import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { deleteProduct } from "../actions";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Product } from "@/types/catalog";

export default async function AdminProdutosPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, size, price, category_id, created_at, category:categories(id, name, slug)")
    .order("created_at", { ascending: false });

  const items = (products ?? []) as unknown as Product[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-metal-900">Produtos</h1>
        <Link href="/admin/produtos/novo" className="rounded bg-brand-700 px-4 py-2 text-white hover:bg-brand-800">
          Novo produto
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-metal-500">Nenhum produto cadastrado ainda.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-metal-300 text-metal-500">
              <th className="py-2">Nome</th>
              <th className="py-2">Categoria</th>
              <th className="py-2">Preço</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id} className="border-b border-metal-100">
                <td className="py-2 font-medium text-metal-900">{product.name}</td>
                <td className="py-2 text-metal-500">{product.category?.name ?? "—"}</td>
                <td className="py-2 text-metal-500">{formatPrice(product.price)}</td>
                <td className="py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/produtos/${product.id}/editar`} className="text-brand-700 hover:underline">
                      Editar
                    </Link>
                    <DeleteButton action={deleteProduct.bind(null, product.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
