import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
// import type { CompetenceData } from "@/types" // Ensure types exist or define locally
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, CheckCircle, XCircle, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"

// Define types locally if not yet in global types
interface CompetenceItem {
    userId: string
    fullName: string
    departmentTag?: string
    competenceType: 'training' | 'proficiency'
    competenceCode: string
    competenceName: string
    status: 'valid' | 'expiring_soon' | 'expired' | 'not_acquired'
    validUntil: string | null
    lastCompletionDate: string | null
}

interface CompetenceSummary {
    valid: number
    expiringSoon: number
    expired: number
    notAcquired: number
}

export default function CompetenceDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    
    const [data, setData] = useState<CompetenceItem[]>([])
    const [summary, setSummary] = useState<CompetenceSummary>({ valid: 0, expiringSoon: 0, expired: 0, notAcquired: 0 })
    const [isLoading, setIsLoading] = useState(true)
    
    // Filters
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (status !== 'all') params.append("status", status)
            if (search) params.append("search", search) // Backend might expect user search or code search
            // The backend supports 'competenceCode' and 'userId' and 'status'. 
            // We might need to adjust frontend filters to match backend capabilities.
            // For now, let's assume specific filters or client-side filtering if backend is limited.
            // The exact backend params: status, competenceCode, userId.
            
            const res = await api.get(`/competence?${params.toString()}`)
            setData(res.data.data || [])
            setSummary(res.data.summary || { valid: 0, expiringSoon: 0, expired: 0, notAcquired: 0 })
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [status, search, page])



    const handleStatusFilter = (val: string) => {
        setSearchParams(prev => {
            if (val === 'all') prev.delete("status")
            else prev.set("status", val)
            return prev
        })
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'valid': return "bg-green-100 text-green-800"
            case 'expiring_soon': return "bg-yellow-100 text-yellow-800"
            case 'expired': return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t("competence.dashboardTitle")}</h1>
                <p className="text-muted-foreground">{t("competence.dashboardSubtitle")}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="cursor-pointer hover:bg-slate-50" onClick={() => handleStatusFilter('valid')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("competence.valid")}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">{summary.valid}</div>
                        <p className="text-xs text-muted-foreground">{t("competence.compliantRecords")}</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-slate-50" onClick={() => handleStatusFilter('expiring_soon')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("competence.expiringSoon")}</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-700">{summary.expiringSoon}</div>
                        <p className="text-xs text-muted-foreground">{t("competence.within90Days")}</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-slate-50" onClick={() => handleStatusFilter('expired')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("competence.expired")}</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{summary.expired}</div>
                        <p className="text-xs text-muted-foreground">{t("competence.actionRequired")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("competence.totalTracked")}</CardTitle>
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.valid + summary.expiringSoon + summary.expired + summary.notAcquired}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                   {/* Search input if supported by backend or client filter */}
                   {/* <Input placeholder="Search employee..." onChange={(e) => handleSearch(e.target.value)} /> */}
                   {/* Actually backend filter 'userId' or 'competenceCode'. Let's skip text search for now unless enhanced. */}
                </div>
                <Select value={status} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("competence.allStatuses")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("competence.allStatuses")}</SelectItem>
                        <SelectItem value="valid">{t("competence.valid")}</SelectItem>
                        <SelectItem value="expiring_soon">{t("competence.expiringSoon")}</SelectItem>
                        <SelectItem value="expired">{t("competence.expired")}</SelectItem>
                        <SelectItem value="not_acquired">{t("competence.notAcquired")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("competence.employee")}</TableHead>
                                <TableHead>{t("common.name")}</TableHead>
                                <TableHead>{t("competence.type")}</TableHead>
                                <TableHead>{t("competence.validUntil")}</TableHead>
                                <TableHead>{t("competence.status")}</TableHead>
                                <TableHead>{t("competence.action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">{t("competence.loading")}</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">{t("competence.noRecords")}</TableCell>
                                </TableRow>
                            ) : (
                                data.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="font-medium">{item.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{item.departmentTag}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.competenceCode}</div>
                                            <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={item.competenceName}>{item.competenceName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">{item.competenceType}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'Permanent'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusStyle(item.status)} variant="outline">
                                                {item.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm" onClick={() => navigate(`/employees/${item.userId}/history`)}>
                                                {t("competence.history")}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
