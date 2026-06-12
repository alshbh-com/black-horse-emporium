import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { useCart } from "@/context/cart";
import { ShoppingBag, Check, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const productQuery = (id: string) => queryOptions({
  queryKey: ["product", id],
  queryFn: async () => {
    const [pRes, iRes] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("product_images").select("image_url,display_order").eq("product_id", id).order("display_order"),
    ]);
    return { product: pRes.data, images: iRes.data ?? [] };
  },
});

export const Route = createFileRoute("/product/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQuery(params.id)),
  component: ProductPage,
  errorComponent: ({ reset }) => <div className="p-10 text-center"><button onClick={reset}>حاول تاني</button></div>,
  notFoundComponent: () => <div className="p-10 text-center">المنتج غير موجود</div>,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(productQuery(id));
  const navigate = useNavigate();
  const cart = useCart();
  const p = data.product;
  const gallery = [p?.image_url, ...data.images.map((i: any) => i.image_url)].filter(Boolean) as string[];
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (!p) return <div className="p-10 text-center">المنتج غير موجود</div>;

  const hasOffer = p.is_offer && p.offer_price != null && p.offer_price < p.price;
  const price = hasOffer ? Number(p.offer_price) : Number(p.price);
  const sizes: string[] = p.size_options ?? [];
  const colors: string[] = p.color_options ?? [];

  const addToCart = (goCheckout = false) => {
    if (sizes.length > 0 && !size) { toast.error("اختر المقاس أولاً"); return; }
    if (colors.length > 0 && !color) { toast.error("اختر اللون أولاً"); return; }
    cart.add({
      productId: p.id, name: p.name, price, quantity: qty,
      image: gallery[0] ?? null, size, color,
    });
    toast.success("أضيف إلى السلة");
    if (goCheckout) navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="mt-6 text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">الرئيسية</Link> / <span className="text-foreground">{p.name}</span></nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-4xl border border-border bg-card">
              {gallery[active] ? (
                <img src={gallery[active]} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted font-display text-6xl text-muted-foreground">BH</div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((g, i) => (
                  <button key={i} onClick={() => setActive(i)} className={`aspect-square overflow-hidden rounded-2xl border-2 ${active===i ? "border-accent" : "border-border"}`}>
                    <img src={g} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {hasOffer && <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">عرض خاص</span>}
            <h1 className="mt-3 font-display text-4xl sm:text-5xl text-foreground">{p.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-display text-3xl text-foreground">{price} ج.م</span>
              {hasOffer && <span className="text-lg text-muted-foreground line-through">{p.price} ج.م</span>}
            </div>
            {p.description && <p className="mt-4 text-muted-foreground leading-relaxed">{p.description}</p>}

            {sizes.length > 0 && (
              <div className="mt-8">
                <div className="text-sm font-semibold text-foreground">المقاس</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)} className={`min-w-12 rounded-full border px-4 py-2 text-sm font-medium transition ${size===s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {colors.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-foreground">اللون</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition inline-flex items-center gap-2 ${color===c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
                      {color===c && <Check className="h-3.5 w-3.5" />} {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-border bg-card">
                <button onClick={() => setQty(Math.max(1, qty-1))} className="h-11 w-11 text-lg">−</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(qty+1)} className="h-11 w-11 text-lg">+</button>
              </div>
              <button onClick={() => addToCart(false)} className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary bg-card text-sm font-semibold text-foreground hover:bg-muted">
                <ShoppingBag className="h-4 w-4" /> أضف للسلة
              </button>
              <button onClick={() => addToCart(true)} className="flex-1 inline-flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90">
                اشتري الآن
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[{icon:Truck,t:"شحن 24-48س"},{icon:ShieldCheck,t:"دفع عند الاستلام"},{icon:RotateCcw,t:"استبدال 15 يوم"}].map((f) => (
                <div key={f.t} className="rounded-2xl border border-border bg-card p-3">
                  <f.icon className="mx-auto h-5 w-5 text-accent" />
                  <div className="mt-1 text-xs font-medium text-foreground">{f.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
