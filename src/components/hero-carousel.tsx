"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

const AUTOPLAY_MS = 5000;

export function HeroCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || products.length < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % products.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, products.length]);

  if (products.length === 0) return null;

  const product = products[index];
  const cover = product.images?.[0];

  return (
    <div
      className="glass-card relative mx-auto mt-6 aspect-[21/9] max-w-5xl overflow-hidden rounded-xl sm:aspect-[3/1]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={product.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {cover && (
            <Image
              src={cover.url}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              priority={index === 0}
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-8">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-200">Destaque</span>
            <h2 className="mt-1 text-xl font-bold text-ink-50 sm:text-3xl">{product.name}</h2>
            <p className="mt-1 text-brand-200 sm:text-lg">{formatPrice(product.price)}</p>
            <Link
              href={`/produto/${product.slug}`}
              className="mt-3 inline-block rounded bg-brand-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800"
            >
              Ver produto
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {products.length > 1 && (
        <>
          {/* Setas ficam presas perto do topo (não centralizadas), pra nunca
              disputar espaço com o texto do produto ancorado embaixo —
              principalmente em banners baixos (mobile). */}
          <button
            type="button"
            aria-label="Destaque anterior"
            onClick={() => setIndex((current) => (current - 1 + products.length) % products.length)}
            className="absolute left-2 top-2 rounded-full bg-ink-950/60 p-1.5 text-ink-50 transition-colors hover:bg-ink-950/90"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo destaque"
            onClick={() => setIndex((current) => (current + 1) % products.length)}
            className="absolute right-2 top-2 rounded-full bg-ink-950/60 p-1.5 text-ink-50 transition-colors hover:bg-ink-950/90"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {products.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Ir para o destaque ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-brand-500" : "w-1.5 bg-ink-50/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
