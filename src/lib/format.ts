export function formatPrice(price: number | null): string {
  if (price === null) return "Sob consulta";
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const NOVIDADE_DIAS = 14;

export function isProdutoNovo(createdAt: string): boolean {
  const dias = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return dias <= NOVIDADE_DIAS;
}
