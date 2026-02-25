import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter, Ballet, Rye, Nosifer } from "next/font/google";
import { CartProvider } from "@/components/cart-provider";

import './globals.css'

const _playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif',
})

const _inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
})

const _ballet = Ballet({
  subsets: ["latin"],
  variable: "--font-script",
});

const _rye = Rye({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rye",
});

const _nosifer = Nosifer({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-nosifer",
});

export const metadata: Metadata = {
  title: "ShaneTirgo - Thời trang hiện đại",
  description: "Khám phá Bộ sưu tập thời trang hiện đại, sang trọng và tinh tế. Thiết kế độc đáo, chất liệu cao cấp.",
}

export const viewport: Viewport = {
  themeColor: '#1c1916',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${_playfair.variable} ${_inter.variable} ${_ballet.variable} ${_rye.variable} ${_nosifer.variable} font-sans antialiased`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
