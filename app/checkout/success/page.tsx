"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [pageTransitionIn, setPageTransitionIn] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRevealed(true);
    }, 60);

    const playTimer = window.setTimeout(() => {
      try {
        const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const note1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        note1.type = "sine";
        note1.frequency.setValueAtTime(660, now);
        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        note1.connect(gain1);
        gain1.connect(ctx.destination);
        note1.start(now);
        note1.stop(now + 0.2);

        const note2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        note2.type = "triangle";
        note2.frequency.setValueAtTime(880, now + 0.14);
        gain2.gain.setValueAtTime(0.0001, now + 0.14);
        gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.16);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
        note2.connect(gain2);
        gain2.connect(ctx.destination);
        note2.start(now + 0.14);
        note2.stop(now + 0.36);

        window.setTimeout(() => {
          ctx.close().catch(() => undefined);
        }, 700);
      } catch {
        // ignore sound errors
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(playTimer);
    };
  }, []);

  function navigateWithCover(href: string, homeTarget?: "top" | "products") {
    setPageTransitionIn(true);

    window.setTimeout(() => {
      if (homeTarget) {
        window.sessionStorage.setItem("home-scroll-target", homeTarget);
      }
      window.sessionStorage.setItem("page-transition-out", "1");
      router.push(href);
    }, 520);
  }

  return (
    <>
      {pageTransitionIn ? (
        <div className="pointer-events-none fixed inset-0 z-[95] bg-background page-transition-in">
          <div className="flex h-full items-center justify-center">
            <p className="text-4xl font-bold tracking-widest text-foreground md:text-6xl">
              <span className="[font-family:var(--font-nosifer)]">SHANE</span>
              <span className="[font-family:var(--font-script)]">Tirgo</span>
            </p>
          </div>
        </div>
      ) : null}
      <Navbar />
      <main className="bg-background pt-24">
        <section className="mx-auto max-w-3xl px-6 pb-16 lg:px-8">
          <Card className={`transition-all duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <CardHeader className="items-center text-center">
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/25" />
                <CheckCircle2 className="relative h-16 w-16 text-emerald-600" />
              </div>
              <CardTitle className={`font-serif text-3xl transition-all delay-100 duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                Đặt hàng thành công
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className={`text-muted-foreground transition-all delay-150 duration-700 ${revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                Cảm ơn bạn đã đặt hàng tại ShaneTirgo. Đơn hàng của bạn đã được ghi nhận và chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.
              </p>
              <div className={`mx-auto grid max-w-md gap-3 transition-all delay-200 duration-700 sm:grid-cols-2 ${revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                <Button variant="outline" onClick={() => navigateWithCover("/", "top")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tiếp tục mua sắm
                </Button>
                <Button className="bg-black text-white hover:bg-black/90" onClick={() => navigateWithCover("/", "products")}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Xem sản phẩm
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
