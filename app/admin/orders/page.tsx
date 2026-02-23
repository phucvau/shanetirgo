"use client"

import { useState } from "react"
import { Search, MoreHorizontal, Eye, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { orders as initialOrders, formatPrice, type Order } from "@/lib/data"

type StatusKey = Order["status"]

const statusConfig: Record<
  StatusKey,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Cho xu ly", variant: "outline" },
  processing: { label: "Dang xu ly", variant: "secondary" },
  shipped: { label: "Dang giao", variant: "default" },
  delivered: { label: "Da giao", variant: "default" },
  cancelled: { label: "Da huy", variant: "destructive" },
}

const allStatuses: StatusKey[] = ["pending", "processing", "shipped", "delivered", "cancelled"]

export default function OrdersPage() {
  const [orderList, setOrderList] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const filtered = orderList.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === "all" || o.status === activeTab
    return matchSearch && matchTab
  })

  function updateStatus(orderId: string, newStatus: StatusKey) {
    setOrderList((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Don hang</h1>
        <p className="text-sm text-muted-foreground">
          Quan ly don hang cua hang ({orderList.length} don hang)
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              Tat ca ({orderList.length})
            </TabsTrigger>
            {allStatuses.map((s) => (
              <TabsTrigger key={s} value={s}>
                {statusConfig[s].label} ({orderList.filter((o) => o.status === s).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tim kiem theo ma don hoac ten khach hang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ma don</TableHead>
                <TableHead>Khach hang</TableHead>
                <TableHead>Ngay dat</TableHead>
                <TableHead>sản phẩm</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead className="text-right">Tong tien</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const status = statusConfig[order.status]
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-xs text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.items.length} sản phẩm
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Thao tac</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                            <Eye className="mr-2 size-4" />
                            Chi tiet
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <ChevronDown className="mr-2 size-4" />
                              Cap nhat trang thai
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {allStatuses.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  disabled={order.status === s}
                                >
                                  {statusConfig[s].label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Khong tim thay don hang nao.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-md">
          {detailOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif">
                  Chi tiet don hang {detailOrder.id}
                </DialogTitle>
                <DialogDescription>
                  Dat ngay {detailOrder.date} boi {detailOrder.customer}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trang thai</span>
                  <Badge variant={statusConfig[detailOrder.status].variant}>
                    {statusConfig[detailOrder.status].label}
                  </Badge>
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-medium">sản phẩm</p>
                  <div className="space-y-2">
                    {detailOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>
                          {item.productName} x{item.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Tong tien</span>
                  <span>{formatPrice(detailOrder.total)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Email: {detailOrder.email}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
