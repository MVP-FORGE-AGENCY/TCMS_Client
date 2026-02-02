import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { notifications as notificationsApi } from "@/lib/api"

export function NotificationBell() {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState<any[]>([])
    // const [loading, setLoading] = useState(false) // Could use this for spinner if needed

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // setLoading(true)
                const data = await notificationsApi.list()
                setNotifications(data)
            } catch (error) {
                console.error("Failed to fetch notifications", error)
            } finally {
                // setLoading(false)
            }
        }
        
        fetchNotifications()
        
        // Poll every 5 minutes
        const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])
    
    const unreadCount = notifications.length

    const handleItemClick = (notification: any) => {
        if (notification.link) {
            navigate(notification.link)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                            onClick={() => handleItemClick(notification)}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className={`font-semibold text-xs ${notification.type === 'critical' ? 'text-red-600' : notification.type === 'warning' ? 'text-amber-600' : ''}`}>
                                    {notification.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(notification.date), "MMM d")}
                                </span>
                            </div>
                            <p className="text-sm text-foreground/90 leading-tight">
                                {notification.message}
                            </p>
                        </DropdownMenuItem>
                    ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-xs text-muted-foreground" onClick={() => navigate("/reports")}>
                    View all alerts
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

