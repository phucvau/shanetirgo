"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, CreditCard, MapPin } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocationOption = {
  code: number;
  name: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalQuantity, clearCart } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [street, setStreet] = useState("");
  const [note, setNote] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  const [cityOptions, setCityOptions] = useState<LocationOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<LocationOption[]>([]);
  const [wardOptions, setWardOptions] = useState<LocationOption[]>([]);

  useEffect(() => {
    async function loadProvinces() {
      setLocationError("");
      try {
        const response = await fetch("/api/locations/provinces", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Khong the tai danh sach tinh/thanh.");
        }
        setCityOptions(result);
      } catch (error) {
        setLocationError((error as Error).message);
      }
    }
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!cityCode) {
      setDistrictOptions([]);
      setDistrictCode("");
      setWardOptions([]);
      setWardCode("");
      return;
    }

    async function loadDistricts() {
      setLocationError("");
      try {
        const response = await fetch(`/api/locations/districts?provinceCode=${cityCode}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Khong the tai danh sach quan/huyen.");
        }
        setDistrictOptions(result);
      } catch (error) {
        setLocationError((error as Error).message);
      }
    }

    loadDistricts();
  }, [cityCode]);

  useEffect(() => {
    if (!districtCode) {
      setWardOptions([]);
      setWardCode("");
      return;
    }

    async function loadWards() {
      setLocationError("");
      try {
        const response = await fetch(`/api/locations/wards?districtCode=${districtCode}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Khong the tai danh sach phuong/xa.");
        }
        setWardOptions(result);
      } catch (error) {
        setLocationError((error as Error).message);
      }
    }

    loadWards();
  }, [districtCode]);

  const cityName = cityOptions.find((item) => String(item.code) === cityCode)?.name || "";
  const districtName = districtOptions.find((item) => String(item.code) === districtCode)?.name || "";
  const wardName = wardOptions.find((item) => String(item.code) === wardCode)?.name || "";

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  async function handlePlaceOrder() {
    if (!fullName.trim() || !phone.trim() || !cityCode || !districtCode || !wardCode || !street.trim()) {
      setMessage("Vui lòng nhập đầy đủ thông tin giao hàng.");
      return;
    }
    if (items.length === 0) {
      setMessage("Giỏ hàng đang trống. Hay thêm sản phẩm trước khi thanh toán.");
      return;
    }

    setPlacingOrder(true);
    setMessage("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: fullName.trim(),
          phone: phone.trim(),
          city: cityName,
          district: districtName,
          ward: wardName,
          street: street.trim(),
          addressLine: `${street.trim()}, ${wardName}, ${districtName}, ${cityName}`,
          note: note.trim(),
          totalAmount: subtotal,
          items: items.map((item) => ({
            productId: item.productId,
            slug: item.slug,
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size || "",
            color: item.color || "",
            imageUrl: item.imageUrl || "",
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Khong the tao don hang.");
      }

      clearCart();
      router.push(`/checkout/success?orderId=${result.id}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="bg-background pt-24">
        <section className="mx-auto max-w-7xl space-y-6 px-6 pb-14 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại mua sắm
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Thông tin giao hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyen Van A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Thành phố</Label>
                    <Select
                      value={cityCode}
                      onValueChange={(value) => {
                        setCityCode(value);
                        setDistrictCode("");
                        setWardCode("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {cityOptions.map((option) => (
                          <SelectItem key={option.code} value={String(option.code)}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quận/Huyện</Label>
                    <Select
                      value={districtCode}
                      onValueChange={(value) => {
                        setDistrictCode(value);
                        setWardCode("");
                      }}
                      disabled={!cityCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districtOptions.map((option) => (
                          <SelectItem key={option.code} value={String(option.code)}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Phường/Xã</Label>
                    <Select value={wardCode} onValueChange={setWardCode} disabled={!districtCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phường/xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {wardOptions.map((option) => (
                          <SelectItem key={option.code} value={String(option.code)}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Tên đường, số nhà</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="So 123, duong ABC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao..."
                    rows={3}
                  />
                </div>

                {locationError ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {locationError}
                  </p>
                ) : null}

                {message ? (
                  <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    {message}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Đơn hàng của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Giỏ hàng đang trống.</p>
                  ) : (
                    items.map((item) => (
                      <div key={item.lineId} className="grid grid-cols-[56px_1fr] gap-3 rounded-lg border border-border p-3">
                        <div className="h-14 w-14 overflow-hidden rounded-md border border-border bg-muted">
                          <img
                            src={item.imageUrl || "/images/product-1.jpeg"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Màu: {item.color || "-"} | Size: {item.size || "-"}</p>
                          <p className="text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
                          <p className="text-xs font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 border-t border-border pt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tổng sản phẩm</span>
                    <span className="font-medium">{totalQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Địa chỉ giao</span>
                    <span className="max-w-[65%] text-right text-xs text-muted-foreground">
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />
                      {street && wardName && districtName && cityName
                        ? `${street}, ${wardName}, ${districtName}, ${cityName}`
                        : "Chưa nhập"
                      }
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full bg-black text-white hover:bg-black/90"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {placingOrder ? "Đang xử lý..." : "Đặt hàng / Thanh toán"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
