import { useState, useMemo, useEffect } from "react"
import {
    Users,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Download,
    Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/KPICard"
import { PersonnelHistoryModal } from "@/components/PersonnelHistoryModal"
import type { Employee } from "@/types"

// Types
type CompetenceStatus = "valid" | "expiring_soon" | "expired" | "not_acquired"

interface CompetenceCell {
    status: CompetenceStatus
    expiryDate?: string
    absenceFlag?: 'none' | 'refresher_required' | 'initial_required'
    absenceDurationMonths?: number
}

interface EmployeeCompetence extends Employee {
    competences: Record<string, CompetenceCell>
}

export function CompetenceDashboard() {
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterDept, setFilterDept] = useState<string>("all")
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    // Data Loading
    const [data, setData] = useState<EmployeeCompetence[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [competenceCodes, setCompetenceCodes] = useState<string[]>([])

    useEffect(() => {
        fetchCompetenceData()
    }, [])

    const fetchCompetenceData = async () => {
        try {
            setIsLoading(true)
            const { api } = await import('@/lib/api')
            const response = await api.get('/competence')
            
            const flatList: any[] = response.data.data || []
            
            // Extract unique codes
            const codes = Array.from(new Set(flatList.map((item: any) => item.competenceCode))).sort() as string[]
            setCompetenceCodes(codes)

            // Aggregate by user
            const usersMap = new Map<string, EmployeeCompetence>()

            flatList.forEach((item: any) => {
                if (!usersMap.has(item.userId)) {
                    usersMap.set(item.userId, {
                        id: item.userId,
                        fullName: item.fullName,
                        organisationId: "",
                        role: "employee",
                        areaOfActivity: item.departmentTag || "General",
                        employmentStart: "",
                        email: item.email,
                        competences: {}
                    } as unknown as EmployeeCompetence)
                }

                const user = usersMap.get(item.userId)!
                user.competences[item.competenceCode] = {
                    status: item.status,
                    expiryDate: item.validUntil,
                    absenceFlag: item.absenceFlag,
                    absenceDurationMonths: item.absenceDurationMonths
                }
            })

            setData(Array.from(usersMap.values()))
        } catch (error) {
            console.error("Failed to fetch competence data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Filter Logic
    const filteredData = useMemo(() => {
        return data.filter(emp => {
            const matchesDept = filterDept === "all" || emp.areaOfActivity === filterDept

            if (!matchesDept) return false
            if (filterStatus === "all") return true

            // Check if employee has ANY competence with the filtered status
            return Object.values(emp.competences).some(c => c.status === filterStatus)
        })
    }, [data, filterStatus, filterDept])

    // KPI Calculations
    const kpis = useMemo(() => {
        let totalValid = 0
        let totalExpiring = 0
        let totalExpired = 0
        let totalCompetences = 0

        data.forEach(emp => {
            Object.values(emp.competences).forEach(c => {
                totalCompetences++
                if (c.status === "valid") totalValid++
                if (c.status === "expiring_soon") totalExpiring++
                if (c.status === "expired") totalExpired++
            })
        })

        const validPercentage = totalCompetences > 0
            ? Math.round((totalValid / totalCompetences) * 100)
            : 0

        return {
            totalPersonnel: data.length,
            validPercentage,
            totalExpiring,
            totalExpired
        }
    }, [data])

    const handleExport = () => {
        const headers = ["Name", "Role", "Department", ...competenceCodes]
        const rows = filteredData.map(emp => [
            emp.fullName,
            emp.role,
            emp.areaOfActivity,
            ...competenceCodes.map((code: string) => {
                const comp = emp.competences[code]
                return comp ? `${comp.status} (${comp.expiryDate || '-'}) ` : "N/A"
            })
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "competence_report.csv"
        a.click()
    }

    const getStatusColor = (status: CompetenceStatus) => {
        switch (status) {
            case "valid": return "bg-emerald-500 hover:bg-emerald-600"
            case "expiring_soon": return "bg-amber-500 hover:bg-amber-600"
            case "expired": return "bg-red-500 hover:bg-red-600"
            default: return "bg-gray-300 hover:bg-gray-400 text-gray-700"
        }
    }

    const getStatusLabel = (status: CompetenceStatus) => {
        switch (status) {
            case "valid": return "Valid"
            case "expiring_soon": return "Expiring"
            case "expired": return "Expired"
            case "not_acquired": return "N/A"
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Personnel"
                    value={kpis.totalPersonnel}
                    icon={Users}
                />
                <KPICard
                    title="Valid Competences"
                    value={`${kpis.validPercentage}%`}
                    icon={CheckCircle}
                    description="Across all departments"
                />
                <KPICard
                    title="Expiring Soon"
                    value={kpis.totalExpiring}
                    icon={AlertTriangle}
                    className="border-amber-200 bg-amber-50"
                    onClick={() => setFilterStatus("expiring_soon")}
                />
                <KPICard
                    title="Expired"
                    value={kpis.totalExpired}
                    icon={XCircle}
                    className="border-red-200 bg-red-50"
                    onClick={() => setFilterStatus("expired")}
                />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterDept} onValueChange={setFilterDept}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            <SelectItem value="Flight Ops">Flight Ops</SelectItem>
                            <SelectItem value="Cabin Crew">Cabin Crew</SelectItem>
                            <SelectItem value="Training Dept">Training Dept</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Employee</TableHead>
                            <TableHead>Role</TableHead>
                            {competenceCodes.map(code => (
                                <TableHead key={code} className="text-center">{code}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map(emp => (
                            <TableRow key={emp.id}>
                                <TableCell className="font-medium">
                                    <button
                                        className="hover:underline text-left"
                                        onClick={() => {
                                            setSelectedEmployee(emp)
                                            setIsHistoryOpen(true)
                                        }}
                                    >
                                        {emp.fullName}
                                    </button>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{emp.role}</TableCell>
                                {competenceCodes.map(code => {
                                    const comp = emp.competences[code] || { status: "not_acquired" as CompetenceStatus }
                                    const hasAbsenceFlag = comp.absenceFlag && comp.absenceFlag !== 'none'
                                    
                                    return (
                                        <TableCell key={code} className="text-center p-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="relative inline-block">
                                                            <Badge
                                                                className={`w-24 justify-center ${getStatusColor(comp.status)}`}
                                                            >
                                                                {getStatusLabel(comp.status)}
                                                            </Badge>
                                                            {hasAbsenceFlag && (
                                                                <div className={`absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm border border-white ${
                                                                    comp.absenceFlag === 'initial_required' ? 'bg-red-600' : 'bg-orange-500'
                                                                }`}>
                                                                    !
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{getStatusLabel(comp.status)}</p>
                                                        {comp.expiryDate && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Expires: {comp.expiryDate}
                                                            </p>
                                                        )}
                                                        {hasAbsenceFlag && (
                                                            <div className="mt-1 pt-1 border-t border-border">
                                                                <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                                                                    <AlertTriangle size={12} />
                                                                    {comp.absenceFlag === 'initial_required' 
                                                                        ? `Initial Training Required (>12m absence)`
                                                                        : `Refresher Required (${comp.absenceDurationMonths}m absence)`
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                        {filteredData.length === 0 && (
                             <TableRow>
                                <TableCell colSpan={competenceCodes.length + 2} className="text-center py-8 text-muted-foreground">
                                    No data found matching current filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <PersonnelHistoryModal
                employee={selectedEmployee}
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
            />
        </div>
    )
}
