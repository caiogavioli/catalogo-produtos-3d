import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProductCard } from "@/components/product-card";
import { flattenProductColors } from "@/lib/colors";
import { formatPrice } from "@/lib/format";
import { whatsappContactLink } from "@/lib/whatsapp";
import type { Category, Product } from "@/types/catalog";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase
      .from("products")
      .select("id, name, slug, description, size, price, category_id, featured, view_count, color_mode, created_at, images:product_images(id, product_id, url, position), product_colors(color:colors(id, name, hex, metallic))")
      .eq("published", true)
      .order("created_at", { ascending: false })
      // A home só mostra uma amostra por seção — limitar a busca evita
      // baixar o catálogo inteiro (que deve crescer para centenas de
      // produtos) a cada carregamento.
      .limit(120),
  ]);

  const allProducts = (products ?? []).map(flattenProductColors) as Product[];
  for (const product of allProducts) {
    product.images?.sort((a, b) => a.position - b.position);
  }

  if (allProducts.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-ink-400">
        Catálogo ainda sem produtos cadastrados.
      </div>
    );
  }

  const categoriesList = (categories ?? []) as Category[];
  const countByCategory = new Map<string, number>();
  for (const product of allProducts) {
    if (product.category_id) {
      countByCategory.set(product.category_id, (countByCategory.get(product.category_id) ?? 0) + 1);
    }
  }
  const categoriasComProduto = categoriesList.filter((category) => (countByCategory.get(category.id) ?? 0) > 0);

  const featured = allProducts.filter((product) => product.featured);
  // O carrossel do topo mostra os produtos marcados como "destacar" (ou os 5
  // mais recentes, se nenhum estiver marcado). A faixa de "Escolha a sua"
  // lista os destacados primeiro e completa com os mais recentes.
  const banners = featured.length > 0 ? featured : allProducts.slice(0, 5);
  const strip = [...featured, ...allProducts.filter((product) => !product.featured)].slice(0, 10);
  const maisVistos = allProducts
    .filter((product) => product.view_count > 0)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 8);
  const whatsapp = whatsappContactLink();

  return (
    <div>
      {/* Topo: só o carrossel de destaques */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-6 md:pb-20 md:pt-8">
        <HeroCarousel products={banners} />
      </section>

      {/* Parte clara: faixa de produtos, categorias, mais vistos e contato */}
      <section id="catalogo" className="rounded-t-[48px] bg-[#f6f2fc] pb-16 pt-14 text-ink-950 md:pt-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-4xl font-bold md:text-6xl">Escolha a sua.</h2>
          <p className="mt-3 max-w-lg text-[#4b3f66]">Deslize para ver as peças do catálogo.</p>

          <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 [scrollbar-width:none]">
            {strip.map((product) => {
              const cover = product.images?.[0];
              return (
                <li key={product.id} className="w-[240px] flex-none snap-start md:w-[300px]">
                  <Link href={`/produto/${product.slug}`} className="group block">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-black">
                      {cover ? (
                        <Image
                          src={cover.url}
                          alt={product.name}
                          fill
                          sizes="300px"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-ink-400">Sem foto</div>
                      )}
                      <span className="absolute bottom-3 right-3 rounded-xl bg-ink-50 px-3.5 py-2 font-mono text-base font-bold text-ink-950">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{product.name}</h3>
                    {product.size && <p className="mt-0.5 text-sm text-[#6b5f85]">{product.size}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>

          {categoriasComProduto.length > 0 && (
            <div className="mt-10 border-t border-[#d6cce6]">
              {categoriasComProduto.map((category) => (
                <Link
                  key={category.id}
                  href={`/categoria/${category.slug}`}
                  className="group flex items-center justify-between gap-6 border-b border-[#d6cce6] py-6 transition-[padding] duration-500 hover:pl-4 md:py-7"
                >
                  <div>
                    <h3 className="text-3xl font-semibold md:text-5xl">{category.name}</h3>
                    <p className="mt-1 text-[#6b5f85]">
                      {countByCategory.get(category.id)} {countByCategory.get(category.id) === 1 ? "peça" : "peças"}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ink-950 text-white transition-colors group-hover:bg-brand-700 md:h-[52px] md:w-[52px]">
                    <ArrowUpRight className="h-5 w-5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          )}

          {maisVistos.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-5 text-3xl font-bold md:text-4xl">Mais vistos</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {maisVistos.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {whatsapp && (
            <div className="mt-16 grid items-center gap-8 rounded-[44px] bg-brand-700 bg-[radial-gradient(ellipse_60%_100%_at_100%_0%,rgba(255,255,255,0.22),transparent_60%)] p-8 text-white md:grid-cols-[1.4fr_1fr] md:p-16">
              <div>
                <h2 className="text-4xl font-bold md:text-5xl">Fale com a gente e receba um orçamento.</h2>
                <p className="mt-3 max-w-md text-[#ece4fb]">Mande a peça que você quer e respondemos com cor, prazo e valor.</p>
              </div>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="justify-self-start rounded-[14px] bg-white px-7 py-4 font-semibold text-ink-950 md:justify-self-end"
              >
                Chamar no WhatsApp
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
