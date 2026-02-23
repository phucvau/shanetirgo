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
          Dang ky nhan tin
        </p>
        <h2 className="font-serif text-4xl font-bold text-background md:text-5xl text-balance">
          Nhan uu dai doc quyen
        </h2>
        <p className="mt-4 text-base leading-relaxed text-background/70">
          Dang ky de nhan thong tin ve Bộ sưu tập moi va cac chuong trinh uu dai dac biet tu ShaneTirgo.
        </p>

        {submitted ? (
          <div className="mt-10 rounded-sm border border-background/20 p-6">
            <p className="text-sm font-medium text-background">
              Cam on ban da dang ky! Chung toi se gui thong tin som nhat.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex gap-0">
            <label htmlFor="email-input" className="sr-only">
              Dia chi email
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhap email cua ban..."
              required
              className="flex-1 bg-background/10 px-6 py-4 text-sm text-background placeholder:text-background/40 outline-none border border-background/20 focus:border-background/50 transition-colors"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-accent px-8 py-4 text-sm font-medium uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Dang ky</span>
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
