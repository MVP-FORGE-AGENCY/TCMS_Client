
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Bot, Mail, Calendar, FileText, Play, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react"
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

interface AutomationSettings {
    timezone: string
    email_alerts: {
        enabled: boolean
        employee_days_expiry: number
        manager_days_summary: number
        schedule: string
        recipients: {
            employee: boolean
            manager: boolean
            admin: boolean
        }
    }
    absence_logic: {
        enabled: boolean
        refresher_days: number
        initial_days: number
        schedule: string
        data_source: string
    }
    document_generation: {
        enabled: boolean
        monthly_schedule: string
        webhook_url: string
        include_pdf: boolean
        include_exports: boolean
    }
}

export default function AutomationCenter() {
    useTranslation()
    const [settings, setSettings] = useState<AutomationSettings | null>(null)
    const [logs, setLogs] = useState<JobLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("jobs")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [settingsRes, logsRes] = await Promise.all([
                api.get('/admin/automation/settings'),
                api.get('/admin/automation/logs')
            ])
            setSettings(settingsRes.data)
            setLogs(logsRes.data)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load automation data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!settings) return
        try {
            setIsSaving(true)
            await api.put('/admin/automation/settings', settings)
            toast.success("Settings saved successfully")
            fetchData() // Refresh logs if any side effects occurred
        } catch (error) {
            console.error(error)
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    const handleTestRun = async (jobKey: string) => {
        try {
            toast.info(`Starting test run for ${jobKey}...`)
            await api.post('/admin/automation/test-run', { jobKey })
            toast.success(`Job ${jobKey} completed`)
            // Refresh logs to show the new run
            const logsRes = await api.get('/admin/automation/logs')
            setLogs(logsRes.data)
        } catch (error) {
            console.error(error)
            toast.error("Test run failed")
        }
    }

    const updateSetting = (section: keyof AutomationSettings, field: string, value: any) => {
        if (!settings) return
        setSettings({
            ...settings,
            [section]: {
                ...(settings[section] as object),
                [field]: value
            }
        })
    }

    const updateNestedSetting = (section: keyof AutomationSettings, parent: string, field: string, value: any) => {
        if (!settings) return
        const sectionData = settings[section] as any
        setSettings({
            ...settings,
            [section]: {
                ...sectionData,
                [parent]: {
                    ...sectionData[parent],
                    [field]: value
                }
            }
        })
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    if (!settings) return null

    return (
        <div className="space-y-6 container mx-auto py-6 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-500" />
                        Automation Center
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure automated tasks, alerts, and compliance workflows.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
                    <TabsTrigger value="settings">Legacy Config</TabsTrigger>
                    <TabsTrigger value="logs">Run History</TabsTrigger>
                </TabsList>

                {/* NEW: Scheduled Jobs Tab */}
                <TabsContent value="jobs" className="mt-6">
                    <JobConfigsPanel />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-6">
                    
                    {/* Timezone & Global */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-gray-500" />
                                Global Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <div className="grid gap-2 max-w-sm">
                                <Label>Organization Timezone</Label>
                                <Select 
                                    value={settings.timezone} 
                                    onValueChange={(val) => setSettings({...settings, timezone: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                                        <SelectItem value="Europe/Sofia">Europe/Sofia</SelectItem>
                                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">All schedules will run according to this timezone.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Alerts */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                    Email Alerts
                                </CardTitle>
                                <CardDescription>Expiry warnings and summaries.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="email-enabled">Enabled</Label>
                                <Switch 
                                    id="email-enabled" 
                                    checked={settings.email_alerts.enabled}
                                    onCheckedChange={(val) => updateSetting('email_alerts', 'enabled', val)}
                                />
                            </div>
                        </CardHeader>
                        {settings.email_alerts.enabled && (
                            <CardContent className="grid gap-6 pt-4 border-t">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Employee Warning (Days Before)</Label>
                                            <Input 
                                                type="number" 
                                                value={settings.email_alerts.employee_days_expiry}
                                                onChange={(e) => updateSetting('email_alerts', 'employee_days_expiry', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Manager Summary (Lookahead Days)</Label>
                                            <Input 
                                                type="number" 
                                                value={settings.email_alerts.manager_days_summary}
                                                onChange={(e) => updateSetting('email_alerts', 'manager_days_summary', parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Schedule (Cron Definition)</Label>
                                            <Input 
                                                value={settings.email_alerts.schedule}
                                                onChange={(e) => updateSetting('email_alerts', 'schedule', e.target.value)}
                                            />
                                            <p className="text-xs text-muted-foreground">Example: 0 0 9 * * * (Daily at 9:00 AM)</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Recipients</Label>
                                        <div className="flex flex-col gap-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="rec-emp">Notify Employees</Label>
                                                <Switch 
                                                    id="rec-emp"
                                                    checked={settings.email_alerts.recipients.employee}
                                                    onCheckedChange={(val) => updateNestedSetting('email_alerts', 'recipients', 'employee', val)}
                                                />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="rec-mgr">Notify Managers</Label>
                                                <Switch 
                                                    id="rec-mgr"
                                                    checked={settings.email_alerts.recipients.manager}
                                                    onCheckedChange={(val) => updateNestedSetting('email_alerts', 'recipients', 'manager', val)}
                                                />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="rec-adm">Notify Admins (Escalations)</Label>
                                                <Switch 
                                                    id="rec-adm"
                                                    checked={settings.email_alerts.recipients.admin}
                                                    onCheckedChange={(val) => updateNestedSetting('email_alerts', 'recipients', 'admin', val)}
                                                />
                                            </div>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => handleTestRun('email.notifications')}>
                                            <Play className="h-3 w-3 mr-2" />
                                            Test Run Now
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Absence Logic */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-orange-500" />
                                    Absence & Refresher Logic
                                </CardTitle>
                                <CardDescription>Automatically flag refresher vs initial training needs.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="absence-enabled">Enabled</Label>
                                <Switch 
                                    id="absence-enabled"
                                    checked={settings.absence_logic.enabled}
                                    onCheckedChange={(val) => updateSetting('absence_logic', 'enabled', val)}
                                />
                            </div>
                        </CardHeader>
                        {settings.absence_logic.enabled && (
                            <CardContent className="grid gap-6 pt-4 border-t">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Refresher Threshold (Days)</Label>
                                            <Input 
                                                type="number" 
                                                value={settings.absence_logic.refresher_days}
                                                onChange={(e) => updateSetting('absence_logic', 'refresher_days', parseInt(e.target.value))}
                                            />
                                            <p className="text-xs text-muted-foreground">Absence greater than this requires Refresher.</p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Initial Threshold (Days)</Label>
                                            <Input 
                                                type="number" 
                                                value={settings.absence_logic.initial_days}
                                                onChange={(e) => updateSetting('absence_logic', 'initial_days', parseInt(e.target.value))}
                                            />
                                            <p className="text-xs text-muted-foreground">Absence greater than this requires Re-Initial.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Schedule</Label>
                                            <Input 
                                                value={settings.absence_logic.schedule}
                                                onChange={(e) => updateSetting('absence_logic', 'schedule', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Data Source</Label>
                                            <Select 
                                                value={settings.absence_logic.data_source}
                                                onValueChange={(val) => updateSetting('absence_logic', 'data_source', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="roster">Roster / Shifts</SelectItem>
                                                    <SelectItem value="login">Last Login</SelectItem>
                                                    <SelectItem value="hr_feed">HR Absence Feed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => handleTestRun('absence.scan')}>
                                            <Play className="h-3 w-3 mr-2" />
                                            Test Scan Now
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Document Generation */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-purple-500" />
                                    Document Generation (n8n)
                                </CardTitle>
                                <CardDescription>Automated monthly reports and exports via webhook.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="docs-enabled">Enabled</Label>
                                <Switch 
                                    id="docs-enabled"
                                    checked={settings.document_generation.enabled}
                                    onCheckedChange={(val) => updateSetting('document_generation', 'enabled', val)}
                                />
                            </div>
                        </CardHeader>
                        {settings.document_generation.enabled && (
                            <CardContent className="grid gap-6 pt-4 border-t">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Webhook URL</Label>
                                            <Input 
                                                value={settings.document_generation.webhook_url || ''}
                                                onChange={(e) => updateSetting('document_generation', 'webhook_url', e.target.value)}
                                                placeholder="https://n8n.your-org.com/webhook/..."
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Monthly Schedule</Label>
                                            <Input 
                                                value={settings.document_generation.monthly_schedule}
                                                onChange={(e) => updateSetting('document_generation', 'monthly_schedule', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Includes</Label>
                                        <div className="flex flex-col gap-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                                            <div className="flex items-center justify-between">
                                                <Label>Compliance PDF</Label>
                                                <Switch 
                                                    checked={settings.document_generation.include_pdf}
                                                    onCheckedChange={(val) => updateSetting('document_generation', 'include_pdf', val)}
                                                />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <Label>Re-qualification Export</Label>
                                                <Switch 
                                                    checked={settings.document_generation.include_exports}
                                                    onCheckedChange={(val) => updateSetting('document_generation', 'include_exports', val)}
                                                />
                                            </div>
                                        </div>
                                        <Button variant="secondary" size="sm" onClick={() => handleTestRun('documents.generate')}>
                                            <Play className="h-3 w-3 mr-2" />
                                            Test Generation Now
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                </TabsContent>

                {/* LOGS TAB */}
                <TabsContent value="logs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Run History</CardTitle>
                            <CardDescription>Audit log of all automated job executions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Job Name</TableHead>
                                        <TableHead>Started</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Metrics</TableHead>
                                        <TableHead>Initiated By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No logs found.
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
                                                    {log.status === 'success' && <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>}
                                                    {log.status === 'failed' && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>}
                                                    {log.status === 'partial' && <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Partial</Badge>}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{log.job_key}</TableCell>
                                                <TableCell>{format(new Date(log.started_at), 'MMM dd, HH:mm')}</TableCell>
                                                <TableCell>{duration}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                    {JSON.stringify(log.metrics)}
                                                    {log.error_summary && <span className="text-red-500 block">{log.error_summary}</span>}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {log.initiated_by === 'system' ? 'System' : 'Manual'}
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
