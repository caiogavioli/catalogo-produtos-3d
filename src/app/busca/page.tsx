import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/pagination";
import { flattenProductColors } from "@/lib/colors";
import type { Product } from "@/types/catalog";

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = (q ?? "").trim();
  const page = parsePage(pageParam);

  if (!query) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ink-400">
        Digite algo na busca do cabeçalho pra encontrar um produto.
      </div>
    );
  }

  const supabase = await createClient();
  const [from, to] = pageRange(page);

  const { data: products, count } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, size, price, category_id, featured, view_count, color_mode, created_at, images:product_images(id, product_id, url, position), product_colors(color:colors(id, name, hex, metallic))",
      { count: "exact" },
    )
    .ilike("name", `%${query}%`)
    .order("created_at", { ascending: false })
    .range(from, to);

  const items = (products ?? []).map(flattenProductColors) as Product[];
  for (const product of items) {
    product.images?.sort((a, b) => a.position - b.position);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">
        Busca por &quot;{query}&quot;
      </h1>
      {items.length === 0 ? (
        <p className="text-ink-400">Nenhum produto encontrado.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            buildHref={(p) => `/busca?q=${encodeURIComponent(query)}&page=${p}`}
          />
        </>
      )}
    </div>
  );
}
