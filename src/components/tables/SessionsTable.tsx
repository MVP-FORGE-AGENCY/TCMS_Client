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
import type { Session } from "@/types"
import { format } from "date-fns"

interface SessionsTableProps {
    data: Session[]
    visibleColumns?: string[]
    onViewSession: (session: Session) => void
    onRecordResults: (session: Session) => void
    onCancelSession: (session: Session) => void
}

export function SessionsTable({
    data,
    visibleColumns = ['date', 'curriculum', 'module', 'instructor', 'location', 'type', 'capacity', 'status'],
    onViewSession,
    onRecordResults,
    onCancelSession,
}: SessionsTableProps) {
    const { t } = useTranslation()
    const [filterSearch, setFilterSearch] = useState("")

    const filteredData = (data || []).filter((session) => {
        // Search by campaign name, module name, instructor name, or location
        const searchLower = filterSearch.toLowerCase()
        const campaignName = (session as any).campaign?.name || session.programme?.name || ''
        const moduleName = (session as any).curriculumModule?.name || ''
        const instructorName = session.instructor?.fullName || ''
        const location = session.location || ''
        
        const matchesSearch = !filterSearch || 
            campaignName.toLowerCase().includes(searchLower) ||
            moduleName.toLowerCase().includes(searchLower) ||
            instructorName.toLowerCase().includes(searchLower) ||
            location.toLowerCase().includes(searchLower)
        return matchesSearch
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
            case "theory":
                return "bg-emerald-100 text-emerald-800"
            case "simulator":
                return "bg-violet-100 text-violet-800"
            case "flight":
            case "practical":
                return "bg-sky-100 text-sky-800"
            case "combined":
                return "bg-orange-100 text-orange-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const isColumnVisible = (columnId: string) => visibleColumns.includes(columnId)

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder={t('sessions.searchPlaceholder', 'Search by campaign, module, instructor, or location...')}
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            {isColumnVisible('date') && (
                                <TableHead>{t('sessions.date', 'Date')}</TableHead>
                            )}
                            {isColumnVisible('curriculum') && (
                                <TableHead>{t('sessions.campaign', 'Campaign')}</TableHead>
                            )}
                            {isColumnVisible('module') && (
                                <TableHead>{t('sessions.module', 'Module')}</TableHead>
                            )}
                            {isColumnVisible('instructor') && (
                                <TableHead>{t('sessions.instructor', 'Instructor')}</TableHead>
                            )}
                            {isColumnVisible('location') && (
                                <TableHead>{t('sessions.location', 'Location')}</TableHead>
                            )}
                            {isColumnVisible('type') && (
                                <TableHead>{t('sessions.type', 'Type')}</TableHead>
                            )}
                            {isColumnVisible('capacity') && (
                                <TableHead>{t('sessions.capacity', 'Capacity')}</TableHead>
                            )}
                            {isColumnVisible('status') && (
                                <TableHead>{t('common.status', 'Status')}</TableHead>
                            )}
                            <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                                    {t('common.noResults', 'No results found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((session) => (
                                <TableRow key={session.id}>
                                    {isColumnVisible('date') && (
                                        <TableCell>
                                            {format(new Date(session.dateStart), 'EEE, MMM d, yyyy')}
                                        </TableCell>
                                    )}
                                    {isColumnVisible('curriculum') && (
                                        <TableCell className="font-medium">
                                            {(session as any).campaign?.name || session.programme?.name || '-'}
                                        </TableCell>
                                    )}
                                    {isColumnVisible('module') && (
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{(session as any).curriculumModule?.name || '-'}</span>
                                                {(session as any).isFinalModuleSession && (
                                                    <Badge variant="outline" className="mt-1 w-fit text-[10px] h-4 bg-amber-50 text-amber-700 border-amber-200">
                                                        Final
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                    {isColumnVisible('instructor') && (
                                        <TableCell>{session.instructor?.fullName || '-'}</TableCell>
                                    )}
                                    {isColumnVisible('location') && (
                                        <TableCell>{session.location || '-'}</TableCell>
                                    )}
                                    {isColumnVisible('type') && (
                                        <TableCell>
                                            <Badge className={getSessionTypeBadge(session.sessionType)}>
                                                {session.sessionType || '-'}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {isColumnVisible('capacity') && (
                                        <TableCell>{session.capacity || "-"}</TableCell>
                                    )}
                                    {isColumnVisible('status') && (
                                        <TableCell>
                                            <Badge className={getStatusColor(session.status)}>
                                                {session.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                    )}
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
                                                    {t('common.view', 'View Details')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onRecordResults(session)}>
                                                    <ClipboardCheck className="mr-2 h-4 w-4" />
                                                    {t('sessions.recordResults', 'Record Results')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => onCancelSession(session)}
                                                    className="text-red-600"
                                                >
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    {t('sessions.cancelSession', 'Cancel Session')}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
