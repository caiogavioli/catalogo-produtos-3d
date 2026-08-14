import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { createClient } from "@/lib/supabase/server";

// Segunda camada de proteção além do middleware: se por qualquer motivo
// o middleware não rodar (ex.: mudança de plataforma, bug de infra),
// essa página não confia só nele — confere a sessão de novo aqui.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return (
    <div>
      <div className="glass-card border-x-0 border-t-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin" className="hover:text-accent-500">
              Produtos
            </Link>
            <Link href="/admin/categorias" className="hover:text-accent-500">
              Categorias
            </Link>
            <Link href="/admin/cores" className="hover:text-accent-500">
              Cores
            </Link>
          </nav>
          <form action={logout}>
            <button type="submit" className="text-sm text-ink-400 hover:text-ink-50">
              Sair
            </button>
          </form>
        </div>
      </div>
      {children}
    </div>
  );
}
