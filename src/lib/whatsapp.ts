export function whatsappLink(productName: string): string | null {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number) return null;

  const message = `Olá! Tenho interesse no produto "${productName}".`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
