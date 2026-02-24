export type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  stock: number;
  size: string;
  material: string;
  category: string;
  description: string;
  colors?: string;
  imageUrl: string;
  imageUrls?: string[] | string;
  variantStocks?: unknown;
  productStatus?: "normal" | "new" | "hot" | "sale";
  salePrice?: number | string | null;
  isNew: boolean;
};

export type ProductVariantStock = {
  size: string;
  color: string;
  stock: number;
};

export function formatStorePrice(price: string | number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price) || 0);
}

export function getEffectiveProductPrice(product: ApiProduct) {
  const status = String(product.productStatus || "").toLowerCase();
  const salePrice = product.salePrice === null || product.salePrice === undefined ? null : Number(product.salePrice);
  if (status === "sale" && salePrice !== null && Number.isFinite(salePrice) && salePrice >= 0) {
    return salePrice;
  }
  return Number(product.price) || 0;
}

export function parseSizes(value: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseColors(value?: string) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getProductImages(product?: ApiProduct | null) {
  if (!product) return ["/images/product-1.jpeg"];
  const source = product.imageUrls;
  const urls = Array.isArray(source)
    ? source
    : typeof source === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(source);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];
  const normalized = urls
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  if (normalized.length > 0) return normalized;
  return [product.imageUrl || "/images/product-1.jpeg"];
}

export function parseVariantStocks(value: unknown): ProductVariantStock[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  return source
    .map((item) => ({
      size: String((item as { size?: unknown })?.size || "").trim(),
      color: String((item as { color?: unknown })?.color || "").trim(),
      stock: Number((item as { stock?: unknown })?.stock || 0),
    }))
    .filter((item) => item.size || item.color);
}
