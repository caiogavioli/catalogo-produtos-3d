import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/types/catalog";

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, size, price, category_id, created_at, images:product_images(id, product_id, url, position)")
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  const items = (products ?? []) as Product[];
  for (const product of items) {
    product.images?.sort((a, b) => a.position - b.position);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">{category.name}</h1>
      {items.length === 0 ? (
        <p className="text-ink-400">Nenhum produto nesta categoria ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
