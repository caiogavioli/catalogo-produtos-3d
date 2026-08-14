import { createClient } from "@/lib/supabase/server";
import { createColor, deleteColor } from "../../actions";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { EditColorRow } from "@/components/admin/edit-color-row";
import type { Color } from "@/types/catalog";

export default async function AdminCoresPage() {
  const supabase = await createClient();
  const { data: colors } = await supabase.from("colors").select("id, name, hex, metallic").order("name");
  const items = (colors ?? []) as Color[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-50">Cores disponíveis</h1>

      <SimpleCreateForm action={createColor} withHex />

      {items.length === 0 ? (
        <p className="mt-6 text-ink-400">Nenhuma cor cadastrada ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-ink-950">
          {items.map((color) => (
            <EditColorRow key={color.id} color={color} deleteAction={deleteColor.bind(null, color.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
