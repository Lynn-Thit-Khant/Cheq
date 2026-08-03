# Cheq UI & Design System Guidelines

This document is the authoritative design system specification for the **Cheq** web application. All UI components, layouts, typography, animations, touch targets, and color schemes created or modified in this repository MUST strictly follow these rules.

---

## 1. Typography Scale System

Enforce a strict 5-tier typography scale across all screens and components. Do not invent arbitrary text sizes outside this scale.

| Tier | Role | Tailwind Classes | Exact Size | Example Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Hero** | Big Dashboard Metrics | `text-4xl font-bold tabular-nums` | `36px` | Monthly total earned (*$362.50*), avatar initials |
| **H1** | Main Page Headers | `text-2xl font-bold` | `24px` | Subpage title headers (*Templates*, *Defaults*, Profile Name) |
| **H2** | Modal Titles | `text-base font-semibold leading-normal` | `16px` | Morph modal titles (*Ginger Lily*, *Add Shift*, *Smart Add*, *Template Name*). Always use `leading-normal` to prevent font descender clipping. |
| **Primary** | Primary Row Titles & Action Buttons | `text-sm font-medium` / `font-semibold` | `14px` | Shift titles (*Ginger Lily*), modal option row labels (*Smart Add*, *Templates*), settings row labels (*Account*), primary action buttons (*Add*, *Save*), list income values (*$78.00*). |
| **Secondary** | Form Inputs, Subtitles & Modal Details | `text-sm` (14px) / `text-[13px]` (13px) | `14px / 13px` | **Modal detail key-value list rows** (*Location*, *Time*, *Rate*), form input text, settings subtitles (*Coming soon*), date subtitles (*Aug 10, 2026*). |
| **Micro** | Section Overlines & Badges | `text-[11px] font-medium uppercase tracking-wider` | `11px` | Weekly section group headers (*AUG 10 – 16*). Date badge weekday label uses `text-[10px] font-bold`. |

---

## 2. Touch Target & Sizing Standards

To guarantee effortless mobile usability (Apple HIG & WCAG 2.1 AAA compliance):
- **Minimum Tap Target**: Interactive buttons, month arrows, and calendar cells MUST have a minimum tap target size of **`40px × 40px` (`size-10`)** to **`44px × 44px` (`size-11`)**.
- **Icon Sizing within Buttons**:
  - `size-10` / `size-11` buttons: Use `size-5` icons (e.g. `<ChevronLeft className="size-5 stroke-[2.25]" />`).
  - Standard form triggers (`h-12`): Use `size-4` icons.

---

## 3. Card with Rows Architecture (Squishy Glass)

When creating list containers or grouped settings/options:

- **Outer Container**: Wrap the entire group in `<div className="flex flex-col w-full relative">`.
- **Absolute Background Layer**: Include an inner background element:
  ```tsx
  <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[28px] border border-border/40 pointer-events-none shadow-sm" />
  ```
- **Inner Content Wrapper**: Wrap rows inside `<div className="flex flex-col p-1">`.
- **Interactive Row Class**:
  ```tsx
  className="flex h-14 w-full items-center justify-between px-6 group transition-colors hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 rounded-full cursor-pointer relative z-10"
  ```

---

## 4. Modals & Center Morph Modal Standards

Modal overlays use `CenterMorphModal` from `@/components/motion/center-morph-modal`:

- **Container**: `<CenterMorphModalContent className="w-full max-w-sm bg-card p-6 border-border/50">` (The 'X' close button is automatically rendered).
- **Layout**: Wrap inner modal contents in `<div className="flex flex-col gap-6">`.
- **Header**:
  ```tsx
  <div className="flex flex-col gap-2 text-center">
    <h2 className="text-base font-semibold leading-normal text-foreground truncate">{title}</h2>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
  ```
- **Detail View Key-Value Lists**:
  - Use `text-sm` (14px) for both key labels and values.
  - Use `py-2.5` vertical padding per row (with `border-b border-border/40`).
  - Set estimated income highlight value to `text-[15px] font-semibold`.
- **Footer**: Place action buttons in `<div className="mt-2 flex justify-end gap-3">`. Wrap cancel buttons in `<CenterMorphModalClose>`.
- **Dismissibility Rule**:
  - `dismissible={false}`: Set on form, edit, input, and confirmation modals to protect user data from accidental background tap dismissal.
  - `dismissible={true}`: Set on read-only view details cards and date pickers for fluid backdrop tap dismissal.

---

## 5. Forms, Inputs & Selector Triggers

- **Form State**: Always use `react-hook-form` with `@hookform/resolvers/zod`.
- **Field Wrappers**: Import from `@/components/ui/field`:
  - Wrap entire form in `<FieldGroup>`.
  - Wrap individual inputs in `<Field data-invalid={fieldState.invalid}>`.
  - Use `<FieldLabel>`, `<FieldError>`, and `<FieldDescription>`.
- **Text Inputs**: Use `rounded-full h-12 px-5 text-sm bg-card border border-border`.
- **Date & Time Selector Triggers**:
  ```tsx
  <button
    type="button"
    onClick={openModal}
    className="flex h-12 w-full items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring outline-none"
  >
    <Clock className="size-4 text-muted-foreground shrink-0" />
    <span className="whitespace-nowrap text-sm font-medium">{displayTime}</span>
    <ChevronDown className="ml-auto size-4 text-muted-foreground/50 shrink-0" />
  </button>
  ```
  *Note*: Always include `whitespace-nowrap text-sm font-medium` on the inner `<span>` so 12h time strings (`8:00 AM`, `3:00 PM`) never wrap onto multiple lines.

---

## 6. Buttons & Motion Tap Physics

- **Standard Buttons**: Use `<Button>` from `@/components/motion/button/base` (`h-12 rounded-full px-5 text-[15px] font-medium`).
- **Custom Glass Buttons**:
  ```tsx
  <motion.button
    type="button"
    whileTap={{ scale: 0.85, opacity: 0.7 }}
    className="inline-flex items-center justify-center h-12 px-5 rounded-full border border-border bg-card/80 backdrop-blur-xl text-[15px] font-medium text-foreground hover:bg-card/90 transition-colors shadow-sm cursor-pointer"
  >
    Add
  </motion.button>
  ```
- **Icon / Arrow Buttons**:
  ```tsx
  <motion.button
    type="button"
    whileTap={{ scale: 0.85 }}
    className="inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 text-foreground cursor-pointer"
  >
    <ChevronLeft className="size-5 text-muted-foreground stroke-[2.25]" />
  </motion.button>
  ```

---

## 7. Calendar & Month Header Navigation

- **Month Header Controls**:
  - Outer container uses a tight gap: `<div className="flex items-center gap-0.5 mt-1">`.
  - Month title trigger button uses tight padding: `<motion.button className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full text-sm font-semibold text-foreground ...">`.
  - Arrow buttons sit adjacent to month text with `size-10` targets and `size-5` icons.
- **Calendar Cell Grid**:
  - Cell dimensions: `size-10 sm:size-11` (`40px × 40px` to `44px × 44px`).
  - Text typography inside cells: `text-[15px] sm:text-base font-medium`.
- **Shift Indicator Dots**:
  - Size: `size-1.5` (`5px × 5px`) positioned at `bottom-1.5`.
  - Unselected shift days: `bg-black dark:bg-white` (Crisp white dot in dark mode, black dot in light mode).
  - Selected shift days: `bg-primary-foreground` (Dynamic contrast over active circle).

---

## 8. Bottom Navigation Dock

- **Container Positioning**:
  ```tsx
  <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
    <div className="pointer-events-auto">
      {/* Dock component */}
    </div>
  </div>
  ```
- **Dock Props & Icons**:
  - Use `Dock` and `DockItem` from `@/components/motion/dock`.
  - Icons: `lucide-react` icons with `className="size-5"`.
  - Active indicator is driven by Framer Motion layout animations (`active={isActive}`).

---

## 9. Tabs & Segmented Controls

- **Component Structure**: Use `Tabs` from `@/components/motion/tabs` with `variant="pill"`.
- **Container**: `<Tabs value={state} onValueChange={setState} variant="pill">`
- **List Container**: `<TabsList className="bg-card/80 backdrop-blur-xl border border-border p-1 rounded-full h-12 flex items-center gap-1 shadow-sm">`
- **Triggers**: `<TabsTrigger value="val" className="h-full rounded-full flex items-center justify-center px-4">`

---

## 10. Popover Morph Systems

When a row acts as a trigger for inline popovers or contextual actions:
- **Global Backdrop**:
  ```tsx
  <div className={"fixed inset-0 z-[55] bg-black/60 backdrop-blur-lg transition-opacity duration-300 " + (isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")} onPointerDown={() => setIsOpen(false)} />
  ```
- **Trigger Elevation**: Elevated state when open: `className={isOpen ? 'z-[60] bg-card shadow-2xl scale-[1.02] ring-1 ring-border/50' : 'z-10 hover:bg-black/5 dark:hover:bg-white/5'}`.
- **Inner Menu Container**: `<div className="rounded-[32px] bg-card/90 backdrop-blur-xl border border-border/50 overflow-hidden flex flex-col p-1.5 gap-0.5">`.

---

## 11. Animations & Framer Motion Standards

- Use `motion/react` (Framer Motion).
- **Tactile Tap Physics**: `whileTap={{ scale: 0.85 }}` for small buttons/arrows, `whileTap={{ scale: 0.94 }}` for standard buttons, `whileTap={{ scale: 0.96 }}` for text triggers.
- **Spring Transition Configs**:
  - Snappy UI state switches: `{ type: "spring", stiffness: 400, damping: 28 }`
  - Modal morph / layout transitions: `{ type: "spring", stiffness: 400, damping: 30 }`

---

## 12. Theming & Color Tokens

- **Semantic Classes**: Strictly use semantic Tailwind variables (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`).
- **Dark Mode**: Rely on `oklch` theme variables defined in `globals.css`. Dark mode background is pure black `#000000` (`oklch(0.145 0 0)`). Never hardcode RGB or HEX colors directly in UI components.
