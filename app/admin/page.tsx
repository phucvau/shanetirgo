"use client"

import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { orders, products, customers, revenueData, formatPrice } from "@/lib/data"

const stats = [
  {
    title: "Doanh thu",
    value: formatPrice(78000000),
    change: "+12.5%",
    icon: DollarSign,
    description: "So voi thang truoc",
  },
  {
    title: "Don hang",
    value: orders.length.toString(),
    change: "+8.2%",
    icon: ShoppingCart,
    description: "Tong don thang nay",
  },
  {
    title: "Khach hang",
    value: customers.length.toString(),
    change: "+4.1%",
    icon: Users,
    description: "Khach hang moi",
  },
  {
    title: "sản phẩm",
    value: products.length.toString(),
    change: "+2",
    icon: Package,
    description: "Dang hoat dong",
  },
]

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Cho xu ly", variant: "outline" },
  processing: { label: "Dang xu ly", variant: "secondary" },
  shipped: { label: "Dang giao", variant: "default" },
  delivered: { label: "Da giao", variant: "default" },
  cancelled: { label: "Da huy", variant: "destructive" },
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-sm text-muted-foreground">
          Chào mừng trở lại! Đây là tổng quan của ngày hôm nay!
        </p>
      </div>

      {/* STất cảrds */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="size-3 text-emerald-600" />
                <span className="font-medium text-emerald-600">{stat.change}</span>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Top Products */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Doanh thu</CardTitle>
            <CardDescription>6 thang gan nhat</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <RechartsTooltip
                  formatter={(value: number) => [formatPrice(value), "Doanh thu"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--foreground))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">sản phẩm ban chay</CardTitle>
            <CardDescription>Top sản phẩm thang nay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.slice(0, 5).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Don hang gan day</CardTitle>
            <CardDescription>Cac don hang moi nhat</CardDescription>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Xem Tất cả
            <ArrowUpRight className="size-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ma don</TableHead>
                <TableHead>Khach hang</TableHead>
                <TableHead>Ngay</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead className="text-right">Tong tien</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((order) => {
                const status = statusMap[order.status]
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
