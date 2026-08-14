"use server";

import { createClient } from "@/lib/supabase/server";

export async function incrementProductViews(productId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_product_views", { product_id: productId });
}
