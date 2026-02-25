// Shared types & mock data for Shane Tirgo storefront and admin

export type Product = {
  id: number
  name: string
  price: number
  category: string
  image: string
  isNew: boolean
  stock: number
  status: "active" | "draft" | "archived"
  description: string
}

export type Order = {
  id: string
  customer: string
  email: string
  date: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: { productName: string; quantity: number; price: number }[]
}

export type Customer = {
  id: number
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  joinedDate: string
  avatar?: string
}


export const products: Product[] = [
  {
    id: 1,
    name: "Ao Blazer Linen",
    price: 1890000,
    category: "Ao",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    isNew: true,
    stock: 24,
    status: "active",
    description: "Ao blazer linen cao cap, phong cach thanh lich va hien dai.",
  },
  {
    id: 2,
    name: "So Mi Oversize",
    price: 890000,
    category: "Ao",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600&q=80",
    isNew: false,
    stock: 56,
    status: "active",
    description: "So mi oversize thoai mai, de phoi do hang ngay.",
  },
  {
    id: 3,
    name: "Quan Ong Rong",
    price: 1290000,
    category: "Quan",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    isNew: true,
    stock: 18,
    status: "active",
    description: "Quan ong rong thanh lich, phu hop ca cong so va dao pho.",
  },
  {
    id: 4,
    name: "Ao Len Cashmere",
    price: 2490000,
    category: "Ao",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
    isNew: false,
    stock: 12,
    status: "active",
    description: "Ao len cashmere mem mai, giu am tot cho mua dong.",
  },
  {
    id: 5,
    name: "Vay Midi Cotton",
    price: 1190000,
    category: "Vay",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80",
    isNew: true,
    stock: 30,
    status: "active",
    description: "Vay midi cotton nhe nhang, nu tinh cho ngay he.",
  },
  {
    id: 6,
    name: "Ao Lua Cream",
    price: 1590000,
    category: "Ao",
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&q=80",
    isNew: false,
    stock: 8,
    status: "draft",
    description: "Ao lua cream sang trong, thich hop cho cac dip dac biet.",
  },
  {
    id: 7,
    name: "Quan Jeans Straight",
    price: 990000,
    category: "Quan",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    isNew: false,
    stock: 42,
    status: "active",
    description: "Quan jeans straight co dien, thoai mai va ben dep.",
  },
  {
    id: 8,
    name: "Ao Khoac Bomber",
    price: 2190000,
    category: "Ao",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
    isNew: true,
    stock: 15,
    status: "active",
    description: "Ao khoac bomber phong cach streetwear, ca tinh va tre trung.",
  },
]

export const orders: Order[] = [
  {
    id: "ORD-001",
    customer: "Nguyen Thi Mai",
    email: "mai.nguyen@email.com",
    date: "2026-02-15",
    total: 3180000,
    status: "delivered",
    items: [
      { productName: "Ao Blazer Linen", quantity: 1, price: 1890000 },
      { productName: "Quan Ong Rong", quantity: 1, price: 1290000 },
    ],
  },
  {
    id: "ORD-002",
    customer: "Tran Van Hung",
    email: "hung.tran@email.com",
    date: "2026-02-14",
    total: 890000,
    status: "shipped",
    items: [{ productName: "So Mi Oversize", quantity: 1, price: 890000 }],
  },
  {
    id: "ORD-003",
    customer: "Le Hoang Anh",
    email: "anh.le@email.com",
    date: "2026-02-14",
    total: 4080000,
    status: "processing",
    items: [
      { productName: "Ao Len Cashmere", quantity: 1, price: 2490000 },
      { productName: "Ao Lua Cream", quantity: 1, price: 1590000 },
    ],
  },
  {
    id: "ORD-004",
    customer: "Pham Minh Tu",
    email: "tu.pham@email.com",
    date: "2026-02-13",
    total: 2380000,
    status: "pending",
    items: [
      { productName: "Vay Midi Cotton", quantity: 1, price: 1190000 },
      { productName: "Vay Midi Cotton", quantity: 1, price: 1190000 },
    ],
  },
  {
    id: "ORD-005",
    customer: "Hoang Duc Minh",
    email: "minh.hoang@email.com",
    date: "2026-02-12",
    total: 1890000,
    status: "delivered",
    items: [{ productName: "Ao Blazer Linen", quantity: 1, price: 1890000 }],
  },
  {
    id: "ORD-006",
    customer: "Vo Thi Lan",
    email: "lan.vo@email.com",
    date: "2026-02-11",
    total: 3680000,
    status: "delivered",
    items: [
      { productName: "Ao Len Cashmere", quantity: 1, price: 2490000 },
      { productName: "Vay Midi Cotton", quantity: 1, price: 1190000 },
    ],
  },
  {
    id: "ORD-007",
    customer: "Bui Quang Huy",
    email: "huy.bui@email.com",
    date: "2026-02-10",
    total: 2280000,
    status: "cancelled",
    items: [
      { productName: "So Mi Oversize", quantity: 1, price: 890000 },
      { productName: "Quan Ong Rong", quantity: 1, price: 1290000 },
    ],
  },
  {
    id: "ORD-008",
    customer: "Dang Thi Hoa",
    email: "hoa.dang@email.com",
    date: "2026-02-09",
    total: 5870000,
    status: "shipped",
    items: [
      { productName: "Ao Blazer Linen", quantity: 1, price: 1890000 },
      { productName: "Ao Len Cashmere", quantity: 1, price: 2490000 },
      { productName: "Ao Lua Cream", quantity: 1, price: 1590000 },
    ],
  },
]

export const customers: Customer[] = [
  { id: 1, name: "Nguyen Thi Mai", email: "mai.nguyen@email.com", phone: "0912 345 678", totalOrders: 5, totalSpent: 8750000, joinedDate: "2025-06-15" },
  { id: 2, name: "Tran Van Hung", email: "hung.tran@email.com", phone: "0923 456 789", totalOrders: 3, totalSpent: 4200000, joinedDate: "2025-08-20" },
  { id: 3, name: "Le Hoang Anh", email: "anh.le@email.com", phone: "0934 567 890", totalOrders: 8, totalSpent: 15600000, joinedDate: "2025-03-10" },
  { id: 4, name: "Pham Minh Tu", email: "tu.pham@email.com", phone: "0945 678 901", totalOrders: 2, totalSpent: 3580000, joinedDate: "2025-11-05" },
  { id: 5, name: "Hoang Duc Minh", email: "minh.hoang@email.com", phone: "0956 789 012", totalOrders: 6, totalSpent: 12300000, joinedDate: "2025-04-22" },
  { id: 6, name: "Vo Thi Lan", email: "lan.vo@email.com", phone: "0967 890 123", totalOrders: 4, totalSpent: 7800000, joinedDate: "2025-07-18" },
  { id: 7, name: "Bui Quang Huy", email: "huy.bui@email.com", phone: "0978 901 234", totalOrders: 1, totalSpent: 2280000, joinedDate: "2026-01-02" },
  { id: 8, name: "Dang Thi Hoa", email: "hoa.dang@email.com", phone: "0989 012 345", totalOrders: 7, totalSpent: 18500000, joinedDate: "2025-02-28" },
]

export const revenueData = [
  { month: "Th9", revenue: 42000000 },
  { month: "Th10", revenue: 58000000 },
  { month: "Th11", revenue: 71000000 },
  { month: "Th12", revenue: 89000000 },
  { month: "Th1", revenue: 65000000 },
  { month: "Th2", revenue: 78000000 },
]

export function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export function formatCompactPrice(price: number) {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toString()
}
