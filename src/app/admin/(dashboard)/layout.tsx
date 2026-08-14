import Link from "next/link";
import { logout } from "../actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="glass-card border-x-0 border-t-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin" className="hover:text-brand-500">
              Produtos
            </Link>
            <Link href="/admin/categorias" className="hover:text-brand-500">
              Categorias
            </Link>
            <Link href="/admin/cores" className="hover:text-brand-500">
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
