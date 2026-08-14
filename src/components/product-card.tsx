"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images?.[0];

  return (
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
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-ink-50">{product.name}</h3>
          <p className="text-sm text-brand-500">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
