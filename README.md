# Ledger

Your school life, managed and interconnected.

Ledger is a Canvas-synced study app for high school students. It connects to a student's Canvas account, pulls their real assignments and grades, generates AI study guides for upcoming work, and gives each class a community feed where students can discuss assignments with their actual classmates.

## Status

In active development. Targeting soft launch at one school in mid-August 2026.

## Tech Stack

- **Framework:** Next.js 16 with TypeScript and the App Router
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Auth:** Auth.js (NextAuth)
- **AI:** Anthropic Claude Haiku
- **Hosting:** Vercel
- **Validation:** Zod

## Architecture

- **Canvas OAuth** for authentication. Students connect their own Canvas account; refresh tokens are stored AES-256-GCM encrypted.
- **Schema** is Canvas-shaped: School, Course, Section, Enrollment, Assignment. Social and AI layers sit on top of the same data.
- **AI study guides** are generated from real Canvas assignment data and capped at one free generation per user per day.
- **Class feeds** are scoped to Canvas sections, so students see posts only from their actual classmates.

## Security

Ledger handles minors' educational data. Security is a foundation layer.

- All Canvas tokens AES-256-GCM encrypted at rest
- Supabase Row Level Security enabled on all tables
- All API input validated with Zod
- Authentication and authorization checked on every protected route
- Rate limiting enforced server-side on AI endpoints
- HTTPS only, with strict security headers

## Roadmap

- Layer 0: Canvas OAuth and database schema
- Layer 1: Canvas data sync (assignments, grades, courses)
- Layer 2: AI study guide generation
- Layer 3: Class community feeds
- Layer 4: Ledger Plus (paid AI tier)
- Layer 5: Nationwide AP communities

## Founder

Built by Sam Berry, a 16-year-old student at Dripping Springs High School in Texas.