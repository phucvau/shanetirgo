"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Heart, ShoppingBag } from "lucide-react"
import { ApiProduct, formatStorePrice } from "@/lib/storefront-products"

const baseCategories = ["Tất cả"]

export function ProductsSection() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [active, setActive] = useState("Tất cả")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" })
        const result = await response.json()
        if (response.ok) {
          setProducts(result)
        }
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(products.map((p) => p.category).filter(Boolean)))
    return [...baseCategories, ...dynamic]
  }, [products])

  const filtered =
    active === "Tất cả"
      ? products
      : products.filter((p) => p.category === active)

  return (
    <section id="products" className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Sản phẩm nổi bật
          </p>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
            Thiết kế mới nhất
          </h2>
        </div>

        {/* Category filter */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-6 py-2 text-sm font-medium uppercase tracking-wider transition-all ${
                active === cat
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-foreground/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center text-muted-foreground">Đang tải sản phẩm...</p>
          ) : null}
          {filtered.map((product) => (
            <div key={product.id} className="group">
              {/* Image wrapper */}
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">Xem chi tiết {product.name}</span>
                </Link>
                <img
                  src={product.imageUrl || "/images/product-1.jpeg"}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 md:group-hover:scale-105"
                />
                {product.isNew && (
                  <span className="absolute left-4 top-4 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                    Mới
                  </span>
                )}
                {/* Hover actions */}
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 bg-foreground/80 p-4 translate-y-0 md:translate-y-full md:transition-transform md:duration-300 md:group-hover:translate-y-0">
                  <button
                    aria-label="Thêm vào giỏ hàng"
                    className="flex items-center gap-2 bg-background px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Thêm vào giỏ
                  </button>
                  <button
                    aria-label="Yêu thích"
                    className="flex h-10 w-10 items-center justify-center bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="mt-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-medium uppercase tracking-wider text-foreground hover:text-accent"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {formatStorePrice(product.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
