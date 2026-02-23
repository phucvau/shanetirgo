import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const collections = [
  {
    title: "Xuan He 2026",
    description: "Nhung thiet ke thoang mat, phong khoang cho ngay nang.",
    image: "/images/collection-1.jpg",
    href: "#",
  },
  {
    title: "Thu Dong 2026",
    description: "Am ap, ca tinh voi tong mau tram am.",
    image: "/images/collection-2.jpg",
    href: "#",
  },
  {
    title: "Phu kien",
    description: "Diem nhan hoan hao cho moi trang phuc.",
    image: "/images/collection-3.jpg",
    href: "#",
  },
]

export function CollectionsSection() {
  return (
    <section id="collections" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      {/* Header */}
      <div className="mb-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Bộ sưu tập
        </p>
        <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
          Duoc tuyen chon dac biet cho ban
        </h2>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {collections.map((col) => (
          <Link
            key={col.title}
            href={col.href}
            className="group relative overflow-hidden"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <Image
                src={col.image}
                alt={col.title}
                width={600}
                height={800}
                
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end bg-foreground/20 p-8 transition-colors group-hover:bg-foreground/40">
              <h3 className="font-serif text-2xl font-bold text-background">
                {col.title}
              </h3>
              <p className="mt-2 text-sm text-background/80">
                {col.description}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-background">
                Kham pha
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
