"use client";

import { useState } from "react";
import { quickUpdateProduct } from "@/app/admin/actions";
import { R, calc, emptyCalc, num, type CalcInput, type Order, type Piece } from "@/lib/gestao";
import { Campo, btn, btnGhost, btnPerigo, campo, cartao, type Ctx } from "./ui";

// A calculadora digita em texto (pra aceitar "2," no meio da digitação)
// e só converte pra número na hora de calcular.
type Linha = { fid: string; g: string; kg: string };
type Entrada = {
  nome: string;
  printer: string;
  h: string;
  m: string;
  mo: string;
  acess: string;
  emb: string;
  lines: Linha[];
  product_id: string;
};

const texto = (n: number) => (n ? String(n) : "");

function deInput(inp: CalcInput, product_id: string): Entrada {
  return {
    nome: inp.nome,
    printer: inp.printer,
    h: texto(inp.h),
    m: texto(inp.m),
    mo: texto(inp.mo),
    acess: texto(inp.acess),
    emb: texto(inp.emb),
    lines: inp.lines.map((l) => ({ fid: l.fid, g: texto(l.g), kg: texto(l.kg) })),
    product_id,
  };
}

function paraInput(e: Entrada): CalcInput {
  return {
    nome: e.nome,
    printer: e.printer,
    h: num(e.h),
    m: num(e.m),
    mo: num(e.mo),
    acess: num(e.acess),
    emb: num(e.emb),
    lines: e.lines.map((l) => ({ fid: l.fid, g: num(l.g), kg: num(l.kg) })),
  };
}

export function PrecosTab({ ctx, novoPedido }: { ctx: Ctx; novoPedido: (r: Partial<Order>) => void }) {
  const [e, setE] = useState<Entrada>(() => deInput(emptyCalc(ctx.cfg), ""));
  const set = (k: Exclude<keyof Entrada, "lines">, v: string) => setE((a) => ({ ...a, [k]: v }));
  const setLinha = (i: number, k: keyof Linha, v: string) =>
    setE((a) => ({ ...a, lines: a.lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));

  const inp = paraInput(e);
  const r = calc(inp, ctx.cfg);
  const c = ctx.cfg;
  const produto = ctx.products.find((p) => p.id === e.product_id);

  async function salvar() {
    if (!e.nome.trim()) return ctx.toast("Dê um nome à peça");
    const dados = {
      nome: e.nome.trim(),
      pix: r.pix,
      deb: r.deb,
      cred: r.cred,
      custo: Math.round(r.custo * 100) / 100,
      inp,
      product_id: e.product_id || null,
    };
    const existente = ctx.pcs.find((p) => p.nome === dados.nome);
    const { error } = existente
      ? await ctx.supabase.from("gestao_pieces").update(dados).eq("id", existente.id)
      : await ctx.supabase.from("gestao_pieces").insert(dados);
    if (error) return ctx.toast(`Não foi possível salvar (${error.message})`);
    await ctx.reload();
    ctx.toast("Peça salva");
  }

  // Leva o preço Pix calculado para o produto ligado no catálogo do site.
  async function usarNoSite() {
    if (!e.product_id) return;
    const res = await quickUpdateProduct(e.product_id, { price: String(r.pix) });
    if (res.error) return ctx.toast(res.error);
    await ctx.reload();
    ctx.toast(`Preço do site agora é ${R(r.pix)}`);
  }

  function abrir(p: Piece) {
    if (!p.inp) return;
    setE(deInput({ ...p.inp, lines: [...p.inp.lines, { fid: "", g: 0, kg: 0 }, { fid: "", g: 0, kg: 0 }, { fid: "", g: 0, kg: 0 }].slice(0, 3) }, p.product_id ?? ""));
    window.scrollTo(0, 0);
  }

  const [confirmaExcluir, setConfirmaExcluir] = useState("");
  async function excluir(p: Piece) {
    if (confirmaExcluir !== p.id) return setConfirmaExcluir(p.id);
    const { error } = await ctx.supabase.from("gestao_pieces").delete().eq("id", p.id);
    if (error) return ctx.toast("Não consegui excluir.");
    setConfirmaExcluir("");
    await ctx.reload();
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-ink-50">Calculadora de preço</h2>
      <p className="mb-3 text-sm text-ink-400">
        Valores de impressoras, impostos e taxas vêm da aba Ajustes. Os iniciais são exemplos: confira antes de confiar nos preços.
      </p>

      <Campo id="c-nome" label="Nome da peça">
        <input id="c-nome" className={campo} value={e.nome} onChange={(ev) => set("nome", ev.target.value)} />
      </Campo>
      <Campo id="c-prod" label="Produto do catálogo do site (opcional)">
        <select id="c-prod" className={campo} value={e.product_id} onChange={(ev) => set("product_id", ev.target.value)}>
          <option value="">Sem ligação</option>
          {ctx.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.published ? "" : " (rascunho)"}
            </option>
          ))}
        </select>
      </Campo>
      <div className="grid grid-cols-3 gap-3">
        <Campo id="c-imp" label="Impressora">
          <select id="c-imp" className={campo} value={e.printer} onChange={(ev) => set("printer", ev.target.value)}>
            {c.printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="c-h" label="Horas">
          <input id="c-h" className={campo} inputMode="numeric" value={e.h} onChange={(ev) => set("h", ev.target.value)} />
        </Campo>
        <Campo id="c-m" label="Minutos">
          <input id="c-m" className={campo} inputMode="numeric" value={e.m} onChange={(ev) => set("m", ev.target.value)} />
        </Campo>
      </div>
      <fieldset className="mb-3 rounded-lg border border-ink-800 p-3">
        <legend className="px-1 text-xs text-ink-400">Material</legend>
        {e.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-3 gap-3">
            <Campo id={`l-f${i}`} label={`Filamento ${i + 1}`}>
              <select
                id={`l-f${i}`}
                className={campo}
                value={l.fid}
                onChange={(ev) => {
                  setLinha(i, "fid", ev.target.value);
                  const rolo = ctx.fil.find((x) => x.id === ev.target.value);
                  if (rolo?.kg) setLinha(i, "kg", String(rolo.kg));
                }}
              >
                <option value="">Outro</option>
                {ctx.fil.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.cor} {x.marca}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id={`l-g${i}`} label="Gramas">
              <input id={`l-g${i}`} className={campo} inputMode="decimal" value={l.g} onChange={(ev) => setLinha(i, "g", ev.target.value)} />
            </Campo>
            <Campo id={`l-k${i}`} label="R$/kg">
              <input id={`l-k${i}`} className={campo} inputMode="decimal" value={l.kg} onChange={(ev) => setLinha(i, "kg", ev.target.value)} />
            </Campo>
          </div>
        ))}
      </fieldset>
      <div className="grid grid-cols-3 gap-3">
        <Campo id="c-mo" label="Mão de obra (min)">
          <input id="c-mo" className={campo} inputMode="numeric" value={e.mo} onChange={(ev) => set("mo", ev.target.value)} />
        </Campo>
        <Campo id="c-ac" label="Acessórios (R$)">
          <input id="c-ac" className={campo} inputMode="decimal" value={e.acess} onChange={(ev) => set("acess", ev.target.value)} />
        </Campo>
        <Campo id="c-em" label="Embalagem (R$)">
          <input id="c-em" className={campo} inputMode="decimal" value={e.emb} onChange={(ev) => set("emb", ev.target.value)} />
        </Campo>
      </div>

      <div className={cartao}>
        <table className="w-full text-sm tabular-nums">
          <tbody>
            {[
              [`Impressora (${r.h.toFixed(2).replace(".", ",")} h)`, r.maq],
              ["Custos fixos (DAS e outros)", r.fixo],
              ["Material", r.mat],
              [`Perda de material (${c.perda}%)`, r.perda],
              ["Mão de obra", r.mo],
              ["Acessórios e embalagem", r.ext],
            ].map(([nome, valor]) => (
              <tr key={nome as string} className="border-b border-ink-800">
                <td className="py-1.5 text-ink-200">{nome}</td>
                <td className="py-1.5 text-right font-mono text-ink-50">{R(valor as number)}</td>
              </tr>
            ))}
            <tr className="border-b border-ink-800 font-bold">
              <td className="py-1.5 text-ink-50">Custo total</td>
              <td className="py-1.5 text-right font-mono text-ink-50">{R(r.custo)}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-ink-200">Lucro ({R(c.lucroHora)} por hora de impressão)</td>
              <td className="py-1.5 text-right font-mono text-ink-50">{R(r.lucro)}</td>
            </tr>
          </tbody>
        </table>
        <div className="my-3 grid grid-cols-3 gap-2">
          {[
            ["Pix", r.pix],
            ["Débito", r.deb],
            ["Crédito", r.cred],
          ].map(([nome, valor]) => (
            <div key={nome as string} className="rounded-lg bg-ink-800 p-2.5 text-center">
              <b className="block font-[family-name:var(--font-heading)] text-xl text-brand-300">{R(valor as number)}</b>
              <span className="text-xs text-ink-400">{nome}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-ink-400">
          Preço mínimo, sem lucro: Pix {R(r.mpix)} · Débito {R(r.mdeb)} · Crédito {R(r.mcred)}. Abaixo disso você paga para vender.
        </div>
        {produto && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-800 pt-3 text-sm">
            <span className="text-ink-200">
              Preço no site hoje: <b className="font-mono">{produto.price != null ? R(produto.price) : "sem preço"}</b>
            </span>
            <button className={`${btnGhost} !px-3 !py-1.5`} onClick={usarNoSite}>
              Usar {R(r.pix)} no site
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={salvar}>
          Salvar peça
        </button>
        <button
          className={btnGhost}
          onClick={() =>
            novoPedido({ item: e.nome, preco: r.pix, pagamento: "Pix", impressora: e.printer, qtd: 1, product_id: e.product_id || null })
          }
        >
          Criar pedido
        </button>
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold text-ink-50">Peças salvas</h2>
      {!ctx.pcs.length && (
        <div className="rounded-xl border border-dashed border-ink-800 p-5 text-center text-ink-400">
          {ctx.loaded ? "Nenhuma peça salva ainda." : "Carregando…"}
        </div>
      )}
      {[...ctx.pcs]
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((p) => (
          <div key={p.id} className={cartao}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-ink-50">{p.nome}</h3>
              <div className="whitespace-nowrap font-mono font-bold text-brand-300">{R(p.pix)}</div>
            </div>
            <div className="text-sm text-ink-400">
              Custo {R(p.custo)} · Débito {R(p.deb)} · Crédito {R(p.cred)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => abrir(p)}>
                Abrir na calculadora
              </button>
              <button
                className={`${btnGhost} !px-3 !py-1.5`}
                onClick={() => novoPedido({ item: p.nome, preco: p.pix, pagamento: "Pix", qtd: 1, product_id: p.product_id })}
              >
                Novo pedido
              </button>
              <button className={`${btnPerigo} !px-3 !py-1.5`} onClick={() => excluir(p)}>
                {confirmaExcluir === p.id ? "Confirmar" : "Excluir"}
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
