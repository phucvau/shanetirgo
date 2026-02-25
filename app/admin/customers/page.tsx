"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ApiOrder, formatOrderDate, formatOrderPrice } from "@/lib/order";

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
  latestOrderDate: string;
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailCustomer, setDetailCustomer] = useState<CustomerRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.message || "Không thể tải danh sách khách hàng");
        }
        const data = await response.json();
        if (cancelled) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message || "Không thể tải danh sách khách hàng");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const customers = useMemo<CustomerRow[]>(() => {
    const map = new Map<string, CustomerRow>();

    for (const order of orders) {
      const key = String(order.phone || "").trim() || `unknown-${order.id}`;
      const existing = map.get(key);
      const amount = Number(order.totalAmount || 0);
      const createdAt = String(order.createdAt || "");
      const customerName = String(order.customerName || "Khách lẻ");

      if (!existing) {
        map.set(key, {
          id: key,
          name: customerName,
          phone: String(order.phone || "-"),
          totalOrders: 1,
          totalSpent: amount,
          joinedDate: createdAt,
          latestOrderDate: createdAt,
        });
        continue;
      }

      existing.totalOrders += 1;
      existing.totalSpent += amount;
      if (new Date(createdAt).getTime() < new Date(existing.joinedDate).getTime()) {
        existing.joinedDate = createdAt;
      }
      if (new Date(createdAt).getTime() > new Date(existing.latestOrderDate).getTime()) {
        existing.latestOrderDate = createdAt;
      }
      if (!existing.name && customerName) {
        existing.name = customerName;
      }
    }

    return [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(keyword) ||
        c.phone.toLowerCase().includes(keyword)
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Khách hàng</h1>
        <p className="text-sm text-muted-foreground">Quản lý khách hàng ({customers.length} khách hàng)</p>
      </div>

      {error ? (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên hoặc số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Tổng chi tiêu</TableHead>
                <TableHead>Ngày tham gia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy khách hàng nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() => setDetailCustomer(customer)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-muted text-xs font-semibold">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{customer.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.phone}</TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell className="font-medium">{formatOrderPrice(customer.totalSpent)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatOrderDate(customer.joinedDate)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
        <DialogContent className="max-w-sm">
          {detailCustomer ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-foreground font-semibold text-background">
                      {detailCustomer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="font-serif">{detailCustomer.name}</DialogTitle>
                    <DialogDescription>
                      Khách hàng từ {formatOrderDate(detailCustomer.joinedDate)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  {detailCustomer.phone}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-lg font-bold">{detailCustomer.totalOrders}</p>
                    <p className="text-xs text-muted-foreground">Đơn hàng</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <p className="text-lg font-bold">{formatOrderPrice(detailCustomer.totalSpent)}</p>
                    <p className="text-xs text-muted-foreground">Tổng chi tiêu</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Đơn gần nhất: {formatOrderDate(detailCustomer.latestOrderDate)}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
