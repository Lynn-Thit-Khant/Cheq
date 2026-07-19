"use client";
// beui.dev/components/motion/dock

import { motion, useReducedMotion, LayoutGroup } from "motion/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type DockContextValue = {
  size: number;
  pillLayoutId: string;
};

const DockContext = createContext<DockContextValue | null>(null);

export interface DockProps {
  children: ReactNode;
  className?: string;
  /** Size of each item in px. */
  size?: number;
}

export function Dock({ children, size = 44, className }: DockProps) {
  // Use a stable ID instead of useId() to prevent layoutId jumping during Next.js navigation
  const pillLayoutId = "dock-active-pill";
  const ctx = useMemo<DockContextValue>(
    () => ({ size, pillLayoutId }),
    [size, pillLayoutId],
  );

  return (
    <DockContext.Provider value={ctx}>
      <LayoutGroup id="dock">
        <div
          className={cn(
            "inline-flex h-auto items-end gap-1.5 rounded-full border border-border bg-card/80 px-2 py-1 shadow-2xl backdrop-blur-xl",
            className,
          )}
        >
          {children}
        </div>
      </LayoutGroup>
    </DockContext.Provider>
  );
}

export interface DockItemProps {
  children: ReactNode;
  className?: string;
  /** When set, the item renders as a <button>. Omit when children carry their own link or button. */
  onClick?: () => void;
  active?: boolean;
  "aria-label"?: string;
}

export function DockItem({
  children,
  className,
  onClick,
  active,
  ...rest
}: DockItemProps) {
  const dock = useContext(DockContext);
  const reduce = useReducedMotion();
  const size = dock?.size ?? 44;
  const pillLayoutId = dock?.pillLayoutId ?? "dock-pill";

  const pill = active ? (
    <motion.span
      layoutId={pillLayoutId}
      transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
      className="absolute inset-0.5 -z-10 rounded-full bg-black/5 dark:bg-white/10"
    />
  ) : null;
  const sharedStyle = { width: size, height: size };
  const sharedClass = cn(
    "relative flex shrink-0 items-center justify-center rounded-full transition-colors duration-200",
    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={rest["aria-label"]}
        aria-pressed={active}
        style={sharedStyle}
        className={cn(
          sharedClass,
          "cursor-pointer border-0 bg-transparent p-0 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {pill}
        {children}
      </button>
    );
  }

  // Children carry their own link or button (and its accessible name).
  return (
    <div style={sharedStyle} className={sharedClass}>
      {pill}
      {children}
    </div>
  );
}

export function DockSeparator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("mx-1 h-6 w-px self-center bg-border", className)}
    />
  );
}
