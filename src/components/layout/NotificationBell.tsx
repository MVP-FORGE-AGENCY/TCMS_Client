import { useState } from "react"
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
import { addDays, format } from "date-fns"

// Mock notifications
const MOCK_NOTIFICATIONS = [
    { id: 1, title: "Expiring Competence", message: "John Doe - OPC-A320 expires in 5 days", date: new Date(), type: "warning" },
    { id: 2, title: "Expiring Competence", message: "Charlie Davis - FIRST-AID expires in 2 days", date: new Date(), type: "critical" },
    { id: 3, title: "New Check Scheduled", message: "LPC for Jane Smith scheduled on 2024-05-20", date: addDays(new Date(), -1), type: "info" },
]

export function NotificationBell() {
    const navigate = useNavigate()
    const [notifications, _setNotifications] = useState(MOCK_NOTIFICATIONS)
    const unreadCount = notifications.length

    const handleItemClick = (_id: number) => {
        // In a real app, mark as read
        // setNotifications(notifications.filter(n => n.id !== id))
        navigate("/reports")
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
                            onClick={() => handleItemClick(notification.id)}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className={`font-semibold text-xs ${notification.type === 'critical' ? 'text-red-600' : notification.type === 'warning' ? 'text-amber-600' : ''}`}>
                                    {notification.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {format(notification.date, "MMM d")}
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
