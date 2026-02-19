
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bot, RefreshCw, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { format } from "date-fns"
import JobConfigsPanel from "@/components/settings/JobConfigsPanel"

interface JobLog {
    id: string
    job_key: string
    status: 'success' | 'failed' | 'partial' | 'running'
    started_at: string
    finished_at?: string
    metrics?: any
    error_summary?: string
    initiated_by: string
}


export default function AutomationCenter() {
    const [logs, setLogs] = useState<JobLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("jobs")
    const { t } = useTranslation()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const logsRes = await api.get('/admin/automation/logs')
            setLogs(logsRes.data?.data || logsRes.data || [])
        } catch (error) {
            console.error(error)
            toast.error(t("errors.loadError"))
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">{t("common.loading")}</div>
    }

    return (
        <div className="space-y-6 container mx-auto py-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-500" />
                        {t("settings.automation.title")}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t("settings.automation.subtitle")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {t("settings.automation.refresh")}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="jobs">{t("settings.automation.scheduledJobs")}</TabsTrigger>
                    <TabsTrigger value="logs">{t("settings.automation.runHistory")}</TabsTrigger>
                </TabsList>

                <TabsContent value="jobs" className="mt-6">
                    <JobConfigsPanel />
                </TabsContent>

                <TabsContent value="logs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("settings.automation.runHistory")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("settings.automation.status")}</TableHead>
                                        <TableHead>{t("settings.automation.jobName")}</TableHead>
                                        <TableHead>{t("settings.automation.started")}</TableHead>
                                        <TableHead>{t("settings.automation.duration")}</TableHead>
                                        <TableHead>{t("settings.automation.metrics")}</TableHead>
                                        <TableHead>{t("settings.automation.initiatedBy")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                {t("settings.automation.noLogs")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {logs.map((log) => {
                                        const duration = log.finished_at && log.started_at 
                                            ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000) + 's'
                                            : '-'
                                        
                                        return (
                                            <TableRow key={log.id}>
                                                <TableCell>
                                                    {log.status === 'success' && <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> {t("settings.automation.success")}</Badge>}
                                                    {log.status === 'failed' && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {t("settings.automation.failed")}</Badge>}
                                                    {log.status === 'partial' && <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> {t("settings.automation.partial")}</Badge>}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{log.job_key}</TableCell>
                                                <TableCell>{format(new Date(log.started_at), 'MMM dd, HH:mm')}</TableCell>
                                                <TableCell>{duration}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                    {JSON.stringify(log.metrics)}
                                                    {log.error_summary && <span className="text-red-500 block">{log.error_summary}</span>}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {log.initiated_by === 'system' ? t("settings.automation.system") : t("settings.automation.manual")}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
