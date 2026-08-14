"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">Entrar</h1>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink-200">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-200">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
          />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
