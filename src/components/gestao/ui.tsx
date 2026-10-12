"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogProduct, Config, Filament, GestaoClient, Order, Piece } from "@/lib/gestao";

export type Ctx = {
  supabase: SupabaseClient;
  cfg: Config;
  fil: Filament[];
  ord: Order[];
  pcs: Piece[];
  cli: GestaoClient[];
  products: CatalogProduct[];
  loaded: boolean;
  reload: () => Promise<void>;
  toast: (msg: string) => void;
};

export const campo =
  "w-full rounded-lg border border-ink-800 bg-ink-950 px-3 py-2.5 text-sm text-ink-50 focus:border-brand-300 focus:outline-none";
export const rotulo = "mb-1 block text-xs text-ink-400";
export const btn =
  "rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-50";
export const btnGhost =
  "rounded-full border border-ink-800 px-4 py-2 text-sm font-medium text-ink-50 transition-colors hover:bg-ink-800";
export const btnPerigo =
  "rounded-full border border-red-500/60 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950";
export const cartao = "glass-card mb-3 rounded-xl p-4";
export const selo =
  "inline-block whitespace-nowrap rounded-full border border-ink-800 bg-ink-800 px-2.5 py-0.5 text-xs font-semibold text-ink-50";
export const seloOk = "inline-block whitespace-nowrap rounded-full border border-emerald-500/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-400";
export const seloAviso = "inline-block whitespace-nowrap rounded-full border border-amber-500/60 px-2.5 py-0.5 text-xs font-semibold text-amber-400";
export const seloRuim = "inline-block whitespace-nowrap rounded-full border border-red-500/60 px-2.5 py-0.5 text-xs font-semibold text-red-400";

export function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92%] w-full max-w-3xl overflow-auto rounded-t-2xl border border-ink-800 bg-ink-950 p-4 pb-8"
      >
        {children}
      </div>
    </div>
  );
}

export function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 min-w-0">
      <label htmlFor={id} className={rotulo}>
        {label}
      </label>
      {children}
    </div>
  );
}
