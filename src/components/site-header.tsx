"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Box } from "lucide-react";

export function SiteHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card sticky top-0 z-10 border-x-0 border-t-0"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink-50">
          <Box className="h-6 w-6 text-brand-500" strokeWidth={2.5} aria-hidden />
          CMG3D
        </Link>
        <nav className="flex gap-6 text-sm text-ink-200">
          <Link href="/" className="transition-colors hover:text-brand-200">
            Catálogo
          </Link>
          <Link href="/cores" className="transition-colors hover:text-brand-200">
            Cores disponíveis
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
