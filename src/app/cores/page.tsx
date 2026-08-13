import { createClient } from "@/lib/supabase/server";
import type { Color } from "@/types/catalog";

export default async function CoresPage() {
  const supabase = await createClient();
  const { data: colors } = await supabase.from("colors").select("id, name, hex").order("name");

  const items = (colors ?? []) as Color[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-metal-900">Cores disponíveis</h1>
      {items.length === 0 ? (
        <p className="text-metal-500">Nenhuma cor cadastrada ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((color) => (
            <li
              key={color.id}
              className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-metal-300"
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full ring-1 ring-metal-300"
                style={{ backgroundColor: color.hex ?? "#ffffff" }}
              />
              <span className="font-medium text-metal-900">{color.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
