"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  lineId: string;
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  size?: string;
  color?: string;
};

type AddToCartPayload = Omit<CartItem, "lineId" | "quantity"> & {
  lineId?: string;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toggleCart: () => void;
  addItem: (payload: AddToCartPayload) => void;
  updateItemQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "shanetirgo_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  function toLineId(item: Partial<CartItem>) {
    return `${item.productId || 0}__${item.size || "no-size"}__${item.color || "no-color"}`;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CartItem>[];
      if (Array.isArray(parsed)) {
        const merged = new Map<string, CartItem>();
        parsed.forEach((item) => {
          const lineId = item.lineId || toLineId(item);
          const current = merged.get(lineId);
          const quantity = Math.max(1, Number(item.quantity || 1));

          if (current) {
            current.quantity += quantity;
            return;
          }

          merged.set(lineId, {
            lineId,
            productId: Number(item.productId || 0),
            slug: String(item.slug || ""),
            name: String(item.name || "sản phẩm"),
            price: Number(item.price || 0),
            imageUrl: String(item.imageUrl || ""),
            quantity,
            size: item.size ? String(item.size) : undefined,
            color: item.color ? String(item.color) : undefined,
          });
        });
        setItems(Array.from(merged.values()));
      }
    } catch {
      // ignore invalid local storage data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(payload: AddToCartPayload) {
    const nextQty = payload.quantity && payload.quantity > 0 ? payload.quantity : 1;
    const lineId =
      payload.lineId ||
      `${payload.productId}__${payload.size || "no-size"}__${payload.color || "no-color"}`;
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.lineId === lineId);

      if (idx === -1) {
        return [
          ...prev,
          {
            ...payload,
            lineId,
            quantity: nextQty,
          },
        ];
      }

      const clone = [...prev];
      clone[idx] = {
        ...clone[idx],
        quantity: clone[idx].quantity + nextQty,
      };
      return clone;
    });
    setCartOpen(true);
  }

  function updateItemQuantity(lineId: string, quantity: number) {
    setItems((prev) =>
      prev.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              quantity: Math.max(1, quantity),
            }
          : item
      )
    );
  }

  function removeItem(lineId: string) {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }

  function clearCart() {
    setItems([]);
  }

  function toggleCart() {
    setCartOpen((prev) => !prev);
  }

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      totalQuantity,
      isCartOpen,
      setCartOpen,
      toggleCart,
      addItem,
      updateItemQuantity,
      removeItem,
      clearCart,
    }),
    [items, totalQuantity, isCartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
