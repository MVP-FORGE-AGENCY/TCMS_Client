import { useState, useMemo } from "react"
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

// Mock Data Types
type CompetenceStatus = "valid" | "expiring" | "expired" | "not_acquired"

interface CompetenceCell {
    status: CompetenceStatus
    expiryDate?: string
}

interface EmployeeCompetence extends Employee {
    competences: Record<string, CompetenceCell>
}

// Mock Data
const COMPETENCE_CODES = ["BRK-MEAS", "FIRE-SAF", "CRM-INIT", "DG-AWR", "SEC-TRN"]

const MOCK_DATA: EmployeeCompetence[] = [
    {
        id: "1",
        fullName: "Captain John Smith",
        organisationId: "Acme Aviation",
        role: "instructor",
        areaOfActivity: "Flight Ops",
        employmentStart: "2020-01-01",
        competences: {
            "BRK-MEAS": { status: "valid", expiryDate: "2025-06-15" },
            "FIRE-SAF": { status: "expiring", expiryDate: "2024-01-20" },
            "CRM-INIT": { status: "valid", expiryDate: "2026-01-01" },
            "DG-AWR": { status: "valid", expiryDate: "2025-12-31" },
            "SEC-TRN": { status: "valid", expiryDate: "2025-03-10" },
        }
    },
    {
        id: "2",
        fullName: "Jane Doe",
        organisationId: "Acme Aviation",
        role: "trainee",
        areaOfActivity: "Cabin Crew",
        employmentStart: "2023-05-15",
        competences: {
            "BRK-MEAS": { status: "not_acquired" },
            "FIRE-SAF": { status: "valid", expiryDate: "2024-11-15" },
            "CRM-INIT": { status: "expired", expiryDate: "2023-12-01" },
            "DG-AWR": { status: "not_acquired" },
            "SEC-TRN": { status: "valid", expiryDate: "2024-09-20" },
        }
    },
    {
        id: "3",
        fullName: "Robert Brown",
        organisationId: "Global Wings",
        role: "manager",
        areaOfActivity: "Training Dept",
        employmentStart: "2019-11-01",
        competences: {
            "BRK-MEAS": { status: "valid", expiryDate: "2025-01-01" },
            "FIRE-SAF": { status: "valid", expiryDate: "2025-02-28" },
            "CRM-INIT": { status: "valid", expiryDate: "2025-05-10" },
            "DG-AWR": { status: "expiring", expiryDate: "2024-02-15" },
            "SEC-TRN": { status: "expired", expiryDate: "2023-10-30" },
        }
    },
]

export function CompetenceDashboard() {
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [filterDept, setFilterDept] = useState<string>("all")
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    // Filter Logic
    const filteredData = useMemo(() => {
        return MOCK_DATA.filter(emp => {
            const matchesDept = filterDept === "all" || emp.areaOfActivity === filterDept

            if (!matchesDept) return false
            if (filterStatus === "all") return true

            // Check if employee has ANY competence with the filtered status
            return Object.values(emp.competences).some(c => c.status === filterStatus)
        })
    }, [filterStatus, filterDept])

    // KPI Calculations
    const kpis = useMemo(() => {
        let totalValid = 0
        let totalExpiring = 0
        let totalExpired = 0
        let totalCompetences = 0

        MOCK_DATA.forEach(emp => {
            Object.values(emp.competences).forEach(c => {
                totalCompetences++
                if (c.status === "valid") totalValid++
                if (c.status === "expiring") totalExpiring++
                if (c.status === "expired") totalExpired++
            })
        })

        const validPercentage = totalCompetences > 0
            ? Math.round((totalValid / totalCompetences) * 100)
            : 0

        return {
            totalPersonnel: MOCK_DATA.length,
            validPercentage,
            totalExpiring,
            totalExpired
        }
    }, [])

    const handleExport = () => {
        const headers = ["Name", "Role", "Department", ...COMPETENCE_CODES]
        const rows = filteredData.map(emp => [
            emp.fullName,
            emp.role,
            emp.areaOfActivity,
            ...COMPETENCE_CODES.map(code => {
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
            case "expiring": return "bg-amber-500 hover:bg-amber-600"
            case "expired": return "bg-red-500 hover:bg-red-600"
            default: return "bg-gray-300 hover:bg-gray-400 text-gray-700"
        }
    }

    const getStatusLabel = (status: CompetenceStatus) => {
        switch (status) {
            case "valid": return "Valid"
            case "expiring": return "Expiring"
            case "expired": return "Expired"
            case "not_acquired": return "N/A"
        }
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
                    onClick={() => setFilterStatus("expiring")}
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
                            <SelectItem value="expiring">Expiring Soon</SelectItem>
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
                            {COMPETENCE_CODES.map(code => (
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
                                {COMPETENCE_CODES.map(code => {
                                    const comp = emp.competences[code] || { status: "not_acquired" }
                                    return (
                                        <TableCell key={code} className="text-center p-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge
                                                            className={`w-24 justify-center ${getStatusColor(comp.status)}`}
                                                        >
                                                            {getStatusLabel(comp.status)}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{getStatusLabel(comp.status)}</p>
                                                        {comp.expiryDate && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Expires: {comp.expiryDate}
                                                            </p>
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
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
