import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "../../../../actions";
import { flattenProductColors } from "@/lib/colors";
import type { Category, Color, Product } from "@/types/catalog";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: colors }] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, description, size, price, category_id, featured, view_count, color_mode, created_at, images:product_images(id, product_id, url, position), product_colors(color:colors(id, name, hex, metallic))",
      )
      .eq("id", id)
      .single(),
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("colors").select("id, name, hex, metallic").order("name"),
  ]);

  if (!product) notFound();

  const typedProduct = flattenProductColors(product) as Product;
  typedProduct.images?.sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">Editar produto</h1>
      <ProductForm
        categories={(categories ?? []) as Category[]}
        colors={(colors ?? []) as Color[]}
        product={typedProduct}
        action={updateProduct.bind(null, id)}
      />
    </div>
  );
}
