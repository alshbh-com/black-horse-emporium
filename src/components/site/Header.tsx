import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search } from "lucide-react";
import { useCart } from "@/context/cart";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl">H</span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl text-foreground">Black Horse</span>
        <span className="text-[10px] tracking-[0.3em] text-muted-foreground">FASHION HOUSE</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground transition" activeProps={{ className: "text-foreground" }}>الرئيسية</Link>
          <a href="#products" className="hover:text-foreground transition">المنتجات</a>
          <a href="#features" className="hover:text-foreground transition">المميزات</a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted sm:inline-flex"><Search className="h-4 w-4" /></button>
          <Link to="/cart" className="relative inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
            <ShoppingBag className="h-4 w-4" />
            <span>السلة</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">{count}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
