"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick"> {
  iconClassName?: string;
}

export function ThemeToggle({
  className,
  iconClassName,
  ...rest
}: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  const isDark = mounted && resolvedTheme === "dark";

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn("flex items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors", className)}
      {...rest}
    >
      {mounted ? (
        isDark ? (
          <Sun className={cn("size-5", iconClassName)} />
        ) : (
          <Moon className={cn("size-5", iconClassName)} />
        )
      ) : (
        <span className={cn("size-5", iconClassName)} aria-hidden="true" />
      )}
    </button>
  );
}
