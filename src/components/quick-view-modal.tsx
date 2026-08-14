"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ProductWhatsapp } from "@/components/product-whatsapp";
import type { Product } from "@/types/catalog";

// Usa os dados que o card já tem em mãos (vindos da listagem) — sem
// buscar nada de novo no banco só para abrir a prévia.
export function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const cover = product.images?.[0];
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `quick-view-title-${product.id}`;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 flex items-center justify-center bg-ink-950/80 p-4"
        onClick={onClose}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          onClick={(event) => event.stopPropagation()}
          className="glass-card grid w-full max-w-2xl gap-6 overflow-hidden rounded-xl p-5 outline-none sm:grid-cols-2"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full bg-ink-950/60 p-1.5 text-ink-50 hover:bg-ink-950/90 sm:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-950 ring-1 ring-inset ring-ink-800">
            {cover ? (
              <Image src={cover.url} alt={product.name} fill sizes="40vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-400">Sem foto</div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-0 top-0 hidden rounded-full p-1.5 text-ink-400 hover:text-ink-50 sm:block"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 id={titleId} className="pr-8 text-xl font-bold text-ink-50">{product.name}</h2>
            <p className="mt-1 text-lg text-brand-500">{formatPrice(product.price)}</p>

            {product.size && (
              <p className="mt-3 text-sm text-ink-200">
                <span className="font-semibold">Tamanho:</span> {product.size}
              </p>
            )}

            {product.description && (
              <p className="mt-3 line-clamp-4 text-sm text-ink-200">{product.description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-start gap-3">
              <Link
                href={`/produto/${product.slug}`}
                className="rounded bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                Ver página completa
              </Link>
              <ProductWhatsapp
                productName={product.name}
                colorMode={product.color_mode}
                colors={product.colors ?? []}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
