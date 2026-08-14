import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/catalog";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CMG3D — Catálogo de produtos de impressão 3D",
  description: "Vitrine dos produtos de impressão 3D da CMG3D.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");

  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SiteHeader categories={(categories ?? []) as Category[]} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-800 bg-ink-950 text-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
            <span className="text-ink-400">CMG3D</span>
            <Link href="/admin" className="text-ink-400 transition-colors hover:text-ink-200">
              Área admin
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
