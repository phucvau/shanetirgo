export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  productId?: number;
  slug?: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  imageUrl?: string;
};

export type ApiOrder = {
  id: number;
  orderCode: string;
  customerName: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  note: string;
  items: OrderItem[];
  itemCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export function formatOrderPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);
}

export function formatOrderDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
