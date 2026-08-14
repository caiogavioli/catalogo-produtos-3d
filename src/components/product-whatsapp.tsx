"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { colorSwatchStyle } from "@/lib/colors";
import type { Color } from "@/types/catalog";

// Mostra os círculos de cor (só quando o produto tem "várias cores") e o
// botão de WhatsApp, já com a cor escolhida na mensagem.
export function ProductWhatsapp({
  productName,
  colorMode,
  colors,
}: {
  productName: string;
  colorMode: "unica" | "varias";
  colors: Color[];
}) {
  const showColors = colorMode === "varias" && colors.length > 0;
  const [selectedColor, setSelectedColor] = useState<Color | null>(showColors ? colors[0] : null);

  const whatsapp = whatsappLink(productName, selectedColor?.name);

  return (
    <div className="space-y-4">
      {showColors && (
        <div>
          <p className="text-sm font-medium text-ink-200">Cores disponíveis</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color)}
                title={color.name}
                aria-label={color.name}
                aria-pressed={selectedColor?.id === color.id}
                className={`h-8 w-8 rounded-full ring-2 transition-shadow ${
                  selectedColor?.id === color.id ? "ring-brand-500" : "ring-ink-800 hover:ring-ink-200"
                }`}
                style={colorSwatchStyle(color)}
              />
            ))}
          </div>
          {selectedColor && <p className="mt-1 text-sm text-ink-400">{selectedColor.name}</p>}
        </div>
      )}

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          Perguntar no WhatsApp
        </a>
      )}
    </div>
  );
}
