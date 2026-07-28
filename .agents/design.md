# UI Design Guidelines

- **UI Guidelines - Forms & Inputs**: Always use `react-hook-form` with `@hookform/resolvers/zod`. Use the wrappers from `@/components/ui/field`: Wrap the form in `<FieldGroup>`, inputs in `<Field>`. Use `<FieldLabel>`, `<FieldError>`, and `<FieldDescription>`. Inputs use `rounded-full h-12`.
- **UI Guidelines - Buttons**: Use `<Button>` from `@/components/motion/button/base` for standard buttons. For custom "squishy/glass" buttons, wrap in `<motion.div whileTap={{ scale: 0.85, opacity: 0.7 }}>` and apply Tailwind classes: `rounded-full border border-border bg-card/80 backdrop-blur-xl transition-colors hover:bg-card/90 text-muted-foreground hover:text-foreground`.
- **UI Guidelines - Morph Modals**: When creating a modal, use `CenterMorphModal` from `@/components/motion/center-morph-modal`. Follow this structure strictly:
  - **Container**: `<CenterMorphModalContent className="w-full max-w-sm bg-card p-6 border-border/50">` (The 'X' close button is auto-rendered).
  - **Layout**: Wrap the inner content with `<div className="flex flex-col gap-6">`.
  - **Header**: Use `<div className="flex flex-col gap-4 text-center">` containing an `h2` (`text-lg font-semibold leading-none tracking-tight text-foreground`) and a `p` (`text-sm text-muted-foreground`).
  - **Footer**: Use `<div className="mt-2 flex justify-end gap-3">` for action buttons. Use `<CenterMorphModalClose>` to wrap the cancel button.
- **UI Guidelines - Theming**: Strictly use semantic Tailwind classes (e.g., `bg-background`, `bg-card`, `text-foreground`). Avoid hardcoding HEX/RGB; rely on the `oklch` theme variables defined in `globals.css` (dark mode is pure black `#000000`).
- **UI Guidelines - Animations**: Use `motion/react` (Framer Motion) for interactions. UI elements should feel responsive and physical (e.g., using `whileTap={{ scale: 0.93 }}`).
- **UI Guidelines - Dock Navigation**: When creating a bottom navigation dock, use `Dock` and `DockItem` from `@/components/motion/dock`.
  - **Container Positioning**: Always wrap the dock in `<div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none"><div className="pointer-events-auto">` to ensure it stays anchored relative to the viewport and does not jump when scrolling on mobile.
  - **Props & State**: Use `usePathname` and `useRouter` from `next/navigation` to manage active state. Pass `active={isActive}` to trigger the animated pill indicator (powered by Framer Motion). Add an `onClick` handler for navigation and `aria-label` for accessibility.
  - **Icons**: Use `lucide-react` icons sized perfectly for the dock (e.g., `<Icon className="size-5" />`).
  - **Hover Tooltips**: For labels that appear on hover, add `className="group"` to the `<DockItem>` and include an absolute span inside: `<span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none rounded-full border border-border bg-card/80 backdrop-blur-xl px-3 py-1 text-sm font-medium text-foreground shadow-2xl whitespace-nowrap">Label</span>`.
