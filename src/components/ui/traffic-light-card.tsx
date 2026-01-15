import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export type TrafficLightStatus = "valid" | "expiring" | "expired"

export interface TrafficLightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status: TrafficLightStatus
  value: number | string
  label: string
  description?: string
  icon?: React.ReactNode
  onClick?: () => void
}

const statusConfig = {
  valid: {
    background: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5",
    border: "border border-emerald-200/50 dark:border-emerald-500/20",
    accent: "bg-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    labelColor: "text-emerald-700/80 dark:text-emerald-300/80",
    descColor: "text-emerald-600/60 dark:text-emerald-400/60",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    hoverStyles: "hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-500/40 dark:hover:shadow-emerald-500/5",
    Icon: CheckCircle,
  },
  expiring: {
    background: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5",
    border: "border border-amber-200/50 dark:border-amber-500/20",
    accent: "bg-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
    labelColor: "text-amber-700/80 dark:text-amber-300/80",
    descColor: "text-amber-600/60 dark:text-amber-400/60",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    hoverStyles: "hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1 hover:border-amber-300 dark:hover:border-amber-500/40 dark:hover:shadow-amber-500/5",
    Icon: AlertTriangle,
  },
  expired: {
    background: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5",
    border: "border border-red-200/50 dark:border-red-500/20",
    accent: "bg-red-500",
    textColor: "text-red-600 dark:text-red-400",
    labelColor: "text-red-700/80 dark:text-red-300/80",
    descColor: "text-red-600/60 dark:text-red-400/60",
    iconBg: "bg-red-500/10 dark:bg-red-500/20",
    hoverStyles: "hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 hover:border-red-300 dark:hover:border-red-500/40 dark:hover:shadow-red-500/5",
    Icon: XCircle,
  },
}

const TrafficLightCard = React.forwardRef<HTMLDivElement, TrafficLightCardProps>(
  ({ className, status, value, label, description, icon, onClick, ...props }, ref) => {
    const config = statusConfig[status]
    const isClickable = !!onClick
    const StatusIcon = config.Icon

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl p-6 transition-all duration-300 ease-out-expo group",
          config.background,
          config.border,
          config.hoverStyles,
          isClickable && "cursor-pointer",
          className
        )}
        onClick={onClick}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onClick?.()
          }
        }}
        {...props}
      >
        {/* Accent bar */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", config.accent)} />
        
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.03] dark:opacity-[0.05] transition-transform duration-500 group-hover:scale-110" 
             style={{ background: `radial-gradient(circle, currentColor 0%, transparent 70%)` }} />
        
        <div className="relative flex items-start justify-between">
          <div className="flex flex-col space-y-2">
            {/* Value with animation */}
            <div className={cn(
              "text-4xl font-bold tracking-tight transition-transform duration-300 group-hover:scale-105 origin-left",
              config.textColor
            )}>
              {value}
            </div>
            
            {/* Label */}
            <div className={cn("text-sm font-semibold", config.labelColor)}>
              {label}
            </div>
            
            {/* Description */}
            {description && (
              <div className={cn("text-xs", config.descColor)}>
                {description}
              </div>
            )}
          </div>
          
          {/* Icon */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-110",
            config.iconBg
          )}>
            {icon ? (
              <span className={cn("text-xl", config.textColor)}>{icon}</span>
            ) : (
              <StatusIcon className={cn("w-6 h-6", config.textColor)} />
            )}
          </div>
        </div>
        
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>
      </div>
    )
  }
)
TrafficLightCard.displayName = "TrafficLightCard"

export { TrafficLightCard }
