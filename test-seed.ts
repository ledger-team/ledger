import 'dotenv/config'
import { seedTestData } from './src/lib/seed'

async function main() {
  const result = await seedTestData({
    userId: 'cmpix1ayn0002pu98c3npnk4b',
  })
  console.log(`✅ Seeded ${result.coursesAdded} courses and ${result.assignmentsAdded} assignments`)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})