"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Box, ChevronDown } from "lucide-react";
import type { Category } from "@/types/catalog";

export function SiteHeader({ categories }: { categories: Category[] }) {
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card sticky top-0 z-20 border-x-0 border-t-0"
      onMouseLeave={() => setCategoriasAbertas(false)}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink-50">
          <Box className="h-6 w-6 text-brand-500" strokeWidth={2.5} aria-hidden />
          CMG3D
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-200">
          <Link href="/" className="transition-colors hover:text-brand-200">
            Catálogo
          </Link>

          {categories.length > 0 && (
            <div className="relative" onMouseEnter={() => setCategoriasAbertas(true)}>
              <button
                type="button"
                onClick={() => setCategoriasAbertas((open) => !open)}
                className="flex items-center gap-1 transition-colors hover:text-brand-200"
                aria-expanded={categoriasAbertas}
              >
                Categorias
                <ChevronDown className={`h-4 w-4 transition-transform ${categoriasAbertas ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {categoriasAbertas && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="glass-card absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg p-1"
                  >
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categoria/${category.slug}`}
                        onClick={() => setCategoriasAbertas(false)}
                        className="block rounded px-3 py-2 text-ink-200 transition-colors hover:bg-ink-800 hover:text-brand-200"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Link href="/cores" className="transition-colors hover:text-brand-200">
            Cores disponíveis
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
