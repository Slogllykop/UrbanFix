# UrbanFix Codebase Context for Future Agents

Welcome to the UrbanFix project! This document serves as a comprehensive reference to guide future AI agents in understanding the architecture, features, data models, and specific implementation quirks of the application.

## 1. Project Overview
UrbanFix is a mobile-first web application designed to allow citizens to report urban issues (e.g., potholes, broken street lights, uncollected garbage) by snapping a picture with their smartphones. 
Once reported, the submissions are sent to a backend AI system for processing. Organizations (NGOs) and system Administrators can log in to view, verify, and resolve these issues via a dashboard.

## 2. Tech Stack & Infrastructure
* **Frontend Framework:** Next.js 16 (App Router)
* **Styling:** Tailwind CSS + Radix UI Primitives (via shadcn/ui components)
* **Backend / Database / Auth:** Supabase
* **Form Validation:** Zod
* **Linting / Formatting:** BiomeJS (`pnpm dist` / `pnpm lint` / `pnpm format`)
* **Package Manager:** `pnpm`

## 3. User Roles & Authentication
Authentication is managed via `src/providers/auth-provider.tsx` and Supabase Auth. The system supports three primary roles:

1. **Citizens (`user` / `citizen`):** 
   * Authenticated via standard email/social login.
   * Can create new reports using their phone camera (`/report`).
   * Can view their past reports (`/profile/reports`).
   * Can upvote/downvote issues on the feed.
2. **NGOs (`ngo`):**
   * Must have their email whitelisted in the `ngos` table by an Administrator to access NGO features.
   * View all active issues via the global dashboard.
   * Can update issue statuses (e.g., `pending` -> `addressed` -> `completed` -> `rejected`). 
   * **Important Rule:** If an issue is set to `addressed`, do NOT forcefully change it to `completed` unless definitively resolved by the org.
3. **Administrators (`admin`):**
   * Must have their email whitelisted in the `admin_emails` table.
   * Have access to the secure `/admin` panel.
   * Can add/remove Admin privileges or whitelist new NGO emails.

## 4. Key Data Flows & Workflows

### The Issue Submission Pipeline (`/report/actions.ts`)
When a user submits an issue using the mobile portal, a Server Action handles a complex set of sequential rules:
1. **Cooldown Check:** Queries `users.last_issue_at` to enforce a 2-hour cooldown period between issue submissions.
2. **Duplicate Detection:** Uses a Supabase Postgres RPC function `find_nearby_issues` (checks within a 50-meter radius & 24-hour window) to verify if the issue was already reported. If a duplicate is found, it increments the `users_reported` counter on the existing issue instead of creating a new one.
3. **Storage:** The image captured from the camera is securely uploaded to a public Supabase Storage bucket.
4. **Issue Creation:** A new record is created in the `issues` table and mapped to the user in `issue_reports`.
5. **AI Handoff POST:** The image's public URL, Issue ID, and Category are posted to an external Backend URL (`NEXT_PUBLIC_BACKEND_URL`). The external AI server processes the image metadata and ultimately validates & updates the issue status on its own end.

### User Dashboards & Live Data fetching
* UI components heavily rely on custom React Hooks (`src/hooks/use-issues.ts`) instead of raw Supabase queries in the view.
* Hooks like `useIssue` and `useUserVotes` subscribe to data fetching logic and populate interactive states like Upvote counts.

## 5. Environment Variables
Agents should ensure the following environment configurations remain intact when testing:
* `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Client-side key for auth and safe data fetching
* `SUPABASE_SECRET_KEY`: Administrative key used ONLY in secure Server Actions or Server-side Middleware to bypass RLS
* `NEXT_PUBLIC_BACKEND_URL`: The destination REST API endpoint where AI image processing handoffs occur

## 6. Known Codebase Quirks & Typescript Rules
To maintain a passing production build with `next build`, we have deployed several strict configurations:
* **Missing Generated Types:** Because some tables like `admin_emails`, `issue_reports`, and new attributes on `users`/`issues` were built manually via Supabase raw SQL migrations and the CLI has not generated localized types for them, standard strongly typed Supabase inserts/updates will fail during compilation with a `never` assignment error.
* **The Fix:** In files like `report/actions.ts`, `admin/page.tsx`, and `use-issues.ts`, payloads modifying unresolved types are deliberately cast utilizing `({ ...payload } as any)` or preceding method execution with `// @ts-ignore`. **Future agents must preserve these bypasses during DB mutations or explicitly regenerate the Supabase TypeScript types globally.**
* **Linting:** We strictly use `biome`. Avoid using standard ESLint fixes or plugins if they conflict with Biome formatting.
* **next.config.ts:** `serverActions` size limits have been updated and scoped tightly inside the `experimental` block to stay compliant with Next.js App router updates. Do not move `serverActions` to the root config object.

## 7. Adding New Features (Agent Checklist)
1. Write Server Actions inside `actions.ts` files for anything requiring backend mutation instead of API Routes. 
2. Protect elevated actions by asserting `useUserRole()` in hooks or via Server-Side auth checks.
3. Use the `pnpm build` command as the sole source of truth for production safety. `pnpm lint` and `pnpm format` must securely pass before any PR creation workflows (`/submit_pr`) are triggered.
