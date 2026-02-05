import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { Plus, Calendar, Filter, X, List, ChevronLeft, ChevronRight, Settings2 } from "lucide-react"
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionsTable } from "@/components/tables/SessionsTable"
import { SessionForm } from "@/components/forms/SessionForm"
import { RecordResultsForm } from "@/components/forms/RecordResultsForm"
import type { Session, Curriculum, Employee, CurriculumModule } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"

// Column definitions
const ALL_COLUMNS = [
    { id: 'date', label: 'Date', defaultVisible: true },
    { id: 'curriculum', label: 'Campaign', defaultVisible: true },
    { id: 'module', label: 'Module', defaultVisible: true },
    { id: 'instructor', label: 'Instructor', defaultVisible: true },
    { id: 'location', label: 'Location', defaultVisible: true },
    { id: 'type', label: 'Type', defaultVisible: false },
    { id: 'capacity', label: 'Capacity', defaultVisible: false },
    { id: 'status', label: 'Status', defaultVisible: true },
]

export default function SessionsPage() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const isAuditor = user?.role === 'auditor' || user?.role === 'readonly'
    const [sessions, setSessions] = useState<Session[]>([])
    const [curriculums, setCurriculums] = useState<Curriculum[]>([])
    const [instructors, setInstructors] = useState<Employee[]>([])
    const [modules, setModules] = useState<CurriculumModule[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    // View mode
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

    // Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState<string>("20")
    const [limit, setLimit] = useState(20)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    
    // Infinite Scroll
    const isInfiniteScroll = pageSize === 'all'
    const [loadingMore, setLoadingMore] = useState(false)

    // Filters
    const [filterCurriculum, setFilterCurriculum] = useState<string>("")
    const [filterModule, setFilterModule] = useState<string>("")
    const [filterInstructor, setFilterInstructor] = useState<string>("")
    const [filterStatus, setFilterStatus] = useState<string>("")
    const [filterDateFrom, setFilterDateFrom] = useState<string>("")
    const [filterDateTo, setFilterDateTo] = useState<string>("")
    const [showFilters, setShowFilters] = useState(false)

    // Filter modules based on selected curriculum
    const filteredModules = useMemo(() => {
        if (!filterCurriculum || filterCurriculum === 'all') return modules
        return modules.filter(m => m.curriculumId === filterCurriculum)
    }, [modules, filterCurriculum])
    
    // Reset module filter when curriculum changes
    useEffect(() => {
        if (filterCurriculum && filterCurriculum !== 'all' && filterModule && filterModule !== 'all') {
            const selectedModule = modules.find(m => m.id === filterModule)
            if (selectedModule && selectedModule.curriculumId !== filterCurriculum) {
                setFilterModule('all')
            }
        }
    }, [filterCurriculum, filterModule, modules])

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
    )

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date())
    const [calendarSessions, setCalendarSessions] = useState<Session[]>([])
    const [loadingCalendar, setLoadingCalendar] = useState(false)
    const [calendarCache, setCalendarCache] = useState<Record<string, Session[]>>({})

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isResultsOpen, setIsResultsOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)

    // Infinite scroll observer
    const observer = useRef<IntersectionObserver | null>(null)
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading || loadingMore) return
        if (observer.current) observer.current.disconnect()
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && sessions.length < total) {
                setPage(prevPage => prevPage + 1)
            }
        })
        
        if (node) observer.current.observe(node)
    }, [isLoading, loadingMore, sessions.length, total])

    const fetchData = async (pageNum: number = page, isAppending: boolean = false) => {
        try {
            if (isAppending) {
                setLoadingMore(true)
            } else {
                setIsLoading(true)
            }
            
            // Build query params for filters
            const params = new URLSearchParams()
            if (filterCurriculum && filterCurriculum !== 'all') params.append('curriculumId', filterCurriculum)
            if (filterModule && filterModule !== 'all') params.append('moduleId', filterModule)
            if (filterInstructor && filterInstructor !== 'all') params.append('instructorId', filterInstructor)
            if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus)
            if (filterDateFrom) params.append('from', filterDateFrom)
            if (filterDateTo) params.append('to', filterDateTo)
            params.append('page', pageNum.toString())
            params.append('limit', limit.toString())
            
            const queryString = `?${params.toString()}`
            
            const sessionsRes = await api.get(`/sessions${queryString}`)

            // Handle paginated response
            const sessionsData = sessionsRes.data?.data || []
            const pagination = sessionsRes.data?.pagination || { page: 1, totalPages: 1, total: 0 }
            
            if (isAppending) {
                setSessions(prev => [...prev, ...sessionsData])
            } else {
                setSessions(Array.isArray(sessionsData) ? sessionsData : [])
            }
            
            setTotalPages(pagination.totalPages || 1)
            setTotal(pagination.total || 0)
        } catch (error) {
            console.error("Failed to fetch sessions:", error)
            toast.error(t("sessions.toast.loadError", "Failed to load sessions data"))
        } finally {
            setIsLoading(false)
            setLoadingMore(false)
        }
    }

    const fetchReferenceData = async () => {
        try {
            const [curriculumsRes, employeesRes] = await Promise.all([
                api.get("/curriculums"),
                api.get("/employees")
            ])

            // Handle curriculums
            const curriculumsData = Array.isArray(curriculumsRes.data) ? curriculumsRes.data : (curriculumsRes.data?.data || [])
            setCurriculums(Array.isArray(curriculumsData) ? curriculumsData : [])
            
            // Extract all modules from curriculums
            const allModules: CurriculumModule[] = []
            curriculumsData.forEach((curr: Curriculum) => {
                if (curr.modules && Array.isArray(curr.modules)) {
                    // Inject curriculumId to ensure it's available for filtering
                    const modulesWithId = curr.modules.map((m: CurriculumModule) => ({
                        ...m,
                        curriculumId: curr.id
                    }))
                    allModules.push(...modulesWithId)
                }
            })
            setModules(allModules)

            // Handle employees (filter to instructors)
            const employeesData = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data?.data || [])
            setInstructors(employeesData.filter((e: Employee) => 
                e.role === 'instructor' || e.role === 'training_manager' || e.role === 'admin'
            ))
        } catch (error) {
            console.error("Failed to fetch reference data:", error)
        }
    }

    const clearFilters = () => {
        setFilterCurriculum("")
        setFilterModule("")
        setFilterInstructor("")
        setFilterStatus("")
        setFilterDateFrom("")
        setFilterDateTo("")
        setPage(1)
    }

    const hasActiveFilters = filterCurriculum || filterModule || filterInstructor || filterStatus || filterDateFrom || filterDateTo

    useEffect(() => {
        fetchReferenceData()
    }, [])

    useEffect(() => {
        if (viewMode === 'table') {
            // If infinite scroll and page > 1, append. Otherwise replace.
            const isAppend = isInfiniteScroll && page > 1
            fetchData(page, isAppend)
        }
    }, [filterCurriculum, filterModule, filterInstructor, filterStatus, filterDateFrom, filterDateTo, page, viewMode, limit])

    // Handle Limit Change
    const handlePageSizeChange = (newValue: string) => {
        setPageSize(newValue)
        setPage(1)
        if (newValue === 'all') {
            setLimit(50) // Use reasonable chunk size for infinite scroll
        } else {
            setLimit(parseInt(newValue))
        }
    }

    // Fetch all sessions for calendar view when calendar is shown or month changes
    const fetchCalendarData = async () => {
        // Create cache key from month + filters
        const monthKey = format(calendarDate, 'yyyy-MM')
        const filterKey = `${monthKey}-${filterCurriculum}-${filterModule}-${filterInstructor}-${filterStatus}`
        
        // Check if we have cached data for this month + filter combo
        if (calendarCache[filterKey]) {
            setCalendarSessions(calendarCache[filterKey])
            return
        }

        try {
            setLoadingCalendar(true)
            
            // Build query params for filters - fetch sessions for the entire visible month
            const params = new URLSearchParams()
            if (filterCurriculum && filterCurriculum !== 'all') params.append('curriculumId', filterCurriculum)
            if (filterModule && filterModule !== 'all') params.append('moduleId', filterModule)
            if (filterInstructor && filterInstructor !== 'all') params.append('instructorId', filterInstructor)
            if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus)
            
            // Set date range to the visible month
            const monthStart = startOfMonth(calendarDate)
            const monthEnd = endOfMonth(calendarDate)
            params.append('from', format(monthStart, 'yyyy-MM-dd'))
            params.append('to', format(monthEnd, 'yyyy-MM-dd'))
            
            // Fetch all sessions for the month (reasonable limit)
            params.append('limit', '200')
            
            const queryString = `?${params.toString()}`
            const sessionsRes = await api.get(`/sessions${queryString}`)

            const sessionsData = sessionsRes.data?.data || []
            const sessionsArray = Array.isArray(sessionsData) ? sessionsData : []
            
            // Store in cache
            setCalendarCache(prev => ({ ...prev, [filterKey]: sessionsArray }))
            setCalendarSessions(sessionsArray)
        } catch (error) {
            console.error("Failed to fetch calendar sessions:", error)
        } finally {
            setLoadingCalendar(false)
        }
    }

    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchCalendarData()
        }
    }, [viewMode, calendarDate, filterCurriculum, filterModule, filterInstructor, filterStatus])

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

    // Calendar view helpers
    const calendarDays = useMemo(() => {
        const start = startOfMonth(calendarDate)
        const end = endOfMonth(calendarDate)
        return eachDayOfInterval({ start, end })
    }, [calendarDate])

    const getSessionsForDay = (day: Date) => {
        return calendarSessions.filter(s => isSameDay(new Date(s.dateStart), day))
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planned': return 'bg-blue-500'
            case 'in_progress': return 'bg-amber-500'
            case 'completed': return 'bg-green-500'
            case 'cancelled': return 'bg-gray-400'
            default: return 'bg-gray-300'
        }
    }

    const toggleColumn = (columnId: string) => {
        setVisibleColumns(prev => 
            prev.includes(columnId) 
                ? prev.filter(c => c !== columnId)
                : [...prev, columnId]
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t("sessions.title")}</h1>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {t("nav.training")}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t("sessions.subtitle")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select value={pageSize} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder={t("sessions.rowsPerPage")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">{t("sessions.showAll")}</SelectItem>
                                </SelectContent>
                    </Select>

                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'calendar')}>
                        <TabsList>
                            <TabsTrigger value="table">
                                <List className="h-4 w-4 mr-1" />
                                {t("common.table", "Table")}
                            </TabsTrigger>
                            <TabsTrigger value="calendar">
                                <Calendar className="h-4 w-4 mr-1" />
                                {t("common.calendar", "Calendar")}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
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
                    {viewMode === 'table' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t("common.columns", "Columns")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {ALL_COLUMNS.map(col => (
                                    <DropdownMenuCheckboxItem
                                        key={col.id}
                                        checked={visibleColumns.includes(col.id)}
                                        onCheckedChange={() => toggleColumn(col.id)}
                                    >
                                        {t(`sessions.${col.id}`, col.label)}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {!isAuditor && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t("sessions.scheduleSession")}
                    </Button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.curriculum", "Curriculum")}</label>
                            <Select value={filterCurriculum} onValueChange={(v) => { setFilterCurriculum(v); setPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("sessions.allCurriculums", "All Curriculums")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("sessions.allCurriculums", "All Curriculums")}</SelectItem>
                                    {curriculums.map((curr) => (
                                        <SelectItem key={curr.id} value={curr.id}>
                                            {curr.code} - {curr.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.module", "Module")}</label>
                            <Select value={filterModule} onValueChange={(v) => { setFilterModule(v); setPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("sessions.allModules", "All Modules")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("sessions.allModules", "All Modules")}</SelectItem>
                                    {filteredModules.map((mod) => (
                                        <SelectItem key={`${mod.curriculumId}-${mod.id}`} value={mod.id}>
                                            {mod.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.instructor", "Instructor")}</label>
                            <Select value={filterInstructor} onValueChange={(v) => { setFilterInstructor(v); setPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("sessions.allInstructors", "All Instructors")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("sessions.allInstructors", "All Instructors")}</SelectItem>
                                    {instructors.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.status")}</label>
                            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
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
                                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("sessions.toDate")}</label>
                            <Input 
                                type="date" 
                                value={filterDateTo} 
                                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} 
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

            {viewMode === 'table' ? (
                <>
                    {isLoading ? (
                        <TableSkeleton columnCount={6} rowCount={10} />
                    ) : sessions.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title={t("common.noData")}
                            description={t("common.getStarted")}
                            actionLabel={!isAuditor ? t("sessions.scheduleSession") : undefined}
                            onAction={!isAuditor ? () => setIsCreateOpen(true) : undefined}
                        />
                    ) : (
                        <>
                            <SessionsTable
                                data={sessions}
                                visibleColumns={visibleColumns}
                                onViewSession={handleViewSession}
                                onRecordResults={handleRecordResults}
                                onCancelSession={handleCancelSession}
                            />
                            
                            
                            {/* Pagination or Infinite Scroll Loader */}
                            {isInfiniteScroll ? (
                                <div className="py-4 text-center">
                                    {loadingMore && (
                                        <div className="py-4 text-center text-sm text-muted-foreground">
                                            {t("sessions.loadingMore")}
                                        </div>
                                    )}
                                    <div ref={lastElementRef} className="h-4" />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Showing {sessions.length} of {total} sessions
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        {t("common.showingOf", "Showing {{from}} to {{to}} of {{total}}", {
                                            from: (page - 1) * limit + 1,
                                            to: Math.min(page * limit, total),
                                            total
                                        })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            {t("common.previous", "Previous")}
                                        </Button>
                                        <span className="text-sm px-2">
                                            {page} / {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                        >
                                            {t("common.next", "Next")}
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                /* Calendar View */
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <Button variant="outline" size="sm" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-center">
                                <h2 className="text-lg font-semibold">
                                    {format(calendarDate, 'MMMM yyyy')}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {loadingCalendar ? t("common.loading", "Loading...") : `${calendarSessions.length} sessions`}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Day headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                            
                            {/* Empty cells for days before the first of the month */}
                            {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[80px]" />
                            ))}
                            
                            {/* Calendar days */}
                            {calendarDays.map(day => {
                                const daySessions = getSessionsForDay(day)
                                const isToday = isSameDay(day, new Date())
                                
                                return (
                                    <div 
                                        key={day.toISOString()} 
                                        className={`min-h-[80px] border rounded-md p-1 ${
                                            isToday ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                                        } ${!isSameMonth(day, calendarDate) ? 'opacity-50' : ''}`}
                                    >
                                        <div className="text-xs font-medium mb-1">
                                            {format(day, 'd')}
                                        </div>
                                        <div className="space-y-1 max-h-[60px] overflow-y-auto">
                                            {daySessions.slice(0, 3).map(session => (
                                                <div 
                                                    key={session.id}
                                                    className={`text-[10px] p-1 rounded cursor-pointer truncate text-white ${getStatusColor(session.status)}`}
                                                    onClick={() => handleViewSession(session)}
                                                    title={`${session.curriculumModule?.name || session.programme?.name || 'Session'} - ${session.location || ''}`}
                                                >
                                                    {format(new Date(session.dateStart), 'HH:mm')} {session.curriculumModule?.name || session.programme?.code || ''}
                                                </div>
                                            ))}
                                            {daySessions.length > 3 && (
                                                <Badge variant="secondary" className="text-[10px]">
                                                    +{daySessions.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex gap-4 mt-4 pt-4 border-t text-xs">
                            <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-slate-500"></span>
                            <span className="text-xs text-muted-foreground">{t("sessions.legend.planned")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                            <span className="text-xs text-muted-foreground">{t("sessions.legend.inProgress")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-green-500"></span>
                            <span className="text-xs text-muted-foreground">{t("sessions.legend.completed")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-red-500"></span>
                            <span className="text-xs text-muted-foreground">{t("sessions.legend.cancelled")}</span>
                        </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{t("sessions.scheduleNewSession")}</DialogTitle>
                    </DialogHeader>
                    <SessionForm
                        curriculums={curriculums}
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
