
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface RevisionBadgeProps {
    revision: number
    isLatest: boolean
    className?: string
}

export function RevisionBadge({ revision, isLatest, className }: RevisionBadgeProps) {
    if (isLatest) {
        return (
            <Badge variant="outline" className={`font-mono ${className}`}>
                v{revision}
            </Badge>
        )
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="secondary" className={`font-mono opacity-70 ${className}`}>
                        <Clock className="mr-1 h-3 w-3" />
                        v{revision}
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Archived Revision</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
