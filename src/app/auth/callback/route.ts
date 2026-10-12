import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Destino do link do e-mail "esqueci minha senha". Troca o código (ou o
// token) por uma sessão e manda pra tela de nova senha. Só aceita
// redirecionar pra dentro de /admin, nunca pra endereço de fora.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const proximo = searchParams.get("next");
  const destino = proximo && proximo.startsWith("/admin/") && !proximo.startsWith("//") ? proximo : "/admin/redefinir-senha";

  const supabase = await createClient();
  let erro = true;
  if (code) {
    erro = Boolean((await supabase.auth.exchangeCodeForSession(code)).error);
  } else if (tokenHash && type) {
    erro = Boolean((await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error);
  }

  if (erro) return NextResponse.redirect(`${origin}/admin/esqueci-senha?erro=1`);
  return NextResponse.redirect(`${origin}${destino}`);
}
