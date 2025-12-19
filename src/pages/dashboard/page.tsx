import { useState, useEffect } from "react"
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
// import { toast } from "sonner"

// Mock Data for Charts (kept as mock for now as API lacks aggregation endpoints)
const DEPARTMENT_DATA = [
    { name: "Flight Ops", valid: 45, expiring: 5, expired: 2 },
    { name: "Cabin Crew", valid: 80, expiring: 12, expired: 5 },
    { name: "Ground Ops", valid: 30, expiring: 3, expired: 1 },
    { name: "Maintenance", valid: 25, expiring: 2, expired: 0 },
]

const TRAINING_TREND_DATA = [
    { month: "Jan", completed: 12 },
    { month: "Feb", completed: 19 },
    { month: "Mar", completed: 15 },
    { month: "Apr", completed: 22 },
    { month: "May", completed: 28 },
    { month: "Jun", completed: 25 },
]

const ROLE_DATA = [
    { name: "Pilots", value: 52 },
    { name: "Cabin Crew", value: 97 },
    { name: "Instructors", value: 15 },
    { name: "Admin", value: 8 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DashboardPage() {
    const { t } = useTranslation()
    const [stats, setStats] = useState({
        totalPersonnel: 0,
        activeProgrammes: 0,
        expiringCompetences: 0,
        complianceRate: 94.2 // Mocked for now
    })

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [employeesRes, programmesRes, expiringRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/programmes?isActive=true"),
                    api.get("/reports/expiring?withinDays=30")
                ])

                setStats({
                    totalPersonnel: employeesRes.data.length,
                    activeProgrammes: programmesRes.data.length,
                    expiringCompetences: expiringRes.data.length,
                    complianceRate: 94.2
                })
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error)
                // Don't show toast on dashboard to avoid annoyance, just log
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("dashboard.subtitle")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            <SelectItem value="flight-ops">Flight Ops</SelectItem>
                            <SelectItem value="cabin-crew">Cabin Crew</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select defaultValue="6m">
                        <SelectTrigger className="w-[180px]">
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.totalPersonnel")}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPersonnel}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.activeEmployees")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.activeProgrammes")}</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeProgrammes}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.currentlyActive")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.expiringCompetences")}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiringCompetences}</div>
                        <p className="text-xs text-muted-foreground">{t("dashboard.within30Days")}</p>
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t("dashboard.competenceStatusByDepartment")}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={DEPARTMENT_DATA}>
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
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>{t("dashboard.personnelDistribution")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={ROLE_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {ROLE_DATA.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("dashboard.trainingCompletionTrend")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={TRAINING_TREND_DATA}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="completed" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
