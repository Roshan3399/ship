import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { exchangeGitHubCode, getGitHubUser, getGitHubRepos } from "@/lib/github"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const errorParam = searchParams.get("error")

  if (errorParam || !code) {
    return NextResponse.redirect(new URL("/dashboard?github=error", request.url))
  }

  try {
    const token = await exchangeGitHubCode(code)
    const githubUser = await getGitHubUser(token.access_token)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=github_auth_required", request.url))
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: existing } = await admin
      .from("github_connections")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      await admin
        .from("github_connections")
        .update({
          github_id: githubUser.id,
          github_username: githubUser.login,
          access_token: token.access_token,
          token_expires_at: token.token_expires_at,
          is_active: true,
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
    } else {
      await admin.from("github_connections").insert({
        user_id: user.id,
        github_id: githubUser.id,
        github_username: githubUser.login,
        access_token: token.access_token,
        token_expires_at: token.token_expires_at,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      })
    }

    try {
      const repos = await getGitHubRepos(token.access_token)
      for (const r of repos) {
        await admin.from("github_repos").upsert(
          {
            user_id: user.id,
            github_repo_id: r.id,
            name: r.name,
            full_name: r.full_name,
            description: r.description,
            repo_created_at: r.created_at,
            repo_updated_at: r.updated_at,
            pushed_at: r.pushed_at,
            language: r.language,
            stargazers_count: r.stargazers_count,
            forks_count: r.forks_count,
            is_private: r.private,
          },
          { onConflict: "user_id, github_repo_id", ignoreDuplicates: false }
        )
      }
    } catch {
      // repo sync failure is non-fatal
    }

    return NextResponse.redirect(new URL("/dashboard?github=connected", request.url))
  } catch {
    return NextResponse.redirect(new URL("/dashboard?github=error", request.url))
  }
}
