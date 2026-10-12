"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";

export default function RedefinirSenhaPage() {
  const [state, formAction, pending] = useActionState(updatePassword, undefined);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold text-ink-50">Nova senha</h1>
      <p className="mb-6 text-sm text-ink-400">Escolha uma senha nova, com pelo menos 8 caracteres.</p>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-200">
            Nova senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-ink-200">
            Repita a senha
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50"
          />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar senha"}
        </button>
      </form>
    </div>
  );
}
