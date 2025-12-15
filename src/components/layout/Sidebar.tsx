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
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string
}

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation()

    // TODO: Replace with real role check
    const userRole = "admin"

    const navItems = [
        {
            title: "Dashboard",
            href: "/",
            icon: LayoutDashboard,
            roles: ["admin", "instructor", "trainee", "manager"],
        },
        {
            title: "Personnel",
            href: "/personnel",
            icon: Users,
            roles: ["admin", "manager"],
        },
        {
            title: "Programmes",
            href: "/programmes",
            icon: BookOpen,
            roles: ["admin", "manager", "instructor"],
        },
        {
            title: "Sessions",
            href: "/sessions",
            icon: Calendar,
            roles: ["admin", "manager", "instructor", "trainee"],
        },
        {
            title: "Proficiency Checks",
            href: "/checks",
            icon: ClipboardCheck,
            roles: ["admin", "manager", "instructor", "trainee"],
        },
        {
            title: "Reports",
            href: "/reports",
            icon: FileText,
            roles: ["admin", "manager"],
            badge: 12, // Mocked expired items
        },
        {
            title: "Settings",
            href: "/settings",
            icon: Settings,
            roles: ["admin"],
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
                                    location.pathname === item.href
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
