"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRODUCT_API_BASE = process.env.NEXT_PUBLIC_PRODUCT_API_URL || "http://localhost:4001";
const statusOptions = ["normal", "new", "hot", "sale"] as const;

type ProductStatus = (typeof statusOptions)[number];

type Product = {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  salePrice?: string | number | null;
  stock: number;
  material: string;
  category: string;
  imageUrl: string;
  imageUrls?: string[] | string;
  variantStocks?: unknown;
  productStatus?: ProductStatus;
};

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);
}

function countVariants(raw: unknown) {
  if (Array.isArray(raw)) return raw.length;
  if (typeof raw !== "string") return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function firstImage(product: Product) {
  if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    return String(product.imageUrls[0]);
  }
  if (typeof product.imageUrls === "string") {
    try {
      const parsed = JSON.parse(product.imageUrls);
      if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]);
    } catch {
      // ignore parse errors
    }
  }
  return product.imageUrl || "/images/product-1.jpeg";
}

function normalizeStatus(value: unknown): ProductStatus {
  const next = String(value || "normal").toLowerCase();
  if (statusOptions.includes(next as ProductStatus)) {
    return next as ProductStatus;
  }
  return "normal";
}

const statusLabel: Record<ProductStatus, string> = {
  normal: "Normal",
  new: "New",
  hot: "Hot",
  sale: "Sale",
};

const statusClass: Record<ProductStatus, string> = {
  normal: "border-slate-300 bg-slate-50 text-slate-700",
  new: "border-blue-300 bg-blue-50 text-blue-700",
  hot: "border-red-300 bg-red-50 text-red-700",
  sale: "border-emerald-300 bg-emerald-50 text-emerald-700",
};

export default function ProductsPage() {
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState("");

  async function fetchProducts() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${PRODUCT_API_BASE}/products`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không thể tải danh sách sản phẩm.");
      }
      setProductList(Array.isArray(result) ? result : []);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) return;
        const next = Array.isArray(result)
          ? result
              .filter((item) => item?.isActive !== false)
              .map((item) => String(item?.name || "").trim())
              .filter(Boolean)
          : [];
        setCategoryOptions(next);
      } catch {
        // ignore category loading failure
      }
    }
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    return productList.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [productList, search, categoryFilter]);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function handleDelete(productId: number) {
    setMessage("");
    try {
      const response = await fetch(`${PRODUCT_API_BASE}/products/${productId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Xóa sản phẩm thất bại.");
      }
      setProductList((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  async function handleQuickStatusUpdate(product: Product, nextStatus: ProductStatus) {
    setMessage("");
    try {
      const response = await fetch(`${PRODUCT_API_BASE}/products/${product.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productStatus: nextStatus,
          salePrice: nextStatus === "sale" ? product.salePrice ?? null : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Cập nhật trạng thái thất bại.");
      }
      setProductList((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                productStatus: normalizeStatus(result.productStatus),
                salePrice: result.salePrice ?? null,
              }
            : item
        )
      );
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Sản phẩm</h1>
          <p className="text-sm text-muted-foreground">Quản lý danh sách sản phẩm ({productList.length})</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 size-4" />
            Tạo sản phẩm mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categoryOptions.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[84px]">Ảnh</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Biến thể</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[110px] text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy sản phẩm nào.
                  </TableCell>
                </TableRow>
              ) : (
                pagedProducts.map((product) => {
                  const status = normalizeStatus(product.productStatus);
                  const displayPrice = status === "sale" && product.salePrice ? product.salePrice : product.price;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="size-14 overflow-hidden rounded-md bg-muted">
                          <img src={firstImage(product)} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{product.name}</p>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="font-medium">{formatPrice(displayPrice)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{countVariants(product.variantStocks)}</TableCell>
                      <TableCell>
                        <Select
                          value={status}
                          onValueChange={(value) => handleQuickStatusUpdate(product, value as ProductStatus)}
                        >
                          <SelectTrigger className={`h-8 w-[120px] ${statusClass[status]}`}>
                            <SelectValue>{statusLabel[status]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {statusLabel[item]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" className="size-8">
                            <Link href={`/admin/products/${product.id}/edit`} aria-label={`Sửa ${product.name}`}>
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(product.id)}
                            aria-label={`Xóa ${product.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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
