import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/catalog";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

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
    <html lang="pt-BR" className={`${geist.variable} ${spaceGrotesk.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <SiteHeader categories={(categories ?? []) as Category[]} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-800 bg-ink-950 text-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
            <span className="flex items-center gap-3 text-ink-400">
              <Image src="/logo.png" alt="CMG3D Studio" width={69} height={40} className="h-10 w-auto" />
              @cmg3dstudio
            </span>
            <Link href="/admin" className="text-ink-400 transition-colors hover:text-ink-200">
              Área admin
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
