"use client"

import { use, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Flame, Calendar, Check, ShipIcon, AlertTriangle } from "lucide-react"
import { DashboardSkeleton } from "@/components/skeleton"
import { Nav } from "@/components/nav"
import { calculateStreak } from "@/lib/streak"
import type { Build, Log, Season, Profile } from "@/types"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeBuild, setActiveBuild] = useState<Build | null>(null)
  const [yesterdaysLog, setYesterdaysLog] = useState<Log | null>(null)
  const [todaysGoal, setTodaysGoal] = useState("")
  const [streak, setStreak] = useState(0)
  const [season, setSeason] = useState<Season | null>(null)
  const [cohort, setCohort] = useState<{ name: string; build_title: string; id: string }[]>([])
  const [loggedToday, setLoggedToday] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [pastBuilds, setPastBuilds] = useState<Build[]>([])
  const [allLogs, setAllLogs] = useState<Log[]>([])
  const [shipConfirm, setShipConfirm] = useState(false)
  const [shipInput, setShipInput] = useState("")
  const [shipping, setShipping] = useState(false)
  const [showShipAnimation, setShowShipAnimation] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUser(user)

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (p) setProfile(p as unknown as Profile)

      const { data: activeSeason } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .single()
      if (activeSeason) setSeason(activeSeason)

      const { data: builds } = await supabase
        .from("builds")
        .select("*")
        .eq("user_id", user.id)
        .not("status", "eq", "shipped")
        .order("created_at", { ascending: false })
        .limit(1)

      const { data: allUserBuilds } = await supabase
        .from("builds")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      const buildList = (allUserBuilds ?? []) as unknown as Build[]
      setPastBuilds(buildList.filter((b) => b.status === "shipped"))

      if (builds && builds.length > 0) {
        const build = builds[0] as unknown as Build
        setActiveBuild(build)

        const today = new Date().toISOString().split("T")[0]

        const { data: logs } = await supabase
          .from("logs")
          .select("*")
          .eq("build_id", build.id)
          .order("created_at", { ascending: false })

        if (logs) {
          const logList = logs as unknown as Log[]
          setAllLogs(logList)
          const todayLog = logList.find((l) => l.log_date === today || l.created_at?.startsWith(today))
          const yesterdayLog = logList.find((l) => {
            const y = new Date(Date.now() - 86400000).toISOString().split("T")[0]
            return l.log_date === y || l.created_at?.startsWith(y)
          })

          if (todayLog) setLoggedToday(true)
          if (yesterdayLog) setYesterdaysLog(yesterdayLog)
          setStreak(calculateStreak(logList))
        }
      }

      const { data: cohortData } = await supabase
        .from("cohorts")
        .select("user_id")
        .eq("season_id", activeSeason?.id)

      if (cohortData && activeSeason) {
        const others = cohortData.filter((c) => c.user_id !== user.id).slice(0, 5)
        const info = await Promise.all(
          others.map(async (c) => {
            const { data: p } = await supabase.from("profiles").select("name, username").eq("id", c.user_id).single()
            const { data: b } = await supabase
              .from("builds")
              .select("title")
              .eq("user_id", c.user_id)
              .not("status", "eq", "shipped")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
            const prof = p as unknown as { name: string; username: string | null } | null
            return {
              name: prof?.name ?? "Builder",
              id: prof?.username ?? c.user_id,
              build_title: (b as unknown as { title: string })?.title ?? "No active build",
            }
          })
        )
        setCohort(info)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleLogProgress() {
    if (!activeBuild || loggedToday || !todaysGoal.trim()) return
    if (todaysGoal.trim().length < 10) {
      setLogError("Log must be at least 10 characters")
      return
    }
    setSaving(true)
    setLogError(null)
    const { error } = await supabase.from("logs").insert({
      build_id: activeBuild.id,
      content: todaysGoal,
    })
    if (error) {
      setLogError(error.message)
      setSaving(false)
      return
    }
    const newLog: Log = {
      id: "",
      build_id: activeBuild.id,
      log_date: new Date().toISOString().split("T")[0],
      content: todaysGoal,
      image_url: null,
      created_at: new Date().toISOString(),
    }
    setAllLogs((prev) => [newLog, ...prev])
    setLoggedToday(true)
    setStreak((s) => s + 1)
    setTodaysGoal("")
    setSaving(false)
  }

  async function handleShip() {
    if (!activeBuild || shipInput !== activeBuild.title) return

    setShipping(true)
    const { error } = await supabase
      .from("builds")
      .update({ status: "shipped", shipped_at: new Date().toISOString() })
      .eq("id", activeBuild.id)

    if (error) {
      setShipping(false)
      return
    }

    setShipConfirm(false)
    setShipping(false)
    setShipInput("")
    setShowShipAnimation(true)
    setTimeout(() => {
      setShowShipAnimation(false)
      setActiveBuild(null)
      setPastBuilds((prev) => [activeBuild, ...prev])
    }, 3000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return <DashboardSkeleton />

  const seasonEnd = season ? Math.ceil((new Date(season.end_date).getTime() - Date.now()) / 86400000) : 0
  const canShip = allLogs.length >= 3
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const isStreakDanger = !loggedToday && hour >= 22 && hour < 23
  const isStreakCritical = !loggedToday && (hour >= 23 || (hour === 22 && minute >= 30))
  const isStreakLost = !loggedToday && hour === 0 && minute < 5

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight text-foreground">
            Ship
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={profile?.username ? `/profile/${profile.username}` : `/profile/${user?.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <button onClick={handleLogout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log out
            </button>
          </div>
        </div>
      </header>

      <Nav />

      <main className="mx-auto max-w-2xl px-4 py-8 pb-24">
        {isStreakLost && (
          <div className="mb-6 rounded-xl border border-red/30 bg-red/10 p-4 text-center">
            <p className="text-sm text-red font-medium">Streak broken at {streak} days. It happens. Start again today.</p>
          </div>
        )}

        {isStreakCritical && (
          <div className="mb-6 rounded-xl border border-red/30 bg-red/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red" />
              <p className="text-sm text-red font-medium">Ship your log before midnight or lose your streak.</p>
            </div>
          </div>
        )}

        {isStreakDanger && (
          <div className="mb-6 rounded-xl border border-amber/30 bg-amber/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber" />
              <p className="text-sm text-amber font-medium">Ship your log soon. Streak expires at midnight.</p>
            </div>
          </div>
        )}

        {!activeBuild ? (
          <div className="text-center py-16">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border">
              <ShipIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">You have no active Build</h2>
            <p className="text-sm text-muted-foreground mb-8">Every great builder starts with one plank.</p>
            <Link href="/builds/new">
              <button className="inline-flex items-center gap-2 rounded-full bg-ship px-8 py-3 text-sm font-medium text-background hover:bg-ship/90 transition-all">
                <Plus className="h-4 w-4" /> Start a Build
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <Flame className={`h-4 w-4 ${streak > 0 ? "text-amber" : "text-muted-foreground"}`} />
                  <span className="text-foreground font-medium">{streak}</span>
                  <span className="text-muted-foreground">{streak === 1 ? "day" : "days"}</span>
                </div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Season ends in {seasonEnd}d</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-semibold text-foreground">{activeBuild.title}</h2>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{activeBuild.status}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-5">Day {streak + 1} · {activeBuild.category}</p>

              {yesterdaysLog && (
                <div className="mb-5">
                  <p className="text-xs text-muted-foreground mb-1.5">Yesterday</p>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-sm text-foreground/80">{yesterdaysLog.content}</p>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-1.5 block">Today&apos;s goal</label>
                <input
                  value={todaysGoal}
                  onChange={(e) => setTodaysGoal(e.target.value)}
                  placeholder="What will you build today?"
                  className="block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all"
                  disabled={loggedToday}
                />
                {todaysGoal.trim().length > 0 && todaysGoal.trim().length < 10 && (
                  <p className="mt-1 text-xs text-muted-foreground">Minimum 10 characters</p>
                )}
              </div>
              {logError && (
                <p className="text-xs text-red mb-3">{logError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleLogProgress}
                  disabled={loggedToday || saving || !todaysGoal.trim() || todaysGoal.trim().length < 10}
                  className="flex-1 rounded-lg bg-ship px-4 py-3 text-sm font-medium text-background hover:bg-ship/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {loggedToday ? "Logged today" : saving ? "Saving..." : "Log progress"}
                </button>
                <button
                  onClick={() => setShipConfirm(true)}
                  disabled={!canShip}
                  className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Ship It
                </button>
              </div>
              {!canShip && allLogs.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {3 - allLogs.length} more log{3 - allLogs.length !== 1 ? "s" : ""} before you can ship
                </p>
              )}
            </div>

            {pastBuilds.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Past builds ({pastBuilds.length})
                </h3>
                <div className="space-y-2">
                  {pastBuilds.slice(0, 3).map((build) => (
                    <Link
                      key={build.id}
                      href={`/builds/${build.id}`}
                      className="block rounded-lg border border-border bg-card p-3 hover:border-muted-foreground/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{build.title}</span>
                        <span className="text-xs text-ship">Shipped</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {build.category} · {build.shipped_at ? new Date(build.shipped_at).toLocaleDateString() : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {cohort.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {cohort.length} builder{cohort.length !== 1 ? "s" : ""} in your season
                </h3>
                <div className="space-y-2">
                  {cohort.map((c, i) => (
                    <Link
                      key={i}
                      href={`/profile/${c.id}`}
                      className="block rounded-lg border border-border bg-card px-4 py-3 hover:border-muted-foreground/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">—</span>
                        <span className="text-sm text-muted-foreground truncate">{c.build_title}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {shipConfirm && activeBuild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ship/20">
              <ShipIcon className="h-6 w-6 text-ship" />
            </div>
            <h2 className="text-lg font-semibold text-foreground text-center mb-2">Ship this build?</h2>
            <p className="text-sm text-muted-foreground text-center mb-5">
              Once shipped, this Build is frozen forever. Your reputation will increase. No edits, no going back.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Type <span className="text-foreground font-mono">{activeBuild.title}</span> to confirm:
            </p>
            <input
              value={shipInput}
              onChange={(e) => setShipInput(e.target.value)}
              placeholder={activeBuild.title}
              className="block w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShipConfirm(false); setShipInput("") }}
                className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleShip}
                disabled={shipInput !== activeBuild.title || shipping}
                className="flex-1 rounded-lg bg-ship px-4 py-3 text-sm font-medium text-background hover:bg-ship/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {shipping ? "Shipping..." : "Ship It"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShipAnimation && activeBuild && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ship/20 animate-pulse">
              <Check className="h-8 w-8 text-ship" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{activeBuild.title} has shipped.</h2>
            <p className="text-muted-foreground">This Build is now frozen forever. Your reputation has increased.</p>
          </div>
        </div>
      )}
    </div>
  )
}
