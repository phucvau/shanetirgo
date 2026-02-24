"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ApiProduct, formatStorePrice, getEffectiveProductPrice, getProductImages } from "@/lib/storefront-products"

const baseCategories = ["Tất cả"]

export function ProductsSection() {
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [active, setActive] = useState("Tất cả")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [hoverImageIndex, setHoverImageIndex] = useState<Record<string, number>>({})

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
  const itemsPerPage = 4
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }, [filtered, currentPage])

  const productImageMap = useMemo(() => {
    const map = new Map<string, string[]>()
    pagedProducts.forEach((product) => {
      map.set(product.slug, getProductImages(product))
    })
    return map
  }, [pagedProducts])

  useEffect(() => {
    setCurrentPage(1)
  }, [active])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (!hoveredSlug) return
    const images = productImageMap.get(hoveredSlug) || []
    if (images.length <= 1) return

    const timer = setInterval(() => {
      setHoverImageIndex((prev) => {
        const current = prev[hoveredSlug] ?? 0
        const next = current >= images.length - 1 ? 0 : current + 1
        return { ...prev, [hoveredSlug]: next }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hoveredSlug, productImageMap])

  function renderStatusTag(product: ApiProduct) {
    const status = String(product.productStatus || "").toLowerCase()
    if (status === "hot") {
      return (
        <span className="absolute left-4 top-4 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
          🔥 Hot
        </span>
      )
    }
    if (status === "sale") {
      return (
        <span className="absolute left-4 top-4 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
          Sale
        </span>
      )
    }
    if (status === "new" || product.isNew) {
      return (
        <span className="absolute left-4 top-4 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
          Mới
        </span>
      )
    }
    return null
  }

  return (
    <section id="products" className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Sản phẩm nổi bật
          </p>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
            "Shane Tirgo - New waves of fashion"
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {loading ? (
            <p className="col-span-full text-center text-muted-foreground">Đang tải sản phẩm...</p>
          ) : null}
          {pagedProducts.map((product) => (
            <div key={product.id} className="group w-full overflow-hidden rounded-xl bg-card shadow-[0_10px_25px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(0,0,0,0.16)]">
              {/* Image wrapper */}
              <div
                className="relative aspect-[4/5] overflow-hidden bg-muted"
                onMouseEnter={() => {
                  const images = productImageMap.get(product.slug) || []
                  if (images.length > 1) {
                    setHoveredSlug(product.slug)
                    setHoverImageIndex((prev) => ({ ...prev, [product.slug]: 1 }))
                  }
                }}
                onMouseLeave={() => {
                  setHoveredSlug((prev) => (prev === product.slug ? null : prev))
                  setHoverImageIndex((prev) => ({ ...prev, [product.slug]: 0 }))
                }}
              >
                <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">Xem chi tiết {product.name}</span>
                </Link>
                <div
                  className="flex h-full w-full transition-transform duration-1000 ease-in-out"
                  style={{
                    transform: `translateX(-${
                      (hoverImageIndex[product.slug] ?? 0) * 100
                    }%)`,
                  }}
                >
                  {(productImageMap.get(product.slug) || ["/images/product-1.jpeg"]).map((imageUrl, index) => (
                    <div key={`${product.slug}-${index}`} className="h-full w-full shrink-0">
                      <img
                        src={imageUrl}
                        alt={`${product.name}-${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {renderStatusTag(product)}
              </div>
              {/* Info */}
              <div className="bg-[#eceff1] px-4 py-4 text-center">
                <Link
                  href={`/products/${product.slug}`}
                  className="font-serif text-base font-bold tracking-wide text-foreground hover:text-accent"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {String(product.productStatus || "").toLowerCase() === "sale" && product.salePrice ? (
                    <>
                      <span className="mr-2 line-through opacity-60">{formatStorePrice(product.price)}</span>
                      <span className="text-red-600">{formatStorePrice(product.salePrice)}</span>
                    </>
                  ) : (
                    formatStorePrice(getEffectiveProductPrice(product))
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!loading && filtered.length > 0 ? (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-md border bg-background px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  currentPage === page
                    ? "bg-foreground text-background"
                    : "border bg-background text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border bg-background px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
