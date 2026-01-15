import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users, ClipboardCheck, Ban } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session } from "@/types"
import { format } from "date-fns"

interface SessionsTableProps {
    data: Session[]
    onViewSession: (session: Session) => void
    onRecordResults: (session: Session) => void
    onCancelSession: (session: Session) => void
}

export function SessionsTable({
    data,
    onViewSession,
    onRecordResults,
    onCancelSession,
}: SessionsTableProps) {
    const { t } = useTranslation()
    const [filterSearch, setFilterSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const filteredData = (data || []).filter((session) => {
        // Search by curriculum name, instructor name, or location
        const searchLower = filterSearch.toLowerCase()
        const curriculumName = session.curriculum?.name || session.programme?.name || ''
        const instructorName = session.instructor?.fullName || ''
        const location = session.location || ''
        
        const matchesSearch = !filterSearch || 
            curriculumName.toLowerCase().includes(searchLower) ||
            instructorName.toLowerCase().includes(searchLower) ||
            location.toLowerCase().includes(searchLower)
        const matchesStatus = filterStatus === "all" || session.status === filterStatus
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case "planned":
                return "bg-blue-500 hover:bg-blue-600"
            case "in_progress":
                return "bg-amber-500 hover:bg-amber-600"
            case "completed":
                return "bg-green-500 hover:bg-green-600"
            case "cancelled":
                return "bg-gray-500 hover:bg-gray-600"
            default:
                return "bg-gray-500"
        }
    }

    const getSessionTypeBadge = (type: string) => {
        switch (type) {
            case "ground":
                return "bg-emerald-100 text-emerald-800"
            case "simulator":
                return "bg-violet-100 text-violet-800"
            case "flight":
                return "bg-sky-100 text-sky-800"
            case "combined":
                return "bg-orange-100 text-orange-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder={t('sessions.searchPlaceholder', 'Search by curriculum, instructor, or location...')}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('sessions.filterStatus', 'Filter by Status')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                        <SelectItem value="planned">{t('sessions.planned', 'Planned')}</SelectItem>
                        <SelectItem value="in_progress">{t('sessions.inProgress', 'In Progress')}</SelectItem>
                        <SelectItem value="completed">{t('sessions.completed', 'Completed')}</SelectItem>
                        <SelectItem value="cancelled">{t('sessions.cancelled', 'Cancelled')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[900px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('sessions.date', 'Date')}</TableHead>
                            <TableHead>{t('sessions.curriculum', 'Curriculum')}</TableHead>
                            <TableHead>{t('sessions.instructor', 'Instructor')}</TableHead>
                            <TableHead>{t('sessions.location', 'Location')}</TableHead>
                            <TableHead>{t('sessions.type', 'Type')}</TableHead>
                            <TableHead>{t('sessions.capacity', 'Capacity')}</TableHead>
                            <TableHead>{t('common.status', 'Status')}</TableHead>
                            <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell>
                                    {format(new Date(session.dateStart), 'EEE, MMM d, yyyy')}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {session.curriculum?.name || session.programme?.name || '-'}
                                </TableCell>
                                <TableCell>{session.instructor?.fullName || '-'}</TableCell>
                                <TableCell>{session.location || '-'}</TableCell>
                                <TableCell>
                                    <Badge className={getSessionTypeBadge(session.sessionType)}>
                                        {session.sessionType}
                                    </Badge>
                                </TableCell>
                                <TableCell>{session.capacity || "-"}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(session.status)}>
                                        {session.status.replace("_", " ")}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onViewSession(session)}>
                                                <Users className="mr-2 h-4 w-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onRecordResults(session)}>
                                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                                Record Results
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onCancelSession(session)}
                                                className="text-red-600"
                                            >
                                                <Ban className="mr-2 h-4 w-4" />
                                                Cancel Session
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
