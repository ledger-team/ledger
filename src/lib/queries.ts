import { prisma } from './prisma'

/**
 * Fetch a complete dashboard view for a user:
 * - Their courses with current grades
 * - Their upcoming assignments (next 30 days), grouped by week
 */
export async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  // Get all courses for this school
  const courses = await prisma.course.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: 'asc' },
  })

  // Get upcoming assignments (next 30 days, due in the future)
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: courses.map((c) => c.id) },
      dueAt: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    include: { course: true },
    orderBy: { dueAt: 'asc' },
  })

  // Get all assignments (for the full list)
  const allAssignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: courses.map((c) => c.id) },
    },
    include: { course: true },
    orderBy: { dueAt: 'asc' },
  })

  return {
    user,
    courses,
    upcomingAssignments,
    allAssignments,
  }
}

/**
 * Group assignments by week for the weekly view.
 * Returns Map<weekStart ISO date, Assignment[]>
 */
export function groupAssignmentsByWeek<T extends { dueAt: Date | null }>(
  assignments: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const assignment of assignments) {
    if (!assignment.dueAt) continue

    // Get the Monday of the week this assignment is due
    const date = new Date(assignment.dueAt)
    const day = date.getDay() // 0 = Sunday, 1 = Monday, ...
    const diff = day === 0 ? -6 : 1 - day // Move to Monday
    const monday = new Date(date)
    monday.setDate(date.getDate() + diff)
    monday.setHours(0, 0, 0, 0)

    const key = monday.toISOString().split('T')[0]
    const existing = groups.get(key) ?? []
    existing.push(assignment)
    groups.set(key, existing)
  }

  return groups
}