"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/components/cart-provider";
import {
  ApiProduct,
  formatStorePrice,
  getEffectiveProductPrice,
  getProductImages,
  parseColors,
  parseSizes,
  parseVariantStocks,
} from "@/lib/storefront-products";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProductDetailPage() {
  const router = useRouter();
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const productImages = useMemo(() => getProductImages(product), [product]);
  const variants = useMemo(() => parseVariantStocks(product?.variantStocks), [product?.variantStocks]);

  const hasVariantMatrix = variants.length > 0;
  const fallbackSizes = useMemo(() => parseSizes(product?.size || ""), [product?.size]);
  const fallbackColors = useMemo(() => parseColors(product?.colors || ""), [product?.colors]);

  const colors = useMemo(() => {
    if (hasVariantMatrix) {
      return [...new Set(variants.map((item) => item.color).filter(Boolean))];
    }
    return fallbackColors;
  }, [hasVariantMatrix, variants, fallbackColors]);

  const sizeOptions = useMemo(() => {
    if (!hasVariantMatrix) {
      return fallbackSizes.map((size) => ({ size, stock: Number(product?.stock || 0) }));
    }

    const source = selectedColor
      ? variants.filter((item) => item.color === selectedColor)
      : variants;

    const map = new Map<string, number>();
    source.forEach((item) => {
      if (!item.size) return;
      if (!map.has(item.size)) {
        map.set(item.size, Number(item.stock || 0));
      }
    });

    return Array.from(map.entries()).map(([size, stock]) => ({ size, stock }));
  }, [hasVariantMatrix, fallbackSizes, product?.stock, selectedColor, variants]);

  const selectedVariantStock = useMemo(() => {
    if (!hasVariantMatrix) {
      return Number(product?.stock || 0);
    }
    const found = variants.find((item) => item.color === selectedColor && item.size === selectedSize);
    return Number(found?.stock || 0);
  }, [hasVariantMatrix, product?.stock, selectedColor, selectedSize, variants]);

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
            .filter((item) => item.category === detail.category && item.slug !== detail.slug);
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
    setActiveImageIndex(0);

    const parsedVariants = parseVariantStocks(product.variantStocks);
    if (parsedVariants.length > 0) {
      const nextColors = [...new Set(parsedVariants.map((item) => item.color).filter(Boolean))];
      const firstColor = nextColors[0] || "";
      setSelectedColor(firstColor);

      const nextSizes = parsedVariants.filter((item) => item.color === firstColor).map((item) => item.size);
      setSelectedSize(nextSizes[0] || "");
      setQuantity(1);
      return;
    }

    const nextSizes = parseSizes(product.size);
    const nextColors = parseColors(product.colors);
    setSelectedSize(nextSizes[0] || "");
    setSelectedColor(nextColors[0] || "");
    setQuantity(1);
  }, [product]);

  useEffect(() => {
    if (sizeOptions.length === 0) {
      setSelectedSize("");
      return;
    }
    const hasCurrent = sizeOptions.some((item) => item.size === selectedSize);
    if (!hasCurrent) {
      setSelectedSize(sizeOptions[0].size);
      setQuantity(1);
    }
  }, [selectedColor, selectedSize, sizeOptions]);

  function handleAddToCart() {
    if (!product) return;
    if (sizeOptions.length > 0 && !selectedSize) {
      setError("Vui long chon size.");
      return false;
    }
    if (colors.length > 0 && !selectedColor) {
      setError("Vui long chon mau.");
      return false;
    }
    if (selectedVariantStock <= 0) {
      setError("Bien the da het hang.");
      return false;
    }

    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: getEffectiveProductPrice(product),
      imageUrl: productImages[0],
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    });

    setError("");
    return true;
  }

  function handleBuyNow() {
    const added = handleAddToCart();
    if (!added) return;
    router.push("/checkout");
  }

  function goNextImage() {
    setActiveImageIndex((prev) => (prev + 1) % productImages.length);
  }

  function goPrevImage() {
    setActiveImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  }

  return (
    <>
      <Navbar />
      <main className="products-page-reveal bg-background pt-24">
        <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lai danh sách sản phẩm
          </Link>

          {loading ? <p className="py-10 text-muted-foreground">Đang tải chi tiết sản phẩm...</p> : null}
          {error && !product ? <p className="py-10 text-destructive">{error}</p> : null}

          {product ? (
            <div className="space-y-6">
              <div className="grid gap-10 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="relative aspect-[5/5] overflow-hidden rounded-xl bg-white">
                    <img
                      src={productImages[activeImageIndex]}
                      alt={`${product.name}-${activeImageIndex + 1}`}
                      className="h-full w-full object-contain"
                    />

                    {productImages.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={goPrevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border bg-white/90 p-2"
                          aria-label="Anh truoc"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={goNextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border bg-white/90 p-2"
                          aria-label="Anh sau"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    ) : null}
                  </div>

                  {productImages.length > 1 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {productImages.map((imageUrl, index) => (
                        <button
                          key={`${imageUrl}-${index}`}
                          type="button"
                          onClick={() => setActiveImageIndex(index)}
                          className={`overflow-hidden rounded-md border ${
                            index === activeImageIndex ? "border-foreground" : "border-border"
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={`${product.name}-thumb-${index + 1}`}
                            className="h-20 w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-6">
                  <h1 className="font-serif text-4xl font-bold text-foreground">{product.name}</h1>
                  <p className="text-2xl font-semibold text-foreground">
                    {String(product.productStatus || "").toLowerCase() === "sale" && product.salePrice ? (
                      <>
                        <span className="mr-2 text-lg line-through opacity-60">{formatStorePrice(product.price)}</span>
                        <span>{formatStorePrice(product.salePrice)}</span>
                      </>
                    ) : (
                      formatStorePrice(getEffectiveProductPrice(product))
                    )}
                  </p>

                  <div className="grid gap-4 rounded-lg border bg-card p-5 text-sm">
                    <div>
                      <p className="mb-1 text-muted-foreground">Chất liệu</p>
                      <p className="font-medium">{product.material || "Dang cap nhat"}</p>
                    </div>

                    {colors.length > 0 ? (
                      <div>
                        <p className="mb-2 text-muted-foreground">Màu sắc</p>
                        <div className="flex flex-wrap gap-2">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => {
                                setSelectedColor(color);
                                setQuantity(1);
                              }}
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

                    {sizeOptions.length > 0 ? (
                      <div>
                        <p className="mb-2 text-muted-foreground">Size</p>
                        <div className="flex flex-wrap gap-2">
                          {sizeOptions.map((item) => {
                            const disabled = item.stock <= 0;
                            return (
                              <button
                                key={`${item.size}-${item.stock}`}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  setSelectedSize(item.size);
                                  setQuantity(1);
                                }}
                                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  disabled
                                    ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                                    : selectedSize === item.size
                                      ? "border-foreground bg-foreground text-background"
                                      : "border-border bg-background text-foreground hover:bg-accent"
                                }`}
                              >
                                {item.size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <p className="mb-2 text-muted-foreground">Số lượng</p>
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
                          onClick={() => setQuantity((q) => Math.min(Math.max(selectedVariantStock, 1), q + 1))}
                          className="rounded-md border px-3 py-1 text-sm"
                        >
                          +
                        </button>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {selectedVariantStock > 0 ? `Còn ${selectedVariantStock}` : "Het hang"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={handleAddToCart}
                      className="rounded-md bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
                    >
                      Thêm vào giỏ hàng
                    </button>
                    <button
                      onClick={handleBuyNow}
                      className="rounded-md border border-border px-5 py-3 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
                    >
                      Mua ngay
                    </button>
                  </div>

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <div className="grid gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Giao hàng toàn quốc trong 2-5 ngày làm việc.
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Bảo đảm đổi trả trong 7 ngày nếu lỗi nhà sản xuất.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-5">
                <p className="mb-2 text-sm font-medium text-foreground">Mô tả sản phẩm</p>
                <div
                  className="rich-content text-base leading-7 text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: product.description || "" }}
                />
              </div>
            </div>
          ) : null}
        </section>

        {relatedProducts.length > 0 ? (
          <section className="border-t bg-secondary py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="mb-8 font-serif text-3xl font-bold text-foreground">Sản phẩm liên quan khác</h2>
              <Carousel opts={{ align: "start" }} className="px-2 md:px-4">
                <CarouselContent>
                  {relatedProducts.map((item) => (
                    <CarouselItem key={item.id} className="basis-full sm:basis-1/2 lg:basis-1/4">
                      <Link
                        href={`/products/${item.slug}`}
                        className="group block overflow-hidden rounded-lg border bg-card"
                      >
                        <div className="relative aspect-[5/5] overflow-hidden">
                          <img
                            src={getProductImages(item)[0]}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="space-y-1 p-4">
                          <p className="text-sm uppercase tracking-wider text-muted-foreground">{item.category}</p>
                          <h3 className="font-medium text-foreground">{item.name}</h3>
                          <p className="text-sm font-semibold text-muted-foreground">
                            {formatStorePrice(getEffectiveProductPrice(item))}
                          </p>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-2 md:-left-5" />
                <CarouselNext className="-right-2 md:-right-5" />
              </Carousel>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
