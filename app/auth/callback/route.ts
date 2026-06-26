import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle()

      if (!profile) {
        const name =
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          data.user.email?.split("@")[0] ??
          "Builder"
        const avatar = data.user.user_metadata?.avatar_url ?? data.user.user_metadata?.picture ?? null

        const baseUsername = name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9_]/g, "")
          .slice(0, 32) || `user${data.user.id.slice(0, 8)}`

        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        let username = baseUsername
        let attempts = 0
        while (attempts < 10) {
          const { data: existing } = await admin
            .from("profiles")
            .select("id")
            .eq("username", username)
            .maybeSingle()
          if (!existing) break
          attempts++
          username = `${baseUsername}${attempts}`
        }

        await admin.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          name,
          username,
          avatar_url: avatar,
          age: 15,
        })
      }

      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
