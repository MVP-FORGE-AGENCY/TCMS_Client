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
import { Printer, FileSpreadsheet } from "lucide-react"
import { differenceInDays } from "date-fns"
import { useTranslation } from "react-i18next"

import { reports } from "@/lib/api"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExpiringReport() {
    const { t, i18n } = useTranslation()
    const [daysThreshold, setDaysThreshold] = useState([90])
    const [showAll, setShowAll] = useState(false)
    const [items, setItems] = useState<any[]>([])
    // const [loading, setLoading] = useState(false) // Unused for now

    useEffect(() => {
        const fetchData = async () => {
            // setLoading(true)
            try {
                const data = await reports.getExpiring(daysThreshold[0], showAll)
                setItems(data || [])
            } catch (err) {
                 console.error(err)
            } finally {
                 // setLoading(false)
            }
        }
        fetchData()
    }, [daysThreshold, showAll])

    const filteredItems = items.map(item => ({
         id: item.id,
         employee: item.users?.full_name || 'Unknown',
         competence: item.training_standards?.code || 'Unknown',
         expiryDate: new Date(item.valid_until),
         // acquired_date is the date the competence was given/completed
         dateCompleted: item.acquired_date ? new Date(item.acquired_date) : (item.valid_from ? new Date(item.valid_from) : null),
         status: item.status
    })).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())

    const handlePrint = () => {
        window.print()
    }

    const handleExportCSV = () => {
        const headers = [
            t("common.fullName"),
            t("sessions.programme"),
            t("reports.dateCompleted"),
            t("common.date"), // Expiry Date
            t("reports.daysRemaining"),
            t("common.status")
        ].join(",")

        const rows = filteredItems.map(item => {
            const daysRemaining = differenceInDays(item.expiryDate, new Date())
            return [
                `"${item.employee}"`,
                `"${item.competence}"`,
                item.dateCompleted ? formatDate(item.dateCompleted) : "",
                formatDate(item.expiryDate),
                daysRemaining,
                getStatusTranslation(item.status)
            ].join(",")
        }).join("\n")

        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `expiring_competences_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getRowColor = (daysRemaining: number) => {
        if (daysRemaining < 0) return "bg-gray-100 text-muted-foreground" // Expired
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
        if (days < 0) return `${Math.abs(days)} ${t("common.days")} ago` // Expired labeling
        if (days === 1) {
            return `1 ${t("common.day")}`
        }
        return `${days} ${t("common.days")}`
    }

    const getStatusTranslation = (status: string) => {
        const statusMap: Record<string, string> = {
            valid: t("dashboard.valid"),
            expiring: t("dashboard.expiring"),
            expiring_soon: t("dashboard.expiring"),
            expired: t("dashboard.expired"),
        }
        return statusMap[status] || status
    }

    return (
        <div className="space-y-6 print:space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("reports.expiringTitle")}</h1>
                    <p className="text-muted-foreground">
                        {showAll ? t("reports.showingAll") : t("reports.expiringSubtitle", { days: daysThreshold[0] })}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        {t("reports.exportCsv")}
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4" />
                        {t("reports.exportPdf")}
                    </Button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">{t("reports.expiringTitle")}</h1>
                <p className="text-sm text-gray-500">{t("reports.generatedOn", { date: formatDate(new Date()) })}</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 p-4 border rounded-lg bg-card print:hidden">
                <div className="flex items-center space-x-2">
                    <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
                    <Label htmlFor="show-all">{t("reports.showAll")}</Label>
                </div>
                
                {!showAll && (
                    <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm font-medium whitespace-nowrap">{t("reports.withinDays", { days: daysThreshold[0] })}</span>
                        <Slider
                            value={daysThreshold}
                            onValueChange={setDaysThreshold}
                            max={730}
                            step={5}
                            className="w-full max-w-[300px]"
                        />
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 print:hidden">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md p-4 bg-muted/20">
                         {t("reports.noExpiringItems")}
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        const daysRemaining = differenceInDays(item.expiryDate, new Date());

                        // Note: hover classes don't matter much on mobile, but bg classes do.
                        // We might want to apply the bg color to the card or a border.
                        
                        return (
                            <Card key={item.id} className={`${daysRemaining < 7 ? 'border-red-200 bg-red-50/50' : daysRemaining < 30 ? 'border-amber-200 bg-amber-50/50' : ''}`}>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base">{item.employee}</CardTitle>
                                        <Badge variant={daysRemaining < 0 ? "secondary" : "outline"} className="uppercase text-xs">
                                            {getStatusTranslation(item.status)}
                                        </Badge>
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">{item.competence}</div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("reports.daysRemaining")}:</span>
                                        <span className={daysRemaining < 0 
                                            ? "text-gray-500 font-medium" 
                                            : daysRemaining < 7 
                                                ? "text-red-600 font-bold" 
                                                : daysRemaining < 30 
                                                    ? "text-amber-600 font-medium" 
                                                    : ""}>
                                            {formatDays(daysRemaining)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed pt-2">
                                        <span className="text-muted-foreground">{t("common.date")}:</span>
                                        <span>{formatDate(item.expiryDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("reports.dateCompleted")}:</span>
                                        <span>{item.dateCompleted ? formatDate(item.dateCompleted) : '-'}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("common.fullName")}</TableHead>
                            <TableHead>{t("sessions.programme")}</TableHead>
                            <TableHead>{t("reports.dateCompleted")}</TableHead>
                            <TableHead>{t("common.date")}</TableHead>
                            <TableHead>{t("reports.daysRemaining")}</TableHead>
                            <TableHead>{t("common.status")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
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
                                        <TableCell>{item.dateCompleted ? formatDate(item.dateCompleted) : '-'}</TableCell>
                                        <TableCell>{formatDate(item.expiryDate)}</TableCell>
                                        <TableCell>
                                            <span className={daysRemaining < 0 
                                                ? "text-gray-500 font-medium" 
                                                : daysRemaining < 7 
                                                    ? "text-red-600 font-bold" 
                                                    : daysRemaining < 30 
                                                        ? "text-amber-600 font-medium" 
                                                        : ""}>
                                                {formatDays(daysRemaining)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={daysRemaining < 0 ? "secondary" : "outline"} className="uppercase text-xs">
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
