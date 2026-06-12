import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { useCart } from "@/context/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "إتمام الطلب — Black Horse" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [address, setAddress] = useState("");
  const [govId, setGovId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: govs = [] } = useQuery({
    queryKey: ["governorates"],
    queryFn: async () => (await supabase.from("governorates").select("id,name,shipping_cost").order("name")).data ?? [],
  });

  const shipping = Number(govs.find((g) => g.id === govId)?.shipping_cost ?? 0);
  const total = cart.subtotal + shipping;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.items.length === 0) { toast.error("السلة فارغة"); return; }
    if (!name || !phone || !address || !govId) { toast.error("املأ كل البيانات المطلوبة"); return; }
    setSubmitting(true);
    try {
      const gov = govs.find((g) => g.id === govId);
      // customer
      const { data: cust, error: cErr } = await supabase
        .from("customers")
        .insert({ name, phone, phone2: phone2 || null, address, governorate: gov?.name ?? null })
        .select("id").single();
      if (cErr) throw cErr;

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id: cust.id,
          governorate_id: govId,
          total_amount: total,
          shipping_cost: shipping,
          status: "pending",
          notes: notes || null,
          order_details: cart.items.map((i) => `${i.name} × ${i.quantity}`).join(" | "),
        })
        .select("id,tracking_code,order_number").single();
      if (oErr) throw oErr;

      const itemsPayload = cart.items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        quantity: i.quantity,
        price: i.price,
        size: i.size ?? null,
        color: i.color ?? null,
        product_details: i.name,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
      if (iErr) throw iErr;

      cart.clear();
      toast.success("تم استلام طلبك بنجاح");
      navigate({ to: "/order/$tracking", params: { tracking: order.tracking_code ?? String(order.order_number) } });
    } catch (err: any) {
      console.error(err);
      toast.error("حصلت مشكلة في إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl text-foreground">إتمام الطلب</h1>
        <p className="mt-2 text-muted-foreground">الدفع عند الاستلام — اكتب بياناتك بدقة.</p>

        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
            <Field label="الاسم بالكامل" value={name} onChange={setName} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رقم الموبايل" value={phone} onChange={setPhone} type="tel" />
              <Field label="رقم احتياطي (اختياري)" value={phone2} onChange={setPhone2} type="tel" required={false} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">المحافظة</label>
              <select value={govId} onChange={(e) => setGovId(e.target.value)} required className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                <option value="">اختر المحافظة</option>
                {govs.map((g) => <option key={g.id} value={g.id}>{g.name} — شحن {g.shipping_cost} ج.م</option>)}
              </select>
            </div>
            <Field label="العنوان بالتفصيل" value={address} onChange={setAddress} textarea />
            <Field label="ملاحظات (اختياري)" value={notes} onChange={setNotes} textarea required={false} />
          </div>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-2xl text-foreground">ملخص الطلب</h2>
            <ul className="mt-4 space-y-2 max-h-60 overflow-auto">
              {cart.items.map((i) => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{i.name} × {i.quantity}</span>
                  <span className="font-medium">{i.price * i.quantity} ج.م</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="المجموع الفرعي" value={`${cart.subtotal} ج.م`} />
              <Row label="الشحن" value={govId ? `${shipping} ج.م` : "—"} />
              <Row label="الإجمالي" value={`${total} ج.م`} bold />
            </div>
            <button disabled={submitting} type="submit" className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {submitting ? "جارٍ الإرسال..." : "تأكيد الطلب"}
            </button>
            <Link to="/cart" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">العودة للسلة</Link>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea, required = true }:
  { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={3} className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} required={required} type={type} className="mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
      )}
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "text-base font-bold text-foreground" : "text-muted-foreground"}`}><span>{label}</span><span>{value}</span></div>;
}
