"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Cobre os casos mais comuns que inflavam "Mais vistos" sem visita
// humana de verdade: crawlers de busca e o preview de link que
// WhatsApp/Facebook/Twitter/Slack geram ao buscar a OG image do produto.
const BOT_USER_AGENT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|preview/i;

// Contagem de visualização é um "nice to have" — se a função ainda não
// existir no banco (migração não rodada) ou falhar por qualquer motivo,
// a página do produto não pode quebrar por causa disso.
export async function incrementProductViews(productId: string) {
  try {
    const userAgent = (await headers()).get("user-agent") ?? "";
    if (BOT_USER_AGENT.test(userAgent)) return;

    const supabase = await createClient();
    await supabase.rpc("increment_product_views", { product_id: productId });
  } catch {
    // silencioso de propósito
  }
}
