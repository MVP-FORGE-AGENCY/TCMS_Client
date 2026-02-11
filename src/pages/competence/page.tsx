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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrafficLightCard } from "@/components/ui/traffic-light-card"
import { Filter, User, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

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
    protocolId?: string | null
}

interface CompetenceSummary {
    valid: number
    expiringSoon: number
    expired: number
    notAcquired: number
}

interface EmployeeOption {
    id: string
    fullName: string
}

export default function CompetenceDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user } = useAuth() // Access user for role check
    
    const [data, setData] = useState<CompetenceItem[]>([])
    const [summary, setSummary] = useState<CompetenceSummary>({ valid: 0, expiringSoon: 0, expired: 0, notAcquired: 0 })
    const [employees, setEmployees] = useState<EmployeeOption[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Filters
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const userId = searchParams.get("userId") || "all"
    const page = parseInt(searchParams.get("page") || "1")

    // Local state for expiry switch - default to false unless param explicitly present and significant?
    // User requested "slider should load as toggled off"
    const [expiryFilterEnabled, setExpiryFilterEnabled] = useState(false)

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees?limit=1000') // increased limit for dropdown
            const emps = res.data.data.map((e: any) => ({
                id: e.id,
                fullName: e.fullName
            }))
            setEmployees(emps)
        } catch (e) {
            console.error("Failed to fetch employees", e)
        }
    }

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (status !== 'all') params.append("status", status)
            if (search) params.append("search", search)
            if (userId && userId !== 'all') params.append("userId", userId)
            
            // Only append expiry if switch is explicitly ENABLED
            if (expiryFilterEnabled) {
                const expiresWithin = searchParams.get("expiresWithin") || "90"
                params.append("expiresWithin", expiresWithin)
            }
            
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
        fetchEmployees()
    }, [])

    useEffect(() => {
        fetchData()
    }, [status, search, page, userId, expiryFilterEnabled, searchParams.get("expiresWithin")])



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
                
            {/* Employee Filter - Hidden for employees */}
            {user?.role !== 'employee' && (
                <Select value={userId} onValueChange={(val) => {
                    setSearchParams(prev => {
                        if (val === 'all') prev.delete("userId")
                        else prev.set("userId", val)
                        return prev
                    })
                }}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={t('common.allEmployees')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.allEmployees')}</SelectItem>
                        {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

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
            <Card className={`border-dashed transition-colors ${expiryFilterEnabled ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50'}`}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                         <div className="flex items-center space-x-2">
                            <Switch 
                                id="expiry-mode" 
                                checked={expiryFilterEnabled}
                                onCheckedChange={(checked) => {
                                    setExpiryFilterEnabled(checked)
                                    // If enabling, ensure param exists
                                    if (checked && !searchParams.has("expiresWithin")) {
                                        setSearchParams(prev => {
                                            prev.set("expiresWithin", "90")
                                            return prev
                                        })
                                    }
                                    // Logic handled by useEffect mostly, but param cleanup could be here
                                }}
                            />
                            <label htmlFor="expiry-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {t("competence.filterExpiresWithin") || "Filter by Expiry"}
                            </label>
                        </div>
                    </div>

                    {expiryFilterEnabled && (
                        <div className="flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-medium">{t("competence.expiresWithin")}</span>
                                <span className="text-sm font-bold text-primary">{searchParams.get("expiresWithin") || 90} {t("common.days")}</span>
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
                                max={730} // Increased to 2 years as requested (ish)
                                step={30}
                            />
                        </div>
                    )}
                    
                    {!expiryFilterEnabled && (
                         <div className="text-sm text-muted-foreground italic flex-1">
                            {t("competence.showingAll")}
                         </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="min-w-[700px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("competence.employee")}</TableHead>
                                <TableHead>{t("common.name")}</TableHead>
                                {/* Removed Type Column */}
                                <TableHead>{t("competence.validUntil")}</TableHead>
                                <TableHead>{t("competence.status")}</TableHead>
                                <TableHead>{t("competence.action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">{t("competence.loading")}</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">{t("competence.noRecords")}</TableCell>
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
                                        {/* Removed Type Cell */}
                                        <TableCell>
                                            {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'Permanent'}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(item.status)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/personnel/${item.userId}/history`)}>
                                                    {t("competence.history")}
                                                </Button>
                                                {(item.status === 'valid' || item.status === 'expiring_soon') && item.protocolId && (
                                                     <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="View Protocol" onClick={() => {
                                                         navigate(`/protocols/${item.protocolId}`);
                                                     }}>
                                                        <ShieldCheck className="w-4 h-4" />
                                                     </Button>
                                                )}
                                            </div>
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
