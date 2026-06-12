import { Link } from "@tanstack/react-router";

export type ProductLite = {
  id: string;
  name: string;
  price: number;
  offer_price: number | null;
  image_url: string | null;
  is_offer?: boolean | null;
};

export default function ProductCard({ p }: { p: ProductLite }) {
  const hasOffer = p.is_offer && p.offer_price != null && p.offer_price < p.price;
  const display = hasOffer ? p.offer_price! : p.price;
  return (
    <Link to="/product/$id" params={{ id: p.id }} className="group block">
      <div className="relative overflow-hidden rounded-3xl bg-card aspect-[4/5] border border-border">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="font-display text-4xl text-muted-foreground">BH</span>
          </div>
        )}
        {hasOffer && (
          <span className="absolute top-3 right-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">عرض</span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-foreground group-hover:text-accent transition">{p.name}</h3>
        <div className="text-right shrink-0">
          <div className="font-semibold text-foreground">{display} ج.م</div>
          {hasOffer && <div className="text-xs text-muted-foreground line-through">{p.price} ج.م</div>}
        </div>
      </div>
    </Link>
  );
}
