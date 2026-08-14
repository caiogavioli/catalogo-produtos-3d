import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "../../../actions";
import type { Category, Color } from "@/types/catalog";

export default async function NovoProdutoPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: colors }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("colors").select("id, name, hex").order("name"),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">Novo produto</h1>
      <ProductForm
        categories={(categories ?? []) as Category[]}
        colors={(colors ?? []) as Color[]}
        action={createProduct}
      />
    </div>
  );
}
