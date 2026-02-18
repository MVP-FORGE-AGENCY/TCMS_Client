import { Outlet } from "react-router-dom"
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useAuth } from "@/context/AuthContext"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainLayout() {
    const { user } = useAuth()
    const isAuditor = user?.role === 'auditor'
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    return (
        <div className="flex min-h-screen w-full flex-col bg-background dark:bg-slate-950 transition-colors duration-300">
             {isAuditor && (
                <div className="w-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-1.5 text-center text-sm font-medium flex items-center justify-center gap-2 border-b border-amber-200 dark:border-amber-800 fixed top-0 z-50 h-auto sm:h-8">
                    <Lock className="h-3 w-3" />
                    <span>Auditor Mode: Read-Only Access</span>
                </div>
            )}
            <div className={cn("flex flex-col gap-4 py-4 transition-all duration-300 ease-in-out", isSidebarOpen ? "xl:pl-60" : "xl:pl-0", isAuditor && "pt-12 sm:pt-12")}>
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onToggle={toggleSidebar}
                    className={cn("fixed inset-y-0 left-0 z-10 hidden w-60 flex-col xl:flex border-r", isAuditor && "top-8")} 
                />
                <div className="flex flex-col sm:gap-4 sm:py-4">
                    <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 animate-fade-in">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}
