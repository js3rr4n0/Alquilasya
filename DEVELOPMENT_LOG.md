# Development and Changes Log

## Log Entry: 2026-05-26 20:50:00 -06:00
### Action: Initial Waitlist Architecture Setup

**Details:**
1. **Environment Configuration**: 
   - Created `.env.local` to securely store Vercel Postgres/Neon connection strings.
   - Configured `src/lib/db.ts` to instantiate a serverless Postgres connection using `@neondatabase/serverless`.

2. **Dependency Management**:
   - Installed `@neondatabase/serverless` for optimized serverless edge connections.
   - Installed `react-hook-form`, `zod`, and `@hookform/resolvers` for robust, scalable client-side form validation.
   - Installed `sonner` and `lucide-react` for user feedback (toast notifications) and icons.

3. **Backend Implementation (`src/app/api/waitlist/route.ts`)**:
   - Implemented a standard RESTful POST endpoint.
   - Employed Zod for server-side payload validation ensuring data integrity.
   - Utilized parameterized SQL queries (Tagged Template Literals) provided by Neon to strictly prevent SQL Injection vulnerabilities.
   - Added specific PostgreSQL error handling (e.g., Code 23505 for unique constraint violations on the email column).

4. **Frontend Implementation (`src/components/WaitlistForm.tsx`)**:
   - Adopted a strictly typed React functional component structure.
   - Utilized `react-hook-form` for performant, uncontrolled form inputs.
   - Implemented an accessible and responsive user interface using Tailwind CSS.
   - Added loading states to prevent race conditions or double submissions.

**Security Considerations:**
- Full defense against SQL injection via parameterized queries.
- Double-layer validation (Client-side and Server-side) using identical Zod schemas to ensure no bypassed validation.
- Secure environment variable isolation.

**Architectural Patterns:**
- Separation of Concerns: Database instance singleton (`src/lib/db.ts`), API logic (`src/app/api/waitlist/route.ts`), and UI logic (`src/components/WaitlistForm.tsx`).

## Log Entry: 2026-05-26 20:53:00 -06:00
### Action: Landing Page Integration and DB Count Synchronization

**Details:**
1. **Dynamic Real-Time Waitlist Count**:
   - Transformed `src/app/page.tsx` into an async Server Component.
   - Connected `page.tsx` to Neon DB to query `SELECT COUNT(*) FROM waitlist`.
   - Implemented logic to set a base number of 1000 + the actual DB row count.
   - Passed the live count as a prop to the client side.

2. **Frontend UI Architecture**:
   - Created `src/components/LandingPage.tsx` using the user's custom layout aesthetic.
   - Split concerns between Server Component (data fetching) and Client Component (UI interactivity).
   - Embedded the previously built secure `WaitlistForm` into the new Landing Page.
   - Bubbled up the form success state (`onSuccess` prop) to trigger the parent UI swap and locally increment the counter immediately without requiring a page reload.

3. **Animations and Polishing**:
   - Integrated `framer-motion` for fluid, dynamic entrance animations across the hero section, text reveal, and feature cards.
   - Applied custom Google Fonts (`Playfair Display` and `DM Sans`) globally via `src/app/layout.tsx`.
   - Replaced generic styling with the custom color palette (CREAM, BLACK, ORANGE).

   - Initialized Git, connected the remote `js3rr4n0/Alquilasya.git`, committed "version 1", and pushed the code base.

## Log Entry: 2026-05-26 20:56:00 -06:00
### Action: Branding and Iconography Updates

**Details:**
1. **Logo Typography**:
   - Updated the `<Logo />` component in `src/components/LandingPage.tsx` to display "ALQUILASYA" entirely in uppercase for stronger brand presence.

2. **Dynamic Favicon (`icon.tsx`)**:
   - Leveraged Next.js 14 App Router's dynamic image generation (`next/og`) to programmatically create the Chrome browser tab icon (`src/app/icon.tsx`).
   - Configured the icon to display "A" in pure white and "Y" in the brand's Terracotta/Orange (`#D4541A`) over a deep black background (`#0A0A0A`) for maximum contrast and legibility at 32x32px.
   - Removed the default Next.js `favicon.ico` to prevent rendering conflicts and ensure edge-rendering of the new SVG-like dynamic icon.

## Log Entry: 2026-05-26 20:58:00 -06:00
### Action: Logo Redesign based on Visual Mockup

**Details:**
1. **Typography Correction**:
   - Reverted the all-caps logo to PascalCase ("AlquilasYa") to match the provided visual identity.
   - Applied tight kerning (`letterSpacing: "-0.06em"`) to emulate the connected logotype feel.

2. **Lockup Subtitle Addition**:
   - Integrated the "PORTAL DE ALQUILER · EL SALVADOR" subtitle directly into the `<Logo />` component.

## Log Entry: 2026-05-26 21:00:00 -06:00
### Action: Responsive Logo Scaling

**Details:**
1. **Responsive Size Adjustments**:
   - Upgraded the `<Logo />` component to use CSS `clamp()` for fluid typography scaling across devices.
   - The main logo text scales dynamically from `42px` on mobile up to `72px` on large screens (`clamp(42px, 6vw, 72px)`).
   - The subtitle scales proportionally from `10px` to `16px`, maintaining the lockup ratio on tablets and mobile without breaking layout constraints.
