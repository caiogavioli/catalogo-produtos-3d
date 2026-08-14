export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  position: number;
};

export type ColorMode = "unica" | "varias";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  size: string | null;
  price: number | null;
  category_id: string | null;
  featured: boolean;
  view_count: number;
  color_mode: ColorMode;
  created_at: string;
  category?: Category | null;
  images?: ProductImage[];
  colors?: Color[];
};

export type Color = {
  id: string;
  name: string;
  hex: string | null;
  metallic: boolean;
};
