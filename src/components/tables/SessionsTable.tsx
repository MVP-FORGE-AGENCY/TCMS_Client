import { useState, useEffect } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, Users, ClipboardCheck, Ban, Calendar, MapPin, User, Search } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
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

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    useEffect(() => {
        setCurrentPage(1)
    }, [filterSearch])

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedItems = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "planned":
                return "pending"
            case "in_progress":
                return "expiring"
            case "completed":
                return "valid"
            case "cancelled":
                return "expired"
            default:
                return "secondary"
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
                    className="max-w-sm w-full"
                />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredData.length === 0 ? (
                    <div className="py-6 border rounded-md bg-muted/10">
                        <EmptyState
                            icon={Search}
                            title={t('common.noResults', 'No results found')}
                            description={t('sessions.noDataDesc', 'Adjust your search filters to find sessions.')}
                        />
                    </div>
                ) : (
                    paginatedItems.map((session) => (
                        <Card key={session.id} className="overflow-hidden">
                            <CardHeader className="p-4 bg-muted/30 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-medium">
                                            {(session as any).curriculumModule?.name || '-'}
                                        </CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            {(session as any).campaign?.name || session.programme?.name || '-'}
                                        </div>
                                    </div>
                                    <Badge variant={getStatusVariant(session.status) as any} className="capitalize">
                                        {session.status.replace("_", " ")}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                <div className="flex items-center text-sm gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground min-w-4" />
                                    <span>{format(new Date(session.dateStart), 'EEE, MMM d, yyyy • HH:mm')}</span>
                                </div>
                                
                                {session.instructor && (
                                    <div className="flex items-center text-sm gap-2">
                                        <User className="h-4 w-4 text-muted-foreground min-w-4" />
                                        <span>{session.instructor.fullName}</span>
                                    </div>
                                )}
                                
                                {session.location && (
                                    <div className="flex items-center text-sm gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground min-w-4" />
                                        <span>{session.location}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 pt-2 border-t mt-2">
                                    {isColumnVisible('type') && (
                                        <Badge variant="outline" className={getSessionTypeBadge(session.sessionType)}>
                                            {session.sessionType}
                                        </Badge>
                                    )}
                                    {(session as any).isFinalModuleSession && (
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                            Final
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                      {/* Mobile Actions */}
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button variant="outline" size="sm" className="w-full">
                                                  <MoreHorizontal className="mr-2 h-4 w-4" />
                                                  {t('common.actions', 'Actions')}
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-[200px]">
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
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="hidden md:block rounded-md border overflow-x-auto">
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
                                <TableCell colSpan={visibleColumns.length + 1} className="h-64 text-center p-0">
                                    <EmptyState
                                        icon={Search}
                                        title={t('common.noResults', 'No results found')}
                                        description={t('sessions.noDataDesc', 'Adjust your search filters to find sessions.')}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedItems.map((session) => (
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
                                            <Badge variant={getStatusVariant(session.status) as any} className="capitalize">
                                                {session.status.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover-lift">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="animate-scale-in">
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="hover-lift"
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="hover-lift"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
