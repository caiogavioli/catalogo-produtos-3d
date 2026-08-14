import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { incrementProductViews } from "@/lib/product-views";
import { flattenProductColors } from "@/lib/colors";
import { ProductWhatsapp } from "@/components/product-whatsapp";
import { ProductGallery } from "@/components/product-gallery";
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
      "id, name, slug, description, size, price, category_id, featured, view_count, color_mode, created_at, category:categories(id, name, slug), images:product_images(id, product_id, url, position), product_colors(color:colors(id, name, hex, metallic))",
    )
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const typedProduct = flattenProductColors(product) as unknown as Product;
  const images = [...(typedProduct.images ?? [])].sort((a, b) => a.position - b.position);

  await incrementProductViews(typedProduct.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={images} productName={typedProduct.name} />

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
          <p className="mt-2 font-mono text-xl text-brand-500">{formatPrice(typedProduct.price)}</p>

          {typedProduct.size && (
            <p className="mt-4 font-mono text-sm text-steel-300">
              <span className="font-semibold text-ink-200">Tamanho:</span> {typedProduct.size}
            </p>
          )}

          {typedProduct.description && (
            <p className="mt-4 whitespace-pre-line text-ink-200">{typedProduct.description}</p>
          )}

          <div className="mt-6">
            <ProductWhatsapp
              productName={typedProduct.name}
              colorMode={typedProduct.color_mode}
              colors={typedProduct.colors ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
