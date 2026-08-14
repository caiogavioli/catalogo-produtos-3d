import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE, pageRange, parsePage } from "@/lib/pagination";
import { flattenProductColors } from "@/lib/colors";
import type { Product } from "@/types/catalog";

const SORTS = {
  recentes: { column: "created_at", ascending: false, label: "Mais recentes" },
  preco_asc: { column: "price", ascending: true, label: "Menor preço" },
  preco_desc: { column: "price", ascending: false, label: "Maior preço" },
} as const;

type SortKey = keyof typeof SORTS;

function isSortKey(value: string | undefined): value is SortKey {
  return !!value && value in SORTS;
}

export default async function CategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { sort: sortParam, page: pageParam } = await searchParams;
  const sortKey: SortKey = isSortKey(sortParam) ? sortParam : "recentes";
  const sort = SORTS[sortKey];
  const page = parsePage(pageParam);

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const buildHref = (overrides: { sort?: SortKey; page?: number }) => {
    const params = new URLSearchParams();
    params.set("sort", overrides.sort ?? sortKey);
    params.set("page", String(overrides.page ?? page));
    return `/categoria/${slug}?${params.toString()}`;
  };

  // Precisa saber o total antes de decidir se `page` é válida — por isso
  // uma segunda contagem rápida (sem trazer as linhas) antes da busca real.
  const { count: totalCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", category.id);
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));
  if (page > totalPages) redirect(buildHref({ page: totalPages }));

  const [from, to] = pageRange(page);
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, size, price, category_id, featured, view_count, color_mode, created_at, images:product_images(id, product_id, url, position), product_colors(color:colors(id, name, hex, metallic))",
    )
    .eq("category_id", category.id)
    // "Sob consulta" (preço em branco) sempre por último, nas duas direções
    // de ordenação por preço — sem isso o Postgres põe nulo primeiro no
    // "Maior preço", na frente dos produtos mais caros de verdade.
    .order(sort.column, { ascending: sort.ascending, nullsFirst: false })
    .range(from, to);

  const items = (products ?? []).map(flattenProductColors) as Product[];
  for (const product of items) {
    product.images?.sort((a, b) => a.position - b.position);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-50">{category.name}</h1>
        {items.length > 0 && (
          <div className="flex gap-1 text-sm">
            {(Object.keys(SORTS) as SortKey[]).map((key) => (
              <Link
                key={key}
                href={buildHref({ sort: key, page: 1 })}
                className={`rounded-full px-3 py-1 transition-colors ${
                  key === sortKey ? "bg-brand-700 text-white" : "text-ink-400 hover:bg-ink-800 hover:text-ink-50"
                }`}
              >
                {SORTS[key].label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-ink-400">Nenhum produto nesta categoria ainda.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} buildHref={(p) => buildHref({ page: p })} />
        </>
      )}
    </div>
  );
}
