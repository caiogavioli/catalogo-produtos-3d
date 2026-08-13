import { createClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory } from "../../actions";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Category } from "@/types/catalog";

export default async function AdminCategoriasPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");
  const items = (categories ?? []) as Category[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-metal-900">Categorias</h1>

      <SimpleCreateForm action={createCategory} />

      {items.length === 0 ? (
        <p className="mt-6 text-metal-500">Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-metal-100">
          {items.map((category) => (
            <li key={category.id} className="flex items-center justify-between py-2">
              <span className="text-metal-900">{category.name}</span>
              <DeleteButton action={deleteCategory.bind(null, category.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
