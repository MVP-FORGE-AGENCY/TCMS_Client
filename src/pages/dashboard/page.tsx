import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Users, BookOpen, AlertTriangle, CheckCircle } from "lucide-react"
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
    const { isLoading: authLoading, isAuthenticated } = useAuth()
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
                    api.get("/employees?limit=100"),
                    api.get("/programmes?isActive=true&limit=100"),
                    api.get("/reports/expiring?withinDays=90"),
                    api.get("/competence?limit=100"),
                    api.get("/sessions?status=completed&limit=100")
                ])

                // Extract results safely
                const employeesRes = results[0].status === 'fulfilled' ? results[0].value : null
                const programmesRes = results[1].status === 'fulfilled' ? results[1].value : null
                const expiringRes = results[2].status === 'fulfilled' ? results[2].value : null
                const competenceRes = results[3].status === 'fulfilled' ? results[3].value : null
                const sessionsRes = results[4].status === 'fulfilled' ? results[4].value : null

                // Log for debugging
                console.log('Dashboard API responses:', {
                    employees: employeesRes?.data,
                    programmes: programmesRes?.data,
                    expiring: expiringRes?.data,
                    competence: competenceRes?.data,
                    sessions: sessionsRes?.data
                })

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
                const programmesData = getDataArray(programmesRes)
                const expiringData = getDataArray(expiringRes)

                console.log('Parsed data:', { 
                    employeesCount: employees.length, 
                    competencesCount: competences.length,
                    sessionsCount: sessions.length,
                    programmesCount: programmesData.length
                })

                // === Calculate Stats ===
                const totalPersonnel = employeesRes?.data?.pagination?.total ?? employees.length
                const activeProgrammes = programmesRes?.data?.pagination?.total ?? programmesData.length
                const expiringCompetences = expiringData.length

                // Calculate compliance rate (valid + expiring_soon / total competences * 100)
                // Expiring competences are still valid until they actually expire
                const validCount = competences.filter(c => c.status === 'valid' || c.status === 'expiring_soon').length
                const complianceRate = competences.length > 0 
                    ? Math.round((validCount / competences.length) * 100 * 10) / 10 
                    : 0

                setStats({
                    totalPersonnel,
                    activeProgrammes,
                    expiringCompetences,
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
        <div className="space-y-6">
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
                    onClick={() => navigate('/programmes')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.activeProgrammes")}</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeProgrammes}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.currentlyActive")}</p>
                    </CardContent>
                </Card>
                <Card 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate('/competence')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.expiringCompetences")}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiringCompetences}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.within90Days")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.complianceRate")}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.complianceRate}%</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.overallCompliance")}</p>
                    </CardContent>
                </Card>
            </div>

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

