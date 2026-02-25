"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  orderId: number;
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

export function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as NotificationItem[];
      if (!Array.isArray(parsed)) return;
      setNotifications(parsed.slice(0, 100));
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

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  );

  useEffect(() => {
    type SimpleSocket = {
      on: (event: string, cb: (payload: OrderPayload) => void) => void;
      disconnect: () => void;
    };

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

      nextSocket.on("order:new", (order: OrderPayload) => {
        const id = Number(order?.id || 0);
        if (!Number.isInteger(id) || id <= 0) return;

        const orderCode = order.orderCode || `ORD-${String(id).padStart(6, "0")}`;
        const description = `${orderCode} • ${order.customerName || "Khách mới"} • ${formatMoney(Number(order.totalAmount || 0))}`;

        setNotifications((prev) => {
          const exists = prev.some((item) => item.id === `order-${id}`);
          if (exists) return prev;

          const next: NotificationItem[] = [
            {
              id: `order-${id}`,
              orderId: id,
              title: "Đơn hàng mới",
              description,
              time: formatTime(order.createdAt),
              unread: true,
            },
            ...prev,
          ].slice(0, 100);
          return next;
        });
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

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
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
          <p className="text-sm font-semibold">Thông báo đơn hàng</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => setNotifications([])}
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
              {notifications.map((item) => (
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
                    router.push(`/admin/orders/${item.orderId}`);
                  }}
                  className={`w-full cursor-pointer rounded-md border p-3 text-left transition-colors hover:bg-muted/60 ${item.unread ? "border-black/30 bg-muted/40" : "border-border bg-background"}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
