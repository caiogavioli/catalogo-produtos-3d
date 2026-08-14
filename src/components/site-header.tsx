"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronDown, Menu, Search, X } from "lucide-react";
import type { Category } from "@/types/catalog";

function SearchForm({ onSubmitted, className }: { onSubmitted?: () => void; className?: string }) {
  return (
    <form
      action="/busca"
      className={className}
      onSubmit={() => onSubmitted?.()}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          name="q"
          placeholder="Buscar produto..."
          className="w-full rounded-full border border-ink-800 bg-ink-900 py-1.5 pl-8 pr-3 text-sm text-ink-50 placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
        />
      </div>
    </form>
  );
}

function CategoriasMenu({ categories }: { categories: Category[] }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  if (categories.length === 0) return null;

  return (
    <div className="relative" onMouseEnter={() => setAberto(true)} onMouseLeave={() => setAberto(false)}>
      <button
        type="button"
        onClick={() => setAberto((open) => !open)}
        className="flex items-center gap-1 transition-colors hover:text-accent-200"
        aria-expanded={aberto}
        aria-controls="categorias-menu-painel"
      >
        Categorias
        <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            id="categorias-menu-painel"
            className="glass-card absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg p-1"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                onClick={() => setAberto(false)}
                className="block rounded px-3 py-2 text-ink-200 transition-colors hover:bg-ink-800 hover:text-accent-200"
              >
                {category.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SiteHeader({ categories }: { categories: Category[] }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card sticky top-0 z-20 border-x-0 border-t-0"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink-50">
          <Box className="h-6 w-6 text-brand-500" strokeWidth={2.5} aria-hidden />
          CMG3D
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 text-sm text-ink-200 md:flex">
          <Link href="/" className="transition-colors hover:text-accent-200">
            Catálogo
          </Link>
          <CategoriasMenu categories={categories} />
          <SearchForm className="w-48" />
        </nav>

        {/* Mobile: botão hambúrguer */}
        <button
          type="button"
          onClick={() => setMenuAberto((open) => !open)}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuAberto}
          className="text-ink-50 md:hidden"
        >
          {menuAberto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile: painel do menu */}
      <AnimatePresence>
        {menuAberto && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-ink-800 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3 text-sm text-ink-200">
              <SearchForm className="mb-2" onSubmitted={() => setMenuAberto(false)} />
              <Link href="/" onClick={() => setMenuAberto(false)} className="rounded px-2 py-2 hover:bg-ink-800">
                Catálogo
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categoria/${category.slug}`}
                  onClick={() => setMenuAberto(false)}
                  className="rounded px-2 py-2 pl-4 text-ink-400 hover:bg-ink-800"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
