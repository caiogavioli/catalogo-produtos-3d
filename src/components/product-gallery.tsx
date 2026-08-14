"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import type { ProductImage } from "@/types/catalog";

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zoomOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomOpen(false);
      if (event.key === "ArrowRight") setSelected((current) => (current + 1) % images.length);
      if (event.key === "ArrowLeft") setSelected((current) => (current - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [zoomOpen, images.length]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-950 ring-1 ring-inset ring-ink-800">
        <div className="flex h-full items-center justify-center text-ink-400">Sem foto</div>
      </div>
    );
  }

  const current = images[selected] ?? images[0];

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setZoomOpen(true)}
        aria-label="Ampliar foto"
        className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-ink-950 ring-1 ring-inset ring-ink-800"
      >
        <Image src={current.url} alt={productName} fill sizes="50vw" className="object-cover" priority />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-ink-950/70 px-2 py-1 text-xs text-ink-50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden />
          Ampliar
        </span>
      </button>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver foto ${index + 1}`}
              aria-pressed={index === selected}
              className={`relative aspect-square overflow-hidden rounded ring-2 transition-shadow ${
                index === selected ? "ring-brand-300" : "ring-ink-800 hover:ring-ink-200"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="12vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${productName}`}
          tabIndex={-1}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/90 p-4 outline-none"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected((current) => (current - 1 + images.length) % images.length);
                }}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected((current) => (current + 1) % images.length);
                }}
                aria-label="Próxima foto"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <Image
            src={current.url}
            alt={productName}
            width={1200}
            height={1200}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full rounded object-contain"
            sizes="90vw"
          />
        </div>
      )}
    </div>
  );
}
