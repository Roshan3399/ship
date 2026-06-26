import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user } } = await admin.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: repos } = await admin
      .from("github_repos")
      .select("id")
      .eq("user_id", user.id)

    if (repos && repos.length > 0) {
      const repoIds = repos.map((r: any) => r.id)
      await admin.from("github_commits").delete().in("repo_id", repoIds)
    }

    await admin.from("github_repos").delete().eq("user_id", user.id)
    await admin.from("github_connections").delete().eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
