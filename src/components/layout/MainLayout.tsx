import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

export function MainLayout() {
    return (
        <div className="flex min-h-screen w-full flex-col bg-background dark:bg-slate-950 overflow-x-hidden transition-colors duration-300">
            <div className="flex flex-col gap-4 py-4 xl:pl-60">
                <Sidebar className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col xl:flex" />
                <div className="flex flex-col sm:gap-4 sm:py-4">
                    <Header />
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 animate-fade-in">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    )
}
