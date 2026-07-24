# Graph Report - .  (2026-07-25)

## Corpus Check
- Corpus is ~48,147 words - fits in a single context window. You may not need a graph.

## Summary
- 316 nodes · 593 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Authentication Forms & Schemas|Authentication Forms & Schemas]]
- [[_COMMUNITY_Button & UI Components|Button & UI Components]]
- [[_COMMUNITY_MFA & Account Settings|MFA & Account Settings]]
- [[_COMMUNITY_App Root & Layout|App Root & Layout]]
- [[_COMMUNITY_App Navigation & Layout|App Navigation & Layout]]
- [[_COMMUNITY_Motion & Animation Components|Motion & Animation Components]]
- [[_COMMUNITY_Component Aliases & Structure|Component Aliases & Structure]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Package Runtime Dependencies|Package Runtime Dependencies]]
- [[_COMMUNITY_Package Dev Dependencies|Package Dev Dependencies]]
- [[_COMMUNITY_Agent Settings & Back Button|Agent Settings & Back Button]]
- [[_COMMUNITY_Agent Page & Text Reveal|Agent Page & Text Reveal]]
- [[_COMMUNITY_Middleware & Session Handling|Middleware & Session Handling]]
- [[_COMMUNITY_ESLint Configuration|ESLint Configuration]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_PostCSS Configuration|PostCSS Configuration]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 50 edges
2. `createClient()` - 21 edges
3. `compilerOptions` - 16 edges
4. `Button` - 10 edges
5. `FieldGroup()` - 9 edges
6. `BackButton()` - 8 edges
7. `Field()` - 8 edges
8. `createClient()` - 8 edges
9. `checkRateLimit()` - 7 edges
10. `getRateLimitKey()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout()` --calls--> `cn()`  [INFERRED]
  app/layout.tsx → lib/utils.ts
- `DockSeparator()` --calls--> `cn()`  [EXTRACTED]
  components/motion/dock.tsx → lib/utils.ts
- `AccountPage()` --calls--> `useUser()`  [EXTRACTED]
  app/(app)/settings/account/page.tsx → components/user-provider.tsx
- `SettingsPage()` --calls--> `useUser()`  [EXTRACTED]
  app/(app)/settings/page.tsx → components/user-provider.tsx
- `logout()` --calls--> `createClient()`  [EXTRACTED]
  app/auth/actions.ts → lib/server.ts

## Import Cycles
- None detected.

## Communities (19 total, 3 thin omitted)

### Community 0 - "Authentication Forms & Schemas"
Cohesion: 0.13
Nodes (28): ForgotPasswordForm(), formSchema, formSchema, LoginForm(), formSchema, SignUpForm(), formSchema, UpdatePasswordForm() (+20 more)

### Community 1 - "Button & UI Components"
Cohesion: 0.08
Nodes (29): ButtonProps, ButtonSize, ButtonVariant, Ripple, SIZE_CLASS, VARIANT_CLASS, useHoverCapable(), EASE_DRAWER (+21 more)

### Community 2 - "MFA & Account Settings"
Cohesion: 0.13
Nodes (23): AuthMFAForm(), MFAEnrollModal(), MFARemoveModal(), createClient(), CENTER_UNFOLD_EASE, CENTER_UNFOLD_TRANSITION, CenterMorphModal(), CenterMorphModalClose() (+15 more)

### Community 3 - "App Root & Layout"
Cohesion: 0.14
Nodes (22): inter, metadata, RootLayout(), Page(), checkRateLimit(), forgotPassword(), getRateLimitKey(), getSiteUrl() (+14 more)

### Community 4 - "App Navigation & Layout"
Cohesion: 0.09
Nodes (21): AccountPage(), logout(), BottomNav(), LogoutButton(), AUTH_PASSTHROUGH_ROUTES, UserContext, UserContextType, UserProvider() (+13 more)

### Community 5 - "Motion & Animation Components"
Cohesion: 0.10
Nodes (22): ActionSwapAnimation, ActionSwapButton(), ActionSwapButtonProps, ActionSwapButtonSize, ActionSwapButtonVariant, ActionSwapIcon(), ActionSwapIconProps, ActionSwapItem (+14 more)

### Community 6 - "Component Aliases & Structure"
Cohesion: 0.09
Nodes (22): aliases, components, lib, ui, utils, iconLibrary, menuAccent, menuColor (+14 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Package Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @base-ui/react, border-beam, class-variance-authority, clsx, @hookform/resolvers, lucide-react, motion (+11 more)

### Community 9 - "Package Dev Dependencies"
Cohesion: 0.11
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 10 - "Agent Settings & Back Button"
Cohesion: 0.16
Nodes (5): verifyEmailOtp(), BackButton(), BackButtonProps, VerifyOTPForm(), VerifyOTPFormProps

### Community 11 - "Agent Page & Text Reveal"
Cohesion: 0.40
Nodes (3): motionMap, TextReveal(), TextRevealProps

### Community 12 - "Middleware & Session Handling"
Cohesion: 0.47
Nodes (4): AUTH_PASSTHROUGH_ROUTES, updateSession(), config, proxy()

## Knowledge Gaps
- **135 isolated node(s):** `rateLimitMap`, `VerifyOTPFormProps`, `inter`, `metadata`, `$schema` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Authentication Forms & Schemas` to `Button & UI Components`, `MFA & Account Settings`, `App Root & Layout`, `App Navigation & Layout`, `Motion & Animation Components`, `Agent Settings & Back Button`, `Agent Page & Text Reveal`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `createClient()` connect `App Root & Layout` to `Agent Settings & Back Button`, `App Navigation & Layout`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `BackButton()` connect `Agent Settings & Back Button` to `Authentication Forms & Schemas`, `MFA & Account Settings`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `rateLimitMap`, `VerifyOTPFormProps`, `inter` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication Forms & Schemas` be split into smaller, more focused modules?**
  _Cohesion score 0.12896405919661733 - nodes in this community are weakly interconnected._
- **Should `Button & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07954545454545454 - nodes in this community are weakly interconnected._
- **Should `MFA & Account Settings` be split into smaller, more focused modules?**
  _Cohesion score 0.13306451612903225 - nodes in this community are weakly interconnected._