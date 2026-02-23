"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PRODUCT_API_BASE = process.env.NEXT_PUBLIC_PRODUCT_API_URL || "http://localhost:4001";

const categories = ["Ao", "Quan", "Vay", "Phụ kiện"];

type Product = {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  size: string;
  material: string;
  category: string;
  description: string;
  colors?: string;
  imageUrl: string;
  isNew: boolean;
};

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);
}

export default function ProductsPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formMaterial, setFormMaterial] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColors, setFormColors] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");

  async function fetchProducts() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${PRODUCT_API_BASE}/products`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Khong the tai danh sach sản phẩm.");
      }
      setProductList(result);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    return productList.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [productList, search, categoryFilter]);

  function openCreateDialog() {
    setFormName("");
    setFormPrice("");
    setFormStock("");
    setFormSize("");
    setFormMaterial("");
    setFormCategory("");
    setFormDescription("");
    setFormColors("");
    setFormImageFile(null);
    setFormImagePreview("");
    setMessage("");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (
      !formName.trim() ||
      !formPrice.trim() ||
      !formStock.trim() ||
      !formSize.trim() ||
      !formMaterial.trim() ||
      !formCategory.trim() ||
      !formDescription.trim() ||
      !formImageFile
    ) {
      setMessage("Vui long nhap day du Tất cả truong va chon anh.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const imageData = new FormData();
      imageData.append("image", formImageFile);

      const uploadResponse = await fetch(`${PRODUCT_API_BASE}/upload-image`, {
        method: "POST",
        body: imageData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadResult?.message || "Upload anh that bai.");
      }

      const createResponse = await fetch(`${PRODUCT_API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          price: Number(formPrice),
          stock: Number(formStock),
          size: formSize.trim(),
          material: formMaterial.trim(),
          category: formCategory.trim(),
          description: formDescription.trim(),
          colors: formColors.trim(),
          imageUrl: uploadResult.imageUrl,
          isNew: true,
        }),
      });
      const createResult = await createResponse.json();
      if (!createResponse.ok) {
        throw new Error(createResult?.message || "Tao sản phẩm that bai.");
      }

      setDialogOpen(false);
      await fetchProducts();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(productId: number) {
    setMessage("");
    try {
      const response = await fetch(`${PRODUCT_API_BASE}/products/${productId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "Xoa sản phẩm that bai.");
      }
      setProductList((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">sản phẩm</h1>
          <p className="text-sm text-muted-foreground">
            Danh sach sản phẩm tu API ({productList.length} sản phẩm)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Them sản phẩm
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tim kiem sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Danh muc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh muc</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[84px]">Anh</TableHead>
                <TableHead>Ten</TableHead>
                <TableHead>Danh muc</TableHead>
                <TableHead>Gia</TableHead>
                <TableHead>Ton kho</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Chat lieu</TableHead>
                <TableHead className="w-[64px] text-right">Xoa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Dang tai du lieu...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Khong tim thay sản phẩm nao.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="size-14 overflow-hidden rounded-md bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
                        {product.isNew ? <Badge variant="outline">Moi</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-medium">{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.size}</TableCell>
                    <TableCell>{product.material}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(product.id)}
                        aria-label={`Xoa ${product.name}`}
                      >
                        <X className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Them sản phẩm moi</DialogTitle>
            <DialogDescription>
              Du lieu se duoc luu vao MySQL qua API `http://localhost:4001/products`.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Ten sản phẩm</Label>
              <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Gia</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Ton kho</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formSize}
                onChange={(e) => setFormSize(e.target.value)}
                placeholder="VD: S,M,L"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="material">Chat lieu</Label>
              <Input id="material" value={formMaterial} onChange={(e) => setFormMaterial(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Danh muc</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chon danh muc" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Mo ta</Label>
              <Textarea
                id="description"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="colors">Mau sac (neu nhieu, cach nhau boi dau phay)</Label>
              <Input
                id="colors"
                value={formColors}
                onChange={(e) => setFormColors(e.target.value)}
                placeholder="Den, Trang, Xam"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Anh</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormImageFile(file);
                  setFormImagePreview(file ? URL.createObjectURL(file) : "");
                }}
              />
              {formImagePreview ? (
                <div className="w-fit overflow-hidden rounded-md border">
                  <img src={formImagePreview} alt="Preview" className="h-28 w-28 object-cover" />
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Chon anh tu may, he thong se upload qua API `/upload-image`.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Huy
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              <Upload className="mr-2 size-4" />
              {submitting ? "Dang luu..." : "Tao sản phẩm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
