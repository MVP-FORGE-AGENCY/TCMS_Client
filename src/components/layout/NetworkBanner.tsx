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
        <div className="bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>Connection lost. Retrying...</span>
        </div>
    )
}
