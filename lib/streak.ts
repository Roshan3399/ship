export function calculateStreak(
  logs: { log_date?: string; created_at?: string }[]
): number {
  if (logs.length === 0) return 0

  const dates = [
    ...new Set(
      logs.map((l) => {
        if (l.log_date) return l.log_date
        return l.created_at?.split("T")[0] ?? ""
      })
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
