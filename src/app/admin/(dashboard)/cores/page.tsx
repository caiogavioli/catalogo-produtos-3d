import { createClient } from "@/lib/supabase/server";
import { createColor, deleteColor } from "../../actions";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Color } from "@/types/catalog";

export default async function AdminCoresPage() {
  const supabase = await createClient();
  const { data: colors } = await supabase.from("colors").select("id, name, hex").order("name");
  const items = (colors ?? []) as Color[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-metal-900">Cores disponíveis</h1>

      <SimpleCreateForm action={createColor} withHex />

      {items.length === 0 ? (
        <p className="mt-6 text-metal-500">Nenhuma cor cadastrada ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-metal-100">
          {items.map((color) => (
            <li key={color.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-metal-900">
                <span
                  className="h-5 w-5 rounded-full ring-1 ring-metal-300"
                  style={{ backgroundColor: color.hex ?? "#ffffff" }}
                />
                {color.name}
              </span>
              <DeleteButton action={deleteColor.bind(null, color.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
