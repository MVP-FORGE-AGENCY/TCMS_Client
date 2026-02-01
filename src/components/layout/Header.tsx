import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "./NotificationBell"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"
import { Breadcrumbs } from "./Breadcrumbs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { CommandMenu } from "./CommandMenu"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useTranslation } from "react-i18next"

import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function Header() {
    const { t } = useTranslation()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const getInitials = (name?: string) => {
        if (!name) return "U"
        const parts = name.split(" ")
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }

    const handleLogout = () => {
        logout()
        navigate("/login")
    }
    
    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="xl:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[240px]">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                    <Sidebar className="border-none" />
                </SheetContent>
            </Sheet>

            <div className="hidden xl:block">
                <Breadcrumbs />
            </div>

            <div className="ml-auto flex items-center gap-4">
                <div className="text-sm font-medium text-muted-foreground hidden md:block">
                    {user?.organisation?.name || "Acme Aviation Ltd."}
                </div>

                <div className="relative hidden md:flex items-center gap-2">
                    <CommandMenu />
                </div>

                <LanguageSwitcher />
                <ModeToggle />
                <NotificationBell />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.avatarUrl} alt={user?.full_name || "User"} />
                                <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{user?.full_name || t("common.myAccount")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/settings")}>{t("nav.settings")}</DropdownMenuItem>
                        <DropdownMenuItem>{t("common.support")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>{t("common.logout")}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

