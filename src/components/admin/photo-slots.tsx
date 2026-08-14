"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const MAX_SLOTS = 5;

// 5 campos nomeados ("Foto 1"..."Foto 5") em vez de um único <input
// multiple> — no celular, escolher várias fotos de uma vez pelo seletor
// nativo é confuso; um campo por foto, com prévia, deixa claro quantas
// dá pra adicionar numa submissão só. Todos usam name="photos", então o
// backend (formData.getAll("photos")) não muda nada.
export function PhotoSlots({ existingCount }: { existingCount: number }) {
  const [previews, setPreviews] = useState<(string | null)[]>(Array(MAX_SLOTS).fill(null));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => url && URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(index: number, file: File | null) {
    setPreviews((current) => {
      const next = [...current];
      if (next[index]) URL.revokeObjectURL(next[index]!);
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });
  }

  const remaining = Math.max(0, 5 - existingCount);
  const slotsToShow = existingCount > 0 ? Math.min(MAX_SLOTS, Math.max(remaining, 1)) : MAX_SLOTS;

  return (
    <div>
      <p className="block text-sm font-medium text-ink-200">
        {existingCount > 0 ? "Adicionar fotos" : "Fotos"}
      </p>
      <p className="mt-1 text-xs text-ink-400">Até 5 fotos por produto, uma de cada vez ou todas juntas.</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Array.from({ length: slotsToShow }, (_, index) => (
          <label
            key={index}
            className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded border border-dashed border-ink-800 bg-ink-900 text-center text-xs text-ink-400 hover:border-brand-500"
          >
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="file"
              name="photos"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleChange(index, event.target.files?.[0] ?? null)}
            />
            {previews[index] ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previews[index]!} alt="" className="h-full w-full rounded object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto deste campo"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const input = inputRefs.current[index];
                    if (input) input.value = "";
                    handleChange(index, null);
                  }}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <span>Foto {existingCount + index + 1}</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
