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
        <div className={cn("pb-12 min-h-screen border-r bg-sidebar flex flex-col", className)}>
            <div className="space-y-4 py-4 flex-1">
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 px-4 mb-2">
                        <Plane className="h-6 w-6 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight text-primary">
                            TCMS
                        </h2>
                    </div>

                    {/* Org Switcher for Super Admins */}
                    <div className="mb-4 px-1">
                        <OrgSwitcher />
                    </div>

                    <div className="space-y-1">
                        {filteredNavItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                                    (location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href)))
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

                    {/* Super Admin Section */}
                    {userRole === 'super_admin' && (
                        <div className="mt-8">
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                ADMIN
                            </h3>
                            <div className="space-y-1">
                                {superAdminItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                                            location.pathname.startsWith(item.href)
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                                : "text-muted-foreground hover:bg-sidebar-accent/50"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
