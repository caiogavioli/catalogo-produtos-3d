import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/catalog";

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images?.[0];

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-metal-300 transition hover:shadow-md"
    >
      <div className="relative aspect-square bg-metal-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-metal-500">
            Sem foto
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-metal-900">{product.name}</h3>
        <p className="text-sm text-brand-700">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
