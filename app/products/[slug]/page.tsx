"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, ShieldCheck, Truck } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/components/cart-provider";
import { ApiProduct, formatStorePrice, parseColors, parseSizes } from "@/lib/storefront-products";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { addItem } = useCart();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const sizes = useMemo(() => parseSizes(product?.size || ""), [product?.size]);
  const colors = useMemo(() => parseColors(product?.colors || ""), [product?.colors]);

  useEffect(() => {
    if (!slug) return;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const detailResponse = await fetch(`/api/products/${slug}`, { cache: "no-store" });
        const detail = await detailResponse.json();
        if (!detailResponse.ok) {
          throw new Error(detail?.message || "Khong tim thay sản phẩm.");
        }
        setProduct(detail);

        const listResponse = await fetch("/api/products", { cache: "no-store" });
        const list = await listResponse.json();
        if (listResponse.ok) {
          const related = (list as ApiProduct[])
            .filter((item) => item.category === detail.category && item.slug !== detail.slug)
            .slice(0, 3);
          setRelatedProducts(related);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    const nextSizes = parseSizes(product.size);
    const nextColors = parseColors(product.colors);
    setSelectedSize(nextSizes[0] || "");
    setSelectedColor(nextColors[0] || "");
    setQuantity(1);
  }, [product]);

  function handleAddToCart() {
    if (!product) return;
    if (sizes.length > 0 && !selectedSize) {
      setError("Vui long chon size.");
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      setError("Vui long chon mau.");
      return;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    setError("");
  }

  return (
    <>
      <Navbar />
      <main className="bg-background pt-24">
        <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
          <Link
            href="/#products"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lai danh sach sản phẩm
          </Link>

          {loading ? <p className="py-10 text-muted-foreground">Dang tai chi tiet sản phẩm...</p> : null}
          {error && !product ? <p className="py-10 text-destructive">{error}</p> : null}

          {product ? (
            <div className="space-y-6">
              <div className="grid gap-10 lg:grid-cols-2">
                <div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white">
                    <img
                      src={product.imageUrl || "/images/product-1.jpeg"}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <h1 className="font-serif text-4xl font-bold text-foreground">{product.name}</h1>
                  <p className="text-2xl font-semibold text-foreground">{formatStorePrice(product.price)}</p>

                  <div className="grid gap-4 rounded-lg border bg-card p-5 text-sm">
                    <div>
                      <p className="mb-1 text-muted-foreground">Chat lieu</p>
                      <p className="font-medium">{product.material || "Dang cap nhat"}</p>
                    </div>

                    {sizes.length > 0 ? (
                      <div>
                        <p className="mb-2 text-muted-foreground">Size</p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setSelectedSize(size)}
                              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                selectedSize === size
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-foreground hover:bg-accent"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {colors.length > 0 ? (
                      <div>
                        <p className="mb-2 text-muted-foreground">Mau sac</p>
                        <div className="flex flex-wrap gap-2">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSelectedColor(color)}
                              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                selectedColor === color
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-foreground hover:bg-accent"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-muted-foreground">So luong</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="rounded-md border px-3 py-1 text-sm"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center font-medium">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.min(Math.max(product.stock, 1), q + 1))}
                          className="rounded-md border px-3 py-1 text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={handleAddToCart}
                      className="rounded-md bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
                    >
                      Them vao gio hang
                    </button>
                    <button className="rounded-md border border-border px-5 py-3 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-accent">
                      Mua ngay
                    </button>
                  </div>

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Giao hang toan quoc trong 2-5 ngay lam viec.
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Bao dam doi tra trong 7 ngay neu loi nha san xuat.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5">
                <p className="mb-2 text-sm font-medium text-foreground">Mo ta sản phẩm</p>
                <p className="text-base leading-7 text-muted-foreground">{product.description}</p>
              </div>
            </div>
          ) : null}
        </section>

        {relatedProducts.length > 0 ? (
          <section className="border-t bg-secondary py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">sản phẩm lien quan</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="group overflow-hidden rounded-lg border bg-card"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={item.imageUrl || "/images/product-1.jpeg"}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="text-sm uppercase tracking-wider text-muted-foreground">{item.category}</p>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-sm font-semibold text-muted-foreground">{formatStorePrice(item.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
