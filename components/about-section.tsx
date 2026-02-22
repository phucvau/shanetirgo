import Image from "next/image"

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src="/images/collection-1.jpg"
            alt="Ve chung toi"
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Cau chuyen cua chung toi
          </p>
          <h2 className="font-serif text-4xl font-bold text-foreground md:text-5xl text-balance">
            Thoi trang la nghe thuat cua su tu tin
          </h2>
          <div className="mt-8 space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              ShaneTirgo ra doi tu niem dam me bat tan voi thoi trang va su khat khao mang den nhung thiet ke doc dao, tinh te cho nguoi Viet.
            </p>
            <p>
              Moi san pham deu duoc che tac tu nhung chat lieu cao cap nhat, voi su chu y den tung chi tiet nho nhat. Chung toi tin rang thoi trang khong chi la quan ao ma la cach ban the hien chinh minh.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border pt-8">
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">5+</p>
              <p className="mt-1 text-sm text-muted-foreground">Nam kinh nghiem</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">50K+</p>
              <p className="mt-1 text-sm text-muted-foreground">Khach hang</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-foreground">200+</p>
              <p className="mt-1 text-sm text-muted-foreground">Thiet ke</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
