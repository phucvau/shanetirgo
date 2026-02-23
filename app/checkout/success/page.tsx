"use client";

import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background pt-24">
        <section className="mx-auto max-w-3xl px-6 pb-16 lg:px-8">
          <Card>
            <CardHeader className="items-center text-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-600" />
              <CardTitle className="font-serif text-3xl">Dat hang thanh cong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground">
                Cam on ban da dat hang tai ShaneTirgo. Don hang cua ban da duoc ghi nhan va chung toi se lien he xac nhan trong thoi gian som nhat.
              </p>
              <div className="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tiep tuc mua sam
                  </Link>
                </Button>
                <Button asChild className="bg-black text-white hover:bg-black/90">
                  <Link href="/#products">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Xem sản phẩm
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </>
  );
}
