import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, Calendar, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { SessionsTable } from "@/components/tables/SessionsTable"
import { SessionForm } from "@/components/forms/SessionForm"
import { RecordResultsForm } from "@/components/forms/RecordResultsForm"
import type { Session, Programme } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function SessionsPage() {
    const { t } = useTranslation()
    const [sessions, setSessions] = useState<Session[]>([])
    const [programmes, setProgrammes] = useState<Programme[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    // Filters
    const [filterProgramme, setFilterProgramme] = useState<string>("")
    const [filterStatus, setFilterStatus] = useState<string>("")
    const [filterDateFrom, setFilterDateFrom] = useState<string>("")
    const [filterDateTo, setFilterDateTo] = useState<string>("")
    const [showFilters, setShowFilters] = useState(false)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isResultsOpen, setIsResultsOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            
            // Build query params for filters
            const params = new URLSearchParams()
            if (filterProgramme) params.append('programmeId', filterProgramme)
            if (filterStatus) params.append('status', filterStatus)
            if (filterDateFrom) params.append('from', filterDateFrom)
            if (filterDateTo) params.append('to', filterDateTo)
            
            const queryString = params.toString() ? `?${params.toString()}` : ''
            
            const [sessionsRes, programmesRes] = await Promise.all([
                api.get(`/sessions${queryString}`),
                api.get("/programmes")
            ])

            // Handle both array and paginated response structure for sessions
            const sessionsData = Array.isArray(sessionsRes.data) ? sessionsRes.data : (sessionsRes.data?.data || [])
            setSessions(Array.isArray(sessionsData) ? sessionsData : [])

            // Handle both array and paginated response structure for programmes
            const programmesData = Array.isArray(programmesRes.data) ? programmesRes.data : (programmesRes.data?.data || [])
            setProgrammes(Array.isArray(programmesData) ? programmesData : [])
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error(t("sessions.toast.loadError", "Failed to load sessions data"))
        } finally {
            setIsLoading(false)
        }
    }

    const clearFilters = () => {
        setFilterProgramme("")
        setFilterStatus("")
        setFilterDateFrom("")
        setFilterDateTo("")
    }

    const hasActiveFilters = filterProgramme || filterStatus || filterDateFrom || filterDateTo

    useEffect(() => {
        fetchData()
    }, [filterProgramme, filterStatus, filterDateFrom, filterDateTo])

    const handleCreateSession = async (values: any) => {
        try {
            await api.post("/sessions", values)
            toast.success(t("sessions.toast.created", "Session scheduled successfully"))
            fetchData()
            setIsCreateOpen(false)
        } catch (error: any) {
            console.error("Failed to create session:", error)
            const { parseApiError } = await import("@/lib/error-utils")
            const errorMessage = parseApiError(error)
            toast.error(errorMessage, { duration: 5000 })
        }
    }

    const handleViewSession = (session: Session) => {
        navigate(`/sessions/${session.id}`)
    }

    const handleRecordResults = (session: Session) => {
        setSelectedSession(session)
        setIsResultsOpen(true)
    }

    const handleCancelSession = async (session: Session) => {
        if (confirm(t("sessions.confirmCancel"))) {
            try {
                await api.patch(`/sessions/${session.id}`, { status: "cancelled" })
                toast.success(t("sessions.toast.cancelled", "Session cancelled"))
                fetchData()
            } catch (error) {
                console.error("Failed to cancel session:", error)
                toast.error(t("sessions.toast.cancelError", "Failed to cancel session"))
            }
        }
    }

    const handleSubmitResults = async (results: any) => {
        if (!selectedSession) return
        try {
            await api.post(`/sessions/${selectedSession.id}/results`, { results })
            toast.success(t("sessions.toast.resultsRecorded", "Results recorded successfully"))
            fetchData()
            setIsResultsOpen(false)
            setSelectedSession(null)
        } catch (error) {
            console.error("Failed to record results:", error)
            toast.error(t("sessions.toast.resultsError", "Failed to record results"))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("sessions.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("sessions.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant={showFilters ? "secondary" : "outline"} 
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="mr-2 h-4 w-4" /> 
                        {t("common.filter", "Filter")}
                        {hasActiveFilters && (
                            <span className="ml-2 rounded-full bg-primary w-2 h-2" />
                        )}
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t("sessions.scheduleSession")}
                    </Button>
                </div>
            </div>

            {showFilters && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.programme")}</label>
                            <Select value={filterProgramme} onValueChange={setFilterProgramme}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("sessions.allProgrammes")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("sessions.allProgrammes")}</SelectItem>
                                    {programmes.map((prog) => (
                                        <SelectItem key={prog.id} value={prog.id}>
                                            {prog.code} - {prog.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.status")}</label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("sessions.allStatuses")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("sessions.allStatuses")}</SelectItem>
                                    <SelectItem value="planned">{t("sessions.statuses.scheduled")}</SelectItem>
                                    <SelectItem value="in_progress">{t("sessions.statuses.in_progress")}</SelectItem>
                                    <SelectItem value="completed">{t("sessions.statuses.completed")}</SelectItem>
                                    <SelectItem value="cancelled">{t("sessions.statuses.cancelled")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.fromDate")}</label>
                            <Input 
                                type="date" 
                                value={filterDateFrom} 
                                onChange={(e) => setFilterDateFrom(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.toDate")}</label>
                            <Input 
                                type="date" 
                                value={filterDateTo} 
                                onChange={(e) => setFilterDateTo(e.target.value)} 
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearFilters}
                            disabled={!hasActiveFilters}
                            className="text-muted-foreground"
                        >
                            <X className="mr-2 h-4 w-4" /> {t("sessions.clearFilters")}
                        </Button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <TableSkeleton columnCount={6} rowCount={10} />
            ) : sessions.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title={t("common.noData")}
                    description={t("common.getStarted")}
                    actionLabel={t("sessions.scheduleSession")}
                    onAction={() => setIsCreateOpen(true)}
                />
            ) : (
                <SessionsTable
                    data={sessions}
                    onViewSession={handleViewSession}
                    onRecordResults={handleRecordResults}
                    onCancelSession={handleCancelSession}
                />
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{t("sessions.scheduleNewSession")}</DialogTitle>
                    </DialogHeader>
                    <SessionForm
                        programmes={programmes}
                        onSubmit={handleCreateSession}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <RecordResultsForm
                session={selectedSession}
                open={isResultsOpen}
                onOpenChange={setIsResultsOpen}
                onSubmit={handleSubmitResults}
            />
        </div>
    )
}
