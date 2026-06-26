import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6">About the founder</h1>

          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              Hi, I&apos;m Roshan. I&apos;m 16 years old and I built Ship because I was tired of platforms that reward posting instead of building.
            </p>

            <p>
              I started coding when I was 14. Since then I&apos;ve built STUDENT OS, MOMENTUM, R-OS. None of them had a place to live. No proof. No record.
            </p>

            <p>
              Ship is that place.
            </p>

            <p>
              Every Build you ship is permanent. Every streak you keep is real. Every profile is a credential you can show to colleges, startups, and the world.
            </p>

            <p>
              If you have ideas, bugs, or just want to talk builds: <a href="mailto:roshan114400@gmail.com" className="text-ship hover:underline">roshan114400@gmail.com</a>
            </p>

            <p className="text-foreground font-medium">
              Roshan, Founder
            </p>

            <p className="text-xs text-muted-foreground italic">
              P.S. This platform has zero investors. Zero ads. Zero data selling. Just builders.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
