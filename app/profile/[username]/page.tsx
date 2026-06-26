import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Flame, ArrowLeft, Check } from "lucide-react"
import type { Build, Log } from "@/types"

export const dynamic = "force-dynamic"

function calculateStreak(
  logs: { log_date?: string; created_at?: string }[]
): number {
  if (logs.length === 0) return 0
  const dates = [
    ...new Set(
      logs.map((l) => l.log_date ?? l.created_at?.split("T")[0] ?? "")
    ),
  ]
    .filter(Boolean)
    .sort()
    .reverse()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today.getTime() - streak * 86400000)
      .toISOString()
      .split("T")[0]
    if (dates[i] === expected) streak++
    else break
  }

  return streak
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.eq.${username},id.eq.${username}`)
    .single()

  if (!profile) notFound()

  const { data: builds } = await supabase
    .from("builds")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  const buildList = (builds ?? []) as unknown as Build[]
  const shipped = buildList.filter((b) => b.status === "shipped")
  const active = buildList.filter((b) => b.status !== "shipped")

  const { data: logs } = await supabase
    .from("logs")
    .select("log_date, created_at")
    .in("build_id", buildList.map((b) => b.id))

  const streak = calculateStreak((logs ?? []) as unknown as { log_date?: string; created_at?: string }[])

  const completedRatio = buildList.length > 0 ? shipped.length / buildList.length : 0
  const reputation = Math.round(completedRatio * 70 + Math.min(streak / 30, 1) * 10)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12 pb-24">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-foreground">
                {profile.name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
          {profile.username && <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>}
          {profile.bio && <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{profile.bio}</p>}
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
            {profile.age && <span>{profile.age} years old</span>}
            <span>{buildList.length} build{buildList.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber" />
              {streak} day streak
            </span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
            <span className="text-muted-foreground">Reputation</span>
            <span className="text-foreground font-semibold">{reputation}</span>
          </div>
        </div>

        {active.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Active builds</h2>
            <div className="space-y-2">
              {active.map((build) => (
                <Link key={build.id} href={`/builds/${build.id}`}
                  className="block rounded-lg border border-border bg-card p-4 hover:border-muted-foreground/30 transition-colors"
                >
                  <h3 className="font-medium text-foreground">{build.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">{build.category}</span>
                    <span className="capitalize">{build.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Shipped builds ({shipped.length})
          </h2>
          {shipped.length === 0 ? (
            <p className="text-sm text-muted-foreground/50">No shipped builds yet.</p>
          ) : (
            <div className="space-y-2">
              {shipped.map((build) => (
                <div key={build.id} className="rounded-lg border border-ship/20 bg-card p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{build.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-ship/10 px-2 py-0.5 text-xs font-medium text-ship">
                      <Check className="h-3 w-3" /> Shipped
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">{build.category}</span>
                    {build.shipped_at && (
                      <span>Shipped {new Date(build.shipped_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
