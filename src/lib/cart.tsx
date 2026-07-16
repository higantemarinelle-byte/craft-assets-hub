import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartAttachment = {
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // omitted if file too large for local persistence
};

export type CartItem = {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  variantLabel: string;
  price: number;
  image?: string;
  quantity: number;
  artwork?: CartAttachment;
  reference?: CartAttachment;
  notes?: string;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  updateItem: (variantId: string, patch: Partial<CartItem>) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cc_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const count = items.reduce((s, i) => s + i.quantity, 0);
    return {
      items,
      subtotal,
      count,
      add: (item) =>
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.variantId === item.variantId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
            return next;
          }
          return [...prev, item];
        }),
      updateItem: (variantId, patch) =>
        setItems((prev) => prev.map((p) => (p.variantId === variantId ? { ...p, ...patch } : p))),
      setQty: (variantId, qty) =>
        setItems((prev) =>
          prev
            .map((p) => (p.variantId === variantId ? { ...p, quantity: qty } : p))
            .filter((p) => p.quantity > 0),
        ),
      remove: (variantId) => setItems((prev) => prev.filter((p) => p.variantId !== variantId)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
