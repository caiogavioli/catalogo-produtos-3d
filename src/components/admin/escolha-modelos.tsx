"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "q" | "t";
// [id, nome, índices das coleções, (reservado), slug, caminho da foto]
type Modelo = [number, string, number[], number, string, string];
type Pick = { model_id: number; user_id: string; user_email: string | null; status: Status };

const BASE_FOTO = "https://makerworld.bblmw.com/makerworld/model/";
const POR_PAGINA = 24;

const foto = (m: Modelo) => `${BASE_FOTO}${m[5]}?x-oss-process=image/resize,w_640/format,webp`;
const link = (m: Modelo) => `https://makerworld.com/pt/models/${m[0]}-${m[4]}`;
const nomeCurto = (email: string | null) => (email ? email.split("@")[0] : "?");

export function EscolhaModelos({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [dados, setDados] = useState<{ c: string[]; d: Modelo[] } | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [colecao, setColecao] = useState(-1);
  const [filtro, setFiltro] = useState<"todos" | "meus" | "ela" | "sem">("todos");
  const [pagina, setPagina] = useState(0);

  const carregarPicks = useCallback(async () => {
    const { data, error } = await supabase.from("model_picks").select("model_id, user_id, user_email, status");
    if (error) {
      setErro(
        error.code === "42P01" || /model_picks/.test(error.message)
          ? "A tabela de marcações ainda não existe. Rode supabase/migration-escolha-modelos.sql no SQL Editor do Supabase."
          : error.message,
      );
      return;
    }
    setErro(null);
    setPicks((data ?? []) as Pick[]);
  }, [supabase]);

  useEffect(() => {
    fetch("/dados/modelos-makerworld.json")
      .then((r) => r.json())
      .then(setDados)
      .catch(() => setErro("Não consegui carregar a lista de modelos."));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregarPicks();
    // Atualiza quando a pessoa volta pra aba, pra ver o que o outro marcou.
    const aoVoltar = () => document.visibilityState === "visible" && carregarPicks();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [carregarPicks]);

  const porModelo = useMemo(() => {
    const mapa = new Map<number, Pick[]>();
    for (const p of picks) mapa.set(p.model_id, [...(mapa.get(p.model_id) ?? []), p]);
    return mapa;
  }, [picks]);

  const filtrados = useMemo(() => {
    if (!dados) return [];
    const termo = busca.trim().toLowerCase();
    return dados.d.filter((m) => {
      if (colecao >= 0 && !m[2].includes(colecao)) return false;
      if (termo && !m[1].toLowerCase().includes(termo)) return false;
      const lista = porModelo.get(m[0]) ?? [];
      if (filtro === "meus") return lista.some((p) => p.user_id === userId);
      if (filtro === "ela") return lista.some((p) => p.user_id !== userId);
      if (filtro === "sem") return lista.length === 0;
      return true;
    });
  }, [dados, busca, colecao, filtro, porModelo, userId]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = filtrados.slice(paginaAtual * POR_PAGINA, (paginaAtual + 1) * POR_PAGINA);

  async function marcar(m: Modelo, status: Status) {
    const minha = picks.find((p) => p.model_id === m[0] && p.user_id === userId);
    const anterior = picks;
    if (minha?.status === status) {
      setPicks(picks.filter((p) => p !== minha));
      const { error } = await supabase.from("model_picks").delete().eq("model_id", m[0]).eq("user_id", userId);
      if (error) {
        setPicks(anterior);
        setErro(error.message);
      }
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    const novo: Pick = { model_id: m[0], user_id: userId, user_email: auth.user?.email ?? null, status };
    setPicks([...picks.filter((p) => p !== minha), novo]);
    const { error } = await supabase
      .from("model_picks")
      .upsert({ ...novo, updated_at: new Date().toISOString() }, { onConflict: "model_id,user_id" });
    if (error) {
      setPicks(anterior);
      setErro(error.message);
    }
  }

  function copiarLista() {
    if (!dados) return;
    const linhas = dados.d.flatMap((m) =>
      (porModelo.get(m[0]) ?? []).map(
        (p) =>
          `${p.status === "q" ? "QUERO" : "TALVEZ"} | ${nomeCurto(p.user_email)} | ${m[0]} | ${m[1]} | ${m[2]
            .map((i) => dados.c[i].trim())
            .join(", ")} | ${link(m)}`,
      ),
    );
    navigator.clipboard.writeText(linhas.join("\n"));
  }

  if (erro && !dados) return <p className="text-red-400">{erro}</p>;
  if (!dados) return <p className="text-ink-400">Carregando modelos…</p>;

  const minhasQ = picks.filter((p) => p.user_id === userId && p.status === "q").length;
  const minhasT = picks.filter((p) => p.user_id === userId && p.status === "t").length;
  const dela = picks.filter((p) => p.user_id !== userId).length;
  const campo =
    "rounded-lg border border-ink-800 bg-ink-900 px-3 py-2 text-sm text-ink-50 focus:border-brand-300 focus:outline-none";

  return (
    <div>
      {erro && <p className="mb-3 rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300">{erro}</p>}

      <div className="sticky top-0 z-10 -mx-4 mb-4 space-y-2 border-b border-ink-800 bg-ink-950/95 px-4 py-3 backdrop-blur">
        <input
          className={`${campo} w-full`}
          placeholder="Buscar pelo nome…"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
        />
        <div className="flex gap-2">
          <select
            className={`${campo} min-w-0 flex-1`}
            value={colecao}
            onChange={(e) => {
              setColecao(Number(e.target.value));
              setPagina(0);
            }}
          >
            <option value={-1}>Todas as coleções</option>
            {dados.c.map((nome, i) => (
              <option key={i} value={i}>
                {nome.trim()}
              </option>
            ))}
          </select>
          <select
            className={campo}
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value as typeof filtro);
              setPagina(0);
            }}
          >
            <option value="todos">Todos</option>
            <option value="meus">Marcados por mim</option>
            <option value="ela">Marcados pelo outro</option>
            <option value="sem">Ainda sem marca</option>
          </select>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-400">
          <span>
            {filtrados.length} modelos · eu: {minhasQ} quero, {minhasT} talvez · outro: {dela}
          </span>
          <button onClick={copiarLista} className="text-brand-500 hover:text-brand-300">
            Copiar lista
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((m) => {
          const lista = porModelo.get(m[0]) ?? [];
          const minha = lista.find((p) => p.user_id === userId)?.status;
          const outros = lista.filter((p) => p.user_id !== userId);
          return (
            <li key={m[0]} className="glass-card relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto(m)}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {outros.length > 0 && (
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                  {outros.map((p) => (
                    <span key={p.user_id} className="rounded-full bg-ink-950/85 px-2 py-0.5 text-xs text-ink-50">
                      {nomeCurto(p.user_email)}: {p.status === "q" ? "quero" : "talvez"}
                    </span>
                  ))}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-transparent p-3 pt-12">
                <p className="line-clamp-2 text-sm font-semibold text-ink-50">{m[1]}</p>
                <p className="mb-2 truncate text-xs text-ink-200">
                  {m[2]
                    .slice(0, 2)
                    .map((i) => dados.c[i].trim())
                    .join(" · ")}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => marcar(m, "q")}
                    aria-pressed={minha === "q"}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      minha === "q" ? "bg-brand-700 text-white" : "bg-ink-800/90 text-ink-50 hover:bg-ink-800"
                    }`}
                  >
                    Quero
                  </button>
                  <button
                    onClick={() => marcar(m, "t")}
                    aria-pressed={minha === "t"}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                      minha === "t" ? "bg-brand-900 text-white" : "bg-ink-800/90 text-ink-50 hover:bg-ink-800"
                    }`}
                  >
                    Talvez
                  </button>
                  <a
                    href={link(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-ink-800/90 px-3 py-2 text-sm text-ink-50 hover:bg-ink-800"
                  >
                    Abrir
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          disabled={paginaAtual === 0}
          onClick={() => {
            setPagina(paginaAtual - 1);
            window.scrollTo({ top: 0 });
          }}
          className="rounded-lg bg-ink-800 px-4 py-2 disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-ink-400">
          {paginaAtual + 1} / {totalPaginas}
        </span>
        <button
          disabled={paginaAtual >= totalPaginas - 1}
          onClick={() => {
            setPagina(paginaAtual + 1);
            window.scrollTo({ top: 0 });
          }}
          className="rounded-lg bg-ink-800 px-4 py-2 disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
