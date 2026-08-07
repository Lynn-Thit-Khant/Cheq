"use client"

import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-3 [--cell-size:--spacing(10)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50 rounded-full",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50 rounded-full",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-full",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 bg-popover opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-medium select-none text-sm font-semibold",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex justify-between gap-1 sm:gap-1.5", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-[0.8rem] font-normal text-muted-foreground select-none text-center",
          defaultClassNames.weekday
        ),
        week: cn("mt-1.5 flex w-full justify-between gap-1 sm:gap-1.5", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative size-9 sm:size-10 p-0 text-center select-none flex items-center justify-center",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-full bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none bg-muted", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-full bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "text-foreground",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/30 aria-selected:text-muted-foreground/30",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  children,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelected = modifiers.selected
  const isToday = modifiers.today
  const isRange = modifiers.range_start || modifiers.range_end || modifiers.range_middle
  const hasShift = modifiers.hasShift || modifiers.has_shift

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={isSelected}
      data-today={isToday}
      data-selected-single={isSelected && !isRange}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-9 sm:size-10 w-9 sm:w-10 items-center justify-center border-0 leading-none text-sm font-medium rounded-full transition-colors cursor-pointer",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[2px] group-data-[focused=true]/day:ring-ring/50",
        // Today styling (when not selected)
        isToday && !isSelected && "bg-black/10 dark:bg-white/10 text-foreground font-semibold rounded-full",
        // Single selected day
        isSelected && !isRange && "bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-sm",
        // Range styling
        modifiers.range_start && "rounded-l-full rounded-r-none bg-primary text-primary-foreground",
        modifiers.range_middle && "rounded-none bg-muted text-foreground",
        modifiers.range_end && "rounded-r-full rounded-l-none bg-primary text-primary-foreground",
        // Has shift: subtle background tint (only when not selected/today)
        hasShift && !isSelected && !isToday && "bg-foreground/[0.07]",
        "dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {hasShift && (
        <span
          className={cn(
            "absolute bottom-1.5 size-1.5 rounded-full pointer-events-none transition-colors",
            isSelected ? "bg-primary-foreground" : "bg-black dark:bg-white"
          )}
        />
      )}
    </Button>
  )
}

export { Calendar, CalendarDayButton }
