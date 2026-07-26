# Cheq

A modern web application built with Next.js 16, React 19, and Supabase for authentication.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **React**: 19.2.4
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [@base-ui/react](https://base-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)
- **TypeScript**: 5.x

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── (app)/               # Main application routes (protected)
│   │   ├── agent/           # Agent-related pages
│   │   ├── earnings/        # Earnings dashboard
│   │   ├── home/            # Home dashboard
│   │   └── settings/        # User settings
│   ├── auth/                # Authentication routes
│   │   ├── login/           # Login page
│   │   ├── sign-up/         # Registration page
│   │   ├── forgot-password/ # Password recovery
│   │   ├── mfa/             # Multi-factor authentication
│   │   └── ...              # Other auth flows
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Root page (redirects to /home or /auth/login)
├── components/              # Reusable React components
│   ├── auth/                # Authentication-related components
│   ├── motion/              # Animation components
│   ├── ui/                  # Base UI components
│   ├── bottom-nav.tsx       # Bottom navigation component
│   ├── password-strength-input.tsx
│   ├── theme-provider.tsx   # Theme context provider
│   └── user-provider.tsx    # User context provider
├── lib/                     # Utility libraries
│   ├── client.ts            # Supabase client (browser)
│   ├── server.ts            # Supabase client (server)
│   ├── middleware.ts        # Next.js middleware for auth
│   ├── hooks/               # Custom React hooks
│   ├── ease.ts              # Animation easing functions
│   └── utils.ts             # General utilities
└── graphify-out/            # Graph visualization output
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm, yarn, pnpm, or bun
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cheq
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Features

- 🔐 **Authentication**: Full auth flow with Supabase including login, signup, password recovery, MFA, and OTP verification
- 🎨 **Theming**: Dark/light mode support with next-themes
- 📱 **Responsive Design**: Mobile-first design with bottom navigation
- ✨ **Animations**: Smooth animations powered by Motion
- 📝 **Form Validation**: Type-safe forms with React Hook Form and Zod
- 🛡️ **Protected Routes**: Middleware-based route protection

## Configuration

### Tailwind CSS

This project uses Tailwind CSS v4 with the new configuration format. See `postcss.config.mjs` and `globals.css` for configuration.

### Components.json

The project uses shadcn/ui components configured via `components.json`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com/docs)
- [Zod Documentation](https://zod.dev/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to configure your Supabase environment variables in the Vercel project settings.
