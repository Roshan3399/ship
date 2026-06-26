"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import type { Profile } from "@/types"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [emailDigest, setEmailDigest] = useState(true)
  const [timezone, setTimezone] = useState("UTC")

  const [password, setPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (p) {
        const prof = p as unknown as Profile
        setProfile(prof)
        setName(prof.name)
        setUsername(prof.username ?? "")
        setBio(prof.bio ?? "")
        setEmailDigest(prof.email_digest)
        setTimezone(prof.timezone)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const updates: Record<string, unknown> = { name, bio, email_digest: emailDigest, timezone }
    if (username !== profile?.username) {
      updates.username = username.toLowerCase()
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile?.id)

    if (updateError) {
      if (updateError.message.includes("username")) {
        setError("Username is already taken")
      } else {
        setError(updateError.message)
      }
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setPasswordError(error.message)
      setChangingPassword(false)
      return
    }

    setPasswordSuccess(true)
    setPassword("")
    setChangingPassword(false)
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account? This cannot be undone. All your builds and logs will be permanently deleted."
    )
    if (!confirmed) return

    const { error } = await supabase.rpc("delete_user")
    if (error) {
      setError(error.message)
      return
    }

    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ship border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-10 pb-24">
        <h1 className="text-xl font-semibold text-foreground mb-8">Settings</h1>

        <form onSubmit={handleSave} className="space-y-5 mb-10">
          <h2 className="text-sm font-medium text-muted-foreground">Profile</h2>

          <div>
            <label htmlFor="settings-name" className="block text-sm font-medium text-foreground/80 mb-1.5">Name</label>
            <input id="settings-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
          </div>
          <div>
            <label htmlFor="settings-username" className="block text-sm font-medium text-foreground/80 mb-1.5">Username</label>
            <input id="settings-username" type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
          </div>
          <div>
            <label htmlFor="settings-bio" className="block text-sm font-medium text-foreground/80 mb-1.5">Bio</label>
            <textarea id="settings-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship resize-none transition-all" />
          </div>

          <h2 className="text-sm font-medium text-muted-foreground pt-4">Preferences</h2>

          <div className="flex items-center justify-between">
            <label htmlFor="email-digest" className="text-sm text-foreground/80">Daily email digest</label>
            <input id="email-digest" type="checkbox" checked={emailDigest} onChange={(e) => setEmailDigest(e.target.checked)} className="rounded border-border bg-card text-ship focus:ring-ship" />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-foreground/80 mb-1.5">Timezone</label>
            <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all">
              {Intl.supportedValuesOf?.("timeZone")?.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              )) ?? <option value="UTC">UTC</option>}
            </select>
          </div>

          {error && <p className="text-sm text-red">{error}</p>}
          {success && <p className="text-sm text-ship">Profile updated.</p>}

          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ship px-4 py-3 text-sm font-medium text-background hover:bg-ship/90 disabled:opacity-50 transition-all">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        <form onSubmit={handleChangePassword} className="space-y-5 mb-10">
          <h2 className="text-sm font-medium text-muted-foreground">Change password</h2>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground/80 mb-1.5">New password</label>
            <input id="new-password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
          </div>
          {passwordError && <p className="text-sm text-red">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-ship">Password changed.</p>}
          <button type="submit" disabled={changingPassword || password.length < 6} className="inline-flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-all">
            {changingPassword ? "Changing..." : "Change password"}
          </button>
        </form>

        <div className="pt-6 border-t border-border">
          <h2 className="text-sm font-medium text-red mb-4">Danger zone</h2>
          <button
            onClick={handleDeleteAccount}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red/30 px-4 py-3 text-sm font-medium text-red hover:bg-red/10 transition-all"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        </div>
      </main>
    </div>
  )
}
