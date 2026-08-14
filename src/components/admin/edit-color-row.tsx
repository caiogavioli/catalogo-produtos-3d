"use client";

import { useActionState, useState } from "react";
import { updateColor, type ActionState } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/delete-button";
import { colorSwatchStyle } from "@/lib/colors";
import type { Color } from "@/types/catalog";

export function EditColorRow({ color, deleteAction }: { color: Color; deleteAction: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateColor.bind(null, color.id);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(boundUpdate, undefined);

  // Fecha o modo de edição assim que a action confirmar sucesso — calculado
  // durante a renderização (não em efeito) para evitar um render em cascata.
  if (state?.success && editing) setEditing(false);

  if (!editing) {
    return (
      <li className="flex items-center justify-between py-2">
        <span className="flex items-center gap-2 text-ink-50">
          <span className="h-5 w-5 rounded-full ring-1 ring-ink-800" style={colorSwatchStyle(color)} />
          {color.name}
          {color.metallic && <span className="text-xs text-ink-400">(metálica)</span>}
        </span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-brand-500 hover:underline"
          >
            Editar
          </button>
          <DeleteButton action={deleteAction} />
        </span>
      </li>
    );
  }

  return (
    <li className="py-2">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor={`name-${color.id}`} className="block text-xs font-medium text-ink-200">
            Nome
          </label>
          <input
            id={`name-${color.id}`}
            name="name"
            defaultValue={color.name}
            required
            className="mt-1 rounded border border-ink-800 bg-ink-900 px-3 py-1.5 text-ink-50"
          />
        </div>
        <div>
          <label htmlFor={`hex-${color.id}`} className="block text-xs font-medium text-ink-200">
            Cor
          </label>
          <input
            id={`hex-${color.id}`}
            name="hex"
            type="color"
            defaultValue={color.hex ?? "#ffffff"}
            className="mt-1 h-9 w-14 rounded border border-ink-800"
          />
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm text-ink-200">
          <input
            type="checkbox"
            name="metallic"
            defaultChecked={color.metallic}
            className="h-4 w-4 rounded border-ink-800 bg-ink-900 accent-brand-700"
          />
          Metálica
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded px-3 py-1.5 text-sm text-ink-400 hover:text-ink-50"
        >
          Cancelar
        </button>
        {state?.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
      </form>
    </li>
  );
}
