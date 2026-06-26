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
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Array<{ size: string | null; color: string | null }>>([{ size: null, color: null }]);

  if (!p) return <div className="p-10 text-center">المنتج غير موجود</div>;

  const hasOffer = p.is_offer && p.offer_price != null && p.offer_price < p.price;
  const basePrice = hasOffer ? Number(p.offer_price) : Number(p.price);
  const sizes: string[] = p.size_options ?? [];
  const colors: string[] = p.color_options ?? [];

  // Quantity price tiers: [{qty, price}] — price is the TOTAL for that qty bundle
  const rawTiers: Array<{ qty: number; price: number }> = Array.isArray((p as any).quantity_price_tiers)
    ? ((p as any).quantity_price_tiers as any[])
        .map((t) => ({ qty: Number(t?.qty), price: Number(t?.price) }))
        .filter((t) => Number.isFinite(t.qty) && t.qty > 0 && Number.isFinite(t.price) && t.price >= 0)
        .sort((a, b) => a.qty - b.qty)
    : [];
  const tiers = rawTiers.length > 0 ? rawTiers : [{ qty: 1, price: basePrice }];
  const hasTiers = rawTiers.length > 0;

  // Compute total for any quantity by greedily applying the largest tier ≤ remaining, repeating last tier.
  const computeTotal = (n: number): number => {
    let remaining = n;
    let total = 0;
    while (remaining > 0) {
      const tier = [...tiers].reverse().find((t) => t.qty <= remaining) ?? tiers[0];
      total += tier.price;
      remaining -= tier.qty;
    }
    return total;
  };

  const totalPrice = computeTotal(qty);
  const unitPrice = totalPrice / qty;

  const updateQty = (n: number) => {
    const nq = Math.max(1, n);
    setQty(nq);
    setSelections((prev) => {
      const next = [...prev];
      if (nq > next.length) {
        for (let i = next.length; i < nq; i++) next.push({ size: null, color: null });
      } else {
        next.length = nq;
      }
      return next;
    });
  };

  const setPieceSize = (idx: number, s: string) =>
    setSelections((prev) => {
      const next = prev.map((x, i) => i === idx ? { ...x, size: s } : x);
      while (next.length < qty) next.push({ size: null, color: null });
      return next;
    });
  const setPieceColor = (idx: number, c: string) =>
    setSelections((prev) => {
      const next = prev.map((x, i) => i === idx ? { ...x, color: c } : x);
      while (next.length < qty) next.push({ size: null, color: null });
      return next;
    });

  const addToCart = (goCheckout = false) => {
    for (let i = 0; i < qty; i++) {
      const sel = selections[i] ?? { size: null, color: null };
      if (sizes.length > 0 && !sel.size) { toast.error(`اختر المقاس للقطعة ${i + 1}`); return; }
      if (colors.length > 0 && !sel.color) { toast.error(`اختر اللون للقطعة ${i + 1}`); return; }
    }
    for (let i = 0; i < qty; i++) {
      const sel = selections[i];
      cart.add({
        productId: p.id, name: p.name, price: unitPrice, quantity: 1,
        image: gallery[0] ?? null, size: sel.size, color: sel.color,
      });
    }
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
              <span className="font-display text-3xl text-foreground">{basePrice} ج.م</span>
              {hasOffer && <span className="text-lg text-muted-foreground line-through">{p.price} ج.م</span>}
            </div>
            {p.description && <p className="mt-4 text-muted-foreground leading-relaxed">{p.description}</p>}

            {hasTiers && (
              <div className="mt-5 rounded-3xl border border-accent/40 bg-accent/5 p-4">
                <div className="text-sm font-bold text-foreground">عروض الكمية</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {tiers.map((t) => (
                    <div key={t.qty} className={`rounded-2xl border px-3 py-2 text-center text-xs ${qty >= t.qty ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                      <div className="font-bold text-foreground">{t.qty} {t.qty === 1 ? "قطعة" : t.qty === 2 ? "قطعتين" : "قطع"}</div>
                      <div className="text-muted-foreground">{t.price} ج.م</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">الكمية</span>
              <div className="inline-flex items-center rounded-full border border-border bg-card">
                <button onClick={() => updateQty(qty-1)} className="h-11 w-11 text-lg">−</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button onClick={() => updateQty(qty+1)} className="h-11 w-11 text-lg">+</button>
              </div>
              <div className="ms-auto text-end">
                <div className="text-xs text-muted-foreground">الإجمالي</div>
                <div className="font-display text-2xl text-foreground">{totalPrice} ج.م</div>
              </div>
            </div>

            {(sizes.length > 0 || colors.length > 0) && (() => {
              const isComplete = (s: { size: string | null; color: string | null }) =>
                (sizes.length === 0 || !!s.size) && (colors.length === 0 || !!s.color);
              const completedCount = selections.slice(0, qty).filter(isComplete).length;
              return (
                <div className="mt-6">
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
                    <div className="text-sm font-semibold text-foreground">
                      اختر تفاصيل كل قطعة <span className="text-muted-foreground">({qty} {qty === 1 ? "قطعة" : "قطع"})</span>
                    </div>
                    <div className={`text-xs font-bold ${completedCount === qty ? "text-emerald-600" : "text-amber-600"}`}>
                      {completedCount} / {qty} مكتملة
                    </div>
                  </div>

                  <div className="mt-3 space-y-4">
                    {Array.from({ length: qty }).map((_, idx) => {
                      const sel = selections[idx] ?? { size: null, color: null };
                      const done = isComplete(sel);
                      return (
                        <div key={idx} className={`rounded-3xl border bg-card p-4 transition ${done ? "border-emerald-500/60" : "border-amber-500/60"}`}>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>{idx + 1}</span>
                              <span className="text-sm font-bold text-foreground">القطعة {idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {sizes.length > 0 && (
                                <span className={`rounded-full px-2 py-1 font-semibold ${sel.size ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                  المقاس: {sel.size ?? "—"}
                                </span>
                              )}
                              {colors.length > 0 && (
                                <span className={`rounded-full px-2 py-1 font-semibold ${sel.color ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                  اللون: {sel.color ?? "—"}
                                </span>
                              )}
                              {done && <Check className="h-4 w-4 text-emerald-600" />}
                            </div>
                          </div>
                          {sizes.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-semibold text-muted-foreground">المقاس</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {sizes.map((s) => (
                                  <button key={s} onClick={() => setPieceSize(idx, s)} className={`min-w-12 rounded-full border px-4 py-2 text-sm font-medium transition ${sel.size===s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>{s}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {colors.length > 0 && (
                            <div className="mt-3">
                              <div className="text-xs font-semibold text-muted-foreground">اللون</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {colors.map((c) => (
                                  <button key={c} onClick={() => setPieceColor(idx, c)} className={`rounded-full border px-4 py-2 text-sm font-medium transition inline-flex items-center gap-2 ${sel.color===c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"}`}>
                                    {sel.color===c && <Check className="h-3.5 w-3.5" />} {c}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 flex items-center gap-3">
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
