"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

export function SimpleCreateForm({
  action,
  withHex = false,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  withHex?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-200">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
        />
      </div>
      {withHex && (
        <>
          <div>
            <label htmlFor="hex" className="block text-sm font-medium text-ink-200">
              Cor (opcional)
            </label>
            <input id="hex" name="hex" type="color" className="mt-1 h-10 w-16 rounded border border-ink-800" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-ink-200">
            <input type="checkbox" name="metallic" className="h-4 w-4 rounded border-ink-800 bg-ink-900 accent-teal-600" />
            Metálica
          </label>
        </>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent-700 px-4 py-2 font-medium text-white hover:bg-accent-800 disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
