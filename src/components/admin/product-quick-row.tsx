"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { quickUpdateProduct, deleteProduct, type QuickProductPatch } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/delete-button";
import type { Category, Product } from "@/types/catalog";

const campo =
  "w-full rounded-md border border-ink-800 bg-ink-900 px-2 py-1.5 text-sm text-ink-50 focus:border-brand-300 focus:outline-none";

function precoParaCampo(preco: number | null) {
  return preco === null ? "" : String(preco).replace(".", ",");
}

export function ProductQuickRow({ product, categories }: { product: Product; categories: Category[] }) {
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [colorMode, setColorMode] = useState(product.color_mode);
  const [featured, setFeatured] = useState(product.featured);
  const [price, setPrice] = useState(precoParaCampo(product.price));
  const [estado, setEstado] = useState<"" | "salvando" | "salvo" | string>("");
  const [, startTransition] = useTransition();

  function salvar(patch: QuickProductPatch, desfazer: () => void) {
    setEstado("salvando");
    startTransition(async () => {
      const resultado = await quickUpdateProduct(product.id, patch);
      if (resultado.error) {
        desfazer();
        setEstado(`Erro: ${resultado.error}`);
      } else {
        setEstado("salvo");
        setTimeout(() => setEstado((atual) => (atual === "salvo" ? "" : atual)), 1500);
      }
    });
  }

  return (
    <tr className="border-b border-ink-950 align-middle">
      <td className="py-2 pr-2 font-medium text-ink-50">
        {product.name}
        {estado && (
          <span className={`ml-2 text-xs ${estado.startsWith("Erro") ? "text-red-400" : "text-ink-400"}`}>
            {estado === "salvando" ? "salvando…" : estado === "salvo" ? "✓ salvo" : estado}
          </span>
        )}
      </td>
      <td className="py-2 pr-2">
        <select
          className={campo}
          value={categoryId}
          onChange={(e) => {
            const anterior = categoryId;
            setCategoryId(e.target.value);
            salvar({ category_id: e.target.value || null }, () => setCategoryId(anterior));
          }}
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2 pr-2">
        <select
          className={campo}
          value={colorMode}
          onChange={(e) => {
            const anterior = colorMode;
            const novo = e.target.value as "unica" | "varias";
            setColorMode(novo);
            salvar({ color_mode: novo }, () => setColorMode(anterior));
          }}
        >
          <option value="unica">Cor única</option>
          <option value="varias">Várias cores</option>
        </select>
      </td>
      <td className="py-2 pr-2">
        <input
          className={`${campo} w-24 font-mono`}
          inputMode="decimal"
          placeholder="—"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => {
            if (price === precoParaCampo(product.price)) return;
            const anterior = precoParaCampo(product.price);
            salvar({ price }, () => setPrice(anterior));
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      </td>
      <td className="py-2 pr-2 text-center">
        <input
          type="checkbox"
          aria-label="Destacar"
          className="h-5 w-5 accent-[var(--color-brand-700)]"
          checked={featured}
          onChange={(e) => {
            const anterior = featured;
            setFeatured(e.target.checked);
            salvar({ featured: e.target.checked }, () => setFeatured(anterior));
          }}
        />
      </td>
      <td className="py-2 text-right">
        <div className="flex justify-end gap-3">
          <Link href={`/admin/produtos/${product.id}/editar`} className="text-brand-500 hover:underline">
            Editar
          </Link>
          <DeleteButton action={deleteProduct.bind(null, product.id)} />
        </div>
      </td>
    </tr>
  );
}
