import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProductCard, { type ProductLite } from "@/components/site/ProductCard";
import { Truck, ShieldCheck, RotateCcw, Sparkles, ArrowLeft } from "lucide-react";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from("products").select("id,name,price,offer_price,image_url,is_offer").eq("is_active", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("categories").select("id,name,image_url").eq("is_active", true).order("display_order").limit(4),
    ]);
    return { products: (pRes.data ?? []) as ProductLite[], categories: cRes.data ?? [] };
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Black Horse — أزياء فاخرة | شحن سريع ودفع عند الاستلام" },
      { name: "description", content: "تسوق أحدث تشكيلات Black Horse للملابس الفاخرة. خامات راقية، شحن خلال 24-48 ساعة لكل المحافظات، دفع عند الاستلام واستبدال خلال 15 يوم." },
      { property: "og:title", content: "Black Horse — أزياء فاخرة" },
      { property: "og:description", content: "خامات راقية، شحن سريع، دفع عند الاستلام." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
  errorComponent: ({ reset }) => (
    <div className="p-10 text-center"><button onClick={reset}>حاول تاني</button></div>
  ),
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { products, categories } = data;
  const hero = products[0];
  const promo1 = products[1];
  const promo2 = products[2];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* Bento Hero */}
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:h-[560px]">
          {/* Main */}
          <div className="relative overflow-hidden rounded-4xl bg-primary text-primary-foreground md:col-span-2 md:row-span-2 p-8 sm:p-12 flex flex-col justify-between min-h-[420px]">
            <div className="absolute inset-0 opacity-30">
              {hero?.image_url && (
                <img src={hero.image_url} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-l from-primary via-primary/70 to-transparent" />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
                <Sparkles className="h-3.5 w-3.5" /> مجموعة جديدة 2026
              </span>
              <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-7xl">
                أناقة سوداء<br/>
                <span className="text-accent">بلمسة ذهبية.</span>
              </h1>
            </div>
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <p className="max-w-md text-base text-primary-foreground/75">
                Black Horse — بيت أزياء فاخر يقدم قطع مختارة بخامات راقية لرجل يعرف قيمته.
              </p>
              <Link to="/cart" className="group inline-flex items-center gap-3 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:scale-105">
                تسوق الآن
                <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Promo 1 */}
          <Link to={promo1 ? "/product/$id" : "/"} params={promo1 ? { id: promo1.id } : undefined as never} className="group relative overflow-hidden rounded-4xl bg-accent text-accent-foreground p-6 min-h-[180px] flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold tracking-widest">عرض اليوم</div>
              <div className="mt-2 font-display text-3xl">خصم حتى 30%</div>
            </div>
            <div className="text-sm font-medium">على تشكيلة مختارة</div>
            {promo1?.image_url && (
              <img src={promo1.image_url} alt="" className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full object-cover opacity-50 transition group-hover:scale-110" />
            )}
          </Link>

          {/* Promo 2 */}
          <div className="relative overflow-hidden rounded-4xl bg-card border border-border p-6 min-h-[180px] flex flex-col justify-between">
            <div>
              <Truck className="h-7 w-7 text-accent" />
              <div className="mt-3 font-display text-2xl text-foreground">شحن سريع</div>
            </div>
            <p className="text-sm text-muted-foreground">خلال 24-48 ساعة لكل المحافظات</p>
            {promo2?.image_url && (
              <img src={promo2.image_url} alt="" className="absolute -bottom-4 -left-4 h-24 w-24 rounded-2xl object-cover opacity-40" />
            )}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-3xl sm:text-4xl text-foreground">تصفح الأقسام</h2>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {categories.map((c) => (
                <Link key={c.id} to="/category/$id" params={{ id: c.id }} className="group relative aspect-square overflow-hidden rounded-3xl border border-border bg-card">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground"><span className="font-display text-3xl">{c.name?.[0]?.toUpperCase() ?? "?"}</span></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-4">
                    <div className="font-display text-lg text-primary-foreground">{c.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Products */}
        <section id="products" className="mt-20 scroll-mt-24">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs font-bold tracking-[0.3em] text-accent">CURATED</div>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl text-foreground">منتجاتنا المختارة</h2>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">لا توجد منتجات بعد.</div>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>

        {/* Features */}
        <section id="features" className="mt-24 scroll-mt-24 rounded-4xl bg-card border border-border p-8 sm:p-12">
          <h2 className="font-display text-3xl sm:text-4xl text-foreground text-center">ليه Black Horse؟</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Truck, title: "شحن سريع", desc: "خلال 24-48 ساعة لكل المحافظات" },
              { icon: ShieldCheck, title: "دفع عند الاستلام", desc: "ادفع بعد ما تستلم منتجك" },
              { icon: RotateCcw, title: "استبدال 15 يوم", desc: "استبدال أو استرجاع بدون أسئلة" },
              { icon: Sparkles, title: "خامات راقية", desc: "تشكيلة مختارة بعناية" },
            ].map((f) => (
              <div key={f.title} className="text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                  <f.icon className="h-6 w-6" />
                </div>
                <div className="mt-4 font-display text-xl text-foreground">{f.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
