"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search, Trash2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiOrder, formatOrderDate, formatOrderPrice, OrderStatus } from "@/lib/order";

const allStatuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];

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

const statusTriggerClass: Record<OrderStatus, string> = {
  pending: "border-slate-300 bg-slate-50 text-slate-700",
  processing: "border-amber-300 bg-amber-50 text-amber-700",
  shipped: "border-blue-300 bg-blue-50 text-blue-700",
  delivered: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orderList, setOrderList] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState("");

  async function fetchOrders() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không thể tải danh sách đơn hàng.");
      }
      setOrderList(Array.isArray(result) ? result : []);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orderList.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        String(o.orderCode || "").toLowerCase().includes(q) ||
        String(o.customerName || "").toLowerCase().includes(q);
      const matchTab = activeTab === "all" || o.status === activeTab;
      return matchSearch && matchTab;
    });
  }, [orderList, search, activeTab]);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleUpdateStatus(orderId: number, nextStatus: OrderStatus) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Cập nhật trạng thái thất bại.");
      }

      setOrderList((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: result.status } : order))
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleDeleteOrder(orderId: number) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Xóa đơn hàng thất bại.");
      }
      setOrderList((prev) => prev.filter((item) => item.id !== orderId));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground">Quản lý đơn hàng ({orderList.length} đơn)</p>
      </div>

      <div className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tất cả ({orderList.length})</TabsTrigger>
            {allStatuses.map((status) => (
              <TabsTrigger key={status} value={status}>
                {statusConfig[status].label} ({orderList.filter((order) => order.status === status).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Đang tải đơn hàng...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy đơn hàng nào.
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? pagedOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">{order.orderCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatOrderDate(order.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.itemCount} sản phẩm
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatOrderPrice(order.totalAmount)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                        >
                          <SelectTrigger className={`h-8 w-[158px] ${statusTriggerClass[order.status]}`}>
                            <SelectValue>{statusConfig[order.status].label}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {allStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusConfig[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Thao tác</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
                              <Eye className="mr-2 size-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              Xóa đơn hàng
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!loading && filtered.length > 0 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <Button
              key={page}
              type="button"
              size="sm"
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}
