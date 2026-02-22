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
  isNew: boolean;
};

export function formatStorePrice(price: string | number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price) || 0);
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
