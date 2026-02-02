import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { format } from "date-fns"
import { Loader2, RefreshCw, ChevronDown, ChevronRight } from "lucide-react"

// Helper component for expandable rows
function AuditLogRow({ log }: { log: any }) {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const hasDetails = log.details && Object.keys(log.details).length > 0
    
    // Determine badge color
    const getActionBadgeVariant = (action: string) => {
        switch (action) {
            case 'CREATE': return 'default'
            case 'UPDATE': return 'secondary'
            case 'DELETE': return 'destructive'
            case 'READ': return 'outline'
            default: return 'outline'
        }
    }

    return (
        <>
            <TableRow 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${isExpanded ? 'bg-muted/50' : ''}`}
                onClick={() => hasDetails && setIsExpanded(!isExpanded)}
            >
                <TableCell className="whitespace-nowrap font-medium text-xs">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.user?.fullName || 'System'}</span>
                        <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action) as any}>
                        {log.action}
                    </Badge>
                </TableCell>
                <TableCell className="text-sm font-mono">
                    {log.entity}
                    {log.entityId && <span className="block text-[10px] text-muted-foreground truncate max-w-[100px]">{log.entityId}</span>}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    {hasDetails ? (
                         <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent text-muted-foreground">
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            <span className="ml-1 text-xs">{t("auditLogs.viewDetails")}</span>
                        </Button>
                    ) : '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {log.ipAddress || '-'}
                </TableCell>
            </TableRow>
            {isExpanded && hasDetails && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={6} className="p-0">
                        <div className="p-4 pl-4 md:pl-12 border-b">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                {t("auditLogs.changeDetails")}
                            </h4>
                            <div className="rounded-md border bg-background/50 p-2 overflow-x-auto">
                                <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

export default function AuditLogsPage() {
    const { t } = useTranslation()
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
    
    // Filters
    const [actionFilter, setActionFilter] = useState<string>("all")
    const [entityFilter] = useState<string>("")

    const fetchLogs = async (page = 1) => {
        setIsLoading(true)
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: pagination.limit.toString(),
            })

            if (actionFilter && actionFilter !== "all") queryParams.append("action", actionFilter)
            if (entityFilter) queryParams.append("entity", entityFilter)

            const response = await api.get(`/audit-logs?${queryParams.toString()}`)
            setLogs(response.data.data)
            setPagination(response.data.pagination)
        } catch (error) {
            console.error("Failed to fetch audit logs", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs(1)
    }, [actionFilter])

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(newPage)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("auditLogs.title")}</h1>
                    <p className="text-muted-foreground text-sm">{t("auditLogs.subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.page)}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <CardTitle className="text-lg">{t("auditLogs.header")}</CardTitle>
                        <div className="flex gap-2 items-center">
                            <div className="w-[150px]">
                                <Select value={actionFilter} onValueChange={setActionFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("auditLogs.filterAction")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t("auditLogs.allActions")}</SelectItem>
                                        <SelectItem value="CREATE">{t("auditLogs.actions.CREATE")}</SelectItem>
                                        <SelectItem value="UPDATE">{t("auditLogs.actions.UPDATE")}</SelectItem>
                                        <SelectItem value="DELETE">{t("auditLogs.actions.DELETE")}</SelectItem>
                                        <SelectItem value="READ">{t("auditLogs.actions.READ")}</SelectItem>
                                        <SelectItem value="GENERATE_REPORT">{t("auditLogs.actions.GENERATE_REPORT")}</SelectItem>
                                        <SelectItem value="LOGIN">{t("auditLogs.actions.LOGIN")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("auditLogs.date")}</TableHead>
                                    <TableHead>{t("auditLogs.user")}</TableHead>
                                    <TableHead>{t("auditLogs.action")}</TableHead>
                                    <TableHead>{t("auditLogs.entity")}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t("auditLogs.details")}</TableHead>
                                    <TableHead className="hidden md:table-cell">{t("auditLogs.ipAddress")}</TableHead>
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
                                            {t("auditLogs.noLogs")}
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

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <div className="flex-1 text-sm text-muted-foreground">
                           {t("common.showingOf", "Page {{current}} of {{total}}", { current: pagination.page, total: pagination.totalPages })}
                        </div>
                        <div className="space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1 || isLoading}
                            >
                                {t("common.previous")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages || isLoading}
                            >
                                {t("common.next")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
