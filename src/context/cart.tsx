import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string; // unique line id
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "bh_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add: CartCtx["add"] = (it) => {
    setItems((prev) => {
      const key = `${it.productId}|${it.size ?? ""}|${it.color ?? ""}`;
      const existing = prev.find((p) => `${p.productId}|${p.size ?? ""}|${p.color ?? ""}` === key);
      if (existing) {
        return prev.map((p) => p === existing ? { ...p, quantity: p.quantity + it.quantity } : p);
      }
      return [...prev, { ...it, id: crypto.randomUUID() }];
    });
  };
  const remove = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((p) => p.map((i) => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, subtotal, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
