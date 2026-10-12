// Tipos, valores iniciais e cálculo de preço do sistema de gestão
// (/admin/gestao). Tudo aqui é puro: sem Supabase, sem React.

export type Printer = { id: string; nome: string; preco: number; vida: number; watts: number };

export type Config = {
  printers: Printer[];
  horasDia: number;
  kwh: number;
  das: number;
  outrosFixos: number;
  horasMes: number;
  lucroHora: number;
  maoObra: number;
  perda: number;
  taxaPix: number;
  taxaDeb: number;
  taxaCred: number;
};

// Valores de exemplo: o dono troca pelos reais em Ajustes.
export const DEFAULT_CONFIG: Config = {
  printers: [
    { id: "a1mini", nome: "Bambu A1 mini", preco: 1800, vida: 4000, watts: 80 },
    { id: "a1", nome: "Bambu A1 + AMS", preco: 3500, vida: 4000, watts: 120 },
    { id: "kobra", nome: "Creality Kobra 3 V2", preco: 2200, vida: 4000, watts: 150 },
    { id: "u1", nome: "Snapmaker U1", preco: 7000, vida: 4000, watts: 150 },
  ],
  horasDia: 12,
  kwh: 0.95,
  das: 81,
  outrosFixos: 0,
  horasMes: 300,
  lucroHora: 15,
  maoObra: 20,
  perda: 10,
  taxaPix: 0,
  taxaDeb: 0,
  taxaCred: 0,
};

export const STATUS = ["Novo", "Orçado", "Aprovado", "Na fila", "Imprimindo", "Pronto", "Entregue", "Cancelado"] as const;
export type Status = (typeof STATUS)[number];

export type Filament = {
  id: string;
  marca: string;
  tipo: string;
  cor: string;
  hex: string;
  inicial: number;
  restante: number;
  kg: number;
  minimo: number;
};

export type GestaoClient = { id: string; nome: string; contato: string; notas: string; created_at: string };

export type Order = {
  id: string;
  client_id: string | null;
  product_id: string | null;
  filament_id: string | null;
  canal: string;
  item: string;
  qtd: number;
  preco: number;
  pagamento: string;
  status: string;
  impressora: string;
  urgente: boolean;
  horas: number;
  gramas: number;
  custo: number;
  prazo: string | null;
  pago: boolean;
  notas: string;
  baixado: boolean;
  created_at: string;
};

export type CalcLine = { fid: string; g: number; kg: number };
export type CalcInput = {
  nome: string;
  printer: string;
  h: number;
  m: number;
  lines: CalcLine[];
  mo: number;
  acess: number;
  emb: number;
};

export type Piece = {
  id: string;
  nome: string;
  pix: number;
  deb: number;
  cred: number;
  custo: number;
  inp: CalcInput | null;
  product_id: string | null;
};

// Produto do catálogo do site, só o que a gestão precisa.
export type CatalogProduct = { id: string; name: string; price: number | null; published: boolean };

export function emptyCalc(cfg: Config): CalcInput {
  return {
    nome: "",
    printer: cfg.printers[0]?.id ?? "",
    h: 0,
    m: 0,
    lines: [
      { fid: "", g: 0, kg: 0 },
      { fid: "", g: 0, kg: 0 },
      { fid: "", g: 0, kg: 0 },
    ],
    mo: 5,
    acess: 0,
    emb: 1,
  };
}

export function machineHour(p: Printer, cfg: Config) {
  return p.preco / Math.max(1, p.vida) + (p.watts / 1000) * cfg.kwh;
}

export function overheadHour(cfg: Config) {
  return (cfg.das + cfg.outrosFixos) / Math.max(1, cfg.horasMes);
}

export type CalcResult = {
  h: number;
  maq: number;
  fixo: number;
  mat: number;
  perda: number;
  mo: number;
  ext: number;
  custo: number;
  lucro: number;
  pix: number;
  deb: number;
  cred: number;
  mpix: number;
  mdeb: number;
  mcred: number;
};

export function calc(inp: CalcInput, cfg: Config): CalcResult {
  const p = cfg.printers.find((x) => x.id === inp.printer) ?? cfg.printers[0];
  const h = inp.h + inp.m / 60;
  const maq = p ? machineHour(p, cfg) * h : 0;
  const fixo = overheadHour(cfg) * h;
  const mat = inp.lines.reduce((a, l) => a + (l.g * l.kg) / 1000, 0);
  const perda = (mat * cfg.perda) / 100;
  const mo = (inp.mo / 60) * cfg.maoObra;
  const ext = inp.acess + inp.emb;
  const custo = maq + fixo + mat + perda + mo + ext;
  const lucro = cfg.lucroHora * h;
  const base = custo + lucro;
  // Preço que, depois de descontada a taxa, ainda deixa o valor desejado.
  const preco = (valor: number, taxa: number) => Math.ceil(valor / (1 - taxa / 100));
  return {
    h,
    maq,
    fixo,
    mat,
    perda,
    mo,
    ext,
    custo,
    lucro,
    pix: preco(base, cfg.taxaPix),
    deb: preco(base, cfg.taxaDeb),
    cred: preco(base, cfg.taxaCred),
    mpix: preco(custo, cfg.taxaPix),
    mdeb: preco(custo, cfg.taxaDeb),
    mcred: preco(custo, cfg.taxaCred),
  };
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const R = (n: number) => brl.format(Number.isFinite(n) ? n : 0);

export function num(v: string | number | null | undefined): number {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function isoLocal(d: Date) {
  const m = d.getMonth() + 1;
  const x = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? "0" : ""}${m}-${x < 10 ? "0" : ""}${x}`;
}

export const hoje = () => isoLocal(new Date());

export function fmtData(s: string | null) {
  if (!s) return "";
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
}

export const emAberto = (o: Order) => o.status !== "Entregue" && o.status !== "Cancelado";
export const totalPedido = (o: Order) => o.preco * (o.qtd || 1);
