"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";

function Formulario() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);
  const linkInvalido = useSearchParams().get("erro") === "1";

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold text-ink-50">Esqueci minha senha</h1>
      <p className="mb-6 text-sm text-ink-400">
        Digite o e-mail do seu login. Vamos mandar um link para você criar uma senha nova.
      </p>
      {linkInvalido && !state && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          Esse link não funcionou (venceu ou foi aberto em outro navegador). Peça um novo abaixo e abra o link no mesmo
          aparelho em que pediu.
        </p>
      )}
      {state?.success ? (
        <p className="rounded-lg border border-ink-800 bg-ink-900 p-4 text-sm text-ink-50">
          Se esse e-mail tiver um login, o link chega em alguns minutos. Olhe também o spam. Abra o link no mesmo
          aparelho em que pediu.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-200">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
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
            {pending ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-sm">
        <Link href="/admin/login" className="text-brand-500 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
