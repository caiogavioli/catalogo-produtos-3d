"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_CONFIG,
  R,
  emAberto,
  totalPedido,
  type CatalogProduct,
  type Config,
  type Filament,
  type GestaoClient,
  type Order,
  type Piece,
} from "@/lib/gestao";
import { AjustesTab } from "./ajustes-tab";
import { ClientesTab } from "./clientes-tab";
import { EstoqueTab } from "./estoque-tab";
import { PainelTab } from "./painel-tab";
import { PedidosTab } from "./pedidos-tab";
import { PrecosTab } from "./precos-tab";
import { btn, btnGhost, type Ctx } from "./ui";

type Aba = "pedidos" | "estoque" | "precos" | "clientes" | "painel" | "ajustes";
const ABAS: [Aba, string][] = [
  ["pedidos", "Pedidos"],
  ["estoque", "Estoque"],
  ["precos", "Preços"],
  ["clientes", "Clientes"],
  ["painel", "Painel"],
];

export function GestaoApp() {
  const supabase = useMemo(() => createClient(), []);
  const [aba, setAba] = useState<Aba>("pedidos");
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [fil, setFil] = useState<Filament[]>([]);
  const [ord, setOrd] = useState<Order[]>([]);
  const [pcs, setPcs] = useState<Piece[]>([]);
  const [cli, setCli] = useState<GestaoClient[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [novoPedido, setNovoPedido] = useState<Partial<Order> & { clienteNome?: string } | null>(null);

  const toast = useCallback((msg: string) => {
    setAviso(msg);
    setTimeout(() => setAviso((atual) => (atual === msg ? null : atual)), 2600);
  }, []);

  const reload = useCallback(async () => {
    const [c, f, o, p, k, prod] = await Promise.all([
      supabase.from("gestao_config").select("data").eq("id", "main").maybeSingle(),
      supabase.from("gestao_filaments").select("*"),
      supabase.from("gestao_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("gestao_pieces").select("*"),
      supabase.from("gestao_clients").select("*").order("nome"),
      supabase.from("products").select("id, name, price, published").order("name"),
    ]);
    const falha = c.error ?? f.error ?? o.error ?? p.error ?? k.error;
    if (falha) {
      setErro(
        falha.code === "42P01" || /gestao_/.test(falha.message)
          ? "As tabelas da gestão ainda não existem. Rode supabase/migration-gestao.sql no SQL Editor do Supabase."
          : falha.message,
      );
      setLoaded(true);
      return;
    }
    setErro(null);
    setCfg({ ...DEFAULT_CONFIG, ...((c.data?.data as Partial<Config> | undefined) ?? {}) });
    setFil((f.data ?? []) as Filament[]);
    setOrd((o.data ?? []) as Order[]);
    setPcs((p.data ?? []) as Piece[]);
    setCli((k.data ?? []) as GestaoClient[]);
    setProducts(((prod.data ?? []) as CatalogProduct[]).map((x) => ({ ...x, price: x.price == null ? null : Number(x.price) })));
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
    // Atualiza quando volta pra aba, pra ver o que a outra pessoa mexeu.
    const aoVoltar = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [reload]);

  const ctx: Ctx = { supabase, cfg, fil, ord, pcs, cli, products, loaded, reload, toast };

  const abertos = ord.filter(emAberto).length;
  const receber = ord.filter((o) => o.status !== "Cancelado" && !o.pago).reduce((a, o) => a + totalPedido(o), 0);
  const acabando = fil.filter((f) => f.restante <= f.minimo).length;

  function irParaPedido(r: Partial<Order> & { clienteNome?: string }) {
    setNovoPedido(r);
    setAba("pedidos");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-28">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-50">Gestão</h1>
        <div className="flex gap-2">
          <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => setAba("ajustes")}>
            Ajustes
          </button>
          <button className={`${btn} !px-3 !py-1.5`} onClick={() => irParaPedido({})}>
            + Pedido
          </button>
        </div>
      </div>

      {erro && <p className="mb-3 rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300">{erro}</p>}

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          [String(abertos), "Pedidos em aberto", ""],
          [R(receber), "A receber", ""],
          [String(acabando), "Filamento acabando", acabando ? "text-red-400" : ""],
        ].map(([valor, rotulo, cor]) => (
          <div key={rotulo} className="glass-card min-w-0 rounded-xl p-3">
            <b className={`block font-[family-name:var(--font-heading)] text-lg tabular-nums ${cor || "text-ink-50"}`}>{valor}</b>
            <span className="text-xs text-ink-400">{rotulo}</span>
          </div>
        ))}
      </div>

      {aba === "pedidos" && <PedidosTab ctx={ctx} novoPedido={novoPedido} setNovoPedido={setNovoPedido} />}
      {aba === "estoque" && <EstoqueTab ctx={ctx} />}
      {aba === "precos" && <PrecosTab ctx={ctx} novoPedido={irParaPedido} />}
      {aba === "clientes" && <ClientesTab ctx={ctx} novoPedidoPara={(c) => irParaPedido({ client_id: c.id, clienteNome: c.nome })} />}
      {aba === "painel" && <PainelTab ctx={ctx} />}
      {aba === "ajustes" && <AjustesTab ctx={ctx} />}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink-800 bg-ink-950 px-1 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5">
        {ABAS.map(([id, nome]) => (
          <button
            key={id}
            aria-selected={aba === id}
            onClick={() => {
              setAba(id);
              window.scrollTo(0, 0);
            }}
            className={`min-h-11 rounded-lg px-1 py-2 text-xs font-semibold ${
              aba === id ? "bg-brand-700 text-white" : "text-ink-400"
            }`}
          >
            {nome}
          </button>
        ))}
      </nav>

      {aviso && (
        <div className="fixed bottom-20 left-1/2 z-50 max-w-[90%] -translate-x-1/2 rounded-lg bg-ink-50 px-4 py-2.5 text-sm text-ink-950">
          {aviso}
        </div>
      )}
    </div>
  );
}
