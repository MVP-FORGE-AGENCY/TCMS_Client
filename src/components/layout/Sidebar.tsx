import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Calendar,
    ClipboardCheck,
    FileText,
    Settings,
    Plane,
    ClipboardList,
    Shield,
    Building,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { OrgSwitcher } from "./OrgSwitcher"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation()
    const { t } = useTranslation()
    const { user } = useAuth()

    const userRole = user?.role || "guest"

    const navItems = [
        {
            title: t("nav.dashboard"),
            href: "/dashboard", // Updated from "/" to "/dashboard" for consistency
            icon: LayoutDashboard,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin"],
        },
        {
            title: t("nav.personnel"),
            href: "/personnel",
            icon: Users,
            roles: ["admin", "training_manager", "super_admin", "instructor", "assessor"],
        },
        {
            title: t("nav.programmes"),
            href: "/programmes",
            icon: BookOpen,
            roles: ["admin", "training_manager", "instructor", "assessor", "super_admin"],
        },
        {
            title: t("nav.standards"),
            href: "/standards",
            icon: BookOpen,
            roles: ["admin", "training_manager", "instructor", "assessor", "super_admin"],
        },
        {
            title: t("nav.sessions"),
            href: "/sessions",
            icon: Calendar,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin"],
        },
        {
            title: t("nav.checks"),
            href: "/checks",
            icon: ClipboardCheck,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin"],
        },
        {
            title: t("nav.competence"),
            href: "/competence",
            icon: ClipboardList,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "super_admin"],
        },
        {
            title: t("nav.reports"),
            href: "/reports",
            icon: FileText,
            roles: ["admin", "training_manager", "super_admin"],
            badge: 12, // Mocked
        },
        {
            title: t("nav.settings"),
            href: "/settings",
            icon: Settings,
            roles: ["admin", "super_admin"],
        },
        {
            title: t("nav.procedures"),
            href: "/procedures",
            icon: ClipboardList,
            roles: ["admin", "training_manager", "instructor", "assessor", "employee", "readonly", "super_admin"],
        },
    ]

    const superAdminItems = [
        {
            title: "Dashboard",
            href: "/super-admin/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Organizations",
            href: "/super-admin/organizations",
            icon: Building,
        },
    ]

    const filteredNavItems = navItems.filter((item) =>
        item.roles.includes(userRole)
    )

    return (
        <div className={cn(
            "pb-12 min-h-screen border-r border-border bg-background flex flex-col transition-colors duration-300",
            "dark:bg-slate-950 dark:border-slate-800",
            className
        )}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-4 mb-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 dark:shadow-blue-500/20">
                            <Plane className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                            TCMS
                        </h2>
                    </div>

                    {/* Org Switcher for Super Admins */}
                    <div className="mb-4 px-1">
                        <OrgSwitcher />
                    </div>

                    <div className="space-y-1">
                        {filteredNavItems.map((item, index) => {
                            const isActive = location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
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
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                    )}
                                    <item.icon className={cn(
                                        "h-4 w-4 transition-transform duration-200 group-hover:scale-110",
                                        isActive && "text-primary"
                                    )} />
                                    <span>{item.title}</span>
                                    {item.badge && item.badge > 0 && (
                                        <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white shadow-sm">
                                            {item.badge > 9 ? "9+" : item.badge}
                                        </span>
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Super Admin Section */}
                    {userRole === 'super_admin' && (
                        <div className="mt-8">
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground/70 tracking-wider">
                                Admin
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
        </div>
    )
}
