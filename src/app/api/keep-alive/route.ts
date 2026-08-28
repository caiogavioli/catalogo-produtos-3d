import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Chamado 1x por dia pelo Cron do Vercel (ver vercel.json). O Supabase
// gratuito pausa o projeto depois de 7 dias sem nenhum acesso — essa
// rota só existe pra gerar movimentação e evitar isso, sem depender de
// alguém visitar o site.
export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
