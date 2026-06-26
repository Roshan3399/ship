"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar, Users, Flame } from "lucide-react"
import { Nav } from "@/components/nav"
import { calculateStreak } from "@/lib/streak"
import type { Season, Build, Log, Profile } from "@/types"

interface BuilderInfo {
  name: string
  id: string
  buildTitle: string
  streak: number
  profile: Profile | null
}

export default function SeasonPage() {
  const router = useRouter()
  const supabase = createClient()
  const [season, setSeason] = useState<Season | null>(null)
  const [builders, setBuilders] = useState<BuilderInfo[]>([])
  const [myStreak, setMyStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setMyId(user.id)

      const { data: s } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .single()
      if (!s) { setLoading(false); return }
      setSeason(s as unknown as Season)

      const { data: myBuilds } = await supabase
        .from("builds")
        .select("id")
        .eq("user_id", user.id)

      if (myBuilds && myBuilds.length > 0) {
        const buildIds = myBuilds.map((b) => b.id)
        const { data: myLogs } = await supabase
          .from("logs")
          .select("log_date, created_at")
          .in("build_id", buildIds)

        if (myLogs) setMyStreak(calculateStreak(myLogs))
      }

      const { data: cohort } = await supabase
        .from("cohorts")
        .select("user_id")
        .eq("season_id", (s as unknown as Season).id)

      if (cohort) {
        const info = await Promise.all(
          cohort.map(async (c) => {
            const { data: p } = await supabase.from("profiles").select("*").eq("id", c.user_id).single()
            const { data: builds } = await supabase
              .from("builds")
              .select("title, id")
              .eq("user_id", c.user_id)
              .order("created_at", { ascending: false })
              .limit(1)

            const buildIds = (builds ?? []).map((b: { id: string }) => b.id)
            let builderStreak = 0
            if (buildIds.length > 0) {
              const { data: logs } = await supabase
                .from("logs")
                .select("log_date, created_at")
                .in("build_id", buildIds)

              if (logs) builderStreak = calculateStreak(logs)
            }

            return {
              name: (p as unknown as Profile)?.name ?? "Builder",
              id: (p as unknown as Profile)?.username ?? c.user_id,
              buildTitle: (builds?.[0] as unknown as { title: string })?.title ?? "No build",
              streak: builderStreak,
              profile: p as unknown as Profile | null,
            }
          })
        )
        const sorted = info.sort((a, b) => b.streak - a.streak)
        setBuilders(sorted)
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ship border-t-transparent" />
      </div>
    )
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No active season.</p>
      </div>
    )
  }

  const daysLeft = Math.ceil((new Date(season.end_date).getTime() - Date.now()) / 86400000)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Ship</h1>
        </div>
      </header>

      <Nav />

      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{season.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(season.start_date).toLocaleDateString()} — {new Date(season.end_date).toLocaleDateString()}
            </span>
            <span>{daysLeft} days left</span>
          </div>
          {myStreak > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm">
              <Flame className="h-4 w-4 text-amber" />
              <span className="text-foreground font-medium">{myStreak}</span>
              <span className="text-muted-foreground">day personal streak</span>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Builders in this season ({builders.length})
          </h2>
          <div className="space-y-2">
            {builders.map((b) => (
              <Link
                key={b.id}
                href={`/profile/${b.id}`}
                className="block rounded-lg border border-border bg-card p-4 hover:border-muted-foreground/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">{b.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{b.buildTitle}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className={`h-3 w-3 ${b.streak > 0 ? "text-amber" : "text-muted-foreground"}`} />
                    {b.streak}
                  </span>
                </div>
              </Link>
            ))}
            {builders.length === 0 && (
              <p className="text-sm text-muted-foreground">No other builders in this season yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
