# Club

Membership management web app for a gym/club (bookings, membership plans,
payments, staff/admin panel, member reports). Built with Next.js (App
Router), Prisma/Postgres, and custom JWT-based auth.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Prisma
- **Auth**: custom JWT (httpOnly cookie), not NextAuth/Auth.js
- **UI**: Tailwind CSS, Radix UI primitives
- **Payments**: Konnect Network (Tunisian payment gateway)
- **Email**: SMTP via Nodemailer (falls back to console logging in dev)

## Getting started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then fill in `.env` — see `.env.example` for what each variable is for
   and which ones are required vs. optional. At minimum you need
   `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` to run the app at all.

3. **Set up the database**

   This project applies schema changes with `prisma db push` — there is no
   `prisma/migrations` history. For local development:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   Before deploying to a real production database, consider switching to
   tracked migrations (`npx prisma migrate dev` locally, `npx prisma migrate
   deploy` in CI/prod) instead of `db push`, so schema changes have a
   reviewable history and a rollback path.

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the unit test suite (Vitest) |

## Tests

`npm test` runs the unit test suite under `lib/__tests__/`. These currently
cover the pure, DB-independent logic: the rate limiter, OTP/token
generation and hashing, and the permission catalog. They intentionally
don't require a live database (the one test file that imports a
DB-touching module mocks the Prisma client out).

There is no integration/e2e test suite yet — most of the app's behavior
(auth flows, booking, payments, admin actions) is only exercised by manual
testing today. If you're extending this, consider adding integration tests
around the API routes (e.g. with a real test database) before it grows
much further.

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main`:
- `lint-and-test`: ESLint + `npm test`
- `build`: spins up an ephemeral Postgres service, runs `prisma db push`
  against it, then does a full `next build`. This exists specifically so a
  schema/route mismatch (e.g. an API route referencing a Prisma model that
  was never added to `schema.prisma`) fails CI instead of shipping broken.

## Known limitations / things to know before relying on this in production

- **Rate limiting is in-memory**, not shared across instances. Fine for a
  single-instance deploy; if you deploy to multiple instances (e.g.
  serverless with concurrency), the effective limit multiplies per
  instance. See the comment in `lib/rate-limit.ts` for the swap-in
  replacement (`@upstash/ratelimit`) if you need a hard global cap.
- **No tracked Prisma migrations** — see step 3 above.
- **`lib/sms.ts` and `lib/config.ts` are empty stub files.** If any feature
  is expected to send SMS notifications, that part is unimplemented.
- User-uploaded files are written to `public/uploads/` on local disk
  (`app/api/upload/route.ts`). This doesn't persist reliably on most
  serverless hosts (Vercel, etc.) and isn't backed up — move this to real
  object storage (S3, Cloudflare R2, Supabase Storage) before relying on
  uploads in production.
- The daily session-reminder cron (`app/api/cron/session-reminders`) is
  wired up via `vercel.json` for Vercel Cron. If you deploy elsewhere,
  you'll need to trigger that endpoint yourself on a schedule (with the
  `CRON_SECRET` bearer token).
