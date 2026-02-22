import { Truck, RefreshCw, Shield, Headphones } from "lucide-react"

const features = [
  {
    icon: Truck,
    title: "Giao hang mien phi",
    description: "Mien phi van chuyen cho don hang tu 500.000d.",
  },
  {
    icon: RefreshCw,
    title: "Doi tra de dang",
    description: "Doi tra mien phi trong vong 30 ngay.",
  },
  {
    icon: Shield,
    title: "Chat luong dam bao",
    description: "San pham chinh hang, chat lieu cao cap.",
  },
  {
    icon: Headphones,
    title: "Ho tro 24/7",
    description: "Doi ngu tu van luon san sang phuc vu.",
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
