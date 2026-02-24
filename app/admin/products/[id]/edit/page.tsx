"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

const PRODUCT_API_BASE = process.env.NEXT_PUBLIC_PRODUCT_API_URL || "http://localhost:4001";
const defaultSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const defaultColors = ["Đen", "Trắng", "Xám", "Be", "Nâu", "Xanh", "Đỏ"];
const statusOptions = ["normal", "new", "hot", "sale"] as const;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function toKey(color: string, size: string) {
  return `${color}__${size}`;
}

type VariantStock = { color: string; size: string; stock: number };
type ProductResponse = {
  id: number;
  name: string;
  price: string | number;
  salePrice?: string | number | null;
  material: string;
  category: string;
  description: string;
  imageUrls?: string[];
  imageUrl?: string;
  productStatus?: string;
  variantStocks?: VariantStock[];
  stock?: number;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params?.id || 0);

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [material, setMaterial] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [productStatus, setProductStatus] = useState<(typeof statusOptions)[number]>("new");
  const [salePrice, setSalePrice] = useState("");

  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [manualStock, setManualStock] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [newColor, setNewColor] = useState("");
  const [colorCatalog, setColorCatalog] = useState<string[]>(defaultColors);
  const [colors, setColors] = useState<string[]>([]);
  const [sizeCatalog, setSizeCatalog] = useState<string[]>(defaultSizes);
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [stockMatrix, setStockMatrix] = useState<Record<string, string>>({});

  const isAccessory = useMemo(() => normalizeText(category).includes("phu kien"), [category]);

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
        // ignore category fetch error
      }
    }
    fetchCategories();
  }, []);

  const variants = useMemo(() => {
    const rows: Array<{ color: string; size: string; stock: number }> = [];
    colors.forEach((color) => {
      sizes.forEach((size) => {
        const raw = stockMatrix[toKey(color, size)];
        if (raw === undefined || raw === "") return;
        const stock = Number(raw);
        if (!Number.isFinite(stock) || stock < 0) return;
        rows.push({ color, size, stock });
      });
    });
    return rows;
  }, [colors, sizes, stockMatrix]);

  const totalStock = useMemo(() => variants.reduce((sum, item) => sum + item.stock, 0), [variants]);
  const sizeSummary = useMemo(() => [...new Set(variants.map((item) => item.size))].join(", "), [variants]);
  const colorSummary = useMemo(() => [...new Set(variants.map((item) => item.color))].join(", "), [variants]);

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) return;

    async function loadProduct() {
      setLoadingProduct(true);
      setMessage("");
      try {
        const response = await fetch(`${PRODUCT_API_BASE}/products/id/${productId}`, { cache: "no-store" });
        const result: ProductResponse = await response.json();
        if (!response.ok) {
          throw new Error((result as { message?: string })?.message || "Không thể tải sản phẩm.");
        }

        setName(String(result.name || ""));
        setPrice(String(result.price ?? ""));
        setMaterial(String(result.material || ""));
        const fetchedCategory = String(result.category || "");
        setCategory(fetchedCategory);
        if (fetchedCategory) {
          setCategoryOptions((prev) => [...new Set([...prev, fetchedCategory])]);
        }
        setDescription(String(result.description || ""));

        const nextStatus = String(result.productStatus || "new").toLowerCase();
        setProductStatus(statusOptions.includes(nextStatus as (typeof statusOptions)[number]) ? (nextStatus as (typeof statusOptions)[number]) : "new");
        setSalePrice(result.salePrice === null || result.salePrice === undefined ? "" : String(result.salePrice));

        const images = Array.isArray(result.imageUrls)
          ? result.imageUrls
          : result.imageUrl
            ? [result.imageUrl]
            : [];
        setExistingImageUrls(images.filter(Boolean));

        const incomingVariants = Array.isArray(result.variantStocks) ? result.variantStocks : [];
        if (incomingVariants.length > 0) {
          const uniqueColors = [...new Set(incomingVariants.map((item) => String(item.color || "").trim()).filter(Boolean))];
          const uniqueSizes = [...new Set(incomingVariants.map((item) => String(item.size || "").trim()).filter(Boolean))];

          setColors(uniqueColors);
          setSizes(uniqueSizes);
          setColorCatalog((prev) => [...new Set([...prev, ...uniqueColors])]);
          setSizeCatalog((prev) => [...new Set([...prev, ...uniqueSizes])]);

          const matrix: Record<string, string> = {};
          incomingVariants.forEach((item) => {
            const color = String(item.color || "").trim();
            const size = String(item.size || "").trim();
            if (!color || !size) return;
            matrix[toKey(color, size)] = String(Number(item.stock || 0));
          });
          setStockMatrix(matrix);
        } else {
          setManualStock(String(result.stock || 0));
        }
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoadingProduct(false);
      }
    }

    loadProduct();
  }, [productId]);

  async function uploadFile(file: File) {
    const imageData = new FormData();
    imageData.append("image", file);

    const uploadResponse = await fetch(`${PRODUCT_API_BASE}/upload-image`, {
      method: "POST",
      body: imageData,
    });
    const uploadResult = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(uploadResult?.message || "Upload ảnh thất bại.");
    }
    return String(uploadResult.imageUrl || "");
  }

  function addColor() {
    const normalized = newColor.trim();
    if (!normalized) return;
    if (!colorCatalog.includes(normalized)) {
      setColorCatalog((prev) => [...prev, normalized]);
    }
    setColors((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setNewColor("");
  }

  function toggleColor(color: string) {
    setColors((prev) => {
      if (prev.includes(color)) {
        setStockMatrix((current) => {
          const next = { ...current };
          Object.keys(next).forEach((key) => {
            if (key.startsWith(`${color}__`)) delete next[key];
          });
          return next;
        });
        return prev.filter((item) => item !== color);
      }
      return [...prev, color];
    });
  }

  function toggleSize(size: string) {
    setSizes((prev) => {
      if (prev.includes(size)) {
        setStockMatrix((current) => {
          const next = { ...current };
          Object.keys(next).forEach((key) => {
            if (key.endsWith(`__${size}`)) delete next[key];
          });
          return next;
        });
        return prev.filter((item) => item !== size);
      }
      return [...prev, size];
    });
  }

  function addCustomSize() {
    const normalized = customSize.trim().toUpperCase();
    if (!normalized) return;
    if (!sizeCatalog.includes(normalized)) {
      setSizeCatalog((prev) => [...prev, normalized]);
    }
    setSizes((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setCustomSize("");
  }

  async function handleUpdate() {
    if (!name.trim() || !price.trim() || !material.trim() || !category || !description.trim()) {
      setMessage("Vui lòng nhập đầy đủ thông tin cơ bản.");
      return;
    }

    if (!isAccessory) {
      if (colors.length === 0 || sizes.length === 0) {
        setMessage("Sản phẩm quần áo cần có màu và size.");
        return;
      }
      if (variants.length === 0) {
        setMessage("Vui lòng nhập tồn kho cho ít nhất 1 biến thể màu-size.");
        return;
      }
    }

    if (isAccessory) {
      const stockValue = Number(manualStock);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        setMessage("Phụ kiện cần nhập tồn kho hợp lệ.");
        return;
      }
    }

    setSubmitting(true);
    setMessage("");

    try {
      let uploadedImageUrls = existingImageUrls;
      if (imageFiles.length > 0) {
        uploadedImageUrls = [];
        for (const file of imageFiles) {
          const imageUrl = await uploadFile(file);
          if (imageUrl) uploadedImageUrls.push(imageUrl);
        }
      }

      if (uploadedImageUrls.length === 0) {
        throw new Error("Sản phẩm cần ít nhất 1 ảnh.");
      }

      const payload = {
        name: name.trim(),
        price: Number(price),
        salePrice: salePrice.trim() === "" ? null : Number(salePrice),
        stock: isAccessory ? Number(manualStock) : totalStock,
        size: isAccessory ? "" : sizeSummary,
        material: material.trim(),
        category,
        description,
        productStatus,
        colors: isAccessory ? "" : colorSummary,
        imageUrl: uploadedImageUrls[0],
        imageUrls: uploadedImageUrls,
        variantStocks: isAccessory ? [] : variants,
      };

      const response = await fetch(`${PRODUCT_API_BASE}/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Cập nhật sản phẩm thất bại.");
      }

      router.push("/admin/products");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingProduct) {
    return <p className="text-sm text-muted-foreground">Đang tải dữ liệu sản phẩm...</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh sách sản phẩm
      </Link>

      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Chỉnh sửa sản phẩm</h1>
      </div>

      {message ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Tên sản phẩm</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá</Label>
                <Input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="material">Chất liệu</Label>
                <Input id="material" value={material} onChange={(e) => setMaterial(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={productStatus} onValueChange={(value) => setProductStatus(value as (typeof statusOptions)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Giá sale (tùy chọn)</Label>
                <Input id="salePrice" type="number" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
              </div>
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ảnh sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {existingImageUrls.map((src, index) => (
                <div key={`${src}-${index}`} className="overflow-hidden rounded-lg border">
                  <img src={src} alt={`existing-${index + 1}`} className="h-36 w-full object-cover" />
                </div>
              ))}
            </div>

            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setImageFiles(files);
                setImagePreviews(files.map((file) => URL.createObjectURL(file)));
              }}
            />

            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {imagePreviews.map((src, index) => (
                  <div key={`${src}-${index}`} className="overflow-hidden rounded-lg border border-emerald-300">
                    <img src={src} alt={`new-${index + 1}`} className="h-36 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Không chọn ảnh mới = giữ ảnh cũ.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mô tả sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <RichTextEditor value={description} onChange={setDescription} onUploadImage={uploadFile} />
        </CardContent>
      </Card>

      {!isAccessory ? (
        <Card>
          <CardHeader>
            <CardTitle>Biến thể quần áo (Màu - Size - Tồn kho)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {colorCatalog.map((color) => (
                  <Button key={color} type="button" variant={colors.includes(color) ? "default" : "outline"} size="sm" onClick={() => toggleColor(color)}>
                    {color}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Thêm màu" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
                <Button type="button" variant="outline" onClick={addColor}>
                  <Plus className="mr-1 size-4" /> Thêm màu
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Size</Label>
              <div className="flex flex-wrap gap-2">
                {sizeCatalog.map((size) => (
                  <Button key={size} type="button" variant={sizes.includes(size) ? "default" : "outline"} size="sm" onClick={() => toggleSize(size)}>
                    {size}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Size tùy chỉnh" value={customSize} onChange={(e) => setCustomSize(e.target.value)} />
                <Button type="button" variant="outline" onClick={addCustomSize}>
                  <Plus className="mr-1 size-4" /> Thêm size
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Màu \\ Size</th>
                    {sizes.map((size) => (
                      <th key={size} className="px-3 py-2 text-center font-medium">{size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colors.length === 0 || sizes.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(2, sizes.length + 1)} className="px-3 py-4 text-center text-muted-foreground">
                        Hãy thêm màu và chọn size để nhập tồn kho.
                      </td>
                    </tr>
                  ) : (
                    colors.map((color) => (
                      <tr key={color} className="border-t">
                        <td className="px-3 py-2 font-medium">{color}</td>
                        {sizes.map((size) => {
                          const key = toKey(color, size);
                          return (
                            <td key={key} className="px-2 py-2">
                              <Input
                                type="number"
                                min="0"
                                placeholder="-"
                                value={stockMatrix[key] || ""}
                                onChange={(e) => setStockMatrix((prev) => ({ ...prev, [key]: e.target.value }))}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 rounded-md border bg-muted/40 p-3 text-sm md:grid-cols-3">
              <p><span className="text-muted-foreground">Size:</span> {sizeSummary || "-"}</p>
              <p><span className="text-muted-foreground">Màu:</span> {colorSummary || "-"}</p>
              <p><span className="text-muted-foreground">Tổng tồn:</span> {totalStock}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tồn kho phụ kiện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="manualStock">Tồn kho</Label>
            <Input id="manualStock" type="number" min="0" value={manualStock} onChange={(e) => setManualStock(e.target.value)} />
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/products">Hủy</Link>
        </Button>
        <Button onClick={handleUpdate} disabled={submitting}>
          <Upload className="mr-2 size-4" />
          {submitting ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}
