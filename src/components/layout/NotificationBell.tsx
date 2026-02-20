import { useState, useEffect, useMemo } from "react"
import { Bell, AlertCircle, ShieldAlert, CalendarClock, ChevronRight, X } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { formatDistanceToNow } from "date-fns"
import { bg } from "date-fns/locale"
import { notifications as notificationsApi } from "@/lib/api"
import { cn } from "@/lib/utils"

interface NotificationItem {
    id: string
    title: string
    message: string
    date: string
    type: "critical" | "warning" | "info"
    link?: string
}

// Translate notification titles/messages based on id prefix
function translateNotification(notification: NotificationItem, t: (key: string, fallback: string, opts?: Record<string, unknown>) => string) {
    // Extract the person name and standard code from the message
    // Backend format: "Name - CODE has EXPIRED!" or "Name - CODE expires in X days"
    const parts = notification.message.match(/^(.+?)\s*-\s*(.+?)\s+(has EXPIRED!|expires in (\d+) days)$/)
    const personName = parts?.[1] || ''
    const standardCode = parts?.[2] || ''
    const daysLeft = parts?.[4]

    if (notification.id.startsWith('expired-')) {
        return {
            title: t('notifications.expiredCompetence', 'Изтекла компетентност'),
            message: personName && standardCode
                ? t('notifications.expiredMessage', '{{name}} - {{code}} е ИЗТЕКЛА!', { name: personName, code: standardCode })
                : notification.message
        }
    }
    if (notification.id.startsWith('exp-')) {
        return {
            title: t('notifications.expiringCompetence', 'Изтичаща компетентност'),
            message: personName && standardCode && daysLeft
                ? t('notifications.expiringMessage', '{{name}} - {{code}} изтича след {{days}} дни', { name: personName, code: standardCode, days: daysLeft })
                : notification.message
        }
    }
    if (notification.id.startsWith('check-')) {
        return {
            title: t('notifications.upcomingCheck', 'Предстояща проверка'),
            message: notification.message
        }
    }
    return { title: notification.title, message: notification.message }
}

const TYPE_STYLES: Record<string, { icon: React.ElementType; badgeClass: string; dotClass: string; bgClass: string }> = {
    critical: {
        icon: ShieldAlert,
        badgeClass: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
        dotClass: "bg-red-500",
        bgClass: "bg-red-50/80 dark:bg-red-950/30 hover:bg-red-100/80 dark:hover:bg-red-950/50 border-l-2 border-l-red-500"
    },
    warning: {
        icon: AlertCircle,
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
        dotClass: "bg-amber-500",
        bgClass: "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 border-l-2 border-l-amber-500"
    },
    info: {
        icon: CalendarClock,
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
        dotClass: "bg-blue-500",
        bgClass: "hover:bg-accent border-l-2 border-l-transparent"
    }
}

export function NotificationBell() {
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())

    const isBg = i18n.language === 'bg'

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationsApi.list()
                setNotifications(data)
            } catch (error) {
                console.error("Failed to fetch notifications", error)
            }
        }
        
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    const activeNotifications = useMemo(
        () => notifications.filter(n => !dismissed.has(n.id)),
        [notifications, dismissed]
    )

    const criticalCount = useMemo(
        () => activeNotifications.filter(n => n.type === "critical").length,
        [activeNotifications]
    )
    const warningCount = useMemo(
        () => activeNotifications.filter(n => n.type === "warning").length,
        [activeNotifications]
    )
    const totalCount = activeNotifications.length

    const handleItemClick = (notification: NotificationItem) => {
        if (notification.link) {
            navigate(notification.link)
            setIsOpen(false)
        }
    }

    const handleDismiss = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setDismissed(prev => new Set(prev).add(id))
    }

    const hasCritical = criticalCount > 0

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Notifications"
                    className={cn(
                        "relative transition-all duration-300",
                        hasCritical && "text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-950/30"
                    )}
                >
                    <Bell className={cn(
                        "h-5 w-5 transition-all",
                        hasCritical && "animate-[bell-ring_1s_ease-in-out_infinite]"
                    )} />
                    {totalCount > 0 && (
                        <span className={cn(
                            "absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                            hasCritical ? "bg-red-500" : warningCount > 0 ? "bg-amber-500" : "bg-blue-500"
                        )}>
                            {hasCritical && (
                                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
                            )}
                            <span className="relative">{totalCount > 99 ? "99+" : totalCount}</span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                        <DropdownMenuLabel className="p-0 text-base font-semibold">
                            {t("notifications.title", "Notifications")}
                        </DropdownMenuLabel>
                        <div className="flex gap-1.5">
                            {criticalCount > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-300 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
                                    {criticalCount} {t("notifications.critical", "critical")}
                                </Badge>
                            )}
                            {warningCount > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                                    {warningCount} {t("notifications.warnings", "warnings")}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Critical Alert Banner */}
                {criticalCount > 0 && (
                    <div className="px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 text-white">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold">
                                    {t("notifications.expiredAlert", "{{count}} Expired Competence(s) Require Immediate Action!", { count: criticalCount })}
                                </p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-6 px-2 text-[10px] text-white/90 hover:text-white hover:bg-white/20 shrink-0"
                                onClick={() => { navigate('/competence?status=expired'); setIsOpen(false) }}
                            >
                                {t("notifications.viewAll", "View")}
                                <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Notification List */}
                <ScrollArea className="max-h-80">
                    {activeNotifications.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                            <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("notifications.empty", "All clear!")}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                {t("notifications.emptyDesc", "No new notifications")}
                            </p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {activeNotifications.map((notification) => {
                                const style = TYPE_STYLES[notification.type] || TYPE_STYLES.info
                                const Icon = style.icon
                                const translated = translateNotification(notification, t)

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors group",
                                            style.bgClass
                                        )}
                                        onClick={() => handleItemClick(notification)}
                                    >
                                        <div className={cn(
                                            "mt-0.5 p-1 rounded-md",
                                            notification.type === 'critical' ? 'bg-red-100 dark:bg-red-900/40' : 
                                            notification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40' : 
                                            'bg-blue-100 dark:bg-blue-900/40'
                                        )}>
                                            <Icon className={cn(
                                                "h-3.5 w-3.5",
                                                notification.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                                                notification.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                                'text-blue-600 dark:text-blue-400'
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-semibold text-xs leading-tight",
                                                    notification.type === 'critical' ? 'text-red-700 dark:text-red-400' :
                                                    notification.type === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                                                    'text-foreground'
                                                )}>
                                                    {translated.title}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground shrink-0">
                                                    {formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: isBg ? bg : undefined })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-foreground/75 leading-snug mt-0.5 line-clamp-2">
                                                {translated.message}
                                            </p>
                                        </div>
                                        <button
                                            className="mt-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                            onClick={(e) => handleDismiss(e, notification.id)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => { navigate("/reports"); setIsOpen(false) }}
                    >
                        {t("notifications.viewAllAlerts", "View all alerts")}
                        <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
