import { createClient } from "@/lib/supabase/server";
import { EscolhaModelos } from "@/components/admin/escolha-modelos";

export const metadata = { title: "Escolha de modelos" };

export default async function EscolhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-ink-50">Escolha de modelos</h1>
      <p className="mb-4 text-sm text-ink-400">
        Marque os modelos do MakerWorld que entram em &ldquo;Sob encomenda&rdquo;. As marcações dos dois aparecem
        para os dois.
      </p>
      <EscolhaModelos userId={user!.id} />
    </div>
  );
}
