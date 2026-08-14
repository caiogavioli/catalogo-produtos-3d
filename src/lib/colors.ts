import type { CSSProperties } from "react";
import type { Color } from "@/types/catalog";

// Estilo do círculo de cor. Metálica ganha um brilho (destaque claro +
// sombra escura sobre a cor base) pra parecer uma esfera polida em vez
// de uma cor lisa — funciona pra qualquer tom (prata, dourado, cobre...).
export function colorSwatchStyle(color: Pick<Color, "hex" | "metallic">): CSSProperties {
  const base = color.hex ?? "#ffffff";
  if (!color.metallic) return { backgroundColor: base };

  return {
    backgroundColor: base,
    backgroundImage: [
      "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), transparent 42%)",
      "radial-gradient(circle at 68% 74%, rgba(0,0,0,0.45), transparent 60%)",
    ].join(", "),
  };
}

// O tipo que o supabase-js infere pra esse embed varia (sem tipos gerados
// do banco, ele às vezes acha que a relação pra `colors` é de-muitos em
// vez de um-só) — aceita qualquer formato aqui e normaliza na hora de
// achatar, já que na prática cada linha de product_colors sempre aponta
// pra exatamente uma cor.
type WithProductColors = { product_colors?: { color: unknown }[] };

// Achata o embed do Supabase (product_colors -> color) num array simples
// de cores, do jeito que o resto do app espera (`product.colors`).
export function flattenProductColors<T extends WithProductColors>(
  row: T,
): Omit<T, "product_colors"> & { colors: Color[] } {
  const { product_colors, ...rest } = row;
  const colors = (product_colors ?? [])
    .map((entry) => (Array.isArray(entry.color) ? entry.color[0] : entry.color))
    .filter((color): color is Color => Boolean(color));
  return { ...rest, colors };
}
