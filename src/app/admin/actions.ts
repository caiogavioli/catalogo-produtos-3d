"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type ActionState = { error?: string } | undefined;

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

async function uploadProductImages(productId: string, files: File[]) {
  const supabase = await createClient();
  const uploaded: string[] = [];

  for (const [index, file] of files.entries()) {
    if (!file || file.size === 0) continue;
    const path = `${productId}/${Date.now()}-${index}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("produtos").upload(path, file);
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrl } = supabase.storage.from("produtos").getPublicUrl(path);
    uploaded.push(publicUrl.publicUrl);
  }

  if (uploaded.length > 0) {
    const { data: existing } = await supabase
      .from("product_images")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1);
    let nextPosition = (existing?.[0]?.position ?? -1) + 1;

    const rows = uploaded.map((url) => ({ product_id: productId, url, position: nextPosition++ }));
    const { error } = await supabase.from("product_images").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function createProduct(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw.replace(",", ".")) : null;
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;

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
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Nome é obrigatório." };

  const description = String(formData.get("description") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw.replace(",", ".")) : null;
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;

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
  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
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
