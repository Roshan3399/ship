export interface Build {
  id: string
  user_id: string
  title: string
  description: string
  category: "code" | "design" | "writing" | "hardware" | "ai" | "other"
  status: "planning" | "building" | "testing" | "shipped"
  season_id: string
  created_at: string
  shipped_at: string | null
}

export interface Log {
  id: string
  build_id: string
  log_date: string
  content: string
  image_url: string | null
  created_at: string
}

export interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface Cohort {
  season_id: string
  user_id: string
}

export interface Endorsement {
  id: string
  build_id: string
  endorser_name: string
  comment: string
  created_at: string
}

export interface Profile {
  id: string
  email: string
  name: string
  username: string | null
  age: number
  bio: string | null
  avatar_url: string | null
  timezone: string
  email_digest: boolean
  created_at: string
}

export interface DailyLog {
  id: string
  build_id: string
  content: string
  image_url: string | null
  created_at: string
  date: string
}
