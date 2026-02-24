"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronDown,
  ChevronUp,
  Flame,
  Filter,
  Package,
  Sparkles,
} from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiProduct,
  formatStorePrice,
  getEffectiveProductPrice,
  getProductImages,
  parseColors,
  parseSizes,
  parseVariantStocks,
} from "@/lib/storefront-products";

const productStatusOptions = ["normal", "new", "hot", "sale"] as const;
type ProductStatus = (typeof productStatusOptions)[number];

const statusLabel: Record<ProductStatus, string> = {
  normal: "Sản phẩm thường",
  new: "Sản phẩm mới nhất",
  hot: "Sản phẩm bán chạy",
  sale: "Sản phẩm đang giảm giá",
};

const sortOptions = [
  { value: "latest", label: "Mới nhất" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "hot_first", label: "Ưu tiên Hot" },
  { value: "new_first", label: "Ưu tiên New" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];
type CollectionItem = {
  id: number;
  name: string;
  slug: string;
  productIds: number[];
  isActive?: boolean;
};

function normalizeStatus(value: unknown): ProductStatus {
  const status = String(value || "normal").toLowerCase();
  return productStatusOptions.includes(status as ProductStatus)
    ? (status as ProductStatus)
    : "normal";
}

function getProductMeta(product: ApiProduct) {
  const variants = parseVariantStocks(product.variantStocks);
  if (variants.length > 0) {
    const sizeSet = new Set<string>();
    const colorSet = new Set<string>();
    let inStock = false;

    variants.forEach((item) => {
      if (item.size) sizeSet.add(item.size);
      if (item.color) colorSet.add(item.color);
      if (Number(item.stock) > 0) inStock = true;
    });

    return {
      sizes: Array.from(sizeSet),
      colors: Array.from(colorSet),
      inStock,
    };
  }

  const sizes = parseSizes(product.size || "");
  const colors = parseColors(product.colors || "");
  return {
    sizes,
    colors,
    inStock: Number(product.stock || 0) > 0,
  };
}

export default function ProductsListingPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProductStatus[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortValue>("latest");
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Không thể tải sản phẩm.");
        }
        setProducts(Array.isArray(result) ? result : []);
      } catch (error) {
        setMessage((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadCollections() {
      try {
        const response = await fetch("/api/collections", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) return;

        const rows = Array.isArray(result) ? result : [];
        setCollections(
          rows
            .filter((item) => item?.isActive !== false)
            .map((item) => ({
              id: Number(item.id),
              name: String(item.name || ""),
              slug: String(item.slug || ""),
              productIds: Array.isArray(item.productIds)
                ? item.productIds
                    .map((value: unknown) => Number(value))
                    .filter((value: number) => Number.isInteger(value) && value > 0)
                : [],
              isActive: Boolean(item.isActive ?? true),
            }))
        );
      } catch {
        // ignore collection loading errors
      }
    }

    loadCollections();
  }, []);

  useEffect(() => {
    const slug = String(searchParams.get("collection") || "").trim();
    if (!slug) return;
    setSelectedCollection(slug);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(min-width: 1024px)");

    const updateState = () => {
      const isDesktop = media.matches;
      setIsDesktopViewport(isDesktop);
      setIsFilterOpen(isDesktop);
    };

    updateState();
    media.addEventListener("change", updateState);
    return () => media.removeEventListener("change", updateState);
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["all", ...unique];
  }, [products]);

  const allSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((product) => {
      const meta = getProductMeta(product);
      meta.sizes.forEach((size) => sizeSet.add(size));
    });
    return Array.from(sizeSet);
  }, [products]);

  const allColors = useMemo(() => {
    const colorSet = new Set<string>();
    products.forEach((product) => {
      const meta = getProductMeta(product);
      meta.colors.forEach((color) => colorSet.add(color));
    });
    return Array.from(colorSet);
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const next = products.filter((product) => {
      const meta = getProductMeta(product);
      const status = normalizeStatus(product.productStatus);

      const matchQuery =
        q.length === 0 ||
        product.name.toLowerCase().includes(q) ||
        String(product.material || "").toLowerCase().includes(q);

      const matchCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchCollection =
        selectedCollection === "all" ||
        collections.some((collection) => {
          if (collection.slug !== selectedCollection) return false;
          return collection.productIds.includes(Number(product.id));
        });

      const matchSizes =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => meta.sizes.includes(size));

      const matchColors =
        selectedColors.length === 0 ||
        selectedColors.some((color) => meta.colors.includes(color));

      const matchStatuses =
        selectedStatuses.length === 0 || selectedStatuses.includes(status);

      const matchStock = !inStockOnly || meta.inStock;

      return (
        matchQuery &&
        matchCategory &&
        matchCollection &&
        matchSizes &&
        matchColors &&
        matchStatuses &&
        matchStock
      );
    });

    next.sort((a, b) => {
      const statusA = normalizeStatus(a.productStatus);
      const statusB = normalizeStatus(b.productStatus);
      const priceA = getEffectiveProductPrice(a);
      const priceB = getEffectiveProductPrice(b);

      switch (sortBy) {
        case "price_desc":
          return priceB - priceA;
        case "price_asc":
          return priceA - priceB;
        case "hot_first":
          return Number(statusB === "hot") - Number(statusA === "hot") || (Number(b.id) - Number(a.id));
        case "new_first":
          return Number(statusB === "new") - Number(statusA === "new") || (Number(b.id) - Number(a.id));
        case "latest":
        default:
          return Number(b.id) - Number(a.id);
      }
    });

    return next;
  }, [
    products,
    query,
    selectedCategory,
    selectedCollection,
    collections,
    selectedSizes,
    selectedColors,
    selectedStatuses,
    inStockOnly,
    sortBy,
  ]);

  const itemsPerPage = isDesktopViewport ? 20 : 8; // mobile/tablet: 2 cột x 4 hàng
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    selectedCategory,
    selectedCollection,
    selectedSizes,
    selectedColors,
    selectedStatuses,
    inStockOnly,
    sortBy,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function toggleInArray(value: string, list: string[], setter: (next: string[]) => void) {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
      return;
    }
    setter([...list, value]);
  }

  function clearAllFilters() {
    setQuery("");
    setSelectedCategory("all");
    setSelectedCollection("all");
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedStatuses([]);
    setInStockOnly(false);
    setSortBy("latest");
  }

  function renderTag(product: ApiProduct) {
    const status = normalizeStatus(product.productStatus);
    if (status === "hot") {
      return (
        <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          🔥 Hot
        </span>
      );
    }
    if (status === "sale") {
      return (
        <span className="absolute left-3 top-3 rounded-md bg-orange-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Sale
        </span>
      );
    }
    if (status === "new") {
      return (
        <span className="absolute left-3 top-3 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Mới
        </span>
      );
    }
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="products-page-reveal bg-background pt-24">
        <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Danh mục</p>
              <h1 className="font-serif text-4xl font-bold text-foreground">Sản phẩm</h1>
              <p className="mt-2 text-sm text-muted-foreground">{filtered.length} sản phẩm phù hợp</p>
            </div>
            <div className="w-full max-w-md">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortValue)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-4 lg:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="w-full justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </span>
              {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <Card className={`h-fit border-border/80 lg:sticky lg:top-24 ${!isDesktopViewport && !isFilterOpen ? "hidden" : ""}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="h-4 w-4" />
                  Bộ lọc
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <LabelText>Tìm kiếm</LabelText>
                  <Input
                    placeholder="Tên, chất liệu..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <LabelText>Danh mục</LabelText>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category === "all" ? "Tất cả" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <LabelText>Bộ sưu tập</LabelText>
                  <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.slug}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FilterGroup title="Size" icon={<Package className="h-4 w-4" />}>
                  <TagList
                    items={allSizes}
                    selected={selectedSizes}
                    onToggle={(value) => toggleInArray(value, selectedSizes, setSelectedSizes)}
                  />
                </FilterGroup>

                <FilterGroup title="Màu" icon={<Sparkles className="h-4 w-4" />}>
                  <TagList
                    items={allColors}
                    selected={selectedColors}
                    onToggle={(value) => toggleInArray(value, selectedColors, setSelectedColors)}
                  />
                </FilterGroup>

                <FilterGroup title="Trạng thái" icon={<Flame className="h-4 w-4" />}>
                  <div className="space-y-2">
                    {productStatusOptions.map((status) => {
                      const checked = selectedStatuses.includes(status);
                      return (
                        <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              toggleInArray(status, selectedStatuses, setSelectedStatuses as (next: string[]) => void)
                            }
                          />
                          <span>{statusLabel[status]}</span>
                        </label>
                      );
                    })}
                  </div>
                </FilterGroup>

                <div className="space-y-2">
                  <LabelText>Lọc nhanh</LabelText>
                  <div className="space-y-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setSortBy("price_desc")}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowDownWideNarrow className="h-4 w-4" /> Giá cao đến thấp
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy("price_asc")}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowUpWideNarrow className="h-4 w-4" /> Giá thấp đến cao
                    </button>
                    <label className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Checkbox checked={inStockOnly} onCheckedChange={(checked) => setInStockOnly(Boolean(checked))} />
                      Chỉ sản phẩm còn hàng
                    </label>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={clearAllFilters}>
                  Xóa bộ lọc
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:gap-5 xl:grid-cols-4">
                {loading ? (
                  <p className="col-span-full text-center text-sm text-muted-foreground">Đang tải sản phẩm...</p>
                ) : null}

                {!loading && pagedProducts.length === 0 ? (
                  <p className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    Không có sản phẩm phù hợp bộ lọc hiện tại.
                  </p>
                ) : null}

                {pagedProducts.map((product) => {
                  const status = normalizeStatus(product.productStatus);
                  const images = getProductImages(product);
                  const effectivePrice = getEffectiveProductPrice(product);

                  return (
                    <div key={product.id} className="group overflow-hidden rounded-xl border bg-card shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(0,0,0,0.14)]">
                      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                        <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10">
                          <span className="sr-only">Xem {product.name}</span>
                        </Link>
                        <img
                          src={images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                        {renderTag(product)}
                      </div>

                      <div className="bg-[#eceff1] px-4 py-4 text-center">
                        <Link href={`/products/${product.slug}`} className="font-serif text-base font-bold tracking-wide text-foreground hover:text-accent">
                          {product.name}
                        </Link>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {status === "sale" && product.salePrice ? (
                            <>
                              <span className="mr-2 line-through opacity-60">{formatStorePrice(product.price)}</span>
                              <span className="text-red-600">{formatStorePrice(product.salePrice)}</span>
                            </>
                          ) : (
                            formatStorePrice(effectivePrice)
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!loading && filtered.length > 0 ? (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      type="button"
                      size="sm"
                      variant={currentPage === page ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function LabelText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{children}</p>;
}

function FilterGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <LabelText>{title}</LabelText>
      </div>
      {children}
    </div>
  );
}

function TagList({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          onClick={() => onToggle(item)}
          className={`cursor-pointer border px-3 py-1 text-xs transition-colors ${
            selected.includes(item)
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:bg-muted"
          }`}
        >
          {item}
        </Badge>
      ))}
    </div>
  );
}
