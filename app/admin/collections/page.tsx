"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Pencil, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

type CollectionItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productIds: number[];
  productCount: number;
  isActive?: boolean;
};

type ProductItem = {
  id: number;
  name: string;
  category: string;
  imageUrl?: string;
  imageUrls?: string;
};

function getProductImage(product: ProductItem) {
  const urls = String(product.imageUrls || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return urls[0] || String(product.imageUrl || "").trim() || "/images/product-1.jpeg";
}

export default function CollectionsPage() {
  const [collectionList, setCollectionList] = useState<CollectionItem[]>([]);
  const [productList, setProductList] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CollectionItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function fetchCollections() {
    const response = await fetch("/api/collections", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || "Không thể tải bộ sưu tập.");
    }
    setCollectionList(Array.isArray(result) ? result : []);
  }

  async function fetchProducts() {
    const response = await fetch("/api/products", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || "Không thể tải sản phẩm.");
    }
    const rows = Array.isArray(result) ? result : [];
    setProductList(rows);
    const uniqueCategories = Array.from(
      new Set(rows.map((item) => String(item?.category || "").trim()).filter(Boolean))
    );
    setCategories(uniqueCategories);
  }

  useEffect(() => {
    async function load() {
      setMessage("");
      try {
        await Promise.all([fetchCollections(), fetchProducts()]);
      } catch (error) {
        setMessage((error as Error).message);
      }
    }
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return productList.filter((product) => {
      const matchCategory = productCategoryFilter === "all" || product.category === productCategoryFilter;
      const matchSearch =
        q.length === 0 ||
        String(product.name || "").toLowerCase().includes(q) ||
        String(product.category || "").toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [productList, productCategoryFilter, productSearch]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormDescription("");
    setFormImage("");
    setSelectedProductIds([]);
    setProductCategoryFilter("all");
    setProductSearch("");
    setMessage("");
    setDialogOpen(true);
  }

  function openEdit(col: CollectionItem) {
    setEditing(col);
    setFormName(col.name);
    setFormDescription(col.description);
    setFormImage(col.imageUrl);
    setSelectedProductIds(Array.isArray(col.productIds) ? col.productIds.map(Number).filter(Number.isFinite) : []);
    setProductCategoryFilter("all");
    setProductSearch("");
    setMessage("");
    setDialogOpen(true);
  }

  function toggleProduct(productId: number) {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((item) => item !== productId);
      }
      return [...prev, productId];
    });
  }

  async function handleImageUpload(file: File) {
    const imageData = new FormData();
    imageData.append("image", file);

    setUploading(true);
    setMessage("");
    try {
      const uploadResponse = await fetch(`/api/upload-image`, {
        method: "POST",
        body: imageData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResponse.ok) {
        throw new Error(uploadResult?.message || "Upload ảnh thất bại.");
      }
      setFormImage(String(uploadResult.imageUrl || ""));
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!formName.trim() || !formDescription.trim() || !formImage.trim()) {
      setMessage("Vui lòng nhập tên, mô tả và ảnh bộ sưu tập.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim(),
        imageUrl: formImage.trim(),
        productIds: selectedProductIds,
      };

      const endpoint = editing ? `/api/collections/${editing.id}` : "/api/collections";
      const method = editing ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không thể lưu bộ sưu tập.");
      }

      await fetchCollections();
      setDialogOpen(false);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/collections/${toDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Không thể xóa bộ sưu tập.");
      }
      setCollectionList((prev) => prev.filter((item) => item.id !== toDelete.id));
      setDeleteDialogOpen(false);
      setToDelete(null);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Bộ sưu tập</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý bộ sưu tập cửa hàng ({collectionList.length} bộ sưu tập)
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Thêm bộ sưu tập
        </Button>
      </div>

      {message ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{message}</div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collectionList.map((col) => (
          <Card key={col.id} className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <img
                src={col.imageUrl || "/images/collection-1.jpg"}
                alt={col.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/20" />
              <div className="absolute bottom-4 left-4">
                <h3 className="font-serif text-lg font-bold text-background">{col.name}</h3>
              </div>
            </div>
            <CardContent className="space-y-3 pt-4">
              <p className="line-clamp-2 text-sm text-muted-foreground">{col.description}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FolderOpen className="size-3" />
                  {col.productCount} sản phẩm
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(col)}>
                    <Pencil className="size-4" />
                    <span className="sr-only">Chỉnh sửa</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      setToDelete(col);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Xóa</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Chỉnh sửa bộ sưu tập" : "Tạo bộ sưu tập mới"}</DialogTitle>
            <DialogDescription>
              Nhập thông tin cơ bản và chọn sản phẩm thuộc bộ sưu tập này.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="collection-name">Tên bộ sưu tập</Label>
                <Input
                  id="collection-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Xuân Hè 2026"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="collection-description">Mô tả</Label>
                <Textarea
                  id="collection-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mô tả ngắn bộ sưu tập..."
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="collection-image">Ảnh bộ sưu tập</Label>
                <Input
                  id="collection-image"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://... hoặc upload từ máy"
                />
                <div>
                  <Label
                    htmlFor="collection-image-file"
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-4 text-sm"
                  >
                    <Upload className="size-4" />
                    {uploading ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}
                  </Label>
                  <Input
                    id="collection-image-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </div>
                {formImage ? (
                  <div className="relative mt-1 aspect-[16/10] overflow-hidden rounded-lg border">
                    <img src={formImage} alt="Collection preview" className="h-full w-full object-cover" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Lọc theo danh mục</Label>
                  <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tìm sản phẩm</Label>
                  <Input
                    placeholder="Tên sản phẩm..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto rounded-lg border p-2">
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const checked = selectedProductIds.includes(Number(product.id));
                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors ${
                          checked ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"
                        }`}
                        onClick={() => toggleProduct(Number(product.id))}
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                        {checked ? <Badge>Đã chọn</Badge> : null}
                      </button>
                    );
                  })}

                  {filteredProducts.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">Không có sản phẩm phù hợp.</p>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Đã chọn {selectedProductIds.length} sản phẩm cho bộ sưu tập này.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Xóa bộ sưu tập</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa &quot;{toDelete?.name}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
