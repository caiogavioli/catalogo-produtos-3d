import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CMG3D — Catálogo de produtos de impressão 3D",
  description: "Vitrine dos produtos de impressão 3D da CMG3D.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col antialiased">
        <header className="bg-brand-800 text-white">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              CMG3D
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-brand-200">
                Catálogo
              </Link>
              <Link href="/cores" className="hover:text-brand-200">
                Cores disponíveis
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-metal-900 text-metal-300 text-sm">
          <div className="mx-auto max-w-5xl px-4 py-6">CMG3D</div>
        </footer>
      </body>
    </html>
  );
}
