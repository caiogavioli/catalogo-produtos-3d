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
        <label htmlFor="name" className="block text-sm font-medium text-metal-700">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 rounded border border-metal-300 px-3 py-2"
        />
      </div>
      {withHex && (
        <div>
          <label htmlFor="hex" className="block text-sm font-medium text-metal-700">
            Cor (opcional)
          </label>
          <input id="hex" name="hex" type="color" className="mt-1 h-10 w-16 rounded border border-metal-300" />
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "Adicionando..." : "Adicionar"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
