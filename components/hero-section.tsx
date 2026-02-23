import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
         <video
    className="h-full w-full object-cover"
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
  >
    <source src="/videos/hero.mp4" type="video/mp4" />
  </video>
        <div className="absolute inset-0 bg-foreground/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-background/80">
            Bo suu tap moi 2026
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight text-background md:text-7xl lg:text-8xl">
            <span className="text-balance">Phong cach dinh nghia ban</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-background/80">
            Kham pha bo suu tap thoi trang hien dai voi thiet ke tinh te, chat lieu cao cap va su sang tao khong gioi han.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="#products"
              className="group inline-flex items-center gap-2 bg-background px-8 py-4 text-sm font-medium uppercase tracking-wider text-foreground transition-all hover:bg-accent hover:text-accent-foreground"
            >
              Kham pha ngay
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#collections"
              className="inline-flex items-center gap-2 border border-background/50 px-8 py-4 text-sm font-medium uppercase tracking-wider text-background transition-all hover:border-background hover:bg-background/10"
            >
              Xem bo suu tap
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
