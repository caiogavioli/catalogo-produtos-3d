"use client";

import { useState } from "react";
import { DEFAULT_CONFIG, R, machineHour, num, overheadHour, type Config } from "@/lib/gestao";
import { Campo, btn, campo, cartao, type Ctx } from "./ui";

export function AjustesTab({ ctx }: { ctx: Ctx }) {
  const c = ctx.cfg;
  const [f, setF] = useState({
    printers: c.printers.map((p) => ({ id: p.id, nome: p.nome, preco: String(p.preco), vida: String(p.vida), watts: String(p.watts) })),
    kwh: String(c.kwh),
    das: String(c.das),
    outrosFixos: String(c.outrosFixos),
    horasMes: String(c.horasMes),
    horasDia: String(c.horasDia),
    lucroHora: String(c.lucroHora),
    maoObra: String(c.maoObra),
    perda: String(c.perda),
    taxaPix: String(c.taxaPix),
    taxaDeb: String(c.taxaDeb),
    taxaCred: String(c.taxaCred),
  });
  const set = (k: Exclude<keyof typeof f, "printers">, v: string) => setF((a) => ({ ...a, [k]: v }));
  const setPrinter = (i: number, k: "nome" | "preco" | "vida" | "watts", v: string) =>
    setF((a) => ({ ...a, printers: a.printers.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));

  async function salvar() {
    const dados: Config = {
      printers: f.printers.map((p, i) => ({
        id: p.id,
        nome: p.nome.trim() || DEFAULT_CONFIG.printers[i]?.nome || p.id,
        preco: num(p.preco),
        vida: num(p.vida) || 4000,
        watts: num(p.watts),
      })),
      kwh: num(f.kwh),
      das: num(f.das),
      outrosFixos: num(f.outrosFixos),
      horasMes: num(f.horasMes) || 300,
      horasDia: num(f.horasDia) || 12,
      lucroHora: num(f.lucroHora),
      maoObra: num(f.maoObra),
      perda: num(f.perda),
      taxaPix: num(f.taxaPix),
      taxaDeb: num(f.taxaDeb),
      taxaCred: num(f.taxaCred),
    };
    const { error } = await ctx.supabase.from("gestao_config").upsert({ id: "main", data: dados });
    if (error) return ctx.toast(`Não foi possível salvar (${error.message})`);
    await ctx.reload();
    ctx.toast("Ajustes salvos");
  }

  const campoNum = (id: string, label: string, k: Exclude<keyof typeof f, "printers">) => (
    <Campo id={id} label={label}>
      <input id={id} className={campo} inputMode="decimal" value={f[k]} onChange={(e) => set(k, e.target.value)} />
    </Campo>
  );

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-ink-50">Ajustes</h2>
      <p className="mb-3 text-sm text-ink-400">
        Os números abaixo começam como exemplos. Troque pelos seus valores reais para os preços ficarem certos.
      </p>

      <fieldset className={cartao}>
        <legend className="px-1 text-xs text-ink-400">Impressoras</legend>
        {f.printers.map((p, i) => (
          <div key={p.id} className="mb-4">
            <Campo id={`p-n${i}`} label="Nome">
              <input id={`p-n${i}`} className={campo} value={p.nome} onChange={(e) => setPrinter(i, "nome", e.target.value)} />
            </Campo>
            <div className="grid grid-cols-3 gap-3">
              <Campo id={`p-p${i}`} label="Preço pago (R$)">
                <input id={`p-p${i}`} className={campo} inputMode="decimal" value={p.preco} onChange={(e) => setPrinter(i, "preco", e.target.value)} />
              </Campo>
              <Campo id={`p-v${i}`} label="Vida útil (h)">
                <input id={`p-v${i}`} className={campo} inputMode="numeric" value={p.vida} onChange={(e) => setPrinter(i, "vida", e.target.value)} />
              </Campo>
              <Campo id={`p-w${i}`} label="Potência (W)">
                <input id={`p-w${i}`} className={campo} inputMode="numeric" value={p.watts} onChange={(e) => setPrinter(i, "watts", e.target.value)} />
              </Campo>
            </div>
            <div className="text-xs text-ink-400">
              Custo por hora:{" "}
              {R(
                machineHour(
                  { id: p.id, nome: p.nome, preco: num(p.preco), vida: num(p.vida) || 4000, watts: num(p.watts) },
                  { ...c, kwh: num(f.kwh) },
                ),
              )}
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className={cartao}>
        <legend className="px-1 text-xs text-ink-400">Custos do negócio</legend>
        <div className="grid grid-cols-2 gap-3">
          {campoNum("k-kwh", "Energia (R$/kWh)", "kwh")}
          {campoNum("k-das", "DAS do MEI (R$/mês)", "das")}
          {campoNum("k-of", "Outros fixos (R$/mês)", "outrosFixos")}
          {campoNum("k-hm", "Horas de impressão por mês", "horasMes")}
          {campoNum("k-hd", "Horas de impressão por dia (fila)", "horasDia")}
        </div>
        <div className="text-xs text-ink-400">
          Custo fixo por hora: {R(overheadHour({ ...c, das: num(f.das), outrosFixos: num(f.outrosFixos), horasMes: num(f.horasMes) || 300 }))}. O DAS é
          um valor fixo por mês, então ele é dividido pelas horas de impressão.
        </div>
      </fieldset>

      <fieldset className={cartao}>
        <legend className="px-1 text-xs text-ink-400">Margem</legend>
        <div className="grid grid-cols-3 gap-3">
          {campoNum("k-lh", "Lucro por hora (R$)", "lucroHora")}
          {campoNum("k-mo", "Sua hora de trabalho (R$)", "maoObra")}
          {campoNum("k-pe", "Perda de material (%)", "perda")}
        </div>
      </fieldset>

      <fieldset className={cartao}>
        <legend className="px-1 text-xs text-ink-400">Taxas de pagamento (%)</legend>
        <div className="grid grid-cols-3 gap-3">
          {campoNum("k-tp", "Pix", "taxaPix")}
          {campoNum("k-td", "Débito", "taxaDeb")}
          {campoNum("k-tc", "Crédito", "taxaCred")}
        </div>
        <div className="text-xs text-ink-400">Veja as taxas reais da sua maquininha.</div>
      </fieldset>

      <button className={btn} onClick={salvar}>
        Salvar ajustes
      </button>
    </div>
  );
}
