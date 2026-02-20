
import { useState, useEffect, useMemo } from "react"
import { ComplianceDetails } from "@/components/dashboard/ComplianceDetails"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Users, BookOpen, AlertTriangle, CheckCircle, AlertCircle, ShieldAlert, ChevronRight } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { MyActions } from "@/components/dashboard/MyActions"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

// Role display name mapping
const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    training_manager: "Training Manager",
    instructor: "Instructor",
    employee: "Employee",
    assessor: "Assessor",
    auditor: "Auditor",
}

interface CompetenceItem {
    departmentTag?: string | null
    status: string
}

interface EmployeeItem {
    role: string
}

interface SessionItem {
    dateStart: string
    status: string
}

export default function DashboardPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { isLoading: authLoading, isAuthenticated, user } = useAuth()
    const isManagerOrAdmin = ['admin', 'training_manager'].includes(user?.role || '')
    
    // Modal State
    const [showComplianceDetails, setShowComplianceDetails] = useState(false)
    const [complianceStats, setComplianceStats] = useState({
        totalCompetences: 0,
        validCount: 0,
        expiredCount: 0,
        expiringCount: 0,
        complianceRate: 0
    })

    const [stats, setStats] = useState({
        totalPersonnel: 0,
        activeProgrammes: 0,
        expiringCompetences: 0,
        complianceRate: 0
    })

    // Chart data states
    const [departmentData, setDepartmentData] = useState<Array<{ name: string; valid: number; expiring: number; expired: number }>>([])
    const [roleData, setRoleData] = useState<Array<{ name: string; value: number }>>([])
    const [trainingTrendData, setTrainingTrendData] = useState<Array<{ month: string; completed: number }>>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Wait for auth to be ready before fetching data
        if (authLoading || !isAuthenticated) {
            return
        }

        const fetchDashboardData = async () => {
            try {
                setIsLoading(true)
                
                // Fetch all data in parallel with allSettled for resilience
                // Note: API max limit is 100, so we use that
                const results = await Promise.allSettled([
                    api.get("/employees", { params: { limit: 100, excludeExternal: true } }),
                    api.get("/campaigns"),
                    api.get("/reports/expiring", { params: { withinDays: 90 } }),
                    api.get("/competence", { params: { limit: 100 } }),
                    api.get("/sessions", { params: { status: 'completed', limit: 100 } })
                ])

                // Extract results safely
                const employeesRes = results[0].status === 'fulfilled' ? results[0].value : null
                const campaignsRes = results[1].status === 'fulfilled' ? results[1].value : null
                const expiringRes = results[2].status === 'fulfilled' ? results[2].value : null
                const competenceRes = results[3].status === 'fulfilled' ? results[3].value : null
                const sessionsRes = results[4].status === 'fulfilled' ? results[4].value : null

                // Parse responses - handle both { data: [...] } and direct array formats
                const getDataArray = (res: { data: { data?: unknown[] } | unknown[] } | null): unknown[] => {
                    if (!res?.data) return []
                    // If res.data is an array directly
                    if (Array.isArray(res.data)) return res.data
                    // If res.data.data is an array (paginated format)
                    if (Array.isArray(res.data.data)) return res.data.data
                    return []
                }

                const employees = getDataArray(employeesRes) as EmployeeItem[]
                const competences = getDataArray(competenceRes) as CompetenceItem[]
                const sessions = getDataArray(sessionsRes) as SessionItem[]
                const campaignsData = getDataArray(campaignsRes)
                const expiringData = getDataArray(expiringRes)

                // === Calculate Stats ===
                // Use explicit summary from API if available, otherwise fallback
                // Cast to any to avoid TS errors with inferred types
                const resAny = competenceRes as any
                // Fix: Access data properties from the response data, not the response object itself
                // The structure is res.data.summary and res.data.pagination
                const summary = resAny?.data?.summary || { valid: 0, expiringSoon: 0, expired: 0 }
                
                const totalPersonnel = employeesRes?.data?.pagination?.total ?? employees.length
                const activeProgrammes = (campaignsData as Array<{ status?: string }>).filter(c => c.status === 'active').length
                
                const validCount = summary.valid
                const expiringStatusCount = summary.expiringSoon
                const expiredCount = summary.expired
                const totalCompetences = resAny?.data?.pagination?.total ?? competences.length

                // For the card display:
                // If we have expired items, we want to highlight them.
                const expiringCompetences = expiringData.length

                const complianceRate = totalCompetences > 0 
                    ? Math.round(((validCount + expiringStatusCount) / totalCompetences) * 100 * 10) / 10 
                    : 0

                setStats({
                    totalPersonnel,
                    activeProgrammes,
                    expiringCompetences,
                    complianceRate
                })

                setComplianceStats({
                    totalCompetences,
                    validCount: validCount + expiringStatusCount,
                    expiringCount: expiringStatusCount,
                    expiredCount: expiredCount,
                    complianceRate
                })

                // === Competence Status by Department (Bar Chart) ===
                const deptMap = new Map<string, { valid: number; expiring: number; expired: number }>()
                
                competences.forEach((comp) => {
                    const dept = comp.departmentTag || "General"
                    if (!deptMap.has(dept)) {
                        deptMap.set(dept, { valid: 0, expiring: 0, expired: 0 })
                    }
                    const entry = deptMap.get(dept)!
                    if (comp.status === 'valid') entry.valid++
                    else if (comp.status === 'expiring_soon') entry.expiring++
                    else if (comp.status === 'expired') entry.expired++
                })

                const deptChartData = Array.from(deptMap.entries())
                    .map(([name, counts]) => ({ name, ...counts }))
                    .sort((a, b) => (b.valid + b.expiring + b.expired) - (a.valid + a.expiring + a.expired))
                    .slice(0, 6) // Top 6 departments

                setDepartmentData(deptChartData)

                // === Personnel Distribution by Role (Pie Chart) ===
                const roleMap = new Map<string, number>()
                
                employees.forEach((emp) => {
                    const role = emp.role || "employee"
                    roleMap.set(role, (roleMap.get(role) || 0) + 1)
                })

                const roleChartData = Array.from(roleMap.entries())
                    .map(([role, count]) => ({
                        name: ROLE_LABELS[role] || role,
                        value: count
                    }))
                    .sort((a, b) => b.value - a.value)

                setRoleData(roleChartData)

                // === Training Completion Trend (Line Chart - Last 6 months) ===
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                const today = new Date()
                const trendMap = new Map<string, number>()

                // Initialize last 6 months with 0
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    trendMap.set(key, 0)
                }

                // Count completed sessions by month
                sessions.forEach((session) => {
                    if (session.dateStart) {
                        const date = new Date(session.dateStart)
                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                        if (trendMap.has(key)) {
                            trendMap.set(key, (trendMap.get(key) || 0) + 1)
                        }
                    }
                })

                const trendChartData = Array.from(trendMap.entries())
                    .map(([key, count]) => {
                        const [_year, month] = key.split('-')
                        return {
                            month: monthNames[parseInt(month) - 1],
                            completed: count
                        }
                    })

                setTrainingTrendData(trendChartData)

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [authLoading, isAuthenticated])

    // Memoized role data for stable rendering
    const stableRoleData = useMemo(() => roleData, [roleData])

    if (isLoading || authLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-xl max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("dashboard.subtitle")}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departmentData.map(d => (
                                <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select defaultValue="6m">
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Time Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1m">Last Month</SelectItem>
                            <SelectItem value="3m">Last 3 Months</SelectItem>
                            <SelectItem value="6m">Last 6 Months</SelectItem>
                            <SelectItem value="1y">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* My Actions - Priority Task List */}
            <MyActions />

            {/* Expired Competences Alert Banner */}
            {isManagerOrAdmin && complianceStats.expiredCount > 0 && (
                <div className="relative overflow-hidden rounded-xl border border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 dark:from-red-950/40 dark:via-red-950/30 dark:to-orange-950/20 p-4 animate-fade-in">
                    {/* Animated background pulse */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent animate-pulse" />
                    <div className="relative flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 ring-4 ring-red-200/50 dark:ring-red-800/30">
                            <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
                                    {t('dashboard.expiredAlert', '⚠️ Expired Competences Detected')}
                                </h3>
                                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/60 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-700">
                                    {complianceStats.expiredCount}
                                </span>
                            </div>
                            <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5">
                                {t('dashboard.expiredAlertDesc', 'There are competences that have expired and require immediate attention. Schedule training or reassessment to restore compliance.')}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="shrink-0 bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600 shadow-lg shadow-red-500/25"
                            onClick={() => navigate('/competence?status=expired')}
                        >
                            {t('dashboard.reviewExpired', 'Review Now')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate('/personnel')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.totalPersonnel")}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPersonnel}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.activeEmployees")}</p>
                    </CardContent>
                </Card>
                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate('/campaigns')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.activeCampaigns", "Active Campaigns")}</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeProgrammes}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.currentlyActive")}</p>
                    </CardContent>
                </Card>
                <Card 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        complianceStats.expiredCount > 0 
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                            : ""
                    }`}
                    onClick={() => navigate('/competence')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${
                            complianceStats.expiredCount > 0 ? "text-red-700 dark:text-red-400" : ""
                        }`}>
                            {complianceStats.expiredCount > 0 ? t("dashboard.expiredCompetences") : t("dashboard.expiringCompetences")}
                        </CardTitle>
                        {complianceStats.expiredCount > 0 ? (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${
                             complianceStats.expiredCount > 0 ? "text-red-700 dark:text-red-400" : ""
                        }`}>
                            {complianceStats.expiredCount > 0 ? complianceStats.expiredCount : stats.expiringCompetences}
                        </div>
                        <p className={`text-xs ${
                            complianceStats.expiredCount > 0 
                                ? "text-red-600/80 dark:text-red-400/80" 
                                : "text-muted-foreground"
                        }`}>
                            {complianceStats.expiredCount > 0 
                                ? t("competence.actionRequired", "Action Required") 
                                : t("dashboard.within90Days")}
                        </p>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        stats.complianceRate === 0 || stats.complianceRate < 50 
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
                            : ""
                    }`}
                    onClick={() => setShowComplianceDetails(true)}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${
                            stats.complianceRate === 0 || stats.complianceRate < 50 ? "text-red-700 dark:text-red-400" : ""
                        }`}>
                            {t("dashboard.complianceRate")}
                        </CardTitle>
                        <CheckCircle className={`h-4 w-4 ${
                            stats.complianceRate === 0 || stats.complianceRate < 50 
                                ? "text-red-600 dark:text-red-500" 
                                : "text-green-500"
                        }`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${
                            stats.complianceRate === 0 || stats.complianceRate < 50 ? "text-red-700 dark:text-red-400" : ""
                        }`}>
                            {stats.complianceRate}%
                        </div>
                        <p className={`text-xs ${
                            stats.complianceRate === 0 || stats.complianceRate < 50 
                                ? "text-red-600/80 dark:text-red-400/80" 
                                : "text-muted-foreground"
                        }`}>
                            {t("dashboard.overallCompliance")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <ComplianceDetails 
                open={showComplianceDetails} 
                onOpenChange={setShowComplianceDetails}
                stats={complianceStats}
            />

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>{t("dashboard.competenceStatusByDepartment")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {departmentData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={departmentData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="valid" name={t("dashboard.valid")} fill="#22c55e" />
                                    <Bar dataKey="expiring" name={t("dashboard.expiring")} fill="#f59e0b" />
                                    <Bar dataKey="expired" name={t("dashboard.expired")} fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                No department data available
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>{t("dashboard.personnelDistribution")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stableRoleData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={stableRoleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {stableRoleData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                                No personnel data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("dashboard.trainingCompletionTrend")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {trainingTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trainingTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line 
                                    type="monotone" 
                                    dataKey="completed" 
                                    stroke="#8884d8" 
                                    strokeWidth={2}
                                    dot={{ fill: '#8884d8', r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                            No training data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
