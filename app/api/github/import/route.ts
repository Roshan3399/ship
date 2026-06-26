import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: { full_name?: string; name?: string; description?: string | null; language?: string | null }
    try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const fullName = body.full_name ?? body.name
    if (!fullName) return NextResponse.json({ error: "full_name is required" }, { status: 400 })

    const displayName = body.name ?? fullName.split("/").pop() ?? fullName
    const title = displayName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())

    const langMap: Record<string, string> = {
      typescript: "code", javascript: "code", python: "code",
      java: "code", rust: "code", go: "code", ruby: "code",
      c: "code", "c++": "code", "c#": "code", swift: "code",
      kotlin: "code", php: "code", html: "code", css: "code",
      scss: "code", sass: "code", less: "code",
      astro: "code",
      figma: "design", sketch: "design", svg: "design",
      markdown: "writing", tex: "writing",
      arduino: "hardware", verilog: "hardware",
    }
    const category = langMap[(body.language ?? "").toLowerCase()] ?? "code"

    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .maybeSingle()

    const { data: build, error } = await supabase
      .from("builds")
      .insert({
        user_id: user.id,
        title,
        description: body.description ?? `Imported from GitHub: ${fullName}`,
        category,
        status: "building",
        season_id: (season as unknown as { id: string })?.id ?? null,
      })
      .select("id, title")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ build })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
