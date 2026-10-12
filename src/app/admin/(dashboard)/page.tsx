import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductQuickRow } from "@/components/admin/product-quick-row";
import type { Category, Product } from "@/types/catalog";

export default async function AdminProdutosPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, slug, description, size, price, category_id, featured, published, makerworld_id, view_count, color_mode, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  const items = (products ?? []) as unknown as Product[];
  const cats = (categories ?? []) as Category[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-50">Produtos</h1>
        <Link href="/admin/produtos/novo" className="rounded bg-brand-700 px-4 py-2 text-white hover:bg-brand-800">
          Novo produto
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-400">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-800 text-ink-400">
              <th className="py-2">Nome</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Cores</th>
              <th className="py-2">Preço</th>
              <th className="py-2 text-center">Destaque</th>
              <th className="py-2 text-center">Publicado</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <ProductQuickRow key={product.id} product={product} categories={cats} />
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
