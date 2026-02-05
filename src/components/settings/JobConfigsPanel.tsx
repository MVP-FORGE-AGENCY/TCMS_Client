import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Mail, Calendar, FileText, Users, Play, AlertCircle,
    CheckCircle, XCircle, Clock, Plus, Settings2, Trash2, History, AlertTriangle, ChevronDown, ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { jobConfigs } from "@/lib/api"
import { format } from "date-fns"

// Types
interface JobConfig {
    id: string
    org_id: string
    job_type: string
    cron_expression: string
    is_enabled: boolean
    timezone: string
    last_run_at: string | null
    next_run_at: string | null
    consecutive_failures: number
    config_payload: Record<string, any>
    friendly_schedule?: string
}

interface JobType {
    type: string
    name: string
    description: string
    icon: string
    minInterval: number
    configSchema: Record<string, any>
}

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

const iconMap: Record<string, React.ReactNode> = {
    mail: <Mail className="h-5 w-5 text-blue-500" />,
    calendar: <Calendar className="h-5 w-5 text-orange-500" />,
    'file-text': <FileText className="h-5 w-5 text-purple-500" />,
    users: <Users className="h-5 w-5 text-green-500" />
}

const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
]

const dayOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
]

const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Sofia', label: 'Europe/Sofia (EET)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
]

function HistoryRow({ log }: { log: JobLog }) {
    const [isOpen, setIsOpen] = useState(false)
    const duration = log.finished_at && log.started_at
        ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000) + 's'
        : '-'

    const details = log.metrics?.details as any[]
    const hasDetails = Array.isArray(details) && details.length > 0

    return (
        <>
            <TableRow 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${isOpen ? 'bg-muted/50' : ''}`}
                onClick={() => hasDetails && setIsOpen(!isOpen)}
            >
                <TableCell>
                    <div className="flex items-center gap-2">
                            {hasDetails ? (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-transparent">
                                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </Button>
                            ) : (
                                <div className="w-6" />
                            )}
                        {log.status === 'success' && <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>}
                        {log.status === 'failed' && <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>}
                        {log.status === 'partial' && <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Partial</Badge>}
                    </div>
                </TableCell>
                <TableCell>{format(new Date(log.started_at), 'MMM dd, HH:mm:ss')}</TableCell>
                <TableCell>{duration}</TableCell>
                <TableCell className="max-w-[200px] truncate text-xs">
                    {log.error_summary
                        ? <span className="text-red-500">{log.error_summary}</span>
                        : (
                            <div className="flex flex-col">
                                <span>{Object.entries(log.metrics || {})
                                    .filter(([k]) => k !== 'details')
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(', ')}</span>
                            </div>
                        )
                    }
                </TableCell>
                <TableCell className="text-xs">
                    {log.initiated_by === 'system' ? 'Scheduled' : 'Manual'}
                </TableCell>
            </TableRow>
            {isOpen && hasDetails && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={5} className="p-0">
                        <div className="p-4 pl-12 border-b">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                Execution Details
                            </h4>
                            <div className="rounded-md border bg-background">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="h-8 hover:bg-transparent">
                                            {Object.keys(details[0] || {}).map(key => (
                                                <TableHead key={key} className="h-8 text-xs font-medium">{key}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {details.map((item, i) => (
                                            <TableRow key={i} className="h-8 hover:bg-muted/50 border-t">
                                                {Object.values(item).map((val: any, j) => (
                                                    <TableCell key={j} className="h-8 text-xs py-1">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

export default function JobConfigsPanel() {
    const [configs, setConfigs] = useState<JobConfig[]>([])
    const [jobTypes, setJobTypes] = useState<JobType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingConfig, setEditingConfig] = useState<JobConfig | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [historyConfig, setHistoryConfig] = useState<JobConfig | null>(null)
    const [history, setHistory] = useState<JobLog[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        job_type: '',
        frequency: 'daily',
        hour: '9',
        minute: '0',
        dayOfWeek: '1',
        dayOfMonth: '1',
        timezone: 'UTC',
        is_enabled: false,
        config_payload: {} as Record<string, any>
    })

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true)
            const [configsData, typesData] = await Promise.all([
                jobConfigs.list(),
                jobConfigs.getJobTypes()
            ])
            setConfigs(configsData)
            setJobTypes(typesData)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load job configurations")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Build cron expression from friendly inputs
    const buildCronExpression = () => {
        const { frequency, minute, hour, dayOfWeek, dayOfMonth } = formData
        switch (frequency) {
            case 'daily':
                return `${minute} ${hour} * * *`
            case 'weekly':
                return `${minute} ${hour} * * ${dayOfWeek}`
            case 'monthly':
                return `${minute} ${hour} ${dayOfMonth} * *`
            default:
                return `${minute} ${hour} * * *`
        }
    }

    // Parse cron expression to friendly format
    const parseCronExpression = (cron: string) => {
        const parts = cron.trim().split(/\s+/)
        if (parts.length !== 5) return { frequency: 'daily', minute: '0', hour: '9', dayOfWeek: '1', dayOfMonth: '1' }

        const [minute, hour, dayOfMonth, , dayOfWeek] = parts

        if (dayOfMonth !== '*' && dayOfWeek === '*') {
            return { frequency: 'monthly', minute, hour, dayOfWeek: '1', dayOfMonth }
        } else if (dayOfWeek !== '*') {
            return { frequency: 'weekly', minute, hour, dayOfWeek, dayOfMonth: '1' }
        } else {
            return { frequency: 'daily', minute, hour, dayOfWeek: '1', dayOfMonth: '1' }
        }
    }

    const openCreateModal = (jobType: string) => {
        const type = jobTypes.find(t => t.type === jobType)
        const defaults: Record<string, any> = {}

        if (type?.configSchema) {
            Object.entries(type.configSchema).forEach(([key, schema]: [string, any]) => {
                if (schema.default !== undefined) {
                    defaults[key] = schema.default
                }
            })
        }

        setFormData({
            job_type: jobType,
            frequency: 'daily',
            hour: '9',
            minute: '0',
            dayOfWeek: '1',
            dayOfMonth: '1',
            timezone: 'UTC',
            is_enabled: false,
            config_payload: defaults
        })
        setIsCreating(true)
        setEditingConfig(null)
        setIsModalOpen(true)
    }

    const openEditModal = (config: JobConfig) => {
        const parsed = parseCronExpression(config.cron_expression)
        setFormData({
            job_type: config.job_type,
            ...parsed,
            timezone: config.timezone,
            is_enabled: config.is_enabled,
            config_payload: config.config_payload || {}
        })
        setEditingConfig(config)
        setIsCreating(false)
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        try {
            const cronExpression = buildCronExpression()

            if (isCreating) {
                await jobConfigs.create({
                    job_type: formData.job_type,
                    cron_expression: cronExpression,
                    timezone: formData.timezone,
                    is_enabled: formData.is_enabled,
                    config_payload: formData.config_payload
                })
                toast.success("Job configuration created")
            } else if (editingConfig) {
                await jobConfigs.update(editingConfig.id, {
                    cron_expression: cronExpression,
                    timezone: formData.timezone,
                    is_enabled: formData.is_enabled,
                    config_payload: formData.config_payload
                })
                toast.success("Job configuration updated")
            }

            setIsModalOpen(false)
            fetchData()
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Failed to save configuration")
        }
    }

    const handleToggleEnabled = async (config: JobConfig) => {
        try {
            await jobConfigs.update(config.id, { is_enabled: !config.is_enabled })
            toast.success(config.is_enabled ? "Job disabled" : "Job enabled")
            fetchData()
        } catch (error) {
            toast.error("Failed to update job status")
        }
    }

    const handleRunNow = async (config: JobConfig) => {
        try {
            toast.info(`Running ${config.job_type}...`)
            await jobConfigs.runNow(config.id)
            toast.success("Job queued for execution")
            setTimeout(fetchData, 2000)
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Failed to run job")
        }
    }

    const handleDelete = async (config: JobConfig) => {
        if (!confirm(`Delete ${config.job_type} configuration?`)) return
        try {
            await jobConfigs.delete(config.id)
            toast.success("Job configuration deleted")
            fetchData()
        } catch (error) {
            toast.error("Failed to delete configuration")
        }
    }

    const handleViewHistory = async (config: JobConfig) => {
        try {
            const historyData = await jobConfigs.getHistory(config.id, 10)
            setHistory(historyData)
            setHistoryConfig(config)
            setIsHistoryOpen(true)
        } catch (error) {
            toast.error("Failed to load run history")
        }
    }

    const getJobTypeInfo = (type: string) => jobTypes.find(t => t.type === type)

    const getAvailableJobTypes = () => {
        const usedTypes = configs.map(c => c.job_type)
        return jobTypes.filter(t => !usedTypes.includes(t.type))
    }

    const renderConfigFields = () => {
        const type = getJobTypeInfo(formData.job_type)
        if (!type?.configSchema) return null

        return Object.entries(type.configSchema).map(([key, schema]: [string, any]) => (
            <div key={key} className="grid gap-2">
                <Label>{schema.label || key}</Label>
                {schema.type === 'number' && (
                    <Input
                        type="number"
                        value={formData.config_payload[key] ?? schema.default ?? ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            config_payload: { ...formData.config_payload, [key]: parseInt(e.target.value) }
                        })}
                    />
                )}
                {schema.type === 'boolean' && (
                    <Switch
                        checked={formData.config_payload[key] ?? schema.default ?? false}
                        onCheckedChange={(val) => setFormData({
                            ...formData,
                            config_payload: { ...formData.config_payload, [key]: val }
                        })}
                    />
                )}
                {schema.type === 'url' && (
                    <Input
                        type="url"
                        placeholder="https://..."
                        value={formData.config_payload[key] ?? ''}
                        onChange={(e) => setFormData({
                            ...formData,
                            config_payload: { ...formData.config_payload, [key]: e.target.value }
                        })}
                    />
                )}
                {schema.type === 'multiselect' && (
                    <div className="flex flex-wrap gap-2">
                        {schema.options?.map((opt: string) => (
                            <Badge
                                key={opt}
                                variant={formData.config_payload[key]?.includes(opt) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                    const current = formData.config_payload[key] || []
                                    const updated = current.includes(opt)
                                        ? current.filter((v: string) => v !== opt)
                                        : [...current, opt]
                                    setFormData({
                                        ...formData,
                                        config_payload: { ...formData.config_payload, [key]: updated }
                                    })
                                }}
                            >
                                {opt}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        ))
    }

    if (isLoading) {
        return <div className="flex items-center justify-center p-8">Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header with Add button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Scheduled Jobs</h2>
                    <p className="text-sm text-muted-foreground">Configure automated tasks with custom schedules</p>
                </div>
                {getAvailableJobTypes().length > 0 && (
                    <Select onValueChange={openCreateModal}>
                        <SelectTrigger className="w-[200px]">
                            <Plus className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Add Job" />
                        </SelectTrigger>
                        <SelectContent>
                            {getAvailableJobTypes().map(type => (
                                <SelectItem key={type.type} value={type.type}>
                                    {type.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Jobs Table */}
            {configs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No scheduled jobs configured</h3>
                        <p className="text-muted-foreground mb-4">Add a job to automate tasks like expiry alerts or absence scans</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job</TableHead>
                                <TableHead>Schedule</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Run</TableHead>
                                <TableHead>Next Run</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {configs.map(config => {
                                const typeInfo = getJobTypeInfo(config.job_type)
                                const hasFailures = config.consecutive_failures > 0
                                const isDisabledByFailures = config.consecutive_failures >= 3

                                return (
                                    <TableRow key={config.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {iconMap[typeInfo?.icon || 'clock'] || <Clock className="h-5 w-5" />}
                                                <div>
                                                    <div className="font-medium">{typeInfo?.name || config.job_type}</div>
                                                    <div className="text-xs text-muted-foreground">{typeInfo?.description}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-mono text-sm">{config.friendly_schedule || config.cron_expression}</div>
                                            <div className="text-xs text-muted-foreground">{config.timezone}</div>
                                        </TableCell>
                                        <TableCell>
                                            {isDisabledByFailures ? (
                                                <Badge variant="destructive" className="gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Auto-Disabled
                                                </Badge>
                                            ) : config.is_enabled ? (
                                                <Badge className="bg-green-500 gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Disabled</Badge>
                                            )}
                                            {hasFailures && !isDisabledByFailures && (
                                                <Badge variant="outline" className="ml-2 text-orange-500 border-orange-500">
                                                    {config.consecutive_failures} failures
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {config.last_run_at
                                                ? format(new Date(config.last_run_at), 'MMM dd, HH:mm')
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {config.next_run_at && config.is_enabled
                                                ? format(new Date(config.next_run_at), 'MMM dd, HH:mm')
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewHistory(config)}
                                                    title="View History"
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRunNow(config)}
                                                    title="Run Now"
                                                >
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditModal(config)}
                                                    title="Edit"
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                                <Switch
                                                    checked={config.is_enabled}
                                                    onCheckedChange={() => handleToggleEnabled(config)}
                                                    disabled={isDisabledByFailures}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Edit/Create Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {isCreating ? 'Add Scheduled Job' : 'Edit Job Configuration'}
                        </DialogTitle>
                        <DialogDescription>
                            {getJobTypeInfo(formData.job_type)?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Frequency Selection */}
                        <div className="grid gap-2">
                            <Label>Frequency</Label>
                            <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {frequencyOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Day Selection (for weekly) */}
                        {formData.frequency === 'weekly' && (
                            <div className="grid gap-2">
                                <Label>Day of Week</Label>
                                <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dayOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Day of Month (for monthly) */}
                        {formData.frequency === 'monthly' && (
                            <div className="grid gap-2">
                                <Label>Day of Month</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="28"
                                    value={formData.dayOfMonth}
                                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                                />
                            </div>
                        )}

                        {/* Time Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Hour</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.hour}
                                    onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Minute</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={formData.minute}
                                    onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Timezone */}
                        <div className="grid gap-2">
                            <Label>Timezone</Label>
                            <Select value={formData.timezone} onValueChange={(v) => setFormData({ ...formData, timezone: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timezoneOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Job-specific config fields */}
                        {renderConfigFields()}

                        <Separator />

                        {/* Enable toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Enable Job</Label>
                                <p className="text-xs text-muted-foreground">Run this job on schedule</p>
                            </div>
                            <Switch
                                checked={formData.is_enabled}
                                onCheckedChange={(v) => setFormData({ ...formData, is_enabled: v })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {!isCreating && editingConfig && (
                            <Button variant="destructive" onClick={() => { handleDelete(editingConfig); setIsModalOpen(false) }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>
                            {isCreating ? 'Create' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* History Modal */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Run History - {getJobTypeInfo(historyConfig?.job_type || '')?.name}</DialogTitle>
                    </DialogHeader>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Started</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Initiated By</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No run history available
                                    </TableCell>
                                </TableRow>
                            ) : history.map(log => (
                                <HistoryRow key={log.id} log={log} />
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </div>
    )
}
