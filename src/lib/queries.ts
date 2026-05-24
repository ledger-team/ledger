import { prisma } from './prisma'

/**
 * Fetch the dashboard data for a user:
 * - Their school
 * - Courses (filtered properly — see TODO below)
 * - Upcoming assignments (next 30 days)
 */
export async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  // TODO: when we have auth, filter courses by the user's enrollments,
  // not just their school. Right now every user at a school sees every
  // course at that school — fine for dev, broken for production.
  const courses = await prisma.course.findMany({
    where: { schoolId: user.schoolId },
    orderBy: { name: 'asc' },
  })

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

  return {
    user,
    courses,
    upcomingAssignments,
  }
}