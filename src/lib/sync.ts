import { prisma } from './prisma'
import { encrypt } from './encryption'
import {
  getSelf,
  getCourses,
  getAssignments,
  getSections,
  type CanvasCourse,
} from './canvas'

interface SyncOptions {
  /** Canvas access token (will be encrypted before storage) */
  canvasToken: string
  /** Canvas base URL for this user's school */
  canvasBaseUrl: string
  /** Display name of the school */
  schoolName: string
}

interface SyncResult {
  userId: string
  coursesAdded: number
  sectionsAdded: number
  assignmentsAdded: number
  durationMs: number
}

/**
 * Full Canvas sync for a single user.
 *
 * - Creates/updates the User and School rows
 * - Fetches courses, sections, and assignments from Canvas
 * - Upserts everything into the database
 * - Stores the encrypted Canvas token on the user
 *
 * Safe to run repeatedly — uses upserts so it won't create duplicates.
 */
export async function syncUserFromCanvas(
  options: SyncOptions
): Promise<SyncResult> {
  const start = Date.now()
  const { canvasToken, canvasBaseUrl, schoolName } = options

  // 1. Get the user's profile from Canvas
  const me = await getSelf(canvasToken)
  const email = me.primary_email ?? me.email ?? `canvas-${me.id}@unknown.local`

  // 2. Upsert the school
  const school = await prisma.school.upsert({
    where: { canvasUrl: canvasBaseUrl },
    update: { name: schoolName },
    create: {
      name: schoolName,
      canvasUrl: canvasBaseUrl,
    },
  })

  // 3. Upsert the user, with the encrypted token
  const encryptedToken = encrypt(canvasToken)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: me.name,
      canvasUserId: String(me.id),
      encryptedRefreshToken: encryptedToken,
      lastSyncedAt: new Date(),
    },
    create: {
      email,
      name: me.name,
      schoolId: school.id,
      canvasUserId: String(me.id),
      encryptedRefreshToken: encryptedToken,
      lastSyncedAt: new Date(),
    },
  })

  // 4. Fetch courses
  const canvasCourses = await getCourses(canvasToken)
  let coursesAdded = 0
  let sectionsAdded = 0
  let assignmentsAdded = 0

  for (const cc of canvasCourses) {
    const course = await upsertCourse(cc, school.id)
    coursesAdded++

    // 5. Fetch sections + assignments for this course in parallel
    const [canvasSections, canvasAssignments] = await Promise.all([
      getSections(canvasToken, cc.id),
      getAssignments(canvasToken, cc.id),
    ])

    // 6. Sections
    for (const cs of canvasSections) {
      const existing = await prisma.section.findFirst({
        where: { canvasSectionId: String(cs.id), courseId: course.id },
      })
      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { name: cs.name },
        })
      } else {
        await prisma.section.create({
          data: {
            courseId: course.id,
            canvasSectionId: String(cs.id),
            name: cs.name,
          },
        })
      }
      sectionsAdded++
    }

    // 7. Assignments
    for (const ca of canvasAssignments) {
      const existing = await prisma.assignment.findFirst({
        where: { canvasId: String(ca.id), courseId: course.id },
      })
      const data = {
        name: ca.name,
        description: ca.description ?? null,
        dueAt: ca.due_at ? new Date(ca.due_at) : null,
        pointsPossible: ca.points_possible ?? null,
        submissionType: ca.submission_types?.[0] ?? null,
      }
      if (existing) {
        await prisma.assignment.update({
          where: { id: existing.id },
          data,
        })
      } else {
        await prisma.assignment.create({
          data: {
            courseId: course.id,
            canvasId: String(ca.id),
            ...data,
          },
        })
      }
      assignmentsAdded++
    }
  }

  return {
    userId: user.id,
    coursesAdded,
    sectionsAdded,
    assignmentsAdded,
    durationMs: Date.now() - start,
  }
}

// ===== Helpers =====

async function upsertCourse(cc: CanvasCourse, schoolId: string) {
  const enrollment = cc.enrollments?.[0]
  const existing = await prisma.course.findFirst({
    where: { canvasCourseId: String(cc.id), schoolId },
  })

  const data = {
    schoolId,
    canvasCourseId: String(cc.id),
    name: cc.name,
    courseCode: cc.course_code,
    currentGrade: enrollment?.computed_current_grade ?? null,
    currentScore: enrollment?.computed_current_score ?? null,
    lastSyncedAt: new Date(),
  }

  if (existing) {
    return prisma.course.update({ where: { id: existing.id }, data })
  }
  return prisma.course.create({ data })
}