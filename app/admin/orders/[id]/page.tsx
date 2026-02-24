"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, MapPin, Phone, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApiOrder, formatOrderDate, formatOrderPrice, OrderStatus } from "@/lib/order";

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Chờ xử lý", variant: "outline" },
  processing: { label: "Đang xử lý", variant: "secondary" },
  shipped: { label: "Đang giao", variant: "default" },
  delivered: { label: "Đã giao", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    async function fetchOrder() {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Không thể tải chi tiết đơn hàng.");
        }
        setOrder(result);
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  const subtotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  }, [order]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách đơn hàng
      </Link>

      {loading ? <p className="text-sm text-muted-foreground">Đang tải chi tiết đơn hàng...</p> : null}
      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      {order ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-2xl font-bold text-foreground">{order.orderCode}</h1>
            <Badge variant={statusConfig[order.status].variant}>{statusConfig[order.status].label}</Badge>
            <span className="text-sm text-muted-foreground">Ngày đặt: {formatOrderDate(order.createdAt)}</span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Thông tin giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Họ và tên</p>
                    <p className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {order.customerName}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Số điện thoại</p>
                    <p className="flex items-center gap-2 font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {order.phone}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Địa chỉ giao hàng</p>
                  <p className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <span>{order.addressLine}</span>
                  </p>
                </div>

                <div className="rounded-md border p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Ghi chú</p>
                  <p className="text-sm text-foreground">{order.note || "Không có ghi chú."}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Đơn hàng của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {order.items.map((item, index) => (
                    <div key={`${item.productId || item.slug || item.productName}-${index}`} className="grid grid-cols-[56px_1fr] gap-3 rounded-lg border border-border p-3">
                      <div className="h-14 w-14 overflow-hidden rounded-md border border-border bg-muted">
                        <img
                          src={item.imageUrl || "/images/product-1.jpeg"}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          Màu: {item.color || "-"} | Size: {item.size || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                        <p className="text-xs font-semibold">{formatOrderPrice(Number(item.price || 0) * Number(item.quantity || 0))}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t border-border pt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tổng sản phẩm</span>
                    <span className="font-medium">{order.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-semibold">{formatOrderPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tổng tiền</span>
                    <span className="font-semibold">{formatOrderPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
