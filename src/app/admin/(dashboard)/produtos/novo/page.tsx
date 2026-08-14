import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../../../actions";
import type { Category } from "@/types/catalog";

export default async function NovoProdutoPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">Novo produto</h1>
      <ProductForm categories={(categories ?? []) as Category[]} action={createProduct} />
    </div>
  );
}
