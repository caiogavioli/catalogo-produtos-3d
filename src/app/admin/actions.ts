"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ActionState = { error?: string } | undefined;

const STORAGE_BUCKET = "produtos";

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
};

function parseProductForm(formData: FormData): { data: ParsedProductForm } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;

  const priceRaw = String(formData.get("price") ?? "").trim();
  let price: number | null = null;
  if (priceRaw) {
    // aceita formato brasileiro (milhar com ponto, decimal com vírgula): "1.234,56"
    const normalized = priceRaw.replace(/\./g, "").replace(",", ".");
    price = Number(normalized);
    if (!Number.isFinite(price)) return { error: "Preço inválido." };
  }

  return { data: { name, description, size, price, categoryId } };
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
  const { name, description, size, price, categoryId } = parsed.data;

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, slug: slugify(name), description, size, price, category_id: categoryId })
    .select("id")
    .single();

  if (error || !product) {
    return { error: error?.message ?? "Não foi possível criar o produto." };
  }

  try {
    const files = formData.getAll("photos") as File[];
    await uploadProductImages(product.id, files);
  } catch (uploadError) {
    return { error: uploadError instanceof Error ? uploadError.message : "Falha ao enviar fotos." };
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
  const { name, description, size, price, categoryId } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ name, slug: slugify(name), description, size, price, category_id: categoryId })
    .eq("id", id);

  if (error) return { error: error.message };

  try {
    const files = formData.getAll("photos") as File[];
    await uploadProductImages(id, files);
  } catch (uploadError) {
    return { error: uploadError instanceof Error ? uploadError.message : "Falha ao enviar fotos." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteProductImage(imageId: string) {
  const supabase = await createClient();
  const { data: image } = await supabase.from("product_images").select("url").eq("id", imageId).single();

  await supabase.from("product_images").delete().eq("id", imageId);
  if (image) await removeStorageFiles([image.url]);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);

  await supabase.from("products").delete().eq("id", id);
  if (images && images.length > 0) await removeStorageFiles(images.map((image) => image.url));

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createCategory(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name, slug: slugify(name) });
  if (error) return { error: error.message };

  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function createColor(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };
  const hex = String(formData.get("hex") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("colors").insert({ name, hex });
  if (error) return { error: error.message };

  revalidatePath("/admin/cores");
  revalidatePath("/cores");
}

export async function deleteColor(id: string) {
  const supabase = await createClient();
  await supabase.from("colors").delete().eq("id", id);
  revalidatePath("/admin/cores");
  revalidatePath("/cores");
}
