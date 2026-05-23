import { getDashboardData, groupAssignmentsByWeek } from '@/lib/queries'

// Temporary hardcoded user — will be replaced when auth is built
const DEV_USER_ID = 'cmpix1ayn0002pu98c3npnk4b'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { user, courses, upcomingAssignments } = await getDashboardData(DEV_USER_ID)
  const weeks = groupAssignmentsByWeek(upcomingAssignments)
  const sortedWeeks = Array.from(weeks.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  )

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 border-b border-zinc-800 pb-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Ledger</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {user.school.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400">{user.name}</p>
              <p className="text-xs text-zinc-600">
                Last synced{' '}
                {user.lastSyncedAt
                  ? new Date(user.lastSyncedAt).toLocaleString()
                  : 'never'}
              </p>
            </div>
          </div>
        </header>

        {/* Courses overview */}
        <section className="mb-12">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your Courses
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {course.courseCode}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-100">
                  {course.name}
                </p>
                <p className="mt-3 text-2xl font-bold text-zinc-100">
                  {course.currentGrade ??
                    (course.currentScore !== null
                      ? `${course.currentScore}%`
                      : '—')}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming assignments by week */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Upcoming Assignments
          </h2>

          {sortedWeeks.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">
              No upcoming assignments in the next 30 days.
            </div>
          ) : (
            <div className="space-y-8">
              {sortedWeeks.map(([weekStart, assignments]) => {
                const weekDate = new Date(weekStart)
                const weekLabel = weekDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                })

                return (
                  <div key={weekStart}>
                    <h3 className="mb-3 text-sm font-semibold text-zinc-400">
                      Week of {weekLabel}
                    </h3>
                    <div className="space-y-2">
                      {assignments.map((assignment) => {
                        const due = assignment.dueAt
                          ? new Date(assignment.dueAt)
                          : null
                        const dueLabel = due
                          ? due.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'No due date'
                        const timeLabel = due
                          ? due.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })
                          : ''

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-zinc-100">
                                {assignment.name}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {assignment.course.name}
                              </p>
                            </div>
                            <div className="ml-4 text-right">
                              <p className="text-sm text-zinc-300">
                                {dueLabel}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {timeLabel}
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

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-600">
            Ledger · {courses.length} courses · {upcomingAssignments.length}{' '}
            upcoming
          </p>
        </footer>
      </div>
    </main>
  )
}