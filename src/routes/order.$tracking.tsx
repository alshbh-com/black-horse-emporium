import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { CheckCircle2, Package, Truck } from "lucide-react";

const orderQuery = (tracking: string) => queryOptions({
  queryKey: ["order", tracking],
  queryFn: async () => {
    const isNum = /^\d+$/.test(tracking);
    let q = supabase.from("orders").select("id,order_number,tracking_code,status,total_amount,shipping_cost,created_at,governorate_id,customer_id").limit(1);
    q = isNum ? q.eq("order_number", Number(tracking)) : q.eq("tracking_code", tracking);
    const { data: orders } = await q;
    const order = orders?.[0];
    if (!order) return { order: null, items: [], gov: null, customer: null };
    const [iRes, gRes, cRes] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", order.id),
      order.governorate_id ? supabase.from("governorates").select("name").eq("id", order.governorate_id).maybeSingle() : Promise.resolve({ data: null }),
      order.customer_id ? supabase.from("customers").select("name,phone,address").eq("id", order.customer_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    return { order, items: iRes.data ?? [], gov: gRes.data, customer: cRes.data };
  },
});

export const Route = createFileRoute("/order/$tracking")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.tracking)),
  component: OrderPage,
});

const STEPS = [
  { key: "pending", label: "تم استلام الطلب", icon: CheckCircle2 },
  { key: "processing", label: "قيد التجهيز", icon: Package },
  { key: "shipped", label: "في الطريق إليك", icon: Truck },
  { key: "delivered", label: "تم التسليم", icon: CheckCircle2 },
];

function OrderPage() {
  const { tracking } = Route.useParams();
  const { data } = useSuspenseQuery(orderQuery(tracking));
  if (!data.order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-3xl p-10 text-center">
          <h1 className="font-display text-3xl">الطلب غير موجود</h1>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground">الرئيسية</Link>
        </main>
        <Footer />
      </div>
    );
  }
  const { order, items, gov, customer } = data;
  const idx = Math.max(0, STEPS.findIndex((s) => s.key === order.status));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="rounded-4xl bg-primary text-primary-foreground p-8 sm:p-12">
          <div className="text-xs tracking-[0.3em] text-accent">ORDER</div>
          <h1 className="mt-2 font-display text-4xl">طلبك #{order.order_number}</h1>
          <p className="mt-2 text-primary-foreground/70 text-sm">رقم التتبع: {order.tracking_code}</p>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">حالة الطلب</h2>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s, i) => {
              const done = i <= idx;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className={done ? "font-semibold text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-display text-xl">بيانات الشحن</h3>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <div className="text-foreground font-medium">{customer?.name}</div>
              <div>{customer?.phone}</div>
              <div>{customer?.address}{gov?.name ? `، ${gov.name}` : ""}</div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-display text-xl">ملخص الطلب</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {items.map((i: any) => (
                <li key={i.id} className="flex justify-between"><span className="text-muted-foreground">{i.product_details ?? "منتج"} × {i.quantity}</span><span>{Number(i.price)*i.quantity} ج.م</span></li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border pt-3 text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>الشحن</span><span>{Number(order.shipping_cost ?? 0)} ج.م</span></div>
              <div className="flex justify-between font-bold text-foreground"><span>الإجمالي</span><span>{Number(order.total_amount)} ج.م</span></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
