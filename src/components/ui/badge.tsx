import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline: 
          "text-foreground border-border dark:border-slate-700",
        // TCMS Traffic Light Status Badges with dark mode support
        valid:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
        expiring:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
        expired:
          "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
        pending:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showIcon?: boolean
  pulse?: boolean
}

function Badge({ className, variant, showIcon = false, pulse = false, children, ...props }: BadgeProps) {
  const getIcon = () => {
    if (!showIcon) return null
    
    const pulseClass = pulse ? "animate-pulse" : ""
    
    switch (variant) {
      case "valid":
        return (
          <span className={cn("relative flex h-2 w-2", pulseClass)} aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 dark:bg-emerald-500"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          </span>
        )
      case "expiring":
        return (
          <span className={cn("relative flex h-2 w-2", pulseClass)} aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 dark:bg-amber-500"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400"></span>
          </span>
        )
      case "expired":
        return (
          <span className={cn("relative flex h-2 w-2", pulseClass)} aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 dark:bg-red-500"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 dark:bg-red-400"></span>
          </span>
        )
      case "pending":
        return (
          <span className={cn("relative flex h-2 w-2", pulseClass)} aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75 dark:bg-blue-500"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {getIcon()}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
