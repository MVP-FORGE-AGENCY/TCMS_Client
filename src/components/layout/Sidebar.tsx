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
} from "lucide-react"
import { useTranslation } from "react-i18next"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation()
    const { t } = useTranslation()

    // TODO: Replace with real role check
    const userRole = "admin"

    const navItems = [
        {
            title: t("nav.dashboard"),
            href: "/",
            icon: LayoutDashboard,
            roles: ["admin", "instructor", "trainee", "manager"],
        },
        {
            title: t("nav.personnel"),
            href: "/personnel",
            icon: Users,
            roles: ["admin", "manager"],
        },
        {
            title: t("nav.programmes"),
            href: "/programmes",
            icon: BookOpen,
            roles: ["admin", "manager", "instructor"],
        },
        {
            title: t("nav.standards"),
            href: "/standards",
            icon: BookOpen,
            roles: ["admin", "manager", "instructor"],
        },
        {
            title: t("nav.sessions"),
            href: "/sessions",
            icon: Calendar,
            roles: ["admin", "manager", "instructor", "trainee"],
        },
        {
            title: t("nav.checks"),
            href: "/checks",
            icon: ClipboardCheck,
            roles: ["admin", "manager", "instructor", "trainee"],
        },
        {
            title: t("nav.competence"),
            href: "/competence",
            icon: ClipboardList, // Or another suitable icon
            roles: ["admin", "manager", "instructor", "trainee"],
        },
        {
            title: t("nav.reports"),
            href: "/reports",
            icon: FileText,
            roles: ["admin", "manager"],
            badge: 12, // Mocked expired items
        },
        {
            title: t("nav.settings"),
            href: "/settings",
            icon: Settings,
            roles: ["admin"],
        },
        {
            title: t("nav.procedures"),
            href: "/procedures",
            icon: ClipboardList,
            roles: ["admin", "manager", "instructor", "trainee", "auditor"],
        },
    ]

    const filteredNavItems = navItems.filter((item) =>
        item.roles.includes(userRole)
    )

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-sidebar", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-4 mb-6">
                        <Plane className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight text-primary">
                            TCMS
                        </h2>
                    </div>
                    <div className="space-y-1">
                        {filteredNavItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                                    (location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href)))
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                        : "text-muted-foreground hover:bg-sidebar-accent/50"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                                {item.badge && item.badge > 0 && (
                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                                        {item.badge > 9 ? "9+" : item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
