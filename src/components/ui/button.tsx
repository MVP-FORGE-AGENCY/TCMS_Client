import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold ring-offset-background transition-all duration-200 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: 
          "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:from-blue-500 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:shadow-blue-500/20",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:from-red-500 hover:to-red-700",
        outline:
          "border border-border bg-background hover:bg-accent/50 text-foreground dark:border-slate-700 dark:hover:bg-slate-800/50 dark:hover:border-slate-600",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 dark:border-slate-700 dark:hover:bg-slate-700/50",
        ghost: 
          "hover:bg-primary/10 text-primary dark:text-blue-400 dark:hover:bg-blue-500/10",
        link: 
          "text-primary underline-offset-4 hover:underline dark:text-blue-400",
        success: 
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-emerald-700",
        warning: 
          "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/30 hover:from-amber-500 hover:to-amber-700",
        danger: 
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:from-red-500 hover:to-red-700",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-sm",
        lg: "h-12 rounded-lg px-8",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
