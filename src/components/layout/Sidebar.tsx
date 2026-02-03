import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardCheck,
    FileText,
    Settings,
    Plane,
    ClipboardList,
    Building,
    ChevronDown,
    ChevronRight,
    Wrench,
    PlayCircle,
    FolderOpen,
    CalendarDays,
    GraduationCap,
    Library,
    Target,
    Bot,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { OrgSwitcher } from "./OrgSwitcher"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

interface NavGroup {
    id: string
    title: string
    icon: React.ElementType
    roles: string[]
    items: NavItem[]
    defaultOpen?: boolean
}

interface NavItem {
    title: string
    href: string
    icon: React.ElementType
    roles: string[]
    badge?: number
    variant?: "training" | "checking" | "default"
}

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation()
    const { t } = useTranslation()
    const { user } = useAuth()

    const userRole = user?.role || "guest"

    // Track which groups are open
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        planning: true,
        execution: true,
        records: false,
        configuration: false,
    })

    const toggleGroup = (groupId: string) => {
        setOpenGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }))
    }

    // Standalone top-level items
    const topLevelItems: NavItem[] = [
        {
            title: t("nav.dashboard"),
            href: "/dashboard",
            icon: LayoutDashboard,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin", "auditor"],
        },
    ]

    // Grouped navigation by workflow stage (Workflow-Driven Design)
    const navGroups: NavGroup[] = [
        {
            id: "planning",
            title: t("nav.groups.planning"),
            icon: CalendarDays,
            roles: ["admin", "training_manager", "super_admin"],
            defaultOpen: true,
            items: [
                {
                    title: t("nav.campaigns"),
                    href: "/campaigns",
                    icon: CalendarDays,
                    roles: ["admin", "training_manager", "super_admin"],
                },
                {
                    title: t("nav.curriculums"),
                    href: "/curriculums",
                    icon: GraduationCap,
                    roles: ["admin", "training_manager", "super_admin"],
                },
                {
                    title: t("nav.regulatoryLibrary"),
                    href: "/standards",
                    icon: Library,
                    roles: ["admin", "super_admin", "training_manager"],
                },
                {
                    title: t("nav.procedures"),
                    href: "/procedures",
                    icon: ClipboardList,
                    roles: ["admin", "training_manager", "super_admin"],
                },
            ],
        },
        {
            id: "execution",
            title: t("nav.groups.execution"),
            icon: PlayCircle,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin", "auditor"],
            defaultOpen: true,
            items: [
                {
                    title: t("nav.sessions"), // Both are named Schedule now
                    href: "/sessions",
                    icon: Calendar,
                    roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin", "auditor"],
                    variant: "training",
                },
                {
                    title: t("nav.checks"), // Both are named Schedule now
                    href: "/checks",
                    icon: ClipboardCheck,
                    roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin", "auditor"],
                    variant: "checking",
                },
                {
                    title: t("nav.competence"),
                    href: "/competence",
                    icon: Target,
                    roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin", "auditor"],
                },
                {
                    title: t("nav.procedures"),
                    href: "/procedures",
                    icon: ClipboardList,
                    roles: ["instructor", "assessor", "employee", "readonly"],
                },
            ],
        },
        {
            id: "records",
            title: t("nav.groups.records"),
            icon: FolderOpen,
            roles: ["admin", "training_manager", "super_admin", "auditor"],
            items: [
                {
                    title: t("nav.personnel"),
                    href: "/personnel",
                    icon: Users,
                    roles: ["admin", "training_manager", "super_admin", "instructor", "assessor", "auditor"],
                },
                {
                    title: t("nav.reports"),
                    href: "/reports",
                    icon: FileText,
                    roles: ["admin", "training_manager", "super_admin", "auditor"],
                },
                {
                    title: t("nav.auditLogs"),
                    href: "/audit-logs",
                    icon: FileText, // Or Shield/Search
                    roles: ["admin", "super_admin", "auditor"],
                },
            ],
        },
        {
            id: "configuration",
            title: t("nav.groups.configuration"),
            icon: Wrench,
            roles: ["admin", "super_admin", "training_manager"], // Manager can view settings
            items: [
                {
                    title: t("nav.automation", "Automation Center"),
                    href: "/settings/automation",
                    icon: Bot,
                    roles: ["admin", "super_admin"], // Automation likely admin only
                },
                {
                    title: t("nav.settings"),
                    href: "/settings",
                    icon: Settings,
                    roles: ["admin", "super_admin", "training_manager"], // Manager views read-only settings
                },
            ],
        },
    ]

    const superAdminItems = [
        {
            title: t("nav.superAdmin.dashboard.navLabel"),
            href: "/super-admin/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: t("nav.superAdmin.organizations.navLabel"),
            href: "/super-admin/organizations",
            icon: Building,
        },
    ]

    // Filter items based on user role
    const filteredTopLevel = topLevelItems.filter(item => item.roles.includes(userRole))
    const filteredGroups = navGroups
        .filter(group => group.roles.includes(userRole))
        .map(group => ({
            ...group,
            items: group.items.filter(item => item.roles.includes(userRole))
        }))
        .filter(group => group.items.length > 0)

    // Get variant styles for training vs checking
    const getVariantStyles = (variant?: string, isActive?: boolean) => {
        if (!variant) return {}
        
        if (variant === "training") {
            return {
                indicator: isActive ? "bg-blue-500" : "",
                icon: isActive ? "text-blue-500" : "group-hover:text-blue-500",
                badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
            }
        }
        
        if (variant === "checking") {
            return {
                indicator: isActive ? "bg-violet-500" : "",
                icon: isActive ? "text-violet-500" : "group-hover:text-violet-500",
                badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
            }
        }
        
        return {}
    }

    const renderNavItem = (item: NavItem, index: number, inGroup = false) => {
        // Special case for Settings vs Automation Center to avoid double highlighting
        // If we are exactly at /settings, only highlight Settings
        // If we are at /settings/automation, do NOT highlight Settings
        const isActive = item.href === "/dashboard" 
            ? location.pathname === "/dashboard"
            : item.href === "/settings"
                ? location.pathname === "/settings"
                : location.pathname.startsWith(item.href)

        const variantStyles = getVariantStyles(item.variant, isActive)

        return (
            <Link
                key={item.href}
                to={item.href}
                className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    inGroup && "pl-10",
                    isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {/* Active indicator */}
                {isActive && (
                    <span className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full",
                        variantStyles.indicator || "bg-primary"
                    )} />
                )}
                <item.icon className={cn(
                    "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                    isActive && (variantStyles.icon || "text-primary"),
                    !isActive && variantStyles.icon
                )} />
                <span className="flex-1">{item.title}</span>
                
                {/* Visual tag for training vs checking */}
                {item.variant === "training" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {t("nav.training")}
                    </span>
                )}
                {item.variant === "checking" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                        {t("nav.checking")}
                    </span>
                )}
                
                {item.badge && item.badge > 0 && (
                    <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-sm">
                        {item.badge > 9 ? "9+" : item.badge}
                    </span>
                )}
            </Link>
        )
    }

    return (
        <div className={cn(
            "h-screen sticky top-0 border-r border-border bg-background flex flex-col transition-colors duration-300",
            "dark:bg-slate-950 dark:border-slate-800",
            className
        )}>
            <div className="space-y-4 py-4 flex-1 overflow-y-auto">
                <div className="px-3 py-2">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-4 mb-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 dark:shadow-blue-500/20">
                            <Plane className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                            CertifyCloud
                        </h2>
                    </div>

                    {/* Org Switcher for Super Admins */}
                    <div className="mb-4 px-1">
                        <OrgSwitcher />
                    </div>

                    {/* Top-level items (Dashboard) */}
                    <div className="space-y-1 mb-4">
                        {filteredTopLevel.map((item, index) => renderNavItem(item, index))}
                    </div>

                    {/* Grouped Navigation */}
                    <div className="space-y-2">
                        {filteredGroups.map((group) => (
                            <Collapsible
                                key={group.id}
                                open={openGroups[group.id]}
                                onOpenChange={() => toggleGroup(group.id)}
                            >
                                <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold uppercase text-muted-foreground/70 tracking-wider hover:text-muted-foreground transition-colors">
                                    <group.icon className="h-3.5 w-3.5" />
                                    <span className="flex-1 text-left">{group.title}</span>
                                    {openGroups[group.id] ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-1 mt-1">
                                    {group.items.map((item, index) => renderNavItem(item, index, true))}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>

                    {/* Super Admin Section */}
                    {userRole === 'super_admin' && (
                        <div className="mt-8">
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground/70 tracking-wider">
                                {t("nav.superAdmin.title")}
                            </h3>
                            <div className="space-y-1">
                                {superAdminItems.map((item) => {
                                    const isActive = location.pathname.startsWith(item.href)
                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-primary/10 text-primary dark:bg-primary/20"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/50"
                                            )}
                                        >
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                            )}
                                            <item.icon className={cn(
                                                "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                                                isActive && "text-primary"
                                            )} />
                                            {item.title}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend for Training vs Checking */}
            <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{t("nav.training")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span>{t("nav.checking")}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
