"use client";

import { useState } from "react";
import { R, emAberto, fmtData, hoje, isoLocal, totalPedido, type Order } from "@/lib/gestao";
import { cartao, seloAviso, seloRuim, type Ctx } from "./ui";
import { nomeCliente } from "./pedidos-tab";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesDe = (o: Order) => isoLocal(new Date(o.created_at)).slice(0, 7);
function nomeMes(m: string) {
  const [ano, mes] = m.split("-");
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
}

type Grupo = { k: string; n: number; v: number };
function agrupar(lista: Order[], chave: (o: Order) => string): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const o of lista) {
    const k = chave(o);
    if (!k) continue;
    const g = mapa.get(k) ?? { k, n: 0, v: 0 };
    g.n += o.qtd || 1;
    g.v += totalPedido(o);
    mapa.set(k, g);
  }
  return [...mapa.values()].sort((a, b) => b.v - a.v);
}

function Ranking({ titulo, itens, max }: { titulo: string; itens: Grupo[]; max: number }) {
  return (
    <div className={cartao}>
      <h3 className="mb-2 font-semibold text-ink-50">{titulo}</h3>
      {!itens.length ? (
        <div className="text-sm text-ink-400">Sem dados.</div>
      ) : (
        <table className="w-full text-sm tabular-nums">
          <tbody>
            {itens.slice(0, max).map((x) => (
              <tr key={x.k} className="border-b border-ink-800 last:border-0">
                <td className="py-1.5 text-ink-50">
                  {x.k} <span className="text-ink-400">({x.n})</span>
                </td>
                <td className="py-1.5 text-right font-mono text-ink-50">{R(x.v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function PainelTab({ ctx }: { ctx: Ctx }) {
  const [mes, setMes] = useState("tudo");
  const validos = ctx.ord.filter((o) => o.status !== "Cancelado");
  const meses = [...new Set(validos.map(mesDe))].sort();
  const lista = mes === "tudo" ? validos : validos.filter((o) => mesDe(o) === mes);

  const faturado = lista.reduce((a, o) => a + totalPedido(o), 0);
  const recebido = lista.filter((o) => o.pago).reduce((a, o) => a + totalPedido(o), 0);
  const comCusto = lista.filter((o) => o.custo > 0 && o.horas > 0);
  const lucro = comCusto.reduce((a, o) => a + totalPedido(o) - o.custo * (o.qtd || 1), 0);
  const horas = comCusto.reduce((a, o) => a + o.horas * (o.qtd || 1), 0);
  const ganhoHora = horas ? lucro / horas : 0;
  const meta = ctx.cfg.lucroHora;

  const porMes = meses.slice(-6).map((m) => ({
    m,
    v: validos.filter((o) => mesDe(o) === m).reduce((a, o) => a + totalPedido(o), 0),
  }));
  const maximo = Math.max(1, ...porMes.map((x) => x.v));

  const atrasados = ctx.ord.filter((o) => emAberto(o) && o.prazo && o.prazo < hoje());
  const acabando = ctx.fil.filter((f) => f.restante <= f.minimo);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink-50">Painel de vendas</h2>
        <select
          aria-label="Período"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="rounded-lg border border-ink-800 bg-ink-950 px-3 py-2 text-sm text-ink-50"
        >
          <option value="tudo">Tudo</option>
          {[...meses].reverse().map((m) => (
            <option key={m} value={m}>
              {nomeMes(m)}
            </option>
          ))}
        </select>
      </div>

      {!lista.length ? (
        <div className="rounded-xl border border-dashed border-ink-800 p-5 text-center text-ink-400">
          {ctx.loaded ? "Sem vendas neste período." : "Carregando…"}
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {[
              [R(faturado), `Vendido (${lista.length} pedidos)`, ""],
              [R(recebido), "Já recebido", ""],
              [R(lucro), "Lucro estimado", ""],
              [`${R(ganhoHora)}/h`, `Ganho por hora (meta ${R(meta)})`, ganhoHora >= meta ? "text-emerald-400" : "text-amber-400"],
            ].map(([valor, rotulo, cor]) => (
              <div key={rotulo} className="glass-card min-w-0 rounded-xl p-3">
                <b className={`block font-[family-name:var(--font-heading)] text-xl tabular-nums ${cor || "text-ink-50"}`}>{valor}</b>
                <span className="text-xs text-ink-400">{rotulo}</span>
              </div>
            ))}
          </div>
          <p className="mb-3 text-xs text-ink-400">
            Lucro e ganho por hora usam só os pedidos que têm horas e custo preenchidos ({comCusto.length} de {lista.length}). O
            ganho não desconta o seu tempo de mão de obra.
          </p>

          <div className={cartao}>
            <h3 className="mb-2 font-semibold text-ink-50">Vendido por mês</h3>
            {porMes.map((x) => (
              <div key={x.m} className="mb-1.5 flex items-center gap-2">
                <span className="w-12 flex-none text-sm text-ink-400">{nomeMes(x.m)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div className="h-full bg-brand-500" style={{ width: `${(x.v / maximo) * 100}%` }} />
                </div>
                <span className="w-24 flex-none text-right text-sm tabular-nums text-ink-50">{R(x.v)}</span>
              </div>
            ))}
          </div>
          <Ranking titulo="Peças mais vendidas" itens={agrupar(lista, (o) => o.item)} max={6} />
          <Ranking titulo="Melhores clientes" itens={agrupar(lista, (o) => nomeCliente(ctx, o))} max={5} />
          <Ranking titulo="Por canal" itens={agrupar(lista, (o) => o.canal)} max={4} />
          <Ranking titulo="Por forma de pagamento" itens={agrupar(lista, (o) => o.pagamento)} max={3} />
        </>
      )}

      <div className={cartao}>
        <h3 className="mb-2 font-semibold text-ink-50">Atenção</h3>
        {!atrasados.length && !acabando.length && (
          <div className="text-sm text-ink-400">Nada atrasado e nenhum filamento acabando.</div>
        )}
        {atrasados.map((o) => (
          <div key={o.id} className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink-50">
            <span className={seloRuim}>Atrasado</span>
            {o.item} · {nomeCliente(ctx, o)} · prazo {fmtData(o.prazo)}
          </div>
        ))}
        {acabando.map((f) => (
          <div key={f.id} className="mb-1 flex flex-wrap items-center gap-2 text-sm text-ink-50">
            <span className={seloAviso}>Comprar</span>
            {f.cor} {f.marca} · restam {Math.round(f.restante)} g
          </div>
        ))}
      </div>
    </div>
  );
}
