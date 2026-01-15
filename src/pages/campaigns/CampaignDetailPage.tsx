/**
 * Campaign Detail Page
 * View and manage a single campaign with enrollments and auto-scheduler
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
    ArrowLeft, Calendar, Users, Play, Pause, 
    UserPlus, Wand2, Trash2, CheckCircle2, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Campaign, Employee, GenerateScheduleRequest, Session } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function CampaignDetailPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [instructors, setInstructors] = useState<Employee[]>([])
    const [campaignSessions, setCampaignSessions] = useState<Session[]>([])
    const [loadingSessions, setLoadingSessions] = useState(false)

    // Enrollment dialog
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [enrolling, setEnrolling] = useState(false)

    // Auto-scheduler dialog
    const [schedulerDialogOpen, setSchedulerDialogOpen] = useState(false)
    const [scheduling, setScheduling] = useState(false)
    const [schedulerForm, setSchedulerForm] = useState<GenerateScheduleRequest>({
        instructorId: '',
        location: '',
        sessionDurationHours: 2,
        preferredDays: ['monday', 'wednesday', 'friday'],
        preferredTime: '09:00',
        breakBetweenMinutes: 60
    })

    useEffect(() => {
        loadCampaign()
        loadEmployees()
        loadCampaignSessions()
    }, [id])

    const loadCampaignSessions = async () => {
        if (!id) return
        try {
            setLoadingSessions(true)
            const response = await api.get(`/sessions`, { params: { campaignId: id } })
            setCampaignSessions(response.data.data || [])
        } catch (error) {
            console.error('Failed to load campaign sessions:', error)
        } finally {
            setLoadingSessions(false)
        }
    }

    const loadCampaign = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/campaigns/${id}`)
            setCampaign(response.data.data)
        } catch (error) {
            console.error('Failed to load campaign:', error)
            toast.error(t('campaigns.loadError', 'Failed to load campaign'))
        } finally {
            setLoading(false)
        }
    }

    const loadEmployees = async () => {
        try {
            const response = await api.get('/employees')
            const allEmployees = response.data.data || []
            setEmployees(allEmployees)
            setInstructors(allEmployees.filter((e: Employee) => 
                e.role === 'instructor' || e.role === 'training_manager' || e.role === 'admin'
            ))
        } catch (error) {
            console.error('Failed to load employees:', error)
        }
    }

    const handleEnroll = async () => {
        if (selectedEmployees.length === 0) {
            toast.error(t('campaigns.selectEmployees', 'Select at least one employee'))
            return
        }

        try {
            setEnrolling(true)
            await api.post(`/campaigns/${id}/enroll`, { userIds: selectedEmployees })
            toast.success(t('campaigns.enrolled', '{count} employees enrolled', { count: selectedEmployees.length }))
            setEnrollDialogOpen(false)
            setSelectedEmployees([])
            loadCampaign()
        } catch (error: any) {
            console.error('Failed to enroll:', error)
            toast.error(error.response?.data?.error?.message || t('errors.enrollError', 'Failed to enroll'))
        } finally {
            setEnrolling(false)
        }
    }

    const handleUnenroll = async (userId: string) => {
        try {
            await api.delete(`/campaigns/${id}/enroll/${userId}`)
            toast.success(t('campaigns.unenrolled', 'Removed from campaign'))
            loadCampaign()
        } catch (error) {
            console.error('Failed to unenroll:', error)
            toast.error(t('errors.unenrollError', 'Failed to remove'))
        }
    }

    const handleGenerateSchedule = async () => {
        try {
            setScheduling(true)
            const response = await api.post(`/campaigns/${id}/generate-schedule`, schedulerForm)
            toast.success(t('campaigns.scheduleGenerated', '{count} sessions created', { 
                count: response.data.summary.sessionsCreated 
            }))
            setSchedulerDialogOpen(false)
            loadCampaign()
            loadCampaignSessions() // Reload sessions to show generated schedule
        } catch (error: any) {
            console.error('Failed to generate schedule:', error)
            toast.error(error.response?.data?.error?.message || t('errors.scheduleError', 'Failed to generate'))
        } finally {
            setScheduling(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        try {
            await api.put(`/campaigns/${id}`, { status: newStatus })
            toast.success(t('campaigns.statusUpdated', 'Status updated'))
            loadCampaign()
        } catch (error) {
            console.error('Failed to update status:', error)
            toast.error(t('errors.updateError', 'Failed to update'))
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-slate-500'
            case 'scheduled': return 'bg-blue-500'
            case 'in_progress': return 'bg-amber-500'
            case 'completed': return 'bg-green-500'
            case 'failed': return 'bg-red-500'
            default: return 'bg-slate-500'
        }
    }

    const enrolledIds = new Set(campaign?.enrollments?.map(e => e.userId) || [])
    const availableEmployees = employees.filter(e => !enrolledIds.has(e.id))

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex h-96 items-center justify-center">
                <p className="text-muted-foreground">{t('campaigns.notFound', 'Campaign not found')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
                            <Badge className={cn(
                                campaign.status === 'draft' && 'bg-slate-500',
                                campaign.status === 'active' && 'bg-blue-500',
                                campaign.status === 'paused' && 'bg-amber-500',
                                campaign.status === 'completed' && 'bg-green-500'
                            )}>
                                {campaign.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {campaign.curriculum?.name}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {campaign.status === 'draft' && (
                        <Button variant="outline" onClick={() => handleStatusChange('active')}>
                            <Play className="mr-2 h-4 w-4" />
                            {t('campaigns.activate', 'Activate')}
                        </Button>
                    )}
                    {campaign.status === 'active' && (
                        <Button variant="outline" onClick={() => handleStatusChange('paused')}>
                            <Pause className="mr-2 h-4 w-4" />
                            {t('campaigns.pause', 'Pause')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('campaigns.progress', 'Progress')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold">{campaign.progressPercent}%</span>
                        </div>
                        <Progress value={campaign.progressPercent} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('campaigns.enrolled', 'Enrolled')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="text-3xl font-bold">{campaign.totalEnrollments || campaign.enrollments?.length || 0}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('campaigns.completed', 'Completed')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-3xl font-bold">{campaign.completedCount || 0}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('campaigns.dateRange', 'Date Range')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span>
                                {format(new Date(campaign.dateRangeStart), 'MMM d')} - {format(new Date(campaign.dateRangeEnd), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="enrollments">
                <TabsList>
                    <TabsTrigger value="enrollments">{t('campaigns.enrollments', 'Enrollments')}</TabsTrigger>
                    <TabsTrigger value="schedule">{t('campaigns.schedule', 'Schedule')}</TabsTrigger>
                    <TabsTrigger value="settings">{t('campaigns.settings', 'Settings')}</TabsTrigger>
                </TabsList>

                <TabsContent value="enrollments" className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">{t('campaigns.enrolledTrainees', 'Enrolled Trainees')}</h3>
                        <div className="flex gap-2">
                            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        {t('campaigns.addTrainees', 'Add Trainees')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>{t('campaigns.addTrainees', 'Add Trainees')}</DialogTitle>
                                        <DialogDescription>
                                            {t('campaigns.selectTrainees', 'Select trainees to enroll in this campaign.')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="max-h-80 overflow-auto space-y-2">
                                        {availableEmployees.map((emp) => (
                                            <div 
                                                key={emp.id}
                                                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent cursor-pointer"
                                                onClick={() => {
                                                    if (selectedEmployees.includes(emp.id)) {
                                                        setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id))
                                                    } else {
                                                        setSelectedEmployees([...selectedEmployees, emp.id])
                                                    }
                                                }}
                                            >
                                                <Checkbox 
                                                    checked={selectedEmployees.includes(emp.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedEmployees([...selectedEmployees, emp.id])
                                                        } else {
                                                            setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id))
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <p className="font-medium">{emp.fullName}</p>
                                                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {availableEmployees.length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">
                                                {t('campaigns.allEnrolled', 'All employees are already enrolled.')}
                                            </p>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
                                            {t('common.cancel', 'Cancel')}
                                        </Button>
                                        <Button onClick={handleEnroll} disabled={enrolling || selectedEmployees.length === 0}>
                                            {enrolling ? t('common.enrolling', 'Enrolling...') : t('campaigns.enroll', 'Enroll')} ({selectedEmployees.length})
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={schedulerDialogOpen} onOpenChange={setSchedulerDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        {t('campaigns.autoSchedule', 'Auto-Schedule')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('campaigns.autoScheduler', 'Auto-Scheduler')}</DialogTitle>
                                        <DialogDescription>
                                            {t('campaigns.autoSchedulerDesc', 'Automatically generate training sessions for all enrolled trainees.')}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('campaigns.instructor', 'Default Instructor')}</Label>
                                            <Select 
                                                value={schedulerForm.instructorId}
                                                onValueChange={(v) => setSchedulerForm({ ...schedulerForm, instructorId: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('campaigns.selectInstructor', 'Select instructor')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {instructors.map((i) => (
                                                        <SelectItem key={i.id} value={i.id}>
                                                            {i.fullName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('campaigns.location', 'Location')}</Label>
                                            <Input 
                                                value={schedulerForm.location}
                                                onChange={(e) => setSchedulerForm({ ...schedulerForm, location: e.target.value })}
                                                placeholder="e.g., Training Center A"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('campaigns.sessionDuration', 'Session Duration (hours)')}</Label>
                                            <Select 
                                                value={schedulerForm.sessionDurationHours?.toString()}
                                                onValueChange={(v) => setSchedulerForm({ ...schedulerForm, sessionDurationHours: parseInt(v) })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 hour</SelectItem>
                                                    <SelectItem value="2">2 hours</SelectItem>
                                                    <SelectItem value="4">4 hours</SelectItem>
                                                    <SelectItem value="8">8 hours (full day)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>{t('campaigns.preferredDays', 'Preferred Days')}</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                                                    <Button
                                                        key={day}
                                                        type="button"
                                                        variant={schedulerForm.preferredDays?.includes(day) ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentDays = schedulerForm.preferredDays || []
                                                            const newDays = currentDays.includes(day)
                                                                ? currentDays.filter(d => d !== day)
                                                                : [...currentDays, day]
                                                            setSchedulerForm({ ...schedulerForm, preferredDays: newDays })
                                                        }}
                                                    >
                                                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{t('campaigns.preferredTime', 'Preferred Start Time')}</Label>
                                                <Input 
                                                    type="time"
                                                    value={schedulerForm.preferredTime || '09:00'}
                                                    onChange={(e) => setSchedulerForm({ ...schedulerForm, preferredTime: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('campaigns.breakBetween', 'Break Between Sessions')}</Label>
                                                <Select 
                                                    value={schedulerForm.breakBetweenMinutes?.toString() || '60'}
                                                    onValueChange={(v) => setSchedulerForm({ ...schedulerForm, breakBetweenMinutes: parseInt(v) })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">No break</SelectItem>
                                                        <SelectItem value="15">15 minutes</SelectItem>
                                                        <SelectItem value="30">30 minutes</SelectItem>
                                                        <SelectItem value="60">1 hour</SelectItem>
                                                        <SelectItem value="120">2 hours</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Card className="bg-muted/50">
                                            <CardContent className="pt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    {t('campaigns.willGenerate', 'This will generate approximately')}:
                                                </p>
                                                <p className="text-lg font-medium">
                                                    {Math.ceil((campaign.enrollments?.length || 0) / campaign.maxPerSession)} {t('campaigns.sessions', 'sessions')}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    ({campaign.enrollments?.length || 0} {t('campaigns.trainees', 'trainees')} ÷ {campaign.maxPerSession} {t('campaigns.perSession', 'per session')})
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSchedulerDialogOpen(false)}>
                                            {t('common.cancel', 'Cancel')}
                                        </Button>
                                        <Button onClick={handleGenerateSchedule} disabled={scheduling}>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            {scheduling ? t('campaigns.generating', 'Generating...') : t('campaigns.generate', 'Generate Schedule')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Enrollments table */}
                    <div className="rounded-lg border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name', 'Name')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.email', 'Email')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status', 'Status')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.enrolledAt', 'Enrolled')}</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">{t('common.actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {campaign.enrollments?.map((enrollment) => (
                                        <tr key={enrollment.id} className="hover:bg-muted/25">
                                            <td className="px-4 py-3 font-medium">{enrollment.user?.fullName}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{enrollment.user?.email}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={getStatusColor(enrollment.status)}>
                                                    {enrollment.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleUnenroll(enrollment.userId)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!campaign.enrollments || campaign.enrollments.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                {t('campaigns.noEnrollments', 'No trainees enrolled yet.')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                            {t('campaigns.generatedSessions', 'Generated Sessions')} 
                            {campaignSessions.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({campaignSessions.length})
                                </span>
                            )}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => navigate('/sessions')}>
                            {t('campaigns.viewInSchedule', 'View in Schedule')}
                        </Button>
                    </div>
                    
                    {loadingSessions ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                        </Card>
                    ) : campaignSessions.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">
                                {t('campaigns.noSessions', 'No sessions generated yet. Use the Auto-Scheduler to create sessions.')}
                            </p>
                        </Card>
                    ) : (
                        <div className="rounded-lg border">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.date', 'Date')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.time', 'Time')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.location', 'Location')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.instructor', 'Instructor')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status', 'Status')}</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">{t('common.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {campaignSessions.map((session) => (
                                            <tr key={session.id} className="hover:bg-muted/25">
                                                <td className="px-4 py-3 font-medium">
                                                    {format(new Date(session.dateStart), 'EEE, MMM d, yyyy')}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {format(new Date(session.dateStart), 'HH:mm')} - {format(new Date(session.dateEnd), 'HH:mm')}
                                                </td>
                                                <td className="px-4 py-3">{session.location || '-'}</td>
                                                <td className="px-4 py-3">{session.instructor?.fullName || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className={cn(
                                                        session.status === 'planned' && 'bg-blue-100 text-blue-800',
                                                        session.status === 'completed' && 'bg-green-100 text-green-800',
                                                        session.status === 'cancelled' && 'bg-red-100 text-red-800'
                                                    )}>
                                                        {session.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => navigate(`/sessions/${session.id}`)}
                                                    >
                                                        {t('common.view', 'View')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('campaigns.campaignSettings', 'Campaign Settings')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('campaigns.maxPerSession', 'Max per Session')}</Label>
                                    <Input 
                                        type="number"
                                        value={campaign.maxPerSession}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('campaigns.defaultLocation', 'Default Location')}</Label>
                                    <Input 
                                        value={campaign.defaultLocation || ''}
                                        disabled
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">{t('common.dangerZone', 'Danger Zone')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button 
                                variant="destructive" 
                                onClick={() => handleStatusChange('cancelled')}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('campaigns.cancelCampaign', 'Cancel Campaign')}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
