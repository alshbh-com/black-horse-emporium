import { Logo } from "./Header";
import { Instagram, Facebook, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <Logo className="[&_span]:text-primary-foreground [&_.text-muted-foreground]:text-primary-foreground/60 [&_.bg-primary]:bg-accent [&_.text-primary-foreground]:text-accent-foreground" />
          <p className="text-sm text-primary-foreground/70 max-w-xs">
            بيت أزياء فاخر — خامات راقية وتفاصيل بتفرق. شحن سريع لكل المحافظات.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg text-accent">روابط</h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li><a href="/" className="hover:text-accent">الرئيسية</a></li>
            <li><a href="#products" className="hover:text-accent">المنتجات</a></li>
            <li><a href="/cart" className="hover:text-accent">السلة</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-accent">تواصل معنا</h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 01000000000</li>
            <li className="flex items-center gap-4">
              <a href="#" aria-label="Instagram" className="hover:text-accent"><Instagram className="h-5 w-5" /></a>
              <a href="#" aria-label="Facebook" className="hover:text-accent"><Facebook className="h-5 w-5" /></a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-primary-foreground/50 sm:px-6">
          © {new Date().getFullYear()} Black Horse. كل الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
