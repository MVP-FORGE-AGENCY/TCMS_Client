import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Printer } from "lucide-react"
import { differenceInDays } from "date-fns"
import { useTranslation } from "react-i18next"

import { reports } from "@/lib/api"

export default function ExpiringReport() {
    const { t, i18n } = useTranslation()
    const [daysThreshold, setDaysThreshold] = useState([90])
    const [items, setItems] = useState<any[]>([])
    // const [loading, setLoading] = useState(false) // Unused for now

    useEffect(() => {
        const fetchData = async () => {
            // setLoading(true)
            try {
                const data = await reports.getExpiring(daysThreshold[0])
                setItems(data || [])
            } catch (err) {
                 console.error(err)
            } finally {
                 // setLoading(false)
            }
        }
        fetchData()
    }, [daysThreshold])

    const filteredItems = items.map(item => ({
         id: item.id,
         employee: item.users?.full_name || 'Unknown',
         competence: item.training_standards?.code || 'Unknown',
         expiryDate: new Date(item.valid_until),
         status: item.status
    })).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())


    const handlePrint = () => {
        window.print()
    }

    const getRowColor = (daysRemaining: number) => {
        if (daysRemaining < 7) return "bg-red-50 hover:bg-red-100"
        if (daysRemaining < 30) return "bg-amber-50 hover:bg-amber-100"
        return ""
    }

    const formatDate = (date: Date) => {
        const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB'
        return date.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatDays = (days: number) => {
        if (days === 1) {
            return `1 ${t("common.day")}`
        }
        return `${days} ${t("common.days")}`
    }

    const getStatusTranslation = (status: string) => {
        const statusMap: Record<string, string> = {
            valid: t("dashboard.valid"),
            expiring: t("dashboard.expiring"),
            expired: t("dashboard.expired"),
        }
        return statusMap[status] || status
    }

    return (
        <div className="space-y-6 print:space-y-2">
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("reports.expiringTitle")}</h1>
                    <p className="text-muted-foreground">
                        {t("reports.expiringSubtitle", { days: daysThreshold[0] })}
                    </p>
                </div>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    {t("reports.exportPdf")}
                </Button>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">{t("reports.expiringTitle")}</h1>
                <p className="text-sm text-gray-500">{t("reports.generatedOn", { date: formatDate(new Date()) })}</p>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card print:hidden">
                <span className="text-sm font-medium w-32">{t("reports.withinDays", { days: daysThreshold[0] })}</span>
                <Slider
                    value={daysThreshold}
                    onValueChange={setDaysThreshold}
                    max={180}
                    step={1}
                    className="w-[300px]"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("common.fullName")}</TableHead>
                            <TableHead>{t("sessions.programme")}</TableHead>
                            <TableHead>{t("common.date")}</TableHead>
                            <TableHead>{t("reports.daysRemaining")}</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    {t("reports.noExpiringItems")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => {
                                const daysRemaining = differenceInDays(item.expiryDate, new Date())
                                return (
                                    <TableRow key={item.id} className={getRowColor(daysRemaining)}>
                                        <TableCell className="font-medium">{item.employee}</TableCell>
                                        <TableCell>{item.competence}</TableCell>
                                        <TableCell>{formatDate(item.expiryDate)}</TableCell>
                                        <TableCell>
                                            <span className={daysRemaining < 7 ? "text-red-600 font-bold" : daysRemaining < 30 ? "text-amber-600 font-medium" : ""}>
                                                {formatDays(daysRemaining)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-xs">
                                                {getStatusTranslation(item.status)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <style>{`
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    )
}
