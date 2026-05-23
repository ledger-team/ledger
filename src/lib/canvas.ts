const CANVAS_BASE_URL = process.env.CANVAS_BASE_URL!

if (!CANVAS_BASE_URL) {
  throw new Error('CANVAS_BASE_URL must be set in environment')
}

export class CanvasError extends Error {
  constructor(
    public status: number,
    message: string,
    public url: string
  ) {
    super(message)
    this.name = 'CanvasError'
  }
}

interface CanvasFetchOptions {
  token: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | string[]>
}

/**
 * Low-level Canvas API fetch. Handles auth headers, query params, errors.
 * Returns parsed JSON and the raw response (for pagination Link headers).
 */
async function canvasFetch<T>(
  path: string,
  options: CanvasFetchOptions
): Promise<{ data: T; response: Response }> {
  const { token, method = 'GET', body, query } = options

  // Build URL with query params
  const url = new URL(path, CANVAS_BASE_URL)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        // Canvas uses key[]=val&key[]=val2 for arrays
        for (const v of value) {
          url.searchParams.append(`${key}[]`, String(v))
        }
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown error')
    throw new CanvasError(
      response.status,
      `Canvas API ${response.status}: ${text.slice(0, 200)}`,
      url.toString()
    )
  }

  const data = (await response.json()) as T
  return { data, response }
}

/**
 * Fetch all pages of a paginated Canvas endpoint.
 * Canvas paginates using Link headers (RFC 5988).
 */
async function canvasFetchAll<T>(
  path: string,
  options: CanvasFetchOptions
): Promise<T[]> {
  const results: T[] = []
  let nextUrl: string | null = null
  let isFirst = true

  while (isFirst || nextUrl) {
    let data: T[]
    let response: Response

    if (isFirst) {
      const result = await canvasFetch<T[]>(path, {
        ...options,
        query: { ...options.query, per_page: 100 },
      })
      data = result.data
      response = result.response
      isFirst = false
    } else {
      // Use the raw next URL from the Link header
      const res = await fetch(nextUrl!, {
        headers: {
          Authorization: `Bearer ${options.token}`,
          Accept: 'application/json',
        },
      })
      if (!res.ok) {
        throw new CanvasError(res.status, `Pagination failed`, nextUrl!)
      }
      data = (await res.json()) as T[]
      response = res
    }

    results.push(...data)

    // Parse Link header for next page
    const linkHeader = response.headers.get('Link')
    nextUrl = parseNextLink(linkHeader)
  }

  return results
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  // Link header format: <url>; rel="next", <url>; rel="last", ...
  const links = linkHeader.split(',')
  for (const link of links) {
    const match = link.match(/<([^>]+)>;\s*rel="next"/)
    if (match) return match[1]
  }
  return null
}

// ===== Canvas types (just what we need) =====

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  workflow_state: string
  start_at: string | null
  end_at: string | null
  enrollments?: Array<{
    type: string
    role: string
    computed_current_score: number | null
    computed_final_score: number | null
    computed_current_grade: string | null
    computed_final_grade: string | null
  }>
}

export interface CanvasAssignment {
  id: number
  name: string
  description: string | null
  due_at: string | null
  points_possible: number | null
  submission_types: string[]
  course_id: number
  html_url: string
}

export interface CanvasSection {
  id: number
  name: string
  course_id: number
  start_at: string | null
  end_at: string | null
}

// ===== High-level Canvas functions =====

/**
 * Fetch all active courses for the authenticated user, including grades.
 */
export async function getCourses(token: string): Promise<CanvasCourse[]> {
  return canvasFetchAll<CanvasCourse>('/api/v1/courses', {
    token,
    query: {
    enrollment_state: 'active',
    include: ['total_scores'],
    },
  })
}

/**
 * Fetch all assignments for a specific course.
 */
export async function getAssignments(
  token: string,
  courseId: number
): Promise<CanvasAssignment[]> {
  return canvasFetchAll<CanvasAssignment>(
    `/api/v1/courses/${courseId}/assignments`,
    {
      token,
      query: {
        order_by: 'due_at',
      },
    }
  )
}

/**
 * Fetch all sections for a specific course.
 */
export async function getSections(
  token: string,
  courseId: number
): Promise<CanvasSection[]> {
  return canvasFetchAll<CanvasSection>(
    `/api/v1/courses/${courseId}/sections`,
    { token }
  )
}

/**
 * Fetch the authenticated user's profile (id, name, email).
 */
export async function getSelf(token: string): Promise<{
  id: number
  name: string
  email: string | null
  primary_email: string | null
}> {
  const { data } = await canvasFetch<{
    id: number
    name: string
    email: string | null
    primary_email: string | null
  }>('/api/v1/users/self', { token })
  return data
}