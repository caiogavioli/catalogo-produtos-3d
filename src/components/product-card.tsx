"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { formatPrice, isProdutoNovo } from "@/lib/format";
import { QuickViewModal } from "@/components/quick-view-modal";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const cover = product.images?.[0];

  return (
    <>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2, ease: "easeOut" }}>
        <Link
          href={`/produto/${product.slug}`}
          className="glass-card group block overflow-hidden rounded-lg transition-shadow hover:shadow-lg hover:shadow-brand-700/10"
        >
          <div className="relative aspect-square bg-ink-950">
            {cover ? (
              <Image
                src={cover.url}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-400">
                Sem foto
              </div>
            )}

            {isProdutoNovo(product.created_at) && (
              <span className="absolute left-2 top-2 rounded-full bg-brand-700 px-2 py-0.5 text-xs font-medium text-white">
                Novo
              </span>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                setQuickViewOpen(true);
              }}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-ink-950/70 px-2 py-1 text-xs text-ink-50 opacity-0 transition-opacity hover:bg-ink-950/90 group-hover:opacity-100"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              Visualização rápida
            </button>
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-ink-50">{product.name}</h3>
            <p className="text-sm text-brand-500">{formatPrice(product.price)}</p>
          </div>
        </Link>
      </motion.div>

      {quickViewOpen && <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />}
    </>
  );
}
