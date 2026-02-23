import Image from "next/image"

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src="/images/collection-1.jpg"
            alt="Về chúng tôi"
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Câu chuyện của chúng tôi
          </p>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
            Thời trang là nghệ thuật của sự tự tin
          </h2>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              ShaneTirgo ra đời từ niềm đam mê bất tận với thời trang và sự khát khao mang đến những thiết kế độc đáo, tinh tế cho người Việt.
            </p>
            <p>
              Mỗi sản phẩm đều được chế tác từ những chất liệu cao cấp nhất, với sự chú ý đến từng chi tiết nhỏ nhất. Chúng tôi tin rằng thời trang không chỉ là quần áo mà là cách bạn thể hiện chính mình.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border pt-8">
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">5+</p>
              <p className="mt-1 text-sm text-muted-foreground">Năm kinh nghiệm</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">50K+</p>
              <p className="mt-1 text-sm text-muted-foreground">Khách hàng</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">200+</p>
              <p className="mt-1 text-sm text-muted-foreground">Thiết kế</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
