import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="text-brand-500 hover:underline">
          ← Anterior
        </Link>
      ) : (
        <span className="text-ink-800">← Anterior</span>
      )}
      <span className="text-ink-400">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="text-brand-500 hover:underline">
          Próxima →
        </Link>
      ) : (
        <span className="text-ink-800">Próxima →</span>
      )}
    </nav>
  );
}
