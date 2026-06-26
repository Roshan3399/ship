import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const metadata: Metadata = {
  title: "Ship — Build it. Ship it. Prove it.",
  description: "The operating system for ambitious teenagers. Track builds, ship projects, and build a public reputation through real work.",
  openGraph: {
    title: "Ship — Build it. Ship it. Prove it.",
    description: "The operating system for ambitious teenagers. Track builds, ship projects, and build a public reputation through real work.",
    type: "website",
    url: "https://roshan-ship.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ship — Build it. Ship it. Prove it.",
    description: "The operating system for ambitious teenagers. Track builds, ship projects, and build a public reputation through real work.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
