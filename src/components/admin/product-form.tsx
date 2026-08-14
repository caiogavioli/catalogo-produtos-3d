"use client";

import { useActionState } from "react";
import { deleteProductImage, type ActionState } from "@/app/admin/actions";
import type { Category, Product } from "@/types/catalog";

export function ProductForm({
  categories,
  product,
  action,
}: {
  categories: Category[];
  product?: Product;
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-200">
          Nome
        </label>
        <input
          id="name"
          name="name"
          defaultValue={product?.name}
          required
          className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
        />
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-ink-200">
          Categoria
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
        >
          <option value="">Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-ink-200">
            Tamanho
          </label>
          <input
            id="size"
            name="size"
            defaultValue={product?.size ?? ""}
            placeholder="ex.: 10x10x15cm"
            className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-ink-200">
            Preço (R$, opcional)
          </label>
          <input
            id="price"
            name="price"
            defaultValue={product?.price ?? ""}
            placeholder="deixe em branco para sob consulta"
            inputMode="decimal"
            className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-ink-200">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
          className="mt-1 w-full rounded border border-ink-800 bg-ink-900 px-3 py-2 text-ink-50 placeholder:text-ink-400"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-200">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={product?.featured ?? false}
          className="h-4 w-4 rounded border-ink-800 bg-ink-900 accent-brand-700"
        />
        Destacar na home (banner do topo)
      </label>

      {product?.images && product.images.length > 0 && (
        <div>
          <p className="block text-sm font-medium text-ink-200">Fotos atuais</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {product.images.map((image) => (
              <div key={image.id} className="group relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full rounded object-cover" />
                <form
                  action={deleteProductImage.bind(null, image.id)}
                  onSubmit={(event) => {
                    if (!confirm("Remover esta foto?")) event.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    title="Remover foto"
                    className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="photos" className="block text-sm font-medium text-ink-200">
          {product ? "Adicionar fotos" : "Fotos"}
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="mt-1 w-full text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
