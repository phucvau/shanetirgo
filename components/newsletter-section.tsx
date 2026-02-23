"use client"

import { useState } from "react"
import { Send } from "lucide-react"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail("")
    }
  }

  return (
    <section className="bg-foreground py-24">
      <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-background/60">
          Đăng ký nhận tin
        </p>
        <h2 className="font-serif text-4xl font-bold text-background md:text-5xl text-balance">
          Nhận ưu đãi độc quyền
        </h2>
        <p className="mt-4 text-base leading-relaxed text-background/70">
          Đăng ký để nhận thông tin về Bộ sưu tập mới và các chương trình ưu đãi đặc biệt từ ShaneTirgo.
        </p>

        {submitted ? (
          <div className="mt-10 rounded-sm border border-background/20 p-6">
            <p className="text-sm font-medium text-background">
              Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi thông tin sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex gap-0">
            <label htmlFor="email-input" className="sr-only">
              Địa chỉ email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn..."
              required
              className="flex-1 bg-background/10 px-6 py-4 text-sm text-background placeholder:text-background/40 outline-none border border-background/20 focus:border-background/50 transition-colors"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-accent px-8 py-4 text-sm font-medium uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng ký</span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
