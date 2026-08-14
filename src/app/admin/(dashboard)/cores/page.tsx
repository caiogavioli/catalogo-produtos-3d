import { createClient } from "@/lib/supabase/server";
import { createColor, deleteColor } from "../../actions";
import { SimpleCreateForm } from "@/components/admin/simple-create-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { colorSwatchStyle } from "@/lib/colors";
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
            <li key={color.id} className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-ink-50">
                <span className="h-5 w-5 rounded-full ring-1 ring-ink-800" style={colorSwatchStyle(color)} />
                {color.name}
                {color.metallic && <span className="text-xs text-ink-400">(metálica)</span>}
              </span>
              <DeleteButton action={deleteColor.bind(null, color.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
