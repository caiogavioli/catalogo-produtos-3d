"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ActionState = { error?: string; success?: boolean } | undefined;

const STORAGE_BUCKET = "produtos";

// Segunda camada de checagem: o middleware e o layout já bloqueiam acesso
// não autenticado às rotas do admin, mas cada Server Action de escrita
// também confirma a sessão por conta própria — não depende só da RLS.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return supabase;
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

type ParsedProductForm = {
  name: string;
  description: string | null;
  size: string | null;
  price: number | null;
  categoryId: string | null;
  featured: boolean;
  colorMode: "unica" | "varias";
  colorIds: string[];
};

// Aceita tanto "1.234,56" (formato BR, vírgula decimal) quanto "45.90"
// (alguém digitando ponto decimal sem perceber que o campo é BR) sem
// interpretar o segundo caso como 4590 — antes disso já aconteceu de um
// preço ficar 100x maior do que o digitado, sem nenhum aviso.
function parseBrazilianOrPlainPrice(raw: string): number | null {
  if (raw.includes(",")) {
    const value = Number(raw.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(value) ? value : null;
  }

  const dotMatches = raw.match(/\./g) ?? [];
  const lastDot = raw.lastIndexOf(".");
  const decimalsAfterLastDot = lastDot === -1 ? 0 : raw.length - lastDot - 1;
  const looksLikeDecimalPoint = dotMatches.length === 1 && decimalsAfterLastDot > 0 && decimalsAfterLastDot <= 2;

  const value = Number(looksLikeDecimalPoint ? raw : raw.replace(/\./g, ""));
  return Number.isFinite(value) ? value : null;
}

function parseProductForm(formData: FormData): { data: ParsedProductForm } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const featured = formData.get("featured") === "on";
  const colorMode = formData.get("color_mode") === "varias" ? "varias" : "unica";
  const colorIds = colorMode === "varias" ? (formData.getAll("color_ids") as string[]) : [];

  const priceRaw = String(formData.get("price") ?? "").trim();
  let price: number | null = null;
  if (priceRaw) {
    price = parseBrazilianOrPlainPrice(priceRaw);
    if (price === null) return { error: "Preço inválido." };
  }

  return { data: { name, description, size, price, categoryId, featured, colorMode, colorIds } };
}

// Gera um slug garantidamente livre, acrescentando -2, -3... quando o
// nome do produto já resultou no mesmo slug de outro (ex.: dois produtos
// chamados "Vaso espiral"). excludeId evita que editar um produto colida
// com o próprio slug dele mesmo.
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "products" | "categories",
  base: string,
  excludeId?: string,
): Promise<string> {
  let candidate = base;
  for (let suffix = 2; ; suffix++) {
    let query = supabase.from(table).select("id").eq("slug", candidate);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.limit(1);
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
  }
}

async function syncProductColors(productId: string, colorIds: string[]) {
  const supabase = await createClient();
  await supabase.from("product_colors").delete().eq("product_id", productId);
  if (colorIds.length === 0) return;

  const rows = colorIds.map((colorId) => ({ product_id: productId, color_id: colorId }));
  const { error } = await supabase.from("product_colors").insert(rows);
  if (error) throw new Error(error.message);
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

async function uploadProductImages(productId: string, files: File[]) {
  const supabase = await createClient();
  const validFiles = files.filter((file) => file && file.size > 0);
  if (validFiles.length === 0) return;

  const uploadedUrls = await Promise.all(
    validFiles.map(async (file, index) => {
      const path = `${productId}/${Date.now()}-${index}-${file.name}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file);
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return data.publicUrl;
    }),
  );

  const { data: existing } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);
  let nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const rows = uploadedUrls.map((url) => ({ product_id: productId, url, position: nextPosition++ }));
  const { error } = await supabase.from("product_images").insert(rows);
  if (error) throw new Error(error.message);
}

async function removeStorageFiles(urls: string[]) {
  const paths = urls.map(storagePathFromUrl).filter((path): path is string => Boolean(path));
  if (paths.length === 0) return;
  const supabase = await createClient();
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}

export async function createProduct(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { name, description, size, price, categoryId, featured, colorMode, colorIds } = parsed.data;

  const supabase = await requireAdmin();
  const slug = await uniqueSlug(supabase, "products", slugify(name));
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description,
      size,
      price,
      category_id: categoryId,
      featured,
      color_mode: colorMode,
    })
    .select("id")
    .single();

  if (error || !product) {
    return { error: error?.message ?? "Não foi possível criar o produto." };
  }

  try {
    await syncProductColors(product.id, colorIds);
    const files = formData.getAll("photos") as File[];
    await uploadProductImages(product.id, files);
  } catch (uploadError) {
    // Sem isso, uma falha no upload (ex.: nome de arquivo que quebra o
    // caminho no storage) deixava o produto "fantasma" já salvo no banco,
    // sem foto e sem indicação clara pro usuário do que aconteceu.
    await supabase.from("products").delete().eq("id", product.id);
    return {
      error:
        (uploadError instanceof Error ? uploadError.message : "Falha ao salvar o produto.") +
        " O produto não foi criado — tente de novo.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateProduct(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { name, description, size, price, categoryId, featured, colorMode, colorIds } = parsed.data;

  const supabase = await requireAdmin();
  const slug = await uniqueSlug(supabase, "products", slugify(name), id);
  const { error } = await supabase
    .from("products")
    .update({
      name,
      slug,
      description,
      size,
      price,
      category_id: categoryId,
      featured,
      color_mode: colorMode,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  try {
    await syncProductColors(id, colorIds);
    const files = formData.getAll("photos") as File[];
    await uploadProductImages(id, files);
  } catch (uploadError) {
    return { error: uploadError instanceof Error ? uploadError.message : "Falha ao salvar o produto." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteProductImage(imageId: string) {
  const supabase = await requireAdmin();
  const { data: image } = await supabase.from("product_images").select("url").eq("id", imageId).single();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw new Error(error.message);
  // Remove o arquivo do storage só depois de confirmar que a linha saiu do
  // banco — evita órfão no storage se a linha nem existia mais.
  if (image) await removeStorageFiles([image.url]);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  const supabase = await requireAdmin();
  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (images && images.length > 0) await removeStorageFiles(images.map((image) => image.url));

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createCategory(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const supabase = await requireAdmin();
  const slug = await uniqueSlug(supabase, "categories", slugify(name));
  const { error } = await supabase.from("categories").insert({ name, slug });
  if (error) return { error: error.message };

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function createColor(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };
  const hex = String(formData.get("hex") ?? "").trim() || null;
  const metallic = formData.get("metallic") === "on";

  const supabase = await requireAdmin();
  const { error } = await supabase.from("colors").insert({ name, hex, metallic });
  if (error) return { error: error.message };

  revalidatePath("/admin/cores");
  revalidatePath("/admin/produtos/novo");
  return { success: true };
}

export async function updateColor(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };
  const hex = String(formData.get("hex") ?? "").trim() || null;
  const metallic = formData.get("metallic") === "on";

  const supabase = await requireAdmin();
  const { error } = await supabase.from("colors").update({ name, hex, metallic }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/cores");
  revalidatePath("/admin/produtos/novo");
  revalidatePath("/");
  return { success: true };
}

export async function deleteColor(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("colors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cores");
  revalidatePath("/admin/produtos/novo");
}
