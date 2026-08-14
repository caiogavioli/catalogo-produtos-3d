import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { HeroCarousel } from "@/components/hero-carousel";
import { flattenProductColors } from "@/lib/colors";
import type { Category, Product } from "@/types/catalog";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase
      .from("products")
      .select("id, name, slug, description, size, price, category_id, featured, view_count, color_mode, created_at, images:product_images(id, product_id, url, position), product_colors(color:colors(id, name, hex, metallic))")
      .order("created_at", { ascending: false }),
  ]);

  const allProducts = (products ?? []).map(flattenProductColors) as Product[];
  const productsByCategory = new Map<string, Product[]>();
  const semCategoria: Product[] = [];

  for (const product of allProducts) {
    product.images?.sort((a, b) => a.position - b.position);
    if (product.category_id) {
      const list = productsByCategory.get(product.category_id) ?? [];
      list.push(product);
      productsByCategory.set(product.category_id, list);
    } else {
      semCategoria.push(product);
    }
  }

  const categoriesList = (categories ?? []) as Category[];
  const featured = allProducts.filter((product) => product.featured);
  const maisVistos = allProducts
    .filter((product) => product.view_count > 0)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 8);

  if (allProducts.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ink-400">
        Catálogo ainda sem produtos cadastrados.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 space-y-12">
      <HeroCarousel products={featured} />

      {maisVistos.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-ink-50">Mais vistos</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {maisVistos.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {categoriesList.map((category) => {
        const items = productsByCategory.get(category.id) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={category.id}>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-bold text-ink-50">{category.name}</h2>
              <Link href={`/categoria/${category.slug}`} className="text-sm text-brand-500 hover:underline">
                ver tudo
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {items.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}

      {semCategoria.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-ink-50">Outros produtos</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {semCategoria.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
