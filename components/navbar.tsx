"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ShoppingBag, Search, User } from "lucide-react"
import { useCart } from "@/components/cart-provider"

const navLinks = [
  { label: "Trang chủ", href: "/", type: "home" as const },
  { label: "Bộ sưu tập", href: "/#collections", type: "section" as const, sectionId: "collections" },
  { label: "sản phẩm", href: "/products", type: "route" as const },
  { label: "Về chúng tôi", href: "/#about", type: "section" as const, sectionId: "about" },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartPop, setCartPop] = useState(false)
  const [pageTransition, setPageTransition] = useState<"none" | "in" | "out">("none")
  const { items, totalQuantity, isCartOpen, setCartOpen, toggleCart, updateItemQuantity, removeItem } = useCart()
  const previousQuantity = useRef(totalQuantity)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  useEffect(() => {
    if (totalQuantity > previousQuantity.current) {
      setCartPop(true)
      const timer = setTimeout(() => setCartPop(false), 350)
      previousQuantity.current = totalQuantity
      return () => clearTimeout(timer)
    }
    previousQuantity.current = totalQuantity
  }, [totalQuantity])

  useEffect(() => {
    if (pathname === "/checkout") {
      setCartOpen(false)
    }
  }, [pathname, setCartOpen])

  useEffect(() => {
    if (pathname !== "/") return
    const target = window.sessionStorage.getItem("home-scroll-target")
    if (!target) return

    window.sessionStorage.removeItem("home-scroll-target")
    window.setTimeout(() => {
      if (target === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }
      const section = document.getElementById(target)
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 50)
  }, [pathname])

  useEffect(() => {
    const shouldPlayOut = window.sessionStorage.getItem("page-transition-out")
    if (!shouldPlayOut) return

    window.sessionStorage.removeItem("page-transition-out")
    setPageTransition("out")
    const timer = window.setTimeout(() => {
      setPageTransition("none")
    }, 520)
    return () => window.clearTimeout(timer)
  }, [pathname])

  function navigateWithCover(href: string, samePathAction?: () => void) {
    const isSamePath = pathname === href
    setPageTransition("in")

    window.setTimeout(() => {
      if (isSamePath) {
        samePathAction?.()
        setPageTransition("out")
        window.setTimeout(() => {
          setPageTransition("none")
        }, 520)
        return
      }

      window.sessionStorage.setItem("page-transition-out", "1")
      router.push(href)
    }, 520)
  }

  function scrollHome(target: "top" | string) {
    if (pathname !== "/") {
      window.sessionStorage.setItem("home-scroll-target", target)
      router.push("/")
      return
    }

    if (target === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    const section = document.getElementById(target)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function handleNavClick(link: (typeof navLinks)[number], event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    setMobileOpen(false)

    if (link.type === "home") {
      scrollHome("top")
      return
    }

    if (link.type === "section" && link.sectionId) {
      scrollHome(link.sectionId)
      return
    }

    if (link.type === "route") {
      navigateWithCover(link.href)
    }
  }

  return (
    <>
      {pageTransition !== "none" ? (
        <div className={`pointer-events-none fixed inset-0 z-[95] bg-background ${pageTransition === "in" ? "page-transition-in" : "page-transition-out"}`}>
          <div className="flex h-full items-center justify-center">
            <p className="text-4xl font-bold tracking-widest text-foreground md:text-6xl">
              <span className="[font-family:var(--font-nosifer)]">SHANE</span>
              <span className="[font-family:var(--font-script)]">Tirgo</span>
            </p>
          </div>
        </div>
      ) : null}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={(event) => {
            event.preventDefault()
            setMobileOpen(false)
            navigateWithCover("/", () => {
              window.scrollTo({ top: 0, behavior: "smooth" })
            })
          }}
          className="font-serif text-2xl font-bold tracking-widest text-foreground"
        >
          <span className="[font-family:var(--font-nosifer)]">SHANE</span>
          <span className="[font-family:var(--font-script)]">Tirgo</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                onClick={(event) => handleNavClick(link, event)}
                className="group relative inline-flex overflow-hidden rounded-md px-2 py-1 text-sm font-medium uppercase tracking-wider text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-95"
              >
                <span className="relative z-10">{link.label}</span>
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-foreground/10 transition-transform duration-300 group-active:translate-x-0" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <button aria-label="Tim kiem" className="text-foreground transition-all duration-150 hover:text-accent active:scale-90">
            <Search className="h-5 w-5" />
          </button>
          <button aria-label="Tai khoan" className="hidden text-foreground transition-all duration-150 hover:text-accent active:scale-90 md:block">
            <User className="h-5 w-5" />
          </button>
          <button
            aria-label="Giỏ hàng"
            onClick={toggleCart}
            className={`relative text-foreground transition-all duration-150 hover:text-accent active:scale-90 ${cartPop ? "scale-125" : "scale-100"}`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {totalQuantity}
            </span>
          </button>

          {/* Mobile toggle */}
          <button
            aria-label="Mo menu"
            className="text-foreground transition-transform duration-150 active:scale-90 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <ul className="flex flex-col px-6 py-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={(event) => handleNavClick(link, event)}
                    className="group relative block overflow-hidden rounded-md py-3 text-sm font-medium uppercase tracking-wider text-foreground transition-all duration-200 hover:text-accent active:scale-[0.99]"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-foreground/10 transition-transform duration-300 group-active:translate-x-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-[70] bg-black/40 transition-opacity ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[80] h-[100dvh] w-[75vw] md:w-[25vw] border-l border-border bg-background shadow-2xl transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[100dvh] flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Giỏ hàng</p>
              <h3 className="text-lg font-semibold text-foreground">{totalQuantity} sản phẩm</h3>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Đóng giỏ hàng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có sản phẩm nào trong giỏ hàng.</p>
            ) : (
              items.map((item) => (
                <div key={item.lineId} className="grid min-h-[96px] grid-cols-[64px_1fr_auto] items-stretch gap-3 rounded-lg border border-border p-3">
                  <div className="h-full w-16 overflow-hidden rounded-md border border-border bg-muted">
                    <img
                      src={item.imageUrl || "/images/product-1.jpeg"}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Màu: {item.color || "-"}</p>
                    <p className="text-xs text-muted-foreground">Size: {item.size || "-"}</p>
                    <p className="text-xs font-medium text-foreground">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                    </p>
                  </div>

                  <div className="flex h-full flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.lineId)}
                      className="rounded-md p-1 text-red-600 hover:bg-red-50"
                      aria-label="Xóa sản phẩm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItemQuantity(item.lineId, item.quantity - 1)}
                        className="rounded border border-border px-2 py-0.5 text-sm"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateItemQuantity(item.lineId, item.quantity + 1)}
                        className="rounded border border-border px-2 py-0.5 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-semibold text-foreground">
                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(subtotal)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Trở về
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false)
                  navigateWithCover("/checkout")
                }}
                className="rounded-md bg-foreground px-4 py-2 text-center text-sm font-medium text-background hover:bg-foreground/90"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      </aside>

    </>
  )
}
