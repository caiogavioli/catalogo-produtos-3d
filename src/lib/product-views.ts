"use server";

import { createClient } from "@/lib/supabase/server";

// Contagem de visualização é um "nice to have" — se a função ainda não
// existir no banco (migração não rodada) ou falhar por qualquer motivo,
// a página do produto não pode quebrar por causa disso.
export async function incrementProductViews(productId: string) {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_product_views", { product_id: productId });
  } catch {
    // silencioso de propósito
  }
}
