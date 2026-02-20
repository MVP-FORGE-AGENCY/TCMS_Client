import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function NetworkBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    if (isOnline) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center p-2 pointer-events-none">
            <div className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg border border-amber-600/50 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
                <WifiOff className="h-4 w-4 animate-pulse" />
                <span>You are currently offline. Some features may be unavailable.</span>
            </div>
        </div>
    )
}
