import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex min-h-[100px] w-full rounded-lg border border-border bg-background px-4 py-3 text-base ring-offset-background transition-all duration-200 ease-out resize-y",
                "placeholder:text-muted-foreground/60",
                "hover:border-primary/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
                "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-50 disabled:resize-none",
                "dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-600 dark:focus-visible:border-primary dark:focus-visible:ring-primary/30",
                "md:text-sm",
                className
            )}
            ref={ref}
            {...props}
        />
    )
})
Textarea.displayName = "Textarea"

export { Textarea }
