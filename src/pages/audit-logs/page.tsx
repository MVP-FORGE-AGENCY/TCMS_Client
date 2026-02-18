import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Loader2, RefreshCw, ChevronDown, ChevronRight, Calendar as CalendarIcon, Download, Search, X } from "lucide-react"

// --- Types ---
interface AuditLog {
    id: string
    action: string
    description: string
    entity: string
    entityId: string
    details: any
    createdAt: string
    user: {
        id: string
        fullName: string
        email: string | null
        role: string
    }
    ipAddress: string
    userAgent: string
}

interface FilterOptions {
    actions: string[]
    actors: { id: string; full_name: string }[]
    entities: string[]
}

// --- Helper Components ---

function AuditLogRow({ log }: { log: AuditLog }) {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const hasDetails = log.details && Object.keys(log.details).length > 0
    
    // Determine badge color based on category/action
    const getActionBadgeVariant = (action: string) => {
        if (action.includes('CREATE') || action.includes('Add')) return 'default' // Blue/Black
        if (action.includes('UPDATE') || action.includes('Modify') || action.includes('Change')) return 'secondary' // Grey
        if (action.includes('DELETE') || action.includes('Remove') || action.includes('Deactivate')) return 'destructive' // Red
        if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'outline'
        return 'outline'
    }

    // Format details for display
    const renderDetails = (details: any) => {
        if (!details) return null;

        // Check for old/new values pattern
        if (details.old_values || details.new_values) {
            return (
                <div className="grid gap-4 md:grid-cols-2">
                    {details.old_values && (
                        <div>
                            <h5 className="text-xs font-semibold text-muted-foreground mb-1">{t("auditLogs.oldValues", "Old Values")}</h5>
                            <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(details.old_values, null, 2)}
                            </pre>
                        </div>
                    )}
                    {details.new_values && (
                        <div>
                            <h5 className="text-xs font-semibold text-muted-foreground mb-1">{t("auditLogs.newValues", "New Values")}</h5>
                            <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(details.new_values, null, 2)}
                            </pre>
                        </div>
                    )}
                    {/* Other metadata */}
                    {Object.keys(details).filter(k => k !== 'old_values' && k !== 'new_values').length > 0 && (
                        <div className="md:col-span-2 mt-2">
                             <h5 className="text-xs font-semibold text-muted-foreground mb-1">{t("auditLogs.metadata", "Metadata")}</h5>
                             <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(
                                    Object.fromEntries(
                                        Object.entries(details).filter(([k]) => k !== 'old_values' && k !== 'new_values')
                                    ), 
                                    null, 
                                    2
                                )}
                            </pre>
                        </div>
                    )}
                </div>
            )
        }

        // Fallback for simple details
        return (
            <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words max-h-[300px]">
                {JSON.stringify(details, null, 2)}
            </pre>
        )
    }

    return (
        <>
            <TableRow 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${isExpanded ? 'bg-muted/50' : ''}`}
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground w-[150px]">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell className="w-[200px]">
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.user?.fullName || 'System'}</span>
                        {log.user?.role && (
                            <Badge variant="secondary" className="w-fit text-[10px] h-4 px-1 mt-0.5">
                                {log.user.role}
                            </Badge>
                        )}
                    </div>
                </TableCell>
                <TableCell className="font-medium">
                     {log.description || log.action}
                </TableCell>
                <TableCell className="w-[150px]">
                    <Badge variant={getActionBadgeVariant(log.action) as any} className="font-mono text-[10px]">
                        {log.action}
                    </Badge>
                </TableCell>
                <TableCell className="w-[150px] text-xs text-muted-foreground hidden md:table-cell">
                    {log.entity}
                </TableCell>
                <TableCell className="w-[50px]">
                    {hasDetails ? (
                         <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent text-muted-foreground">
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </Button>
                    ) : null}
                </TableCell>
            </TableRow>
            {isExpanded && hasDetails && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={6} className="p-0 border-b">
                        <div className="p-4 pl-4 md:pl-12">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                <Search className="w-3 h-3" />
                                {t("auditLogs.changeDetails", "Change Details")}
                                <span className="ml-auto text-[10px] font-normal normal-case break-all">
                                    ID: {log.id} • IP: {log.ipAddress}
                                </span>
                            </h4>
                            <div className="rounded-md border bg-background p-4 shadow-sm">
                                {renderDetails(log.details)}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

function AuditLogCard({ log }: { log: AuditLog }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const hasDetails = log.details && Object.keys(log.details).length > 0

    return (
        <Card className="mb-4">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}</span>
                        <CardTitle className="text-base font-medium">{log.description || log.action}</CardTitle>
                    </div>
                     <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                 <div className="flex flex-col gap-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Actor:</span>
                        <span className="font-medium">{log.user?.fullName}</span>
                        {log.user?.role && <Badge variant="secondary" className="text-[10px] h-4 px-1">{log.user.role}</Badge>}
                    </div>
                 </div>
                 
                 {hasDetails && (
                     <div className="mt-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-between h-8 text-xs border"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? "Hide Details" : "View Details"}
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </Button>
                        {isExpanded && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                            </div>
                        )}
                     </div>
                 )}
            </CardContent>
        </Card>
    )
}

// --- Main Page Component ---

export default function AuditLogsPage() {
    const { t, i18n } = useTranslation()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
    
    // Filters Data
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({ actions: [], actors: [], entities: [] })
    
    // Active Filters
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState("all")
    const [actorFilter, setActorFilter] = useState("all")
    const [entityFilter, setEntityFilter] = useState("all")
    const [dateFrom, setDateFrom] = useState<Date>()
    const [dateTo, setDateTo] = useState<Date>()

    // Fetch available filters on mount
    useEffect(() => {
        api.get('/audit-logs/filters').then(res => {
            setFilterOptions(res.data)
        }).catch(err => console.error("Failed to load filters", err))
    }, [])

    const fetchLogs = async (page = 1) => {
        setIsLoading(true)
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
                lang: i18n.language // Send current language
            })

            if (search) queryParams.append("search", search)
            if (actionFilter && actionFilter !== "all") queryParams.append("action", actionFilter)
            if (actorFilter && actorFilter !== "all") queryParams.append("userId", actorFilter)
            if (entityFilter && entityFilter !== "all") queryParams.append("entity", entityFilter)
            if (dateFrom) queryParams.append("from", dateFrom.toISOString())
            if (dateTo) queryParams.append("to", dateTo.toISOString())

            const response = await api.get(`/audit-logs?${queryParams.toString()}`)
            setLogs(response.data.data)
            setPagination(response.data.pagination)
        } catch (error) {
            console.error("Failed to fetch audit logs", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [search, actionFilter, actorFilter, entityFilter, dateFrom, dateTo, i18n.language]) // Refetch on lang change too

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(newPage)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setActionFilter("all")
        setActorFilter("all")
        setEntityFilter("all")
        setDateFrom(undefined)
        setDateTo(undefined)
    }

    const exportCSV = () => {
        // Implement CSV export in browser from current applied filters
        // Typically would generate a download link. 
        // For now, simpler to fetch all with limit=1000 or similar, but let's just export current page or filtered set if backend supports export.
        // Backend doesn't support CSV stream yet. We can just export visible rows or fetch larger set.
        // Let's plain export visible rows for MVP.
        
        const headers = ['Date', 'Actor', 'Role', 'Action', 'Description', 'Entity', 'IP']
        const rows = logs.map(log => [
            format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
            log.user?.fullName || 'System',
            log.user?.role || '',
            log.action,
            `"${(log.description || '').replace(/"/g, '""')}"`, // Escape quotes
            log.entity,
            log.ipAddress
        ])

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("auditLogs.title", "Audit Trail")}</h1>
                    <p className="text-muted-foreground text-sm">{t("auditLogs.subtitle", "Track all system activities and changes")}</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" size="sm" onClick={exportCSV} disabled={logs.length === 0}>
                        <Download className="h-4 w-4 mr-2" /> {t("common.export", "Export CSV")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.page)}>
                        <RefreshCw className="h-4 w-4 mr-2" /> {t("common.refresh", "Refresh")}
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-muted/20">
                <CardContent className="p-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                         {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={t("common.search", "Search...")}
                                className="pl-8 bg-background"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Date Range Start */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-background",
                                        !dateFrom && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, "PPP") : <span>{t("common.startDate", "Start Date")}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={setDateFrom}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Actor Filter */}
                         <Select value={actorFilter} onValueChange={setActorFilter}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder={t("auditLogs.filterActor", "Actor")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.allActors", "All Actors")}</SelectItem>
                                {filterOptions.actors.map((actor) => (
                                    <SelectItem key={actor.id} value={actor.id}>{actor.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Action Filter */}
                         <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder={t("auditLogs.filterAction", "Action")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.allActions", "All Actions")}</SelectItem>
                                {filterOptions.actions.map((action) => (
                                    <SelectItem key={action} value={action}>{action}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                         {/* Clear Filter */}
                         {(search || actionFilter !== 'all' || actorFilter !== 'all' || entityFilter !== 'all' || dateFrom || dateTo) && (
                            <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                                <X className="h-4 w-4 mr-2" /> {t("common.clearFilters", "Clear")}
                            </Button>
                         )}
                     </div>
                </CardContent>
            </Card>

            <div className="rounded-md border bg-card">
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("auditLogs.date", "Date")}</TableHead>
                                <TableHead>{t("auditLogs.actor", "Actor")}</TableHead>
                                <TableHead>{t("auditLogs.description", "Description")}</TableHead>
                                <TableHead>{t("auditLogs.action", "Action Type")}</TableHead>
                                <TableHead className="hidden md:table-cell">{t("auditLogs.entity", "Entity")}</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {t("auditLogs.noLogs", "No audit logs found matching your criteria.")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <AuditLogRow key={log.id} log={log} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Mobile View */}
                <div className="md:hidden p-4 bg-muted/10">
                    {isLoading ? (
                        <div className="h-24 flex items-center justify-center">
                             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            {t("auditLogs.noLogs", "No audit logs found.")}
                        </div>
                    ) : (
                        logs.map((log) => (
                            <AuditLogCard key={log.id} log={log} />
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {t("common.showingOf", { 
                        from: (pagination.page - 1) * pagination.limit + 1, 
                        to: Math.min(pagination.page * pagination.limit, pagination.total), 
                        total: pagination.total 
                    })}
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1 || isLoading}
                    >
                        {t("common.previous", "Previous")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages || isLoading}
                    >
                        {t("common.next", "Next")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
