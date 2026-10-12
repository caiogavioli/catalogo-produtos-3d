"use client";

import { useState } from "react";
import { R, totalPedido, type GestaoClient } from "@/lib/gestao";
import { Campo, Sheet, btn, btnGhost, btnPerigo, campo, cartao, selo, seloOk, type Ctx } from "./ui";

function ClienteForm({ ctx, cliente, onClose }: { ctx: Ctx; cliente: GestaoClient | null; onClose: () => void }) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [contato, setContato] = useState(cliente?.contato ?? "");
  const [notas, setNotas] = useState(cliente?.notas ?? "");
  const [confirma, setConfirma] = useState(false);

  async function salvar() {
    if (!nome.trim()) return ctx.toast("Informe o nome");
    const dados = { nome: nome.trim(), contato: contato.trim(), notas: notas.trim() };
    const { error } = cliente
      ? await ctx.supabase.from("gestao_clients").update(dados).eq("id", cliente.id)
      : await ctx.supabase.from("gestao_clients").insert(dados);
    if (error) return ctx.toast(`Não foi possível salvar (${error.message})`);
    await ctx.reload();
    onClose();
    ctx.toast("Cliente salvo");
  }

  async function excluir() {
    if (!cliente) return;
    if (!confirma) return setConfirma(true);
    const { error } = await ctx.supabase.from("gestao_clients").delete().eq("id", cliente.id);
    if (error) return ctx.toast("Não consegui excluir.");
    await ctx.reload();
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="mb-3 text-xl font-bold text-ink-50">{cliente ? "Editar cliente" : "Novo cliente"}</h2>
      <Campo id="c-n" label="Nome">
        <input id="c-n" className={campo} value={nome} onChange={(e) => setNome(e.target.value)} />
      </Campo>
      <Campo id="c-c" label="Instagram ou WhatsApp">
        <input id="c-c" className={campo} value={contato} onChange={(e) => setContato(e.target.value)} />
      </Campo>
      <Campo id="c-o" label="Anotações (gostos, cores, datas)">
        <textarea id="c-o" rows={3} className={campo} value={notas} onChange={(e) => setNotas(e.target.value)} />
      </Campo>
      <div className="flex flex-wrap gap-2">
        <button className={btn} onClick={salvar}>
          Salvar
        </button>
        <button className={btnGhost} onClick={onClose}>
          Cancelar
        </button>
        {cliente && (
          <button className={btnPerigo} onClick={excluir}>
            {confirma ? "Toque de novo para excluir" : "Excluir"}
          </button>
        )}
      </div>
    </Sheet>
  );
}

export function ClientesTab({ ctx, novoPedidoPara }: { ctx: Ctx; novoPedidoPara: (c: GestaoClient) => void }) {
  const [editando, setEditando] = useState<GestaoClient | "novo" | null>(null);

  const linhas = ctx.cli
    .map((c) => {
      const pedidos = ctx.ord.filter((o) => o.client_id === c.id && o.status !== "Cancelado");
      return {
        c,
        n: pedidos.length,
        total: pedidos.reduce((a, o) => a + totalPedido(o), 0),
        ultimo: pedidos.reduce((a, o) => (o.created_at > a ? o.created_at : a), ""),
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink-50">Clientes</h2>
        <button className={`${btn} !px-3 !py-1.5`} onClick={() => setEditando("novo")}>
          + Cliente
        </button>
      </div>
      {!linhas.length && (
        <div className="rounded-xl border border-dashed border-ink-800 p-5 text-center text-ink-400">
          {ctx.loaded
            ? "Nenhum cliente ainda. Eles são criados sozinhos quando você digita um nome novo em um pedido."
            : "Carregando…"}
        </div>
      )}
      {linhas.map(({ c, n, total, ultimo }) => (
        <div key={c.id} className={cartao}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-ink-50">{c.nome}</h3>
              <div className="text-sm text-ink-400">{c.contato || "sem contato"}</div>
            </div>
            <div className="whitespace-nowrap font-mono font-bold text-brand-300">{R(total)}</div>
          </div>
          <div className="my-2 flex flex-wrap gap-1.5">
            <span className={selo}>
              {n} pedido{n === 1 ? "" : "s"}
            </span>
            {n >= 3 && <span className={seloOk}>Recorrente</span>}
            {ultimo && <span className={selo}>Último: {new Date(ultimo).toLocaleDateString("pt-BR")}</span>}
          </div>
          {c.notas && <div className="mb-2 text-sm text-ink-400">{c.notas}</div>}
          <div className="flex gap-2">
            <button className={`${btnGhost} !px-3 !py-1.5`} onClick={() => setEditando(c)}>
              Editar
            </button>
            <button className={`${btn} !px-3 !py-1.5`} onClick={() => novoPedidoPara(c)}>
              Novo pedido
            </button>
          </div>
        </div>
      ))}
      {editando && (
        <ClienteForm ctx={ctx} cliente={editando === "novo" ? null : editando} onClose={() => setEditando(null)} />
      )}
    </div>
  );
}
