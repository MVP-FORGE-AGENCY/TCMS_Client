import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 animate-fade-in [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4",
  {
    variants: {
      variant: {
        default: 
          "bg-background text-foreground border-border dark:border-slate-800",
        destructive:
          "border-red-200 bg-gradient-to-r from-red-50 to-red-50/50 text-red-900 [&>svg]:text-red-600 dark:border-red-500/30 dark:from-red-500/10 dark:to-red-500/5 dark:text-red-300 dark:[&>svg]:text-red-400",
        success:
          "border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-50/50 text-emerald-900 [&>svg]:text-emerald-600 dark:border-emerald-500/30 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:text-emerald-300 dark:[&>svg]:text-emerald-400",
        warning:
          "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/50 text-amber-900 [&>svg]:text-amber-600 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-amber-500/5 dark:text-amber-300 dark:[&>svg]:text-amber-400",
        info:
          "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-900 [&>svg]:text-blue-600 dark:border-blue-500/30 dark:from-blue-500/10 dark:to-blue-500/5 dark:text-blue-300 dark:[&>svg]:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
