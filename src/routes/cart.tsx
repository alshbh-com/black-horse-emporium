import { createFileRoute, Link } from "@tanstack/react-router";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { useCart } from "@/context/cart";
import { Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "السلة — Black Horse" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, remove, setQty, subtotal } = useCart();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl text-foreground">سلة التسوق</h1>
        {items.length === 0 ? (
          <div className="mt-10 rounded-4xl border border-dashed border-border p-16 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">السلة فارغة</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">ابدأ التسوق</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-4 rounded-3xl border border-border bg-card p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-lg text-foreground">{i.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {i.size && <span>المقاس: {i.size}</span>}{i.size && i.color && " · "}{i.color && <span>اللون: {i.color}</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button onClick={() => setQty(i.id, i.quantity-1)} className="h-8 w-8">−</button>
                        <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                        <button onClick={() => setQty(i.id, i.quantity+1)} className="h-8 w-8">+</button>
                      </div>
                      <div className="font-semibold">{i.price * i.quantity} ج.م</div>
                    </div>
                  </div>
                  <button onClick={() => remove(i.id)} className="self-start text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl text-foreground">ملخص الطلب</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span className="font-semibold">{subtotal} ج.م</span></div>
                <div className="flex justify-between text-muted-foreground"><span>الشحن</span><span>يُحسب عند الدفع</span></div>
              </div>
              <Link to="/checkout" className="mt-6 block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90">إتمام الطلب</Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
