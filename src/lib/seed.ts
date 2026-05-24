import { prisma } from './prisma'

interface SeedOptions {
  /** User ID to seed assignments for */
  userId: string
}

interface SeedResult {
  coursesAdded: number
  assignmentsAdded: number
}

/**
 * Seed realistic fake assignments for development/demo purposes.
 *
 * - Creates 4 realistic high school courses (AP World, AP Psych, AP Physics, English IV)
 * - Generates assignments with due dates spread across next 30 days
 * - All flagged with isTestData: true so they can be wiped with one query
 *
 * Safe to run multiple times — checks for existing test data first.
 */
export async function seedTestData(options: SeedOptions): Promise<SeedResult> {
  const { userId } = options

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true },
  })

  if (!user) {
    throw new Error(`User not found: ${userId}`)
  }

  // Wipe any existing test data first (clean reseed)
  await prisma.assignment.deleteMany({
    where: {
      isTestData: true,
      course: { schoolId: user.schoolId },
    },
  })

  await prisma.course.deleteMany({
    where: {
      schoolId: user.schoolId,
      canvasCourseId: { startsWith: 'test_' },
    },
  })

  // Course templates with realistic data
  const courseTemplates = [
    {
      canvasCourseId: 'test_ap_world',
      name: 'AP World History',
      courseCode: 'APWORLD',
      currentGrade: 'A-',
      currentScore: 91.4,
      assignments: [
        { name: 'Unit 5 Test: Industrial Revolution', daysFromNow: 2, points: 100, description: 'Comprehensive test covering the Industrial Revolution from 1750-1900. Topics include the textile industry, factory systems, urbanization, working conditions, and the impact on global trade. Bring a #2 pencil.' },
        { name: 'CCOT Essay: Trade Routes', daysFromNow: 5, points: 50, description: 'Write a continuity and change over time essay analyzing the Silk Road and Indian Ocean trade networks from 1200-1450 CE.' },
        { name: 'Reading Quiz: Chapter 17', daysFromNow: 8, points: 20, description: 'Quiz covering chapter 17 of the textbook on industrialization in Asia.' },
        { name: 'DBQ Practice: Imperialism', daysFromNow: 12, points: 75, description: 'Document-based question essay on European imperialism in Africa. You will analyze 7 primary source documents.' },
        { name: 'Unit 6 Vocabulary Quiz', daysFromNow: 16, points: 25, description: 'Quiz on key terms from Unit 6: imperialism, colonialism, sphere of influence, and related concepts.' },
        { name: 'Group Presentation: Decolonization', daysFromNow: 22, points: 100, description: 'Group presentation on a chosen decolonization movement (1945-1990). Groups of 3-4 students.' },
      ],
    },
    {
      canvasCourseId: 'test_ap_psych',
      name: 'AP Psychology',
      courseCode: 'APPSYCH',
      currentGrade: 'B+',
      currentScore: 87.2,
      assignments: [
        { name: 'Unit 7 Test: Cognition', daysFromNow: 3, points: 100, description: 'Test covering memory, thinking, problem solving, language, and intelligence. Includes multiple choice and free response.' },
        { name: 'Reading: Chapter 8', daysFromNow: 6, points: 15, description: 'Read chapter 8 on motivation and emotion. Complete the reading guide.' },
        { name: 'FRQ Practice: Learning', daysFromNow: 9, points: 30, description: 'Free response question on classical and operant conditioning. Use specific examples.' },
        { name: 'Unit 8 Test: Motivation & Emotion', daysFromNow: 14, points: 100, description: 'Comprehensive test on motivation theories, emotional theories, stress, and health psychology.' },
        { name: 'Research Project Proposal', daysFromNow: 18, points: 50, description: 'Submit your proposal for the semester research project. Include hypothesis, methodology, and expected outcomes.' },
      ],
    },
    {
      canvasCourseId: 'test_ap_physics',
      name: 'AP Physics 1',
      courseCode: 'APPHYS1',
      currentGrade: 'A',
      currentScore: 94.6,
      assignments: [
        { name: 'Lab: Projectile Motion', daysFromNow: 1, points: 50, description: 'Lab report for the projectile motion experiment. Include data table, graphs, and error analysis.' },
        { name: 'Problem Set 12: Circular Motion', daysFromNow: 4, points: 40, description: 'Problem set covering uniform circular motion, centripetal force, and orbital mechanics.' },
        { name: 'Unit Test: Energy Conservation', daysFromNow: 7, points: 100, description: 'Test on work, kinetic energy, potential energy, and conservation of energy. Calculator allowed.' },
        { name: 'Problem Set 13: Momentum', daysFromNow: 11, points: 40, description: 'Linear momentum, impulse, and collision problems. Both elastic and inelastic.' },
        { name: 'Lab: Conservation of Momentum', daysFromNow: 15, points: 60, description: 'Lab report analyzing momentum conservation in two-cart collision experiments.' },
        { name: 'Final Exam Review Packet', daysFromNow: 25, points: 25, description: 'Complete the comprehensive review packet for the AP exam.' },
      ],
    },
    {
      canvasCourseId: 'test_english_iv',
      name: 'English IV',
      courseCode: 'ENG4',
      currentGrade: 'A-',
      currentScore: 89.8,
      assignments: [
        { name: 'Essay: The Great Gatsby Analysis', daysFromNow: 4, points: 100, description: '5-page literary analysis essay on The Great Gatsby. Choose a major theme and trace it through the novel using textual evidence.' },
        { name: 'Reading: Hamlet Act III', daysFromNow: 6, points: 10, description: 'Read Act III of Hamlet and complete the comprehension questions.' },
        { name: 'Vocabulary Quiz: Unit 9', daysFromNow: 9, points: 25, description: 'Quiz on Unit 9 vocabulary words. Be prepared to use them in context.' },
        { name: 'Hamlet Soliloquy Memorization', daysFromNow: 13, points: 30, description: 'Memorize and recite a Hamlet soliloquy of at least 20 lines. Recitations during class.' },
        { name: 'Research Paper: First Draft', daysFromNow: 20, points: 75, description: 'First draft of your research paper. Include thesis, outline, and at least 5 cited sources.' },
      ],
    },
  ]

  let coursesAdded = 0
  let assignmentsAdded = 0

  for (const template of courseTemplates) {
    const course = await prisma.course.create({
      data: {
        schoolId: user.schoolId,
        canvasCourseId: template.canvasCourseId,
        name: template.name,
        courseCode: template.courseCode,
        currentGrade: template.currentGrade,
        currentScore: template.currentScore,
        lastSyncedAt: new Date(),
      },
    })
    coursesAdded++

    for (const a of template.assignments) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + a.daysFromNow)
      dueDate.setHours(23, 59, 0, 0) // 11:59 PM

      await prisma.assignment.create({
        data: {
          courseId: course.id,
          canvasId: `test_${course.id}_${a.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: a.name,
          description: a.description,
          dueAt: dueDate,
          pointsPossible: a.points,
          submissionType: 'online_text_entry',
          isTestData: true,
        },
      })
      assignmentsAdded++
    }
  }

  return { coursesAdded, assignmentsAdded }
}

/**
 * Wipe all test data for a user's school.
 * Call this when school starts and real Canvas data takes over.
 */
export async function wipeTestData(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error(`User not found: ${userId}`)

  const deletedAssignments = await prisma.assignment.deleteMany({
    where: {
      isTestData: true,
      course: { schoolId: user.schoolId },
    },
  })

  await prisma.course.deleteMany({
    where: {
      schoolId: user.schoolId,
      canvasCourseId: { startsWith: 'test_' },
    },
  })

  return deletedAssignments.count
}