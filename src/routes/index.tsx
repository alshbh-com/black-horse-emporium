import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProductCard, { type ProductLite } from "@/components/site/ProductCard";

const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("id,name,price,offer_price,image_url,is_offer").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("id,name,image_url").eq("is_active", true).order("display_order"),
      ]);
      return { products: (pRes.data ?? []) as ProductLite[], categories: cRes.data ?? [] };
    } catch {
      return { products: [] as ProductLite[], categories: [] as Array<{ id: string; name: string; image_url: string | null }> };
    }
  },

});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Black Horse — أزياء فاخرة" },
      { name: "description", content: "تسوق أحدث تشكيلات Black Horse للملابس الفاخرة." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
  component: Home,

});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { products, categories } = data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {categories.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">الأقسام</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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

        <section id="products" className="mt-16 scroll-mt-24">
          <h2 className="font-display text-3xl sm:text-4xl text-foreground">المنتجات</h2>
          {products.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">لا توجد منتجات بعد.</div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
