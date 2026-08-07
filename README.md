# Cheq — Part-time Income Tracker

A mobile-first web application for part-time workers to log shifts, track income, parse natural language schedules with AI, and export PDF/CSV statements.

---

## Core Features

### 1. Shift Management and Smart Calendar
- Responsive calendar grid with shift indicators, daily earnings, and weekly salary summaries.
- Conflict detection and duplicate shift resolution workflows.
- Single-shift editing and multi-select bulk delete with confirmation dialogs.

### 2. AI Schedule Parser
- Natural language extraction from raw text, messages, or shift rosters.
- Sandboxed parsing via Groq LLaMA 3.3-70B with multi-day expansion, 24-hour time normalization, and wage rate propagation.
- Interactive review accordion to inspect, modify, and batch-approve extracted shifts.

### 3. Analytics and Statement Export
- Monthly and annual earnings, total hours worked, and effective hourly rate averages.
- Workplace breakdown showing earnings distribution across employers or venues.
- Formatted PDF statements (via `@react-pdf/renderer`) and CSV data export for tax and invoicing records.

### 4. Shift Templates
- Reusable shift profiles with preset workplace names, hours, rates, and break durations.
- Single and bulk template management.

### 5. Authentication and Security
- Supabase PKCE authentication with SSR cookies and session synchronization.
- Multi-Factor Authentication (MFA) via TOTP with AAL2 session verification.
- Row Level Security (RLS) on all Postgres tables, revoked anonymous privileges, and security headers (HSTS, CSP, X-Frame-Options).

---

## Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS with semantic tokens and dark mode support
- **Animation**: Framer Motion (`motion/react`) with spring transitions and tactile touch physics
- **Database & Auth**: Supabase (PostgreSQL 17, Row Level Security)
- **AI Engine**: Groq SDK (`llama-3.3-70b-versatile`) with Zod structured validation
- **PDF Generation**: `@react-pdf/renderer`
- **Icons**: Lucide React

---

## Project Structure

```
cheq/
├── app/
│   ├── (app)/                   # Protected application routes (Auth + MFA gate)
│   │   ├── home/                # Shift dashboard, calendar, and AI extraction actions
│   │   ├── analytics/           # Earnings metrics, workplace charts, and PDF export
│   │   └── settings/            # Account, Preferences (12h/24h, default rates), Templates
│   └── auth/                    # Public authentication routes (Login, Sign-up, MFA, OTP, Passwords)
├── components/
│   ├── motion/                  # Framer Motion primitives (CenterMorphModal, Dock, OTPInput, WheelPicker)
│   ├── ui/                      # Base UI components (Field, Calendar, Button, Chart, Input)
│   └── auth/                    # Authentication modals and form components
├── lib/
│   ├── schemas/                 # Zod validation schemas for shifts, templates, and preferences
│   ├── client.ts & server.ts    # Supabase browser and SSR client factories
│   ├── middleware.ts            # Session synchronization and route guard logic
│   └── time-utils.ts            # Duration math, 12h/24h conversion, and midnight crossing logic
└── proxy.ts                     # Next.js root middleware forwarder
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn
- Supabase project
- Groq API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/cheq.git
   cd cheq
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database and Security Architecture

- **Row Level Security (RLS)**: Strict user-scoping on `shifts`, `shift_templates`, and `user_preferences` (`auth.uid() = user_id`).
- **Anon Role Revocation**: The `anon` role has zero database privileges; all queries require an authenticated session.
- **Server Action Validation**: All mutations are validated server-side using Zod schemas with CSRF origin checks.
- **AI Sandboxing**: User-submitted roster text is isolated within untrusted XML boundaries and validated against strict Zod schemas before database insertion.
- **HTTP Security Headers**: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.

---

## Design System

- **Typography Scale**: Strict 5-tier system from 36px Hero metrics down to 12px Micro headers.
- **Touch Ergonomics**: Minimum tap targets of 40px to 44px with scale-down touch physics (`whileTap={{ scale: 0.85 }}`).
- **Theme Support**: Semantic OKLCH color tokens with true-black background in dark mode.
