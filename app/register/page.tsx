"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(64),
  username: z.string().min(3, "Username must be at least 3 characters").max(32).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.coerce.number().int().min(13, "Must be 13-19 years old").max(19, "Must be 13-19 years old"),
})

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [age, setAge] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [checkEmail, setCheckEmail] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const result = registerSchema.safeParse({ name, username, email, password, age })
    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        if (!errors[field]) errors[field] = issue.message
      })
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        name,
        username: username.toLowerCase(),
        age: parseInt(age),
      })

      if (profileError) {
        if (profileError.message.includes("username")) {
          setFieldErrors({ username: "Username is already taken" })
        } else {
          setError(profileError.message)
        }
        setLoading(false)
        return
      }
    }

    setCheckEmail(true)
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) {
      setError(authError.message)
      setGoogleLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ship/20">
            <span className="text-2xl text-ship font-bold">✓</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-2">
            We sent a confirmation link to <span className="text-foreground">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            Click the link in the email to activate your account, then log in.
          </p>
          <Link href="/login">
            <button className="inline-flex items-center gap-2 rounded-xl bg-ship px-6 py-3 text-sm font-medium text-background hover:bg-ship/90 transition-all">
              Go to login
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
            Ship
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-8 mb-1">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start building your reputation.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground/80 mb-1.5">Name</label>
            <input id="name" type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground/80 mb-1.5">Username</label>
            <input id="username" type="text" placeholder="e.g. builder99" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} autoComplete="off" required className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
            {fieldErrors.username && <p className="mt-1 text-xs text-red-400">{fieldErrors.username}</p>}
            {username && username.length > 0 && username.length < 3 && <p className="mt-1 text-xs text-muted-foreground">Minimum 3 characters</p>}
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-foreground/80 mb-1.5">Age</label>
            <input id="age" type="number" min={13} max={19} placeholder="13-19" value={age} onChange={(e) => setAge(e.target.value)} required className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
            {fieldErrors.age && <p className="mt-1 text-xs text-red-400">{fieldErrors.age}</p>}
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-foreground/80 mb-1.5">Email</label>
            <input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-foreground/80 mb-1.5">Password</label>
            <input id="reg-password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={6} className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ship transition-all" />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-xl bg-ship px-4 py-3 text-sm font-medium text-background hover:bg-ship/90 disabled:opacity-50 transition-all">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By creating an account, you agree to being a builder.
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-all">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Already have an account? <span className="text-foreground underline underline-offset-2">Log in</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
