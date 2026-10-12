"use client";

import { useState } from "react";
import {
  STATUS,
  R,
  emAberto,
  fmtData,
  hoje,
  isoLocal,
  num,
  totalPedido,
  type Order,
} from "@/lib/gestao";
import {
  Campo,
  Sheet,
  btn,
  btnGhost,
  btnPerigo,
  campo,
  cartao,
  selo,
  seloAviso,
  seloOk,
  seloRuim,
  type Ctx,
} from "./ui";

const SEQUENCIA = ["Novo", "Orçado", "Aprovado", "Na fila", "Imprimindo", "Pronto", "Entregue"];

export function nomeCliente(ctx: Ctx, o: Order) {
  return ctx.cli.find((c) => c.id === o.client_id)?.nome ?? "";
}

// Quando o pedido fica Pronto/Entregue, desconta os gramas do rolo
// escolhido (uma vez só: `baixado` evita descontar duas vezes).
export async function baixarFilamento(ctx: Ctx, o: Order) {
  if (o.baixado || (o.status !== "Pronto" && o.status !== "Entregue")) return;
  if (!o.filament_id || !(o.gramas > 0)) return;
  const rolo = ctx.fil.find((f) => f.id === o.filament_id);
  if (!rolo) return;
  const gramas = o.gramas * (o.qtd || 1);
  const { error } = await ctx.supabase
    .from("gestao_filaments")
    .update({ restante: Math.max(0, rolo.restante - gramas) })
    .eq("id", rolo.id);
  if (error) return ctx.toast("Não consegui descontar o filamento.");
  await ctx.supabase.from("gestao_orders").update({ baixado: true }).eq("id", o.id);
  ctx.toast(`Baixou ${Math.round(gramas)} g de ${rolo.cor || "filamento"}`);
}

type Rascunho = Partial<Order> & { clienteNome?: string };

export function PedidoForm({ ctx, inicial, onClose }: { ctx: Ctx; inicial: Rascunho; onClose: () => void }) {
  const [f, setF] = useState({
    cliente: inicial.clienteNome ?? ctx.cli.find((c) => c.id === inicial.client_id)?.nome ?? "",
    canal: inicial.canal ?? "Instagram",
    product_id: inicial.product_id ?? "",
    piece_id: "",
    item: inicial.item ?? "",
    qtd: String(inicial.qtd ?? 1),
    preco: inicial.preco ? String(inicial.preco) : "",
    pagamento: inicial.pagamento ?? "Pix",
    horas: inicial.horas ? String(inicial.horas) : "",
    gramas: inicial.gramas ? String(inicial.gramas) : "",
    custo: inicial.custo ? String(inicial.custo) : "",
    filament_id: inicial.filament_id ?? "",
    status: inicial.status ?? "Novo",
    impressora: inicial.impressora ?? "",
    urgente: inicial.urgente ?? false,
    prazo: inicial.prazo ?? "",
    pago: inicial.pago ?? false,
    notas: inicial.notas ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((atual) => ({ ...atual, [k]: v }));

  function preencherPeca(id: string) {
    const p = ctx.pcs.find((x) => x.id === id);
    if (!p) return;
    const inp = p.inp;
    const gramas = inp?.lines.reduce((a, l) => a + (l.g || 0), 0) ?? 0;
    const rolo = inp?.lines.find((l) => l.fid && l.g)?.fid ?? "";
    setF((atual) => ({
      ...atual,
      piece_id: id,
      item: p.nome,
      preco: String(p.pix),
      custo: String(p.custo),
      impressora: inp?.printer ?? atual.impressora,
      horas: inp ? String(Math.round((inp.h + inp.m / 60) * 100) / 100) : atual.horas,
      gramas: gramas ? String(gramas) : atual.gramas,
      filament_id: rolo || atual.filament_id,
      product_id: p.product_id ?? atual.product_id,
    }));
  }

  // Escolher um produto do catálogo traz nome e preço; se esse produto
  // já tem uma peça calculada ligada a ele, traz também a produção.
  function escolherProduto(id: string) {
    const prod = ctx.products.find((x) => x.id === id);
    const peca = ctx.pcs.find((x) => x.product_id === id);
    if (peca) return preencherPeca(peca.id);
    setF((atual) => ({
      ...atual,
      product_id: id,
      item: prod ? prod.name : atual.item,
      preco: prod?.price != null ? String(prod.price) : atual.preco,
    }));
  }

  async function salvar() {
    if (!f.item.trim()) return ctx.toast("Informe a peça");
    setSalvando(true);
    let clientId: string | null = null;
    const nome = f.cliente.trim();
    if (nome) {
      const existente = ctx.cli.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
      if (existente) clientId = existente.id;
      else {
        const { data, error } = await ctx.supabase.from("gestao_clients").insert({ nome }).select("id").single();
        if (error || !data) {
          setSalvando(false);
          return ctx.toast("Não consegui salvar o cliente.");
        }
        clientId = data.id as string;
      }
    }
    const dados = {
      client_id: clientId,
      product_id: f.product_id || null,
      filament_id: f.filament_id || null,
      canal: f.canal,
      item: f.item.trim(),
      qtd: Math.max(1, Math.round(num(f.qtd))),
      preco: num(f.preco),
      pagamento: f.pagamento,
      status: f.status,
      impressora: f.impressora,
      urgente: f.urgente,
      horas: num(f.horas),
      gramas: num(f.gramas),
      custo: num(f.custo),
      prazo: f.prazo || null,
      pago: f.pago,
      notas: f.notas.trim(),
    };
    const consulta = inicial.id
      ? ctx.supabase.from("gestao_orders").update(dados).eq("id", inicial.id).select("*").single()
      : ctx.supabase.from("gestao_orders").insert(dados).select("*").single();
    const { data, error } = await consulta;
    setSalvando(false);
    if (error || !data) return ctx.toast(`Não foi possível salvar${error ? ` (${error.message})` : ""}`);
    await baixarFilamento(ctx, data as Order);
    await ctx.reload();
    onClose();
    ctx.toast("Pedido salvo");
  }

  const [confirmaExcluir, setConfirmaExcluir] = useState(false);
  async function excluir() {
    if (!inicial.id) return;
    if (!confirmaExcluir) return setConfirmaExcluir(true);
    const { error } = await ctx.supabase.from("gestao_orders").delete().eq("id", inicial.id);
    if (error) return ctx.toast("Não consegui excluir.");
    await ctx.reload();
    onClose();
    ctx.toast("Pedido excluído");
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="mb-3 text-xl font-bold text-ink-50">{inicial.id ? "Editar pedido" : "Novo pedido"}</h2>
      <div className="grid grid-cols-2 gap-3">
        <Campo id="o-cli" label="Cliente">
          <input id="o-cli" className={campo} list="gestao-clientes" autoComplete="off" value={f.cliente} onChange={(e) => set("cliente", e.target.value)} />
          <datalist id="gestao-clientes">
            {ctx.cli.map((c) => (
              <option key={c.id} value={c.nome} />
            ))}
          </datalist>
        </Campo>
        <Campo id="o-can" label="Canal">
          <select id="o-can" className={campo} value={f.canal} onChange={(e) => set("canal", e.target.value)}>
            {["Instagram", "WhatsApp", "Presencial", "Outro"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo id="o-prod" label="Produto do catálogo do site">
        <select id="o-prod" className={campo} value={f.product_id} onChange={(e) => escolherProduto(e.target.value)}>
          <option value="">Outra peça (fora do catálogo)</option>
          {ctx.products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.published ? "" : " (rascunho)"}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="o-peca" label="Peça com preço calculado">
        <select id="o-peca" className={campo} value={f.piece_id} onChange={(e) => preencherPeca(e.target.value)}>
          <option value="">Nenhuma</option>
          {ctx.pcs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo id="o-item" label="Nome no pedido">
        <input id="o-item" className={campo} value={f.item} onChange={(e) => set("item", e.target.value)} />
      </Campo>
      <div className="grid grid-cols-3 gap-3">
        <Campo id="o-qtd" label="Qtd">
          <input id="o-qtd" className={campo} type="number" min={1} inputMode="numeric" value={f.qtd} onChange={(e) => set("qtd", e.target.value)} />
        </Campo>
        <Campo id="o-preco" label="Preço un. (R$)">
          <input id="o-preco" className={campo} inputMode="decimal" value={f.preco} onChange={(e) => set("preco", e.target.value)} />
        </Campo>
        <Campo id="o-pg" label="Pagamento">
          <select id="o-pg" className={campo} value={f.pagamento} onChange={(e) => set("pagamento", e.target.value)}>
            {["Pix", "Débito", "Crédito"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>
      </div>
      <fieldset className="mb-3 rounded-lg border border-ink-800 p-3">
        <legend className="px-1 text-xs text-ink-400">Produção (para fila, custo e estoque)</legend>
        <div className="grid grid-cols-3 gap-3">
          <Campo id="o-h" label="Horas por un.">
            <input id="o-h" className={campo} inputMode="decimal" value={f.horas} onChange={(e) => set("horas", e.target.value)} />
          </Campo>
          <Campo id="o-g" label="Gramas por un.">
            <input id="o-g" className={campo} inputMode="decimal" value={f.gramas} onChange={(e) => set("gramas", e.target.value)} />
          </Campo>
          <Campo id="o-cu" label="Custo un. (R$)">
            <input id="o-cu" className={campo} inputMode="decimal" value={f.custo} onChange={(e) => set("custo", e.target.value)} />
          </Campo>
        </div>
        <Campo id="o-fil" label="Filamento principal">
          <select id="o-fil" className={campo} value={f.filament_id} onChange={(e) => set("filament_id", e.target.value)}>
            <option value="">—</option>
            {ctx.fil.map((r) => (
              <option key={r.id} value={r.id}>
                {r.cor} {r.marca}
              </option>
            ))}
          </select>
        </Campo>
      </fieldset>
      <div className="grid grid-cols-3 gap-3">
        <Campo id="o-st" label="Status">
          <select id="o-st" className={campo} value={f.status} onChange={(e) => set("status", e.target.value)}>
            {STATUS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Campo>
        <Campo id="o-imp" label="Impressora">
          <select id="o-imp" className={campo} value={f.impressora} onChange={(e) => set("impressora", e.target.value)}>
            <option value="">—</option>
            {ctx.cfg.printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="o-urg" label="Prioridade">
          <select id="o-urg" className={campo} value={f.urgente ? "1" : "0"} onChange={(e) => set("urgente", e.target.value === "1")}>
            <option value="0">Normal</option>
            <option value="1">Urgente</option>
          </select>
        </Campo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo id="o-prazo" label="Prazo combinado">
          <input id="o-prazo" className={campo} type="date" value={f.prazo} onChange={(e) => set("prazo", e.target.value)} />
        </Campo>
        <Campo id="o-pago" label="Pagamento recebido?">
          <select id="o-pago" className={campo} value={f.pago ? "1" : "0"} onChange={(e) => set("pago", e.target.value === "1")}>
            <option value="0">Não pago</option>
            <option value="1">Pago</option>
          </select>
        </Campo>
      </div>
      <Campo id="o-cor" label="Cores e detalhes">
        <textarea id="o-cor" rows={2} className={campo} value={f.notas} onChange={(e) => set("notas", e.target.value)} />
      </Campo>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        {inicial.id && (
          <button className={btnPerigo} onClick={excluir}>
            {confirmaExcluir ? "Toque de novo para excluir" : "Excluir"}
          </button>
        )}
      </div>
    </Sheet>
  );
}

function Fila({ ctx, editar, avancar }: { ctx: Ctx; editar: (o: Order) => void; avancar: (o: Order) => void }) {
  const porDia = ctx.cfg.horasDia || 12;
  const grupos = [...ctx.cfg.printers.map((p) => ({ id: p.id, nome: p.nome })), { id: "", nome: "Sem impressora definida" }];
  let algum = false;
  return (
    <div>
      <p className="mb-3 text-sm text-ink-400">
        Fila de impressão por impressora. A previsão de término considera {porDia} h de impressão por dia (mude em Ajustes).
      </p>
      {grupos.map((g) => {
        const lista = ctx.ord
          .filter((o) => ["Na fila", "Imprimindo", "Aprovado"].includes(o.status) && (o.impressora || "") === g.id)
          .sort((a, b) => {
            const ra = a.status === "Imprimindo" ? 0 : 1;
            const rb = b.status === "Imprimindo" ? 0 : 1;
            if (ra !== rb) return ra - rb;
            if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
            return (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999");
          });
        if (!lista.length) return null;
        algum = true;
        let acumulado = 0;
        const total = lista.reduce((a, o) => a + o.horas * (o.qtd || 1), 0);
        return (
          <div key={g.id || "sem"} className={cartao}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold text-ink-50">{g.nome}</h3>
              <span className={selo}>{total.toFixed(1).replace(".", ",")} h na fila</span>
            </div>
            {lista.map((o) => {
              const horas = o.horas * (o.qtd || 1);
              acumulado += horas;
              const d = new Date();
              d.setDate(d.getDate() + Math.floor(Math.max(0, acumulado - 0.001) / porDia));
              const fim = isoLocal(d);
              const risco = o.prazo != null && fim > o.prazo;
              return (
                <div key={o.id} className="mt-2 border-t border-ink-800 pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <b className="text-ink-50">
                        {o.item}
                        {o.qtd > 1 ? ` ×${o.qtd}` : ""}
                      </b>{" "}
                      {o.urgente && <span className={seloRuim}>Urgente</span>}
                      <div className="text-sm text-ink-400">
                        {nomeCliente(ctx, o)} · {o.status}
                        {horas ? ` · ${horas.toFixed(1).replace(".", ",")} h` : " · sem horas informadas"}
                      </div>
                    </div>
                    <div className="text-right text-sm text-ink-400">
                      {horas ? <>termina {fmtData(fim)}</> : null}
                      {o.prazo && (
                        <div>
                          <span className={risco ? seloRuim : seloOk}>
                            {risco ? "Prazo em risco " : "Prazo "}
                            {fmtData(o.prazo)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button className={`${btn} !px-3 !py-1.5`} onClick={() => avancar(o)}>
                      Avançar
                    </button>
                    <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => editar(o)}>
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {!algum && (
        <div className="rounded-xl border border-dashed border-ink-800 p-5 text-center text-ink-400">
          Nenhum pedido na fila. Pedidos com status Aprovado, Na fila ou Imprimindo aparecem aqui, por impressora.
        </div>
      )}
    </div>
  );
}

export function PedidosTab({ ctx, novoPedido, setNovoPedido }: { ctx: Ctx; novoPedido: Rascunho | null; setNovoPedido: (r: Rascunho | null) => void }) {
  const [filtro, setFiltro] = useState<string>("abertos");
  const [editando, setEditando] = useState<Order | null>(null);

  async function avancar(o: Order) {
    const i = SEQUENCIA.indexOf(o.status);
    if (i < 0 || i >= SEQUENCIA.length - 1) return;
    const proximo = SEQUENCIA[i + 1];
    const { data, error } = await ctx.supabase.from("gestao_orders").update({ status: proximo }).eq("id", o.id).select("*").single();
    if (error || !data) return ctx.toast("Não consegui avançar o pedido.");
    ctx.toast(`${o.item}: ${proximo}`);
    await baixarFilamento(ctx, data as Order);
    await ctx.reload();
  }

  async function marcarPago(o: Order) {
    const { error } = await ctx.supabase.from("gestao_orders").update({ pago: true }).eq("id", o.id);
    if (error) return ctx.toast("Não consegui marcar como pago.");
    await ctx.reload();
    ctx.toast("Marcado como pago");
  }

  const chips: [string, string][] = [["abertos", "Em aberto"], ["fila", "Fila"], ["todos", "Todos"], ...STATUS.map((s) => [s, s] as [string, string])];
  const lista = ctx.ord
    .filter((o) => (filtro === "todos" ? true : filtro === "abertos" ? emAberto(o) : o.status === filtro))
    .sort((a, b) => {
      if (filtro === "abertos" && a.urgente !== b.urgente) return a.urgente ? -1 : 1;
      if (filtro === "abertos") {
        const sa = STATUS.indexOf(a.status as (typeof STATUS)[number]);
        const sb = STATUS.indexOf(b.status as (typeof STATUS)[number]);
        if (sa !== sb) return sb === 4 ? 1 : sa === 4 ? -1 : sa - sb;
      }
      if (filtro === "todos") return b.created_at.localeCompare(a.created_at);
      return (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999");
    });

  return (
    <div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtro">
        {chips.map(([valor, nome]) => (
          <button
            key={valor}
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
            className={`flex-none rounded-full border px-3 py-1.5 text-sm ${
              filtro === valor ? "border-brand-300 bg-ink-800 text-ink-50" : "border-ink-800 text-ink-400"
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      {filtro === "fila" ? (
        <Fila ctx={ctx} editar={setEditando} avancar={avancar} />
      ) : (
        <>
          {!lista.length && (
            <div className="rounded-xl border border-dashed border-ink-800 p-5 text-center text-ink-400">
              {!ctx.loaded
                ? "Carregando…"
                : ctx.ord.length
                  ? "Nenhum pedido neste filtro."
                  : "Nenhum pedido ainda. Toque em “+ Pedido” para anotar o primeiro."}
            </div>
          )}
          {lista.map((o) => {
            const impressora = ctx.cfg.printers.find((p) => p.id === o.impressora);
            const atrasado = o.prazo != null && emAberto(o) && o.prazo < hoje();
            const estilo = o.status === "Entregue" ? seloOk : o.status === "Cancelado" ? seloRuim : o.status === "Imprimindo" ? seloAviso : selo;
            return (
              <div key={o.id} className={cartao}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-ink-50">
                      {o.item}
                      {o.qtd > 1 ? ` ×${o.qtd}` : ""}
                    </h3>
                    <div className="text-sm text-ink-400">
                      {nomeCliente(ctx, o) || "Sem nome"} · {o.canal}
                    </div>
                  </div>
                  <div className="whitespace-nowrap font-mono font-bold text-brand-300">{R(totalPedido(o))}</div>
                </div>
                <div className="my-2 flex flex-wrap gap-1.5">
                  <span className={estilo}>{o.status}</span>
                  {o.urgente && <span className={seloRuim}>Urgente</span>}
                  <span className={o.pago ? seloOk : seloAviso}>
                    {o.pago ? "Pago" : "A receber"} · {o.pagamento}
                  </span>
                  {o.prazo && <span className={atrasado ? seloRuim : selo}>Prazo {fmtData(o.prazo)}</span>}
                  {impressora && <span className={selo}>{impressora.nome}</span>}
                </div>
                {o.notas && <div className="mb-2 text-sm text-ink-400">{o.notas}</div>}
                <div className="flex flex-wrap gap-2">
                  {emAberto(o) && (
                    <button className={`${btn} !px-3 !py-1.5`} onClick={() => avancar(o)}>
                      Avançar
                    </button>
                  )}
                  <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => setEditando(o)}>
                    Editar
                  </button>
                  {!o.pago && o.status !== "Cancelado" && (
                    <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => marcarPago(o)}>
                      Marcar pago
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {editando && <PedidoForm ctx={ctx} inicial={editando} onClose={() => setEditando(null)} />}
      {novoPedido && <PedidoForm ctx={ctx} inicial={novoPedido} onClose={() => setNovoPedido(null)} />}
    </div>
  );
}
