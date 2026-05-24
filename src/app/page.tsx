import { getDashboardData } from '@/lib/queries'
import { ThemeToggle } from '@/components/theme-toggle'

const DEV_USER_ID = 'cmpix1ayn0002pu98c3npnk4b'

export const dynamic = 'force-dynamic'

function gradeColor(score: number | null): string {
  if (score === null) return 'text-zinc-400 dark:text-zinc-500'
  if (score >= 90) return 'text-lime-600 dark:text-lime-400'
  if (score >= 80) return 'text-zinc-900 dark:text-zinc-100'
  if (score >= 70) return 'text-amber-600 dark:text-amber-300'
  return 'text-rose-600 dark:text-rose-400'
}

function urgencyStyles(dueAt: Date | null) {
  if (!dueAt) return { border: '', accent: 'text-zinc-500', label: '' }
  const diffHours = (dueAt.getTime() - Date.now()) / (1000 * 60 * 60)
  if (diffHours < 24) {
    return {
      border: 'border-rose-400/50 dark:border-rose-500/40',
      accent: 'text-rose-600 dark:text-rose-400',
      label: 'DUE SOON',
    }
  }
  if (diffHours < 72) {
    return {
      border: 'border-amber-400/50 dark:border-amber-500/40',
      accent: 'text-amber-600 dark:text-amber-400',
      label: 'THIS WEEK',
    }
  }
  return { border: '', accent: 'text-zinc-500', label: '' }
}

function relativeDate(date: Date): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === now.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7 && diffDays > 0) {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function DashboardPage() {
  const { user, courses, upcomingAssignments } = await getDashboardData(DEV_USER_ID)

  const byDay = new Map<string, typeof upcomingAssignments>()
  for (const a of upcomingAssignments) {
    if (!a.dueAt) continue
    const key = a.dueAt.toDateString()
    const existing = byDay.get(key) ?? []
    existing.push(a)
    byDay.set(key, existing)
  }
  const sortedDays = Array.from(byDay.entries()).sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
  )

  const firstName = user.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-300 dark:bg-[#0B0B0E] dark:text-[#F2F2F0]">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-xl transition-colors dark:border-zinc-900 dark:bg-[#0B0B0E]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#B5FF3D]">
              <span className="text-base font-black text-black">L</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Ledger</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <p className="font-medium text-zinc-700 dark:text-zinc-300">{user.name}</p>
              <p className="text-zinc-400 dark:text-zinc-600">{user.school.name}</p>
            </div>
            <ThemeToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {firstName[0]}
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-lime-600 dark:text-[#B5FF3D]">
            {greeting}
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            {firstName}, you have{' '}
            <span className="text-lime-600 dark:text-[#B5FF3D]">
              {upcomingAssignments.length}
            </span>{' '}
            upcoming
          </h1>
        </header>

        <section className="mb-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Classes
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              {courses.length} active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-900 dark:bg-[#171719] dark:hover:border-zinc-700 dark:hover:shadow-none"
              >
                <p className="truncate text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {course.courseCode}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {course.name}
                </p>
                <div className="mt-6 flex items-baseline justify-between">
                  <p className={`text-3xl font-bold tracking-tight ${gradeColor(course.currentScore)}`}>
                    {course.currentGrade ??
                      (course.currentScore !== null ? `${Math.round(course.currentScore)}` : '—')}
                  </p>
                  {course.currentScore !== null && course.currentGrade !== null && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                      {Math.round(course.currentScore)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              What&apos;s Coming Up
            </h2>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">next 30 days</span>
          </div>

          {sortedDays.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-900 dark:bg-[#171719]">
              <p className="text-zinc-500">You&apos;re clear for the next 30 days.</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-700">Time to relax.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDays.map(([dayKey, dayAssignments]) => {
                const date = new Date(dayKey)
                return (
                  <div key={dayKey}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {relativeDate(date)}
                      </h3>
                      <p className="text-xs text-zinc-400 dark:text-zinc-600">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {dayAssignments.map((a) => {
                        const u = urgencyStyles(a.dueAt)
                        const time = a.dueAt?.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                        return (
                          <div
                            key={a.id}
                            className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-all hover:border-zinc-300 dark:bg-[#171719] dark:hover:border-zinc-700 ${u.border || 'border-zinc-200 dark:border-zinc-900'}`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                  {a.name}
                                </p>
                                {u.label && (
                                  <span
                                    className={`shrink-0 rounded-full border border-current px-1.5 py-0.5 text-[10px] font-semibold tracking-wider ${u.accent}`}
                                  >
                                    {u.label}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-zinc-500">
                                {a.course.name}
                                {a.pointsPossible ? ` · ${a.pointsPossible} pts` : ''}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {time}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <footer className="mt-16 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-400 dark:border-zinc-900 dark:text-zinc-600">
          <p>
            Last synced{' '}
            {user.lastSyncedAt
              ? new Date(user.lastSyncedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'never'}
          </p>
          <p>Ledger</p>
        </footer>
      </div>
    </main>
  )
}