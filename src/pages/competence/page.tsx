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
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrafficLightCard } from "@/components/ui/traffic-light-card"
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
            if (status !== 'all') params.append("status", status)
            if (search) params.append("search", search)
            
            const expiresWithin = searchParams.get("expiresWithin")
            if (expiresWithin) params.append("expiresWithin", expiresWithin)

            // The exact backend params: status, competenceCode, userId, expiresWithin.
            
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
    }, [status, search, page, searchParams])



    const handleStatusFilter = (val: string) => {
        setSearchParams(prev => {
            if (val === 'all') prev.delete("status")
            else prev.set("status", val)
            return prev
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valid': 
                return <Badge variant="valid" showIcon>{t("competence.valid")}</Badge>
            case 'expiring_soon': 
                return <Badge variant="expiring" showIcon>{t("competence.expiringSoon")}</Badge>
            case 'expired': 
                return <Badge variant="expired" showIcon>{t("competence.expired")}</Badge>
            default: 
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-h2">{t("competence.dashboardTitle")}</h1>
                <p className="text-slate-500 text-sm">{t("competence.dashboardSubtitle")}</p>
            </div>

            {/* Traffic Light Dashboard - Brand Identity System */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <TrafficLightCard
                    status="valid"
                    value={summary.valid}
                    label={t("competence.valid")}
                    onClick={() => handleStatusFilter('valid')}
                />
                <TrafficLightCard
                    status="expiring"
                    value={summary.expiringSoon}
                    label={t("competence.expiringSoon")}
                    onClick={() => handleStatusFilter('expiring_soon')}
                />
                <TrafficLightCard
                    status="expired"
                    value={summary.expired}
                    label={t("competence.expired")}
                    onClick={() => handleStatusFilter('expired')}
                />
            </div>

            {/* Total Tracked Card */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("competence.totalTracked")}</CardTitle>
                    <Filter className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {summary.valid + summary.expiringSoon + summary.expired + summary.notAcquired}
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative flex-1 sm:max-w-sm">
                   <Input 
                        placeholder={t("competence.searchPlaceholder") || "Search by name or email..."} 
                        defaultValue={search}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Debounce could be good, but for now direct update or simple timeout
                            // Using timeout to avoid too many redirects
                            const timeoutId = setTimeout(() => {
                                setSearchParams(prev => {
                                    if (val) prev.set("search", val);
                                    else prev.delete("search");
                                    return prev;
                                });
                            }, 500);
                            return () => clearTimeout(timeoutId);
                        }} 
                    />
                </div>
                <Select value={status} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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

            {/* Expiring Competences Slider (Full Width) */}
            {(status === 'expiring_soon' || status === 'all') && (
                <Card className="bg-slate-50 border-dashed">
                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">{t("competence.expiresWithin") || "Expires within"}</span>
                                <span className="text-sm font-bold text-primary">{searchParams.get("expiresWithin") || 90} {t("common.days") || "days"}</span>
                            </div>
                            <Slider
                                value={[parseInt(searchParams.get("expiresWithin") || "90")]}
                                onValueChange={(vals: number[]) => {
                                    const days = vals[0];
                                    setSearchParams(prev => {
                                        prev.set("expiresWithin", days.toString());
                                        return prev;
                                    });
                                }}
                                max={365}
                                step={1}
                                className="w-full"
                            />
                        </div>
                        <div className="text-xs text-muted-foreground md:w-48">
                            {t("competence.sliderHint") || "Adjust to see competences expiring within the selected timeframe."}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="min-w-[700px]">
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
                                            {getStatusBadge(item.status)}
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
