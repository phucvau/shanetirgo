"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ShoppingCart, TriangleAlert, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationKind = "order" | "stock_low" | "stock_out";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  orderId?: number;
  productId?: number;
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

type OrderPayload = {
  id: number;
  orderCode?: string;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
};

type StockAlertPayload = {
  type?: string;
  productId?: number;
  name?: string;
  stock?: number;
};

type SimpleSocket = {
  on: (event: string, cb: (payload: unknown) => void) => void;
  disconnect: () => void;
};

const STORAGE_KEY = "admin_order_notifications";

function formatMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

function formatTime(value?: string) {
  if (!value) return "Vừa xong";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Vừa xong";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function playNotificationSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const note1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    note1.type = "triangle";
    note1.frequency.setValueAtTime(740, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    note1.connect(gain1);
    gain1.connect(ctx.destination);
    note1.start(now);
    note1.stop(now + 0.2);

    const note2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    note2.type = "sine";
    note2.frequency.setValueAtTime(988, now + 0.14);
    gain2.gain.setValueAtTime(0.0001, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.33);
    note2.connect(gain2);
    gain2.connect(ctx.destination);
    note2.start(now + 0.14);
    note2.stop(now + 0.35);

    window.setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 700);
  } catch {
    // ignore audio errors
  }
}

function normalizeStoredNotification(input: Partial<NotificationItem>): NotificationItem | null {
  const id = String(input.id || "").trim();
  if (!id) return null;
  const kind = String(input.kind || "order");
  const mappedKind: NotificationKind =
    kind === "stock_low" || kind === "stock_out" ? kind : "order";
  return {
    id,
    kind: mappedKind,
    orderId: Number(input.orderId || 0) || undefined,
    productId: Number(input.productId || 0) || undefined,
    title: String(input.title || "Thông báo"),
    description: String(input.description || ""),
    time: String(input.time || "Vừa xong"),
    unread: Boolean(input.unread),
  };
}

function buildOrderNotification(order: OrderPayload): NotificationItem | null {
  const id = Number(order?.id || 0);
  if (!Number.isInteger(id) || id <= 0) return null;
  const orderCode = order.orderCode || `ORD-${String(id).padStart(6, "0")}`;
  return {
    id: `order-${id}-${Date.now()}`,
    kind: "order",
    orderId: id,
    title: "Bạn có đơn hàng mới, kiểm tra ngay nhé!",
    description: `${orderCode} • ${order.customerName || "Khách mới"} • ${formatMoney(Number(order.totalAmount || 0))}`,
    time: formatTime(order.createdAt),
    unread: true,
  };
}

function buildStockNotification(payload: StockAlertPayload): NotificationItem | null {
  const productId = Number(payload?.productId || 0);
  if (!Number.isInteger(productId) || productId <= 0) return null;
  const type = String(payload?.type || "");
  const name = String(payload?.name || "Sản phẩm");
  const stock = Number(payload?.stock || 0);

  if (type === "out_of_stock") {
    return {
      id: `stock-out-${productId}-${Date.now()}`,
      kind: "stock_out",
      productId,
      title: "Cảnh báo tồn kho",
      description: `Sản phẩm ${name} của bạn đã hết hàng!`,
      time: formatTime(),
      unread: true,
    };
  }

  if (type === "low_stock") {
    return {
      id: `stock-low-${productId}-${Date.now()}`,
      kind: "stock_low",
      productId,
      title: "Cảnh báo tồn kho",
      description: `Sản phẩm ${name} sắp hết hàng (còn ${stock}).`,
      time: formatTime(),
      unread: true,
    };
  }

  return null;
}

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeToastId, setActiveToastId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [seenToastIds, setSeenToastIds] = useState<string[]>([]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => item.unread),
    [notifications]
  );
  const unreadToastQueue = useMemo(
    () => unreadNotifications.filter((item) => !seenToastIds.includes(item.id)),
    [seenToastIds, unreadNotifications]
  );
  const unreadCount = unreadNotifications.length;
  const activeToast = useMemo(
    () => notifications.find((item) => item.id === activeToastId) || null,
    [activeToastId, notifications]
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<NotificationItem>[];
      if (!Array.isArray(parsed)) return;
      const normalized = parsed
        .map((item) => normalizeStoredNotification(item))
        .filter(Boolean) as NotificationItem[];
      setNotifications(normalized.slice(0, 100));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  useEffect(() => {
    let socket: SimpleSocket | null = null;

    function connectSocket() {
      const ioFactory = (window as unknown as { io?: (url: string, opts?: unknown) => SimpleSocket }).io;
      if (!ioFactory) return;

      const socketUrl = process.env.NEXT_PUBLIC_ORDER_SOCKET_URL || "http://localhost:4002";
      const nextSocket = ioFactory(socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
      socket = nextSocket;

      nextSocket.on("order:new", (payload) => {
        const item = buildOrderNotification(payload as OrderPayload);
        if (!item) return;
        setNotifications((prev) => [item, ...prev].slice(0, 100));
        playNotificationSound();
      });

      nextSocket.on("stock:alert", (payload) => {
        const item = buildStockNotification(payload as StockAlertPayload);
        if (!item) return;
        setNotifications((prev) => [item, ...prev].slice(0, 100));
        playNotificationSound();
      });
    }

    const existingScript = document.querySelector('script[data-socket-io-client="true"]');
    if (existingScript) {
      connectSocket();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.socket.io/4.8.1/socket.io.min.js";
      script.async = true;
      script.dataset.socketIoClient = "true";
      script.onload = () => connectSocket();
      document.head.appendChild(script);
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (open) return;
    if (activeToastId) return;
    if (unreadToastQueue.length === 0) return;
    setActiveToastId(unreadToastQueue[0].id);
    setToastVisible(false);
  }, [activeToastId, open, unreadToastQueue]);

  useEffect(() => {
    if (!activeToast) return;
    if (!activeToast.unread) {
      setActiveToastId(null);
      return;
    }

    const enterTimer = window.setTimeout(() => setToastVisible(true), 20);
    const hideTimer = window.setTimeout(() => setToastVisible(false), 2020);
    const clearTimer = window.setTimeout(() => {
      setSeenToastIds((prev) => (prev.includes(activeToast.id) ? prev : [...prev, activeToast.id]));
      setActiveToastId(null);
    }, 2320);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(clearTimer);
    };
  }, [activeToast]);

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
            setActiveToastId(null);
            setSeenToastIds([]);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full bg-black text-white hover:bg-black/90 hover:text-white"
            aria-label="Thông báo đơn hàng"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[360px] p-0">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold">Thông báo</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                setNotifications([]);
                setActiveToastId(null);
                setSeenToastIds([]);
              }}
              disabled={notifications.length === 0}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Xóa tất cả
            </Button>
          </div>
          <DropdownMenuSeparator />

          <div className="max-h-[360px] overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Chưa có thông báo mới.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => {
                  const icon =
                    item.kind === "order" ? (
                      <ShoppingCart className="h-3.5 w-3.5" />
                    ) : (
                      <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
                    );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setNotifications((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id ? { ...entry, unread: false } : entry
                          )
                        );
                        if (item.kind === "order" && item.orderId) {
                          router.push(`/admin/orders/${item.orderId}`);
                          return;
                        }
                        router.push("/admin/products");
                      }}
                      className={`w-full cursor-pointer rounded-md border p-3 text-left transition-colors hover:bg-muted/60 ${item.unread ? "border-black/30 bg-muted/40" : "border-border bg-background"}`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {icon}
                        <p className="text-sm font-medium">{item.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {activeToast && activeToast.unread && !open ? (
        <div
          className={`fixed bottom-5 right-5 z-[90] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-black/15 bg-white p-4 shadow-xl transition-transform duration-300 ${toastVisible ? "translate-x-0" : "translate-x-[120%]"}`}
        >
          <div className="mb-1 flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">{activeToast.title}</p>
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
              onClick={() => {
                setNotifications((prev) =>
                  prev.map((item) =>
                    item.id === activeToast.id ? { ...item, unread: false } : item
                  )
                );
                setSeenToastIds((prev) => (prev.includes(activeToast.id) ? prev : [...prev, activeToast.id]));
                setToastVisible(false);
                window.setTimeout(() => setActiveToastId(null), 250);
              }}
              aria-label="Đóng thông báo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{activeToast.description}</p>
        </div>
      ) : null}
    </>
  );
}
