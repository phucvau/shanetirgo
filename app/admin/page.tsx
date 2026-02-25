"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ApiOrder, formatOrderDate, formatOrderPrice } from "@/lib/order";
import { type ApiProduct } from "@/lib/storefront-products";

type TopProduct = {
  id: string;
  name: string;
  category: string;
  sold: number;
  revenue: number;
};

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Cho xu ly", variant: "outline" },
  processing: { label: "Dang xu ly", variant: "secondary" },
  shipped: { label: "Dang giao", variant: "default" },
  delivered: { label: "Da giao", variant: "default" },
  cancelled: { label: "Da huy", variant: "destructive" },
};

function getRecentMonths(count: number) {
  const now = new Date();
  const list: Array<{ key: string; month: string }> = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = `T${date.getMonth() + 1}`;
    list.push({ key, month });
  }
  return list;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch("/api/orders", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);

        if (!ordersRes.ok) {
          const body = await ordersRes.json().catch(() => ({}));
          throw new Error(body?.message || "Không thể tải đơn hàng");
        }
        if (!productsRes.ok) {
          const body = await productsRes.json().catch(() => ({}));
          throw new Error(body?.message || "Không thể tải sản phẩm");
        }

        const [ordersData, productsData] = await Promise.all([
          ordersRes.json(),
          productsRes.json(),
        ]);

        if (cancelled) return;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message || "Không thể tải dữ liệu tổng quan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const customerCount = new Set(
      orders
        .map((order) => String(order.phone || "").trim())
        .filter(Boolean)
    ).size;
    return {
      revenue,
      orderCount: orders.length,
      customerCount,
      productCount: products.length,
    };
  }, [orders, products]);

  const revenueData = useMemo(() => {
    const months = getRecentMonths(6);
    const totals = new Map<string, number>();
    for (const order of orders) {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      totals.set(key, (totals.get(key) || 0) + Number(order.totalAmount || 0));
    }
    return months.map((month) => ({
      month: month.month,
      revenue: totals.get(month.key) || 0,
    }));
  }, [orders]);

  const topProducts = useMemo<TopProduct[]>(() => {
    const productBySlug = new Map<string, ApiProduct>();
    for (const product of products) {
      const slug = String(product.slug || "").trim();
      if (slug) productBySlug.set(slug, product);
    }

    const map = new Map<string, TopProduct>();
    for (const order of orders) {
      for (const item of order.items || []) {
        const slug = String(item.slug || "").trim();
        const key = slug || item.productName;
        const sold = Number(item.quantity || 0);
        const amount = Number(item.price || 0) * sold;
        if (!key || sold <= 0) continue;

        const product = slug ? productBySlug.get(slug) : null;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            id: key,
            name: String(item.productName || product?.name || "Sản phẩm"),
            category: String(product?.category || "-"),
            sold,
            revenue: amount,
          });
          continue;
        }

        existing.sold += sold;
        existing.revenue += amount;
      }
    }

    return [...map.values()].sort((a, b) => b.sold - a.sold).slice(0, 5);
  }, [orders, products]);

  const statCards = [
    {
      title: "Doanh thu",
      value: formatOrderPrice(metrics.revenue),
      icon: DollarSign,
      description: "Tổng từ dữ liệu đơn hàng",
    },
    {
      title: "Đơn hàng",
      value: String(metrics.orderCount),
      icon: ShoppingCart,
      description: "Tổng số đơn đã ghi nhận",
    },
    {
      title: "Khách hàng",
      value: String(metrics.customerCount),
      icon: Users,
      description: "Tính theo số điện thoại",
    },
    {
      title: "Sản phẩm",
      value: String(metrics.productCount),
      icon: Package,
      description: "Đang có trong hệ thống",
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">Dữ liệu realtime từ API sản phẩm và đơn hàng.</p>
      </div>

      {error ? (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3 text-emerald-600" />
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Doanh thu</CardTitle>
            <CardDescription>6 tháng gần nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" tickLine={false} axisLine={false} />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(0)}M`}
                />
                <RechartsTooltip
                  formatter={(value: number) => [formatOrderPrice(value), "Doanh thu"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm bán chạy</CardTitle>
            <CardDescription>Tính theo số lượng đã bán</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu sản phẩm bán chạy.</p>
              ) : (
                topProducts.map((product, i) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">x{product.sold}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
            <CardDescription>Các đơn hàng mới nhất</CardDescription>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Xem tất cả
            <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Chưa có đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => {
                  const status = statusMap[order.status] || statusMap.pending;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderCode || `ORD-${String(order.id).padStart(6, "0")}`}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell className="text-muted-foreground">{formatOrderDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatOrderPrice(order.totalAmount)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
