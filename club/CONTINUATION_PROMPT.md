# LE CLUB DE GAMMARTH — CONTINUATION PROMPT (Part 2)

This is a continuation of a previous production-readiness audit on this repo
(https://github.com/fedimezz/club). That session already completed real,
verified work — do not redo it, and do not assume it's broken without
checking first:

ALREADY DONE (verify with `git log` / `git diff` before touching):
- Fixed booking overbook race condition (atomic SQL update in
  app/api/dashboard/schedule/book/route.ts)
- Made requireUser/requireAdmin/requireOwner/requireCoach (lib/auth.ts)
  re-check isActive + current role against the DB instead of trusting a
  possibly-stale JWT for up to 7 days — rolled out across ~54 files
- Rate-limited OTP verification (app/api/auth/verify/route.ts)
- Zod-validated 11 of the highest-risk routes (auth/register, admin/staff,
  admin/coaches, admin/members, admin/sessions, admin/schedule,
  admin/members/[id]/subscribe) via a shared lib/validation.ts
- Fixed a capacity=0 falsy-bug and a missing planning.manage permission
  check in session edit
- Excluded SVG uploads (stored-XSS vector) in app/api/upload/route.ts
- Migrated avatar upload to the Cloudinary pipeline
  (components/profile/ProfileAvatar.tsx)
- Fixed a live bug: dashboard "upcoming session" widget was always empty
  due to a French/English day-label mismatch (app/api/dashboard/route.ts)
- Added lib/__tests__/validation.test.ts (19 tests) and
  lib/__tests__/auth.test.ts (14 tests) — all 55 tests in the suite pass
  (`npx vitest run`)
- Added @@index to 9 Prisma models (Subscription, Payment, Session,
  UserSession, Attendance, Notification, Post, Like, Comment,
  MemberReport) on foreign-key/filter columns
- Added .env.example (built from grepping actual process.env usage)

IMPORTANT — RUN THIS FIRST, BEFORE ANYTHING ELSE:
```bash
npm install
npx prisma generate
npx prisma migrate dev   # applies the new @@index changes to your DB
npm run build
npx tsc --noEmit
npm run lint
npm test
```
None of the above could be run in the sandbox that did Part 1 (no network
access to Prisma's binary server). Fix anything that fails here before
continuing — this is a hard gate, not optional.

---

## YOUR TASKS FOR THIS SESSION

Work through these in order. For each, actually fix the problem — don't
just report it. After each major change, re-run `npm run build && npx tsc
--noEmit && npm test` and confirm nothing broke before moving to the next
task.

### 1. Finish Zod validation rollout (CRITICAL)
~59 of ~70 API routes still use ad-hoc manual validation instead of the
shared schemas in `lib/validation.ts`. Priority order:
- `app/api/admin/promotions/route.ts` + `[id]/route.ts` (discount codes —
  check for negative/absurd discount values)
- `app/api/admin/reports/route.ts`, `app/api/admin/member-reports/*`
- `app/api/admin/payments/route.ts`, `app/api/admin/subscriptions/route.ts`
- `app/api/admin/analytics/route.ts`, `app/api/admin/settings/route.ts`
- `app/api/dashboard/reports/route.ts`
- `app/api/posts/route.ts`, `app/api/posts/[id]/route.ts`,
  `app/api/posts/[id]/comments/route.ts`
Extend `lib/validation.ts` with new reusable schemas as needed rather than
writing one-off validation inline in each route.

### 2. Playwright E2E tests (CRITICAL — was flagged as top priority, never done)
Write real, running Playwright tests for:
- Auth: register → verify OTP → login → logout → protected route redirect
- Booking: book a class → see it in "my bookings" → cancel it → book again
- Booking race condition: fire 2+ concurrent booking requests at a session
  with exactly 1 spot left, assert only one succeeds and
  `currentBookings` never exceeds `capacity`
- Admin: login as ADMIN → create a session → edit it → verify capacity
  can be set to 0 → try setting capacity below current bookings, assert
  it's rejected
- Suspend flow: as OWNER, suspend a test MEMBER account; confirm that
  member's existing (still-logged-in) session gets 403'd on their next
  request — this directly tests the biggest fix from Part 1
- CMS: OWNER edits a public page → verify the change appears on the
  public-facing page

### 3. Image optimization
`components/profile/ProfileAvatar.tsx` line ~95 uses `<img>` (flagged by
ESLint's `no-img-element` rule). It falls back to a `data:` URL when
Cloudinary isn't configured, which `next/image` doesn't handle cleanly —
solve that properly (e.g. only use `next/image` for the `https://` case
and keep `<img>` for the data: URL fallback with a lint-disable comment
explaining why) rather than blindly swapping the tag.

### 4. `"use client"` / performance audit
Review `app/page.tsx`, `app/offres/*`, `app/coaching/*` and any other
public marketing pages. Identify unnecessary `"use client"` directives
that could be Server Components instead, and isolate genuinely
interactive pieces into small Client Components. Don't remove animations.

### 5. SEO audit
Check every page under `app/**/page.tsx` for a `metadata` export (title,
description, Open Graph). Add a sitemap.ts and robots.ts if missing.

### 6. Accessibility audit
Review interactive components (buttons, modals, forms, mobile nav,
dropdowns) for missing `aria-label`/`aria-expanded`/`aria-controls` and
keyboard navigation support. This genuinely needs the app running in a
browser to verify properly — don't just add ARIA attributes blindly.

### 7. Fix the 8 pre-existing lint warnings
Unused `admin` variable in: `app/api/admin/bookings/route.ts`,
`app/api/admin/notifications/route.ts`, `app/api/admin/payments/route.ts`,
`app/api/admin/schedule/route.ts`, `app/api/admin/subscriptions/route.ts`.
Either use the variable (e.g. for audit logging — check if that's the
intent) or prefix with `_admin` / remove it.

### 8. Logging/monitoring
The app currently just does `console.error(...)`. If a monitoring service
(Sentry, etc.) isn't already configured, don't add one yet unless asked —
just confirm error paths log enough context (route name, user id when
available, no secrets) to be useful once one is added.

---

## RULES (same as the original audit)
- Do NOT convert to multi-tenant SaaS
- Do NOT break existing functionality, routes, or the design system
- Do NOT fake payment success or weaken authorization to make tests pass
- Do NOT overengineer (no Kubernetes, no unnecessary Redis, no
  microservices)
- Actually run tests/build after each change — don't just claim success
- At the end, give an honest status report: what you completed, what you
  didn't, and which specific files still need work — the same way this
  prompt was written for you
