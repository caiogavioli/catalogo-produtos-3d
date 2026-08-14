import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // CLAUDE.md deste repo é mantido manualmente (ver convenção do
  // Brainstorm) — não deixar o `next dev` anexar o bloco de regras dele.
  agentRules: false,
  experimental: {
    serverActions: {
      // Padrão do Next.js é 1MB por requisição de Server Action — uma
      // foto tirada de celular passa disso fácil e a requisição falha
      // com erro genérico de servidor. Cadastro de produto pode enviar
      // várias fotos numa única submissão, então o limite precisa cobrir
      // o conjunto, não uma foto isolada.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // placehold.co: só usado pelas fotos de exemplo/placeholder dos
      // produtos de demonstração — pode ser removido quando todos os
      // produtos tiverem foto real (upload pelo painel admin).
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
