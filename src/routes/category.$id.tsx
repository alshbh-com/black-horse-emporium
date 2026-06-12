import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ProductCard, { type ProductLite } from "@/components/site/ProductCard";

const catQuery = (id: string) => queryOptions({
  queryKey: ["category", id],
  queryFn: async () => {
    const [cRes, pRes] = await Promise.all([
      supabase.from("categories").select("id,name,description,image_url").eq("id", id).maybeSingle(),
      supabase.from("products").select("id,name,price,offer_price,image_url,is_offer").eq("category_id", id).eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    return { category: cRes.data, products: (pRes.data ?? []) as ProductLite[] };
  },
});

export const Route = createFileRoute("/category/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(catQuery(params.id)),
  component: CategoryPage,
  errorComponent: ({ reset }) => <div className="p-10 text-center"><button onClick={reset}>حاول تاني</button></div>,
  notFoundComponent: () => <div className="p-10 text-center">القسم غير موجود</div>,
});

function CategoryPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(catQuery(id));
  const { category, products } = data;
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="mt-6 text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">الرئيسية</Link> / <span className="text-foreground">{category?.name}</span></nav>
        <header className="mt-6 rounded-4xl bg-primary text-primary-foreground p-10 sm:p-16 relative overflow-hidden">
          {category?.image_url && <img src={category.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
          <div className="relative">
            <h1 className="font-display text-4xl sm:text-6xl">{category?.name ?? "القسم"}</h1>
            {category?.description && <p className="mt-3 max-w-2xl text-primary-foreground/75">{category.description}</p>}
          </div>
        </header>
        <section className="mt-10">
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">لا توجد منتجات في هذا القسم.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
