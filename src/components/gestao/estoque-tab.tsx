"use client";

import { useState } from "react";
import { R, num, type Filament } from "@/lib/gestao";
import { Campo, Sheet, btn, btnGhost, btnPerigo, campo, cartao, selo, seloRuim, type Ctx } from "./ui";

const TIPOS = ["PLA", "PLA Silk", "PLA Matte", "PETG", "ABS/ASA", "TPU", "Outro"];

function FilamentoForm({ ctx, rolo, onClose }: { ctx: Ctx; rolo: Filament | null; onClose: () => void }) {
  const [f, setF] = useState({
    marca: rolo?.marca ?? "",
    tipo: rolo?.tipo ?? "PLA",
    cor: rolo?.cor ?? "",
    hex: rolo?.hex ?? "#8a5cd1",
    inicial: String(rolo?.inicial ?? 1000),
    restante: String(rolo?.restante ?? 1000),
    kg: rolo?.kg ? String(rolo.kg) : "",
    minimo: String(rolo?.minimo ?? 200),
  });
  const [confirma, setConfirma] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((a) => ({ ...a, [k]: v }));

  async function salvar() {
    if (!f.cor.trim() && !f.marca.trim()) return ctx.toast("Informe marca ou cor");
    const dados = {
      marca: f.marca.trim(),
      tipo: f.tipo,
      cor: f.cor.trim(),
      hex: f.hex,
      inicial: num(f.inicial),
      restante: num(f.restante),
      kg: num(f.kg),
      minimo: num(f.minimo),
    };
    const { error } = rolo
      ? await ctx.supabase.from("gestao_filaments").update(dados).eq("id", rolo.id)
      : await ctx.supabase.from("gestao_filaments").insert(dados);
    if (error) return ctx.toast(`Não foi possível salvar (${error.message})`);
    await ctx.reload();
    onClose();
    ctx.toast("Filamento salvo");
  }

  async function excluir() {
    if (!rolo) return;
    if (!confirma) return setConfirma(true);
    const { error } = await ctx.supabase.from("gestao_filaments").delete().eq("id", rolo.id);
    if (error) return ctx.toast("Não consegui excluir.");
    await ctx.reload();
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="mb-3 text-xl font-bold text-ink-50">{rolo ? "Editar filamento" : "Novo filamento"}</h2>
      <div className="grid grid-cols-2 gap-3">
        <Campo id="f-marca" label="Marca">
          <input id="f-marca" className={campo} value={f.marca} onChange={(e) => set("marca", e.target.value)} />
        </Campo>
        <Campo id="f-tipo" label="Tipo">
          <select id="f-tipo" className={campo} value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Campo>
        <Campo id="f-cor" label="Nome da cor">
          <input id="f-cor" className={campo} value={f.cor} onChange={(e) => set("cor", e.target.value)} />
        </Campo>
        <Campo id="f-hex" label="Cor">
          <input id="f-hex" type="color" className={`${campo} h-11 p-1`} value={f.hex} onChange={(e) => set("hex", e.target.value)} />
        </Campo>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Campo id="f-ini" label="Peso do rolo (g)">
          <input id="f-ini" className={campo} inputMode="numeric" value={f.inicial} onChange={(e) => set("inicial", e.target.value)} />
        </Campo>
        <Campo id="f-rest" label="Resta (g)">
          <input id="f-rest" className={campo} inputMode="numeric" value={f.restante} onChange={(e) => set("restante", e.target.value)} />
        </Campo>
        <Campo id="f-kg" label="Preço por kg (R$)">
          <input id="f-kg" className={campo} inputMode="decimal" value={f.kg} onChange={(e) => set("kg", e.target.value)} />
        </Campo>
      </div>
      <Campo id="f-min" label="Avisar quando restar menos de (g)">
        <input id="f-min" className={campo} inputMode="numeric" value={f.minimo} onChange={(e) => set("minimo", e.target.value)} />
      </Campo>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={salvar}>
          Salvar
        </button>
        <button className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        {rolo && (
          <button className={btnPerigo} onClick={excluir}>
            {confirma ? "Toque de novo para excluir" : "Excluir"}
          </button>
        )}
      </div>
    </Sheet>
  );
}

export function EstoqueTab({ ctx }: { ctx: Ctx }) {
  const [editando, setEditando] = useState<Filament | "novo" | null>(null);
  const [usados, setUsados] = useState<Record<string, string>>({});

  async function baixar(f: Filament) {
    const g = num(usados[f.id]);
    if (g <= 0) return ctx.toast("Informe os gramas");
    const { error } = await ctx.supabase
      .from("gestao_filaments")
      .update({ restante: Math.max(0, f.restante - g) })
      .eq("id", f.id);
    if (error) return ctx.toast("Não consegui baixar.");
    setUsados((a) => ({ ...a, [f.id]: "" }));
    await ctx.reload();
    ctx.toast(`Baixou ${g} g`);
  }

  const ordenados = [...ctx.fil].sort((a, b) => a.restante / (a.inicial || 1) - b.restante / (b.inicial || 1));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-50">Estoque de filamento</h2>
        <button className={`${btn} !px-3 !py-1.5`} onClick={() => setEditando("novo")}>
          + Rolo
        </button>
      </div>
      {!ordenados.length && (
        <div className="rounded-xl border border-dashed border-ink-800 p-5 text-center text-ink-400">
          {ctx.loaded ? "Nenhum rolo cadastrado. Cadastre seus rolos para o sistema calcular o custo do material." : "Carregando…"}
        </div>
      )}
      {ordenados.map((f) => {
        const pct = Math.max(0, Math.min(100, (f.restante / (f.inicial || 1000)) * 100));
        const baixo = f.restante <= f.minimo;
        return (
          <div key={f.id} className={cartao}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-50">
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-ink-800" style={{ background: f.hex }} />
                  {f.cor || "Sem nome"}
                </h3>
                <div className="text-sm text-ink-400">
                  {f.marca} · {f.tipo}
                  {f.kg ? ` · ${R(f.kg)}/kg` : ""}
                </div>
              </div>
              <span className={baixo ? seloRuim : selo}>{Math.round(f.restante)} g</span>
            </div>
            <div className="my-2 h-2 overflow-hidden rounded-full bg-ink-800">
              <div className={`h-full ${baixo ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className={`${campo} !w-28`}
                inputMode="numeric"
                placeholder="g usados"
                aria-label="Gramas usados"
                value={usados[f.id] ?? ""}
                onChange={(e) => setUsados((a) => ({ ...a, [f.id]: e.target.value }))}
              />
              <button className={`${btn} !px-3 !py-1.5`} onClick={() => baixar(f)}>
                Baixar
              </button>
              <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => setEditando(f)}>
                Editar
              </button>
            </div>
          </div>
        );
      })}
      {editando && (
        <FilamentoForm ctx={ctx} rolo={editando === "novo" ? null : editando} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}
