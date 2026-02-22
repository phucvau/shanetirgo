import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Minh Anh",
    role: "Doanh nhan",
    content:
      "Chat luong san pham cuc ky tot, toi rat hai long voi tung chi tiet tren ao. Se quay lai mua them!",
    rating: 5,
  },
  {
    name: "Thu Huong",
    role: "Nha thiet ke",
    content:
      "Thiet ke doc dao, khong giong bat ky thuong hieu nao khac. ShaneTirgo chinh la diem den thoi trang cua toi.",
    rating: 5,
  },
  {
    name: "Duc Minh",
    role: "Nhiep anh gia",
    content:
      "Tu chat lieu den duong may deu rat chuyen nghiep. Gia ca hop ly cho chat luong nhu vay.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Khach hang noi gi
          </p>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
            Duoc tin tuong boi hang nghin khach hang
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col bg-background p-8 transition-shadow hover:shadow-lg"
            >
              {/* Stars */}
              <div className="mb-6 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <p className="flex-1 text-base leading-relaxed text-muted-foreground">
                {`"${t.content}"`}
              </p>
              <div className="mt-6 border-t border-border pt-6">
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
