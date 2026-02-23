import Link from "next/link"

const footerLinks = {
  "Sản phẩm": ["Áo", "Quần", "Váy", "Phụ kiện", "Bộ sưu tập mới"],
  "Hỗ trợ": ["Hướng dẫn mua hàng", "Chính sách đổi trả", "Vận chuyển", "Liên hệ"],
  "Công ty": ["Về chúng tôi", "Tuyển dụng", "Blog", "Báo chí"],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="font-serif text-2xl font-bold tracking-widest text-foreground">
<span className="[font-family:var(--font-nosifer)]">SHANE</span>
  <span className="[font-family:var(--font-script)]">Tirgo</span>                </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Thời trang hiện đại, sang trọng và tinh tế cho người Việt.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            2026 ShaneTirgo. Tất cả quyền được bảo lưu.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Điều khoản sử dụng
            </Link>
            <Link href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Chính sách bảo mật
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
