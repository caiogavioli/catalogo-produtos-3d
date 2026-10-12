"use server";

import { headers } from "next/headers";
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

// "Esqueci minha senha": manda o e-mail com o link de redefinição. A
// resposta é sempre a mesma, exista o e-mail ou não, pra ninguém usar o
// formulário pra descobrir quais e-mails têm login.
export async function requestPasswordReset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Informe o e-mail." };

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${proto}://${host}/auth/callback?next=/admin/redefinir-senha`,
  });
  if (error && error.status === 429) return { error: "Muitos pedidos seguidos. Espere alguns minutos e tente de novo." };
  return { success: true };
}

// Tela de nova senha: só chega aqui quem abriu o link do e-mail (a sessão
// de recuperação vem do /auth/callback); o middleware barra o resto.
export async function updatePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (password !== confirm) return { error: "As duas senhas não são iguais." };

  const supabase = await requireAdmin();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Não consegui salvar a senha. Peça um novo link e tente de novo." };

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

export type QuickProductPatch = {
  category_id?: string | null;
  featured?: boolean;
  published?: boolean;
  color_mode?: "unica" | "varias";
  price?: string | null;
};

// Edição rápida direto na lista de produtos: cada dropdown/campo salva só
// o que mudou, sem abrir o formulário completo. Trocar pra "cor única" não
// apaga as cores escolhidas (voltar pra "várias" recupera a seleção).
export async function quickUpdateProduct(id: string, patch: QuickProductPatch): Promise<{ error?: string }> {
  const supabase = await requireAdmin();
  const update: Record<string, unknown> = {};

  if ("category_id" in patch) update.category_id = patch.category_id || null;
  if ("featured" in patch) update.featured = Boolean(patch.featured);
  if ("published" in patch) update.published = Boolean(patch.published);
  if ("color_mode" in patch) update.color_mode = patch.color_mode === "varias" ? "varias" : "unica";
  if ("price" in patch) {
    const raw = (patch.price ?? "").trim();
    if (!raw) {
      update.price = null;
    } else {
      const value = parseBrazilianOrPlainPrice(raw);
      if (value === null) return { error: "Preço inválido." };
      update.price = value;
    }
  }
  if (Object.keys(update).length === 0) return {};

  const { error } = await supabase.from("products").update(update).eq("id", id);
  if (error) return { error: error.message };

  // "Várias cores" num produto sem cor nenhuma: já marca todas as cadastradas.
  if (update.color_mode === "varias") {
    const { count } = await supabase
      .from("product_colors")
      .select("color_id", { count: "exact", head: true })
      .eq("product_id", id);
    if (!count) {
      const { data: todas } = await supabase.from("colors").select("id");
      if (todas?.length) {
        await supabase.from("product_colors").insert(todas.map((c) => ({ product_id: id, color_id: c.id })));
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/categoria", "layout");
  revalidatePath("/busca");
  return {};
}

const MAKERWORLD_IMAGE_BASE = "https://makerworld.bblmw.com/makerworld/model/";

export type SyncModelResult = {
  status: "criado" | "existe" | "removido" | "mantido" | "nada";
  error?: string;
  aviso?: string;
  fotos?: number;
};

const MAX_PHOTOS = 5;

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>;

function isSafePhotoPath(path: string) {
  return /^[A-Za-z0-9_\-./]+$/.test(path) && !path.includes("..");
}

function collectPictureUrls(node: unknown, found: string[], depth = 0) {
  if (depth > 12 || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectPictureUrls(item, found, depth + 1);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (/^(designPictures|design_pictures)$/.test(key) && Array.isArray(value)) {
      for (const item of value) {
        const url = typeof item === "string" ? item : (item as { url?: unknown })?.url;
        if (typeof url === "string") found.push(url);
      }
    } else {
      collectPictureUrls(value, found, depth + 1);
    }
  }
}

// Tenta descobrir as fotos extras de um modelo do MakerWorld. Melhor
// esforço: o site não tem API oficial e pode bloquear o servidor — nesse caso
// devolve lista vazia e quem chamou segue só com a capa.
async function fetchMakerworldPhotoPaths(modelId: number): Promise<string[]> {
  const headers = { "user-agent": "Mozilla/5.0", accept: "application/json,text/html" };
  const urls: string[] = [];
  const sources = [
    { url: `https://makerworld.com/api/v1/design-service/design/${modelId}`, json: true },
    { url: `https://makerworld.com/en/models/${modelId}`, json: false },
  ];
  for (const source of sources) {
    try {
      const response = await fetch(source.url, { headers, signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const text = await response.text();
      let data: unknown = null;
      if (source.json) {
        data = JSON.parse(text);
      } else {
        const match = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (match) data = JSON.parse(match[1]);
      }
      collectPictureUrls(data, urls);
      if (urls.length > 0) break;
    } catch {
      // tenta a próxima fonte
    }
  }

  const paths: string[] = [];
  for (const raw of urls) {
    try {
      const parsed = new URL(raw);
      const marker = "/makerworld/model/";
      if (parsed.hostname !== "makerworld.bblmw.com" || !parsed.pathname.startsWith(marker)) continue;
      const path = decodeURIComponent(parsed.pathname.slice(marker.length));
      if (isSafePhotoPath(path) && !paths.includes(path)) paths.push(path);
    } catch {
      // url inválida, ignora
    }
  }
  return paths;
}

// Baixa as fotos do MakerWorld (em paralelo), sobe no storage e grava em
// product_images a partir de startPosition. Devolve quantas deram certo.
async function attachMakerworldPhotos(
  supabase: AdminClient,
  productId: string,
  photoPaths: string[],
  startPosition: number,
): Promise<number> {
  const stamp = Date.now();
  const results = await Promise.all(
    photoPaths.map(async (photoPath, index) => {
      try {
        const response = await fetch(
          `${MAKERWORLD_IMAGE_BASE}${photoPath}?x-oss-process=image/resize,w_1200/format,webp`,
          { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) },
        );
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        const base = (photoPath.split("/").pop() ?? "foto").replace(/\.[A-Za-z0-9]+$/, "").replace(/[^A-Za-z0-9_-]/g, "");
        const path = `${productId}/${stamp}-${index}-mw-${base}.webp`;
        const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, bytes, { contentType: "image/webp" });
        if (error) return null;
        return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
      } catch {
        return null;
      }
    }),
  );

  const urls = results.filter((url): url is string => Boolean(url));
  if (urls.length === 0) return 0;
  const rows = urls.map((url, index) => ({ product_id: productId, url, position: startPosition + index }));
  const { error } = await supabase.from("product_images").insert(rows);
  if (error) {
    await removeStorageFiles(urls);
    throw new Error(error.message);
  }
  return urls.length;
}

// Define qual foto é a capa: ela vai pra posição 0 e as outras seguem na
// ordem atual.
export async function setCoverImage(imageId: string) {
  const supabase = await requireAdmin();
  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", imageId).single();
  if (!image) return;
  const { data: images } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", image.product_id)
    .order("position");
  const ordered = [imageId, ...(images ?? []).map((row) => row.id).filter((id) => id !== imageId)];
  await Promise.all(
    ordered.map((id, position) => supabase.from("product_images").update({ position }).eq("id", id)),
  );
  revalidatePath("/admin");
  revalidatePath("/");
}

export type MoreMakerworldPhotosResult = { error?: string; adicionadas?: number; aviso?: string };

// Botão "Buscar mais fotos do MakerWorld" na edição do produto: completa até
// 5 fotos com as que ainda não estão no produto.
export async function fetchMoreMakerworldPhotos(productId: string): Promise<MoreMakerworldPhotosResult> {
  const supabase = await requireAdmin();
  const { data: product } = await supabase.from("products").select("makerworld_id").eq("id", productId).single();
  if (!product?.makerworld_id) return { error: "Este produto não veio do MakerWorld." };

  const { data: current } = await supabase
    .from("product_images")
    .select("url, position")
    .eq("product_id", productId)
    .order("position", { ascending: false });
  const have = current?.length ?? 0;
  if (have >= MAX_PHOTOS) return { error: `Já tem ${MAX_PHOTOS} fotos. Remova alguma antes.` };

  const found = await fetchMakerworldPhotoPaths(product.makerworld_id);
  const known = (current ?? []).map((row) => row.url);
  const fresh = found.filter((path) => {
    const base = (path.split("/").pop() ?? "").replace(/\.[A-Za-z0-9]+$/, "").replace(/[^A-Za-z0-9_-]/g, "");
    return !known.some((url) => url.includes(`-mw-${base}.webp`));
  });
  if (found.length === 0) {
    return { aviso: "O MakerWorld não deixou o site buscar as fotos. Suba as fotos manualmente (até 5)." };
  }
  if (fresh.length === 0) return { adicionadas: 0, aviso: "Não há fotos novas desse modelo." };

  const added = await attachMakerworldPhotos(
    supabase,
    productId,
    fresh.slice(0, MAX_PHOTOS - have),
    (current?.[0]?.position ?? -1) + 1,
  );
  revalidatePath("/admin");
  revalidatePath("/");
  return { adicionadas: added };
}

// Mantém o produto-rascunho de um modelo do MakerWorld em sincronia com as
// marcações "Quero" da página /admin/escolha: se alguém (o dono ou a
// esposa) quer o modelo, existe um produto rascunho com o nome e a foto
// dele; se ninguém quer mais, o rascunho some, desde que ninguém tenha
// mexido nele (categoria, preço, descrição ou publicação) — senão ele fica.
export async function syncModelProduct(model: {
  id: number;
  name: string;
  photoPath: string;
}): Promise<SyncModelResult> {
  const supabase = await requireAdmin();
  const name = model.name.trim();
  if (!Number.isInteger(model.id) || !name || name.length > 200) {
    return { status: "nada", error: "Modelo inválido." };
  }

  const { count } = await supabase
    .from("model_picks")
    .select("model_id", { count: "exact", head: true })
    .eq("model_id", model.id)
    .eq("status", "q");
  const wanted = (count ?? 0) > 0;

  const { data: existing } = await supabase
    .from("products")
    .select("id, published, category_id, price, description")
    .eq("makerworld_id", model.id)
    .maybeSingle();

  if (!wanted) {
    if (!existing) return { status: "nada" };
    const intacto =
      !existing.published && !existing.category_id && existing.price === null && !existing.description;
    if (!intacto) return { status: "mantido" };

    const { data: images } = await supabase.from("product_images").select("url").eq("product_id", existing.id);
    const { error } = await supabase.from("products").delete().eq("id", existing.id);
    if (error) return { status: "nada", error: error.message };
    if (images && images.length > 0) await removeStorageFiles(images.map((image) => image.url));
    revalidatePath("/admin");
    return { status: "removido" };
  }

  if (existing) return { status: "existe" };

  const slug = await uniqueSlug(supabase, "products", slugify(name));
  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, slug, makerworld_id: model.id, published: false })
    .select("id")
    .single();
  if (error || !product) {
    // outra pessoa marcou ao mesmo tempo e o produto já foi criado
    if (error?.code === "23505") return { status: "existe" };
    return { status: "nada", error: error?.message ?? "Não foi possível criar o rascunho." };
  }

  let aviso: string | undefined;
  let fotos = 0;
  try {
    if (!isSafePhotoPath(model.photoPath)) throw new Error("caminho de foto inválido");
    // A capa do modelo vem primeiro (posição 0); as outras fotos são
    // tentativa — se o MakerWorld não responder, fica só a capa.
    const extras = await fetchMakerworldPhotoPaths(model.id);
    const paths = [model.photoPath, ...extras.filter((path) => path !== model.photoPath)].slice(0, MAX_PHOTOS);
    fotos = await attachMakerworldPhotos(supabase, product.id, paths, 0);
    if (fotos === 0) throw new Error("nenhuma foto baixou");
  } catch (photoError) {
    aviso = `Rascunho criado sem foto (${photoError instanceof Error ? photoError.message : "erro ao baixar"}). Suba a foto na edição.`;
  }

  revalidatePath("/admin");
  return { status: "criado", aviso, fotos };
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
