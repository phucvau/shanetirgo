import { Truck, RefreshCw, Shield, Headphones } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Giao hàng miễn phí",
    description: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ.",
  },
  {
    icon: RefreshCw,
    title: "Đổi trả dễ dàng",
    description: "Đổi trả miễn phí trong vòng 2 tuần",
  },
  {
    icon: Shield,
    title: "Chất lượng đảm bảo",
    description: "Sản phẩm chính hãng, chất liệu cao cấp.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Đội ngũ tư vấn luôn sẵn sàng phục vụ.",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-y border-border py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-border">
              <f.icon className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
