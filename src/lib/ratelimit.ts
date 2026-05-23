import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// One AI study guide per user per 24 hours
export const studyGuideLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, '24 h'),
  prefix: 'ratelimit:study-guide',
})

// General API protection — 60 requests per minute per user
export const apiLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:api',
})

// Canvas sync — once every 30 minutes per user (prevents hammering Canvas)
export const canvasSyncLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, '30 m'),
  prefix: 'ratelimit:canvas-sync',
})

export { redis }