import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-base ring-offset-background transition-all duration-200 ease-out",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/60",
          "hover:border-primary/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
          "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50",
          "dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600 dark:focus-visible:border-primary dark:focus-visible:ring-primary/30",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
