export function whatsappLink(productName: string, colorName?: string | null): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;

  const message = colorName
    ? `Olá! Tenho interesse no produto "${productName}", na cor ${colorName}.`
    : `Olá! Tenho interesse no produto "${productName}".`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
