import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { incrementProductViews } from "@/lib/product-views";
import { whatsappLink } from "@/lib/whatsapp";
import type { Product } from "@/types/catalog";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, size, price, category_id, featured, view_count, created_at, category:categories(id, name, slug), images:product_images(id, product_id, url, position)",
    )
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const typedProduct = product as unknown as Product;
  const images = [...(typedProduct.images ?? [])].sort((a, b) => a.position - b.position);
  const whatsapp = whatsappLink(typedProduct.name);

  await incrementProductViews(typedProduct.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-950 ring-1 ring-inset ring-ink-800">
            {images[0] ? (
              <Image src={images[0].url} alt={typedProduct.name} fill sizes="50vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-400">Sem foto</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded bg-ink-950 ring-1 ring-inset ring-ink-800"
                >
                  <Image src={image.url} alt={typedProduct.name} fill sizes="12vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {typedProduct.category && (
            <Link
              href={`/categoria/${typedProduct.category.slug}`}
              className="text-sm font-medium text-brand-500 hover:underline"
            >
              {typedProduct.category.name}
            </Link>
          )}
          <h1 className="mt-1 text-2xl font-bold text-ink-50">{typedProduct.name}</h1>
          <p className="mt-2 text-xl text-brand-500">{formatPrice(typedProduct.price)}</p>

          {typedProduct.size && (
            <p className="mt-4 text-sm text-ink-200">
              <span className="font-semibold">Tamanho:</span> {typedProduct.size}
            </p>
          )}

          {typedProduct.description && (
            <p className="mt-4 whitespace-pre-line text-ink-200">{typedProduct.description}</p>
          )}

          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Perguntar no WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
