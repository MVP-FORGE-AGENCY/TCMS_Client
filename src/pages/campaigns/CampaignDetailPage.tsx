/**
 * Campaign Detail Page
 * View and manage a single campaign with enrollments and auto-scheduler
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
    ArrowLeft, Calendar, Users, Play, Pause, Award,
    UserPlus, Wand2, Trash2, CheckCircle2, XCircle, Pencil, CalendarPlus, FileText, Download, Search, Loader2
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { api, curriculums, materialActions } from '@/lib/api'
import type { Campaign, Employee, GenerateScheduleRequest, Session, CurriculumModule } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export default function CampaignDetailPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    const [campaign, setCampaign] = useState<Campaign | null>(null)

    const [employees, setEmployees] = useState<Employee[]>([])
    const [instructors, setInstructors] = useState<Employee[]>([])
    const [campaignSessions, setCampaignSessions] = useState<Session[]>([])
    const [loadingSessions, setLoadingSessions] = useState(false)
    const [page, setPage] = useState(1)
    const [limit] = useState(20)
    const [totalSessions, setTotalSessions] = useState(0)

    // Enrollment dialog
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [enrolling, setEnrolling] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('all')

    // Auto-scheduler dialog
    const [schedulerDialogOpen, setSchedulerDialogOpen] = useState(false)
    const [scheduling, setScheduling] = useState(false)
    const [curriculumModules, setCurriculumModules] = useState<CurriculumModule[]>([])
    const [moduleInstructors, setModuleInstructors] = useState<Record<string, string>>({})
    const [schedulerForm, setSchedulerForm] = useState<GenerateScheduleRequest>({
        instructorId: '',
        location: '',
        sessionDurationHours: 2,
        preferredDays: ['monday', 'wednesday', 'friday'],
        preferredTime: '09:00',
        breakBetweenMinutes: 60
    })

    // Edit session dialog
    const [editSessionDialogOpen, setEditSessionDialogOpen] = useState(false)
    const [editingSession, setEditingSession] = useState<Session | null>(null)
    const [editSessionForm, setEditSessionForm] = useState({ instructorId: '', location: '' })
    const [savingSession, setSavingSession] = useState(false)

    // Manual schedule dialog
    const [manualScheduleDialogOpen, setManualScheduleDialogOpen] = useState(false)
    const [manualScheduling, setManualScheduling] = useState(false)
    const [manualScheduleForm, setManualScheduleForm] = useState({
        moduleId: '',
        scheduleAll: false,
        dateStart: '',
        instructorId: '',
        location: '',
        sessionDurationHours: 2,
        selectedTraineeIds: [] as string[]
    })
    // Trainees for manual schedule module selection
    interface ScheduleModuleTrainee {
        userId: string
        fullName: string
        email: string
        hoursAttended: number
        hoursTotal: number
        isComplete: boolean
    }
    const [scheduleModuleTrainees, setScheduleModuleTrainees] = useState<ScheduleModuleTrainee[]>([])
    const [loadingScheduleTrainees, setLoadingScheduleTrainees] = useState(false)

    // Materials state
    interface Material {
        id: string
        title: string
        type: string
        version: number
        status: string
        moduleId?: string
        moduleName?: string
    }
    const [materials, setMaterials] = useState<Material[]>([])
    const [loadingMaterials, setLoadingMaterials] = useState(false)

    // Modules tab state
    interface CampaignModuleStats {
        id: string
        name: string
        type: string
        sequence: number
        durationHours?: number
        requiresTheory?: boolean
        requiresPractical?: boolean
        totalSessions: number
        completedSessions: number
        totalTrainees: number
    }
    const [campaignModulesStats, setCampaignModulesStats] = useState<CampaignModuleStats[]>([])
    const [loadingModules, setLoadingModules] = useState(false)
    const [generatingCerts, setGeneratingCerts] = useState(false)
    const [certConfirmOpen, setCertConfirmOpen] = useState(false)
    const [emailCertificates, setEmailCertificates] = useState(false)
    
    // Module detail dialog
    interface ModuleTrainee {
        userId: string
        fullName: string
        email: string
        sessionsAttended: number
        sessionsAbsent: number
        scheduledHours: number
        totalModuleHours: number
        totalSessions: number
        theoryScore?: number | null
        practicalScore?: number | null
        result: string
    }
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
    const [moduleTrainees, setModuleTrainees] = useState<ModuleTrainee[]>([])
    const [loadingModuleTrainees, setLoadingModuleTrainees] = useState(false)
    const [moduleDetailOpen, setModuleDetailOpen] = useState(false)

    // Trainee details dialog state
    interface TraineeModuleResult {
        id: string
        name: string
        type: string
        sequence: number
        result: string
        theoryScore?: number | null
        practicalScore?: number | null
        sessionsAttended: number
        sessionsAbsent: number
        totalSessions: number
        isComplete: boolean
    }
    interface TraineeDetailsData {
        trainee: { id: string; fullName: string; email: string } | null
        campaign: { id: string; name: string }
        modules: TraineeModuleResult[]
    }
    const [traineeDetailsOpen, setTraineeDetailsOpen] = useState(false)
    const [traineeDetailsData, setTraineeDetailsData] = useState<TraineeDetailsData | null>(null)
    const [loadingTraineeDetails, setLoadingTraineeDetails] = useState(false)
    
    // Retake session dialog
    const [retakeDialogOpen, setRetakeDialogOpen] = useState(false)
    const [selectedRetakeModule, setSelectedRetakeModule] = useState<TraineeModuleResult | null>(null)
    const [retakeDate, setRetakeDate] = useState('')
    const [retakeInstructor, setRetakeInstructor] = useState('')
    const [creatingRetake, setCreatingRetake] = useState(false)


    useEffect(() => {
        loadCampaign()
        loadEmployees()
    }, [id])

    useEffect(() => {
        if (campaign?.curriculum?.id) {
            loadMaterials(campaign.curriculum.id)
        }
    }, [campaign?.curriculum?.id])
    
    useEffect(() => {
        loadCampaignSessions()
    }, [id, page])

    const loadCampaignSessions = async () => {
        if (!id) return
        try {
            setLoadingSessions(true)
            const response = await api.get(`/sessions`, { 
                params: { 
                    campaignId: id,
                    page,
                    limit
                } 
            })
            setCampaignSessions(response.data.data || [])
            setTotalSessions(response.data.pagination?.total || 0)
        } catch (error) {
            console.error('Failed to load campaign sessions:', error)
        } finally {
            setLoadingSessions(false)
        }
    }

    const loadCampaign = async () => {
        try {

            const response = await api.get(`/campaigns/${id}`)
            setCampaign(response.data.data)
        } catch (error) {
            console.error('Failed to load campaign:', error)
            toast.error(t('campaigns.loadError', 'Failed to load campaign'))
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

    const loadMaterials = async (curriculumId: string) => {
        try {
            setLoadingMaterials(true)
            const response = await curriculums.getMaterials(curriculumId)
            // Only show approved materials
            setMaterials((response || []).filter((m: Material) => m.status === 'approved'))
        } catch (error) {
            console.error('Failed to load curriculum materials:', error)
        } finally {
            setLoadingMaterials(false)
        }
    }

    const loadCampaignModules = async () => {
        if (!id) return
        try {
            setLoadingModules(true)
            const response = await api.get(`/campaigns/${id}/modules`)
            setCampaignModulesStats(response.data.data || [])
        } catch (error) {
            console.error('Failed to load campaign modules:', error)
        } finally {
            setLoadingModules(false)
        }
    }

    const loadModuleTrainees = async (moduleId: string) => {
        if (!id) return
        try {
            setLoadingModuleTrainees(true)
            setSelectedModuleId(moduleId)
            const response = await api.get(`/campaigns/${id}/modules/${moduleId}/trainees`)
            setModuleTrainees(response.data.data?.trainees || [])
            setModuleDetailOpen(true)
        } catch (error) {
            console.error('Failed to load module trainees:', error)
            toast.error(t('campaigns.loadModuleError', 'Failed to load module details'))
        } finally {
            setLoadingModuleTrainees(false)
        }
    }

    const loadTraineeModules = async (userId: string) => {
        if (!id) return
        try {
            setLoadingTraineeDetails(true)
            const response = await api.get(`/campaigns/${id}/trainees/${userId}/modules`)
            setTraineeDetailsData(response.data.data)
            setTraineeDetailsOpen(true)
        } catch (error) {
            console.error('Failed to load trainee modules:', error)
            toast.error(t('campaigns.loadTraineeError', 'Failed to load trainee details'))
        } finally {
            setLoadingTraineeDetails(false)
        }
    }

    const handleScheduleRetake = (module: TraineeModuleResult) => {
        setSelectedRetakeModule(module)
        setRetakeDate('')
        setRetakeInstructor('')
        setRetakeDialogOpen(true)
    }

    const createRetake = async () => {
        if (!id || !selectedRetakeModule || !traineeDetailsData?.trainee || !retakeDate) return
        try {
            setCreatingRetake(true)
            await api.post(`/campaigns/${id}/sessions/retake`, {
                moduleId: selectedRetakeModule.id,
                userIds: [traineeDetailsData.trainee.id],
                dateStart: retakeDate,
                instructorId: retakeInstructor || undefined,
                sessionType: 'combined'
            })
            toast.success(t('campaigns.retakeCreated', 'Retake session created'))
            setRetakeDialogOpen(false)
            // Refresh trainee details
            loadTraineeModules(traineeDetailsData.trainee.id)
            loadCampaign()
        } catch (error) {
            console.error('Failed to create retake session:', error)
            toast.error(t('campaigns.retakeError', 'Failed to create retake session'))
        } finally {
            setCreatingRetake(false)
        }
    }

    // Load modules when campaign loads
    useEffect(() => {
        if (id) {
            loadCampaignModules()
        }
    }, [id])

    const handleDownload = async (materialId: string) => {
        try {
            const { url } = await materialActions.getDownloadUrl(materialId)
            window.open(url, '_blank')
        } catch (error) {
            toast.error(t('materials.downloadError', 'Failed to get download URL'))
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

    // Load curriculum modules for the campaign's curriculum
    const loadCurriculumModules = async (curriculumId: string) => {
        try {
            const response = await api.get(`/curriculums/${curriculumId}`)
            const modules = response.data.data?.modules || []
            setCurriculumModules(modules.sort((a: CurriculumModule, b: CurriculumModule) => a.sequence - b.sequence))
        } catch (error) {
            console.error('Failed to load curriculum modules:', error)
        }
    }

    // Load modules when campaign loads
    useEffect(() => {
        if (campaign?.curriculum?.id) {
            loadCurriculumModules(campaign.curriculum.id)
        }
    }, [campaign?.curriculum?.id])

    // Load trainees when module is selected in manual schedule form
    useEffect(() => {
        const loadScheduleModuleTrainees = async () => {
            if (!id || !manualScheduleForm.moduleId) {
                setScheduleModuleTrainees([])
                return
            }
            try {
                setLoadingScheduleTrainees(true)
                const response = await api.get(`/campaigns/${id}/modules/${manualScheduleForm.moduleId}/trainees`)
                const trainees = response.data.data?.trainees || []
                
                // Use backend-provided scheduled hours per trainee
                const mappedTrainees: ScheduleModuleTrainee[] = trainees.map((t: ModuleTrainee) => {
                    const hoursAttended = t.scheduledHours || 0
                    const hoursTotal = t.totalModuleHours || 0
                    return {
                        userId: t.userId,
                        fullName: t.fullName,
                        email: t.email,
                        hoursAttended,
                        hoursTotal,
                        isComplete: hoursAttended >= hoursTotal && hoursTotal > 0
                    }
                })
                setScheduleModuleTrainees(mappedTrainees)
                
                // Auto-select non-complete trainees
                const nonCompleteIds = mappedTrainees.filter(t => !t.isComplete).map(t => t.userId)
                setManualScheduleForm(prev => ({ ...prev, selectedTraineeIds: nonCompleteIds }))
            } catch (error) {
                console.error('Failed to load schedule module trainees:', error)
                setScheduleModuleTrainees([])
            } finally {
                setLoadingScheduleTrainees(false)
            }
        }
        loadScheduleModuleTrainees()
    }, [id, manualScheduleForm.moduleId])

    const handleGenerateSchedule = async () => {
        try {
            setScheduling(true)
            // Include moduleInstructors in the request
            const requestData = {
                ...schedulerForm,
                moduleInstructors: Object.keys(moduleInstructors).length > 0 ? moduleInstructors : undefined
            }
            const response = await api.post(`/campaigns/${id}/generate-schedule`, requestData)
            toast.success(t('campaigns.scheduleGenerated', '{count} sessions created', { 
                count: response.data.summary.sessionsCreated 
            }))
            setSchedulerDialogOpen(false)
            setModuleInstructors({}) // Reset
            loadCampaign()
            loadCampaignSessions()
        } catch (error: any) {
            console.error('Failed to generate schedule:', error)
            toast.error(error.response?.data?.error?.message || t('errors.scheduleError', 'Failed to generate'))
        } finally {
            setScheduling(false)
        }
    }

    // Edit session handlers
    const openEditSessionDialog = (session: Session) => {
        setEditingSession(session)
        setEditSessionForm({
            instructorId: session.instructorId || '',
            location: session.location || ''
        })
        setEditSessionDialogOpen(true)
    }

    const handleSaveSession = async () => {
        if (!editingSession) return
        try {
            setSavingSession(true)
            await api.patch(`/sessions/${editingSession.id}`, {
                instructorId: editSessionForm.instructorId || undefined,
                location: editSessionForm.location || undefined
            })
            toast.success(t('sessions.updated', 'Session updated'))
            setEditSessionDialogOpen(false)
            loadCampaignSessions()
        } catch (error: any) {
            console.error('Failed to update session:', error)
            toast.error(error.response?.data?.error?.message || t('errors.updateError', 'Failed to update'))
        } finally {
            setSavingSession(false)
        }
    }

    // Manual schedule handlers
    const handleManualSchedule = async () => {
        if (!manualScheduleForm.moduleId || !manualScheduleForm.dateStart) {
            toast.error(t('validation.required', 'Module and date are required'))
            return
        }
        try {
            setManualScheduling(true)
            const response = await api.post(`/campaigns/${id}/schedule-module`, {
                ...manualScheduleForm,
                participantIds: manualScheduleForm.selectedTraineeIds
            })
            toast.success(t('campaigns.sessionsScheduled', '{count} session(s) scheduled', {
                count: response.data.summary.sessionsCreated
            }))
            setManualScheduleDialogOpen(false)
            setManualScheduleForm({ moduleId: '', scheduleAll: false, dateStart: '', instructorId: '', location: '', sessionDurationHours: 2, selectedTraineeIds: [] })
            setScheduleModuleTrainees([])
            loadCampaign()
            loadCampaignSessions()
        } catch (error: any) {
            console.error('Failed to schedule sessions:', error)
            toast.error(error.response?.data?.error?.message || t('errors.scheduleError', 'Failed to schedule'))
        } finally {
            setManualScheduling(false)
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

    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
    
    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm(t('sessions.confirmDelete', 'Are you sure you want to delete this session? This action cannot be undone.'))) {
            return
        }
        try {
            setDeletingSessionId(sessionId)
            await api.delete(`/sessions/${sessionId}`)
            toast.success(t('sessions.deleted', 'Session deleted'))
            loadCampaignSessions()
        } catch (error: any) {
            console.error('Failed to delete session:', error)
            toast.error(error.response?.data?.error?.message || t('errors.deleteError', 'Failed to delete session'))
        } finally {
            setDeletingSessionId(null)
        }
    }


    const enrolledIds = new Set(campaign?.enrollments?.map(e => e.userId) || [])
    const availableEmployees = employees.filter(e => !enrolledIds.has(e.id))
    
    // Departments for filter
    const departments = Array.from(new Set(employees.map(e => e.departmentTag).filter(Boolean))) as string[]

    // Filter employees
    const filteredEmployees = availableEmployees.filter(emp => {
        const doc = (emp.fullName + ' ' + (emp.email || '')).toLowerCase()
        const matchesSearch = doc.includes(searchTerm.toLowerCase())
        const matchesDepartment = departmentFilter === 'all' || emp.departmentTag === departmentFilter
        return matchesSearch && matchesDepartment
    })

    // Compute module scheduling status for manual scheduling
    // Note: A module being "complete" is per-trainee, not per-module overall
    // We show total scheduled hours as informational only; actual completion is checked per-trainee
    const totalEnrollments = campaign?.enrollments?.length || 0
    const moduleSchedulingStatus = curriculumModules.map(mod => {
        const sessionsForModule = campaignSessions.filter(
            s => (s.curriculumModuleId || s.curriculumModule?.id) === mod.id
        )
        const scheduledHours = sessionsForModule.reduce((acc, s) => {
            const start = new Date(s.dateStart).getTime()
            const end = s.dateEnd ? new Date(s.dateEnd).getTime() : start
            return acc + (end - start) / (1000 * 60 * 60)
        }, 0)
        const totalHours = mod.durationHours || 0
        // Total hours needed = module hours × number of enrolled trainees
        const totalHoursNeeded = totalHours * totalEnrollments
        return {
            ...mod,
            scheduledHours: Math.round(scheduledHours * 10) / 10,
            totalHours,
            totalHoursNeeded,
            remainingHours: Math.max(0, Math.round((totalHoursNeeded - scheduledHours) * 10) / 10),
            // A module is only complete if we've scheduled enough hours for all trainees
            isComplete: totalEnrollments > 0 && scheduledHours >= totalHoursNeeded && totalHoursNeeded > 0
        }
    })

    // Compute eligible trainees
    const eligibleTrainees = campaign?.enrollments?.filter(e => e.allModulesPassed) || []
    const eligibleTraineesIds = eligibleTrainees.map(e => e.userId)
    const allEligibleHaveCerts = eligibleTrainees.length > 0 && eligibleTrainees.every(e => e.certificateId)
    
    const handleOpenCertDialog = () => {
        if (eligibleTrainees.length === 0) {
            toast.info(t('campaigns.noEligibleTrainees', 'No eligible trainees found'))
            return
        }
        setCertConfirmOpen(true)
    }

    const handleGenerateCertificates = async () => {
        try {
            setGeneratingCerts(true)
            const res = await api.post(`/reports/campaigns/${id}/certificate`, { userIds: eligibleTraineesIds, email: emailCertificates })
            const { generated, skipped } = res.data
            toast.success(t('campaigns.certificatesGenerated', `Generated ${generated} certs. Skipped ${skipped}.`, { generated, skipped }))
            setCertConfirmOpen(false)
            loadCampaign() // Reload to update certificate status
        } catch (error: any) {
            console.error('Failed to generate certificates:', error)
            toast.error(error.response?.data?.error || t('errors.generateError', 'Failed to generate certificates'))
        } finally {
            setGeneratingCerts(false)
        }
    }

    // ... existing status change handler ...

    if (!campaign) return <div className="p-8 text-center">{t('common.loading', 'Loading...')}</div>

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
                    
                    {(campaign.status === 'completed' || campaign.progressPercent === 100) && (
                        allEligibleHaveCerts ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" disabled className="gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {t('campaigns.certificatesGenerated', 'Certificates Generated')}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('campaigns.certificatesGeneratedTooltip', 'View certificates in employee personnel files')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Button 
                                variant="outline" 
                                onClick={handleOpenCertDialog}
                                disabled={generatingCerts}
                                className="gap-2"
                            >
                                {generatingCerts ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Award className="h-4 w-4" />
                                )}
                                {t('campaigns.generateCertificates', 'Generate Certificates')}
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* Certificate Generation Dialog */}
            <Dialog open={certConfirmOpen} onOpenChange={setCertConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('campaigns.certificateGeneration', 'Certificate Generation')}</DialogTitle>
                        <DialogDescription>
                            {t('campaigns.eligibleTrainees', 'Eligible Trainees:')} {eligibleTrainees.length}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="max-h-60 overflow-y-auto rounded-md border p-2">
                             {eligibleTrainees.map((e) => (
                                <div key={e.userId} className="flex items-center justify-between py-1 text-sm">
                                    <span>{e.user?.fullName || e.userId}</span>
                                    {e.certificateId && <Badge variant="secondary" className="text-xs">{t('campaigns.generated', 'Generated')}</Badge>}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg border p-3 bg-muted/50">
                            <Checkbox 
                                id="emailCerts" 
                                checked={emailCertificates} 
                                onCheckedChange={(c) => setEmailCertificates(!!c)} 
                                disabled
                            />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="emailCerts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {t('campaigns.emailCertificates', 'Email certificates to participants')}
                                </Label>
                                <p className="text-[0.8rem] text-muted-foreground">{t('campaigns.toBeImplemented', '(To be implemented)')}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCertConfirmOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={handleGenerateCertificates} disabled={generatingCerts}>
                            {generatingCerts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('common.confirm', 'Confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>{t('campaigns.progress', 'Progress')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold">{campaign.progressPercent || 0}%</span>
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
                                {format(new Date(campaign.dateRangeStart), 'MMM d')} - {new Date(campaign.dateRangeEnd).getFullYear() >= 2099 ? t('common.ongoing', 'Ongoing') : format(new Date(campaign.dateRangeEnd), 'MMM d, yyyy')}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="trainees">
                <TabsList>
                    <TabsTrigger value="trainees">{t('campaigns.trainees', 'Trainees')}</TabsTrigger>
                    <TabsTrigger value="modules">{t('campaigns.modules', 'Modules')}</TabsTrigger>
                    <TabsTrigger value="schedule">{t('campaigns.schedule', 'Schedule')}</TabsTrigger>
                    <TabsTrigger value="materials">{t('campaigns.materials', 'Materials')}</TabsTrigger>
                    <TabsTrigger value="settings">{t('campaigns.settings', 'Settings')}</TabsTrigger>
                </TabsList>

                <TabsContent value="trainees" className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">{t('campaigns.enrolledTrainees', 'Enrolled Trainees')}</h3>
                        <div className="flex gap-2">
                            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => {
                                        setSearchTerm('')
                                        setDepartmentFilter('all')
                                        setEnrollDialogOpen(true)
                                    }}>
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
                                    {/* Filters */}
                                    <div className="flex gap-2 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={t('common.search', 'Search')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder={t('common.department', 'Department')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                                                {departments.map(dept => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="max-h-80 overflow-auto space-y-2">
                                        {filteredEmployees.map((emp) => (
                                            <div 
                                                key={emp.id}
                                                className="group flex items-center gap-3 rounded-lg border p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
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
                                                    className="pointer-events-none group-hover:border-accent-foreground"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium">{emp.fullName}</p>
                                                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-accent-foreground">
                                                        <span>{emp.email}</span>
                                                        {emp.departmentTag && (
                                                            <Badge variant="outline" className="text-xs group-hover:border-accent-foreground group-hover:text-accent-foreground">
                                                                {emp.departmentTag}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredEmployees.length === 0 && (
                                            <p className="text-center text-muted-foreground py-4">
                                                {availableEmployees.length === 0 
                                                    ? t('campaigns.allEnrolled', 'All employees are already enrolled.')
                                                    : t('common.noData', 'No data found')}
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
                                <DialogContent className="max-h-[85vh] overflow-y-auto">
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

                                        {/* Per-module instructor selection */}
                                        {curriculumModules.length > 0 && (
                                            <div className="space-y-2">
                                                <Label>{t('campaigns.instructorByModule', 'Instructor by Module')}</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('campaigns.instructorByModuleDesc', 'Optionally assign different instructors per module. Leave blank to use default.')}
                                                </p>
                                                <div className="max-h-48 overflow-auto space-y-2 border rounded-md p-2">
                                                    {curriculumModules.map(mod => (
                                                        <div key={mod.id} className="flex items-center gap-2">
                                                            <span className="w-40 text-sm truncate" title={mod.name}>
                                                                {mod.name}
                                                            </span>
                                                            <Select 
                                                                value={moduleInstructors[mod.id] || 'default'}
                                                                onValueChange={(v) => setModuleInstructors({
                                                                    ...moduleInstructors, 
                                                                    [mod.id]: v === 'default' ? '' : v
                                                                })}
                                                            >
                                                                <SelectTrigger className="flex-1">
                                                                    <SelectValue placeholder={t('common.default', 'Default')} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="default">
                                                                        {t('common.default', 'Default')}
                                                                    </SelectItem>
                                                                    {instructors.map((i) => (
                                                                        <SelectItem key={i.id} value={i.id}>
                                                                            {i.fullName}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

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
                                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(hours => (
                                                        <SelectItem key={hours} value={hours.toString()}>
                                                            {hours} {hours === 1 ? t('common.hour', 'hour') : t('common.hours', 'hours')}
                                                            {hours === 8 && ` (${t('common.fullDay', 'full day')})`}
                                                        </SelectItem>
                                                    ))}
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
                                                {(() => {
                                                    const groupCount = Math.ceil((campaign.enrollments?.length || 0) / (campaign.maxPerSession || 1))
                                                    const totalDuration = curriculumModules.reduce((acc, mod) => acc + (mod.durationHours || 0), 0)
                                                    // Fallback: if total duration is 0, use module count as a rough proxy for "sessions" or assume 2h per module
                                                    const effectiveTotalDuration = totalDuration > 0 ? totalDuration : (curriculumModules.length * 2) 
                                                    
                                                    const sessDuration = schedulerForm.sessionDurationHours || 2
                                                    const sessionsPerGroup = Math.ceil(effectiveTotalDuration / sessDuration)
                                                    const totalSessions = groupCount * sessionsPerGroup

                                                    return (
                                                        <>
                                                            <p className="text-sm text-muted-foreground">
                                                                {t('campaigns.willGenerate', 'This will generate approximately')}:
                                                            </p>
                                                            <p className="text-lg font-medium">
                                                                {totalSessions} {t('campaigns.sessions', 'sessions')}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {groupCount} {t('campaigns.groups', 'groups')} × {sessionsPerGroup} {t('campaigns.sessionsPerGroup', 'sessions/group')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                ({campaign.enrollments?.length || 0} {t('campaigns.trainees', 'trainees')} ÷ {campaign.maxPerSession} {t('campaigns.perSession', 'per session')})
                                                                {' × '}
                                                                ({effectiveTotalDuration}h {t('common.total', 'total')} ÷ {sessDuration}h {t('campaigns.perSession', 'per session')})
                                                            </p>
                                                        </>
                                                    )
                                                })()}
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

                    {/* Trainees table */}
                    <div className="rounded-lg border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name', 'Name')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.email', 'Email')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status', 'Status')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('campaigns.absences', 'Absences')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{t('common.enrolledAt', 'Enrolled')}</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">{t('common.actions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {campaign.enrollments?.map((enrollment) => {
                                        // Map status based on module results
                                        const getDisplayStatus = () => {
                                            // If trainee has any failed modules, show Failed
                                            if (enrollment.hasFailedModules) {
                                                return { label: t('common.statusFailed', 'Failed'), color: 'bg-red-500' }
                                            }
                                            // If all modules passed, show Passed
                                            if (enrollment.allModulesPassed) {
                                                return { label: t('common.passed', 'Passed'), color: 'bg-green-500' }
                                            }
                                            // Otherwise, ongoing
                                            return { label: t('common.ongoing', 'Ongoing'), color: 'bg-blue-500' }
                                        }
                                        const displayStatus = getDisplayStatus()
                                        
                                        return (
                                            <tr key={enrollment.id} className="hover:bg-muted/25">
                                                <td className="px-4 py-3 font-medium">{enrollment.user?.fullName}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{enrollment.user?.email}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className={displayStatus.color}>
                                                        {displayStatus.label}
                                                    </Badge>
                                                    {enrollment.hasFailedModules && (
                                                        <span className="ml-2 text-xs text-red-500">
                                                            {t('campaigns.failedModulesCount', '({{count}} failed)', { count: enrollment.failedModuleCount })}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={(enrollment.absenceCount ?? 0) > 0 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
                                                        {enrollment.absenceCount ?? 0} {t('common.of', 'of')} {campaignSessions.length === 0 ? 0 : (enrollment.totalSessions ?? 0)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {format(new Date(enrollment.enrolledAt), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-4 py-3 text-right flex justify-end gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => loadTraineeModules(enrollment.userId)}
                                                    >
                                                        {t('common.viewDetails', 'View Details')}
                                                    </Button>
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
                                        )
                                    })}
                                    {(!campaign.enrollments || campaign.enrollments.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                                {t('campaigns.noEnrollments', 'No trainees enrolled yet.')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* Modules Tab */}
                <TabsContent value="modules" className="space-y-4">
                    <div className="flex justify-between">
                        <h3 className="text-lg font-medium">{t('campaigns.curriculumModules', 'Curriculum Modules')}</h3>
                    </div>
                    
                    {loadingModules ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                        </Card>
                    ) : campaignModulesStats.length === 0 ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">
                                {t('campaigns.noModules', 'No modules found for this curriculum.')}
                            </p>
                        </Card>
                    ) : (
                        <div className="rounded-lg border">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('common.name', 'Name')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('common.type', 'Type')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('campaigns.sessions', 'Sessions')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('campaigns.progress', 'Progress')}</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">{t('common.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {campaignModulesStats.map((mod, idx) => {
                                            // Calculate stats from actual sessions
                                            const modSessions = campaignSessions.filter(s => (s.curriculumModuleId || s.curriculumModule?.id) === mod.id)
                                            const completedCount = modSessions.filter(s => s.status === 'completed').length
                                            const totalCount = modSessions.length
                                            
                                            return (
                                            <tr key={mod.id} className="hover:bg-muted/25">
                                                <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                                                <td className="px-4 py-3 font-medium">{mod.name}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={mod.type === 'assessment' ? 'destructive' : 'secondary'}>
                                                        {t(`modules.types.${mod.type}`, mod.type)}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-muted-foreground">
                                                        {completedCount} / {totalCount}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Progress 
                                                        value={totalCount > 0 ? (completedCount / totalCount) * 100 : 0} 
                                                        className="w-24" 
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => loadModuleTrainees(mod.id)}
                                                    >
                                                        {t('common.viewDetails', 'View Details')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {/* Module Detail Dialog */}
                    <Dialog open={moduleDetailOpen} onOpenChange={setModuleDetailOpen}>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {t('campaigns.moduleTrainees', 'Module Trainees')}
                                    {selectedModuleId && campaignModulesStats.find(m => m.id === selectedModuleId) && (
                                        <span className="ml-2 text-muted-foreground font-normal">
                                            - {campaignModulesStats.find(m => m.id === selectedModuleId)?.name}
                                        </span>
                                    )}
                                </DialogTitle>
                                <DialogDescription>
                                    {t('campaigns.moduleTraineesDesc', 'Trainee attendance and results for this module.')}
                                </DialogDescription>
                            </DialogHeader>
                            
                            {loadingModuleTrainees ? (
                                <div className="p-8 text-center">
                                    <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                                </div>
                            ) : moduleTrainees.length === 0 ? (
                                <div className="p-8 text-center">
                                    <p className="text-muted-foreground">{t('campaigns.noTraineesForModule', 'No trainees found for this module.')}</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-sm font-medium">{t('common.name', 'Name')}</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">{t('common.attendance', 'Attendance')}</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">{t('campaigns.theoryScore', 'Theory')}</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">{t('campaigns.practicalScore', 'Practical')}</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium">{t('common.result', 'Result')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {moduleTrainees.map((trainee) => (
                                            <tr key={trainee.userId} className="hover:bg-muted/25">
                                                <td className="px-4 py-2">
                                                    <div className="font-medium">{trainee.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{trainee.email}</div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={trainee.sessionsAbsent > 0 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
                                                        {trainee.sessionsAttended} / {trainee.totalSessions}
                                                    </span>
                                                    {trainee.sessionsAbsent > 0 && (
                                                        <div className="text-xs text-orange-500">
                                                            {t('campaigns.absentCount', '({{count}} absent)', { count: trainee.sessionsAbsent })}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {trainee.theoryScore != null ? `${trainee.theoryScore}%` : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {trainee.practicalScore != null ? `${trainee.practicalScore}%` : '-'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge className={
                                                        trainee.result === 'pass' ? 'bg-green-500' :
                                                        trainee.result === 'fail' ? 'bg-red-500' :
                                                        trainee.result === 'in_progress' ? 'bg-blue-500' :
                                                        'bg-gray-500'
                                                    }>
                                                        {trainee.result === 'in_progress' ? t('sessions.statuses.in_progress', 'In Progress') : 
                                                         trainee.result === 'not_assessed' ? t('common.notAssessed', 'Not Assessed') :
                                                         trainee.result === 'pass' ? t('common.passed', 'Passed') :
                                                         trainee.result === 'fail' ? t('common.statusFailed', 'Failed') :
                                                         trainee.result.toUpperCase()}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{t('campaigns.generatedSessions', 'Generated Sessions')}</h3>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => setSchedulerDialogOpen(true)}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                {t('campaigns.autoSchedule', 'Auto-Schedule')}
                            </Button>
                            <Button onClick={() => setManualScheduleDialogOpen(true)}>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                {t('campaigns.scheduleSession', 'Schedule Session')}
                            </Button>
                        </div>
                    </div>

                    {loadingSessions ? (
                        <Card className="p-8 text-center">
                            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                        </Card>
                    ) : campaignSessions.length === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-10 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-muted-foreground">
                                {t('campaigns.noSessions', 'No sessions generated yet. Use the Auto-Scheduler to create sessions.')}
                            </p>
                            <Button variant="outline" className="mt-4" onClick={() => setSchedulerDialogOpen(true)}>
                                <Wand2 className="mr-2 h-4 w-4" />
                                {t('campaigns.autoSchedule', 'Auto-Schedule')}
                            </Button>
                        </Card>
                    ) : (
                        <div className="rounded-lg border">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.date', 'Date')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.time', 'Time')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.duration', 'Duration')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.module', 'Module')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.location', 'Location')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.instructor', 'Instructor')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('sessions.trainees', 'Trainees')}</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">{t('common.status', 'Status')}</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">{t('common.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {campaignSessions.map((session) => {
                                            // Compute session number within the module
                                            const moduleId = session.curriculumModuleId || session.curriculumModule?.id
                                            const moduleSessions = campaignSessions.filter(s => 
                                                (s.curriculumModuleId || s.curriculumModule?.id) === moduleId
                                            ).sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime())
                                            const sessionNumber = moduleSessions.findIndex(s => s.id === session.id) + 1
                                            const totalModuleSessions = moduleSessions.length
                                            const moduleName = session.curriculumModule?.name || ''
                                            
                                            return (
                                            <tr key={session.id} className="hover:bg-muted/25">
                                                <td className="px-4 py-3 font-medium">
                                                    {format(new Date(session.dateStart), 'EEE, MMM d, yyyy')}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {format(new Date(session.dateStart), 'HH:mm')} - {format(new Date(session.dateEnd || session.dateStart), 'HH:mm')}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {(() => {
                                                        const start = new Date(session.dateStart).getTime()
                                                        const end = session.dateEnd ? new Date(session.dateEnd).getTime() : start
                                                        const hours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10
                                                        return `${hours}${t('common.hourShort', 'h')}`
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {moduleName || '-'}
                                                            {totalModuleSessions > 1 && ` (${sessionNumber}/${totalModuleSessions})`}
                                                        </span>
                                                        {session.isFinalModuleSession && (
                                                            <Badge variant="secondary" className="mt-1 w-fit text-[10px] h-5 bg-amber-100 text-amber-800 hover:bg-amber-100">
                                                                {t('sessions.finalExam', 'Final / Assessment')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{session.location || '-'}</td>
                                                <td className="px-4 py-3">{session.instructor?.fullName || '-'}</td>
                                                <td className="px-4 py-3">
                                                    {session.participantDisplay || (
                                                        <span className="text-muted-foreground text-sm">{t('sessions.noTrainees', 'No trainees')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className={cn(
                                                        session.status === 'planned' && 'bg-blue-100 text-blue-800',
                                                        session.status === 'completed' && 'bg-green-100 text-green-800',
                                                        session.status === 'cancelled' && 'bg-red-100 text-red-800'
                                                    )}>
                                                        {session.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right flex gap-1 justify-end">
                                                    {session.status === 'planned' && (
                                                        <>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                onClick={() => openEditSessionDialog(session)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                disabled={deletingSessionId === session.id}
                                                                onClick={() => handleDeleteSession(session.id)}
                                                            >
                                                                {deletingSessionId === session.id ? (
                                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => navigate(`/sessions/${session.id}?campaignId=${id}&campaignName=${encodeURIComponent(campaign?.name || '')}&moduleName=${encodeURIComponent(moduleName)}&sessionNumber=${sessionNumber}&totalSessions=${totalModuleSessions}`)}
                                                    >
                                                        {t('common.view', 'View')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    
                    {totalSessions > limit && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loadingSessions}
                            >
                                {t('common.previous', 'Previous')}
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                {t('common.pageOf', 'Page {current} of {total}', { 
                                    current: page, 
                                    total: Math.ceil(totalSessions / limit) 
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= Math.ceil(totalSessions / limit) || loadingSessions}
                            >
                                {t('common.next', 'Next')}
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="materials" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{t('campaigns.trainingMaterials', 'Training Materials')}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t('campaigns.materialsFromCurriculum', 'Materials from curriculum: {name}', { name: campaign.curriculum?.name || '' })}
                        </p>
                    </div>

                    {loadingMaterials ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : materials.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                {t('campaigns.noMaterials', 'No approved materials available for this curriculum.')}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-0">
                                <table className="w-full">
                                    <thead className="border-b bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3 font-medium">{t('materials.title', 'Title')}</th>
                                            <th className="text-left p-3 font-medium">{t('materials.module', 'Module')}</th>
                                            <th className="text-left p-3 font-medium">{t('materials.type', 'Type')}</th>
                                            <th className="text-center p-3 font-medium">{t('materials.version', 'Version')}</th>
                                            <th className="text-right p-3 font-medium">{t('common.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materials.map((m) => (
                                            <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{m.title}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {m.moduleName ? (
                                                        <Badge variant="outline" className="text-xs">{m.moduleName}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">General</span>
                                                    )}
                                                </td>
                                                <td className="p-3 uppercase text-xs text-muted-foreground">{m.type}</td>
                                                <td className="p-3 text-center">v{m.version}</td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(m.id)}
                                                    >
                                                        <Download className="h-4 w-4 mr-1" />
                                                        {t('common.download', 'Download')}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
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
                            <CardTitle className="text-destructive">{t('campaigns.dangerZone', 'Danger Zone')}</CardTitle>
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

            {/* Trainee Details Dialog */}
            <Dialog open={traineeDetailsOpen} onOpenChange={setTraineeDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {t('campaigns.traineeDetails', 'Trainee Module Results')}
                            {traineeDetailsData?.trainee && (
                                <span className="ml-2 text-muted-foreground font-normal">
                                    - {traineeDetailsData.trainee.fullName}
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {t('campaigns.traineeDetailsDesc', 'View module results and schedule retakes for failed modules.')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {loadingTraineeDetails ? (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                        </div>
                    ) : traineeDetailsData ? (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">{t('common.module', 'Module')}</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">{t('common.type', 'Type')}</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">{t('common.attendance', 'Attendance')}</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">{t('campaigns.scores', 'Scores')}</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">{t('common.result', 'Result')}</th>
                                    <th className="px-4 py-2 text-right text-sm font-medium">{t('common.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {traineeDetailsData.modules.map((mod) => (
                                    <tr key={mod.id} className={`hover:bg-muted/25 ${mod.result === 'fail' ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-2 font-medium">{mod.name}</td>
                                        <td className="px-4 py-2">
                                            <Badge variant={mod.type === 'assessment' ? 'destructive' : 'secondary'}>
                                                {t(`modules.types.${mod.type}`, mod.type)}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={mod.sessionsAbsent > 0 ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
                                                {mod.sessionsAttended} / {mod.totalSessions}
                                            </span>
                                            {mod.sessionsAbsent > 0 && (
                                                <div className="text-xs text-orange-500">({mod.sessionsAbsent} absent)</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-muted-foreground">
                                            {mod.theoryScore != null && <span>T: {mod.theoryScore}%</span>}
                                            {mod.practicalScore != null && <span className="ml-2">P: {mod.practicalScore}%</span>}
                                            {mod.theoryScore == null && mod.practicalScore == null && '-'}
                                        </td>
                                        <td className="px-4 py-2">
                                            <Badge className={
                                                mod.result === 'pass' ? 'bg-green-500' :
                                                mod.result === 'fail' ? 'bg-red-500' :
                                                mod.result === 'in_progress' ? 'bg-blue-500' :
                                                'bg-gray-500'
                                            }>
                                                {mod.result === 'in_progress' ? t('sessions.statuses.in_progress', 'In Progress') :
                                                 mod.result === 'not_assessed' ? t('common.notAssessed', 'Not Assessed') :
                                                 mod.result === 'pass' ? t('common.passed', 'Passed') :
                                                 mod.result === 'fail' ? t('common.statusFailed', 'Failed') :
                                                 mod.result.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            {mod.result === 'fail' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                                    onClick={() => handleScheduleRetake(mod)}
                                                >
                                                    {t('campaigns.scheduleRetake', 'Schedule Retake')}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : null}
                </DialogContent>
            </Dialog>
            
            {/* Schedule Retake Dialog */}
            <Dialog open={retakeDialogOpen} onOpenChange={setRetakeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('campaigns.scheduleRetake', 'Schedule Retake Session')}</DialogTitle>
                        <DialogDescription>
                            {selectedRetakeModule && (
                                <span>Module: <strong>{selectedRetakeModule.name}</strong></span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="retakeDate">{t('common.dateTime', 'Date & Time')}</Label>
                            <Input
                                id="retakeDate"
                                type="datetime-local"
                                value={retakeDate}
                                onChange={(e) => setRetakeDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="retakeInstructor">{t('common.instructor', 'Instructor')}</Label>
                            <Select value={retakeInstructor} onValueChange={setRetakeInstructor}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('common.selectInstructor', 'Select instructor')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {instructors.map((instructor) => (
                                        <SelectItem key={instructor.id} value={instructor.id}>
                                            {instructor.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRetakeDialogOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button 
                            onClick={createRetake}
                            disabled={!retakeDate || creatingRetake}
                        >
                            {creatingRetake ? t('common.creating', 'Creating...') : t('campaigns.createRetake', 'Create Retake Session')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Session Dialog */}
            <Dialog open={editSessionDialogOpen} onOpenChange={setEditSessionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('sessions.editSession', 'Edit Session')}</DialogTitle>
                        <DialogDescription>
                            {t('sessions.editSessionDesc', 'Update session details. Only available for planned sessions.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('sessions.module', 'Module')}</Label>
                            <Input 
                                value={editingSession?.curriculumModule?.name || '-'}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('sessions.instructor', 'Instructor')}</Label>
                            <Select 
                                value={editSessionForm.instructorId}
                                onValueChange={(v) => setEditSessionForm({ ...editSessionForm, instructorId: v })}
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
                            <Label>{t('sessions.location', 'Location')}</Label>
                            <Input 
                                value={editSessionForm.location}
                                onChange={(e) => setEditSessionForm({ ...editSessionForm, location: e.target.value })}
                                placeholder="e.g., Training Center A"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditSessionDialogOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={handleSaveSession} disabled={savingSession}>
                            {savingSession ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Schedule Session Dialog */}
            <Dialog open={manualScheduleDialogOpen} onOpenChange={setManualScheduleDialogOpen}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>{t('campaigns.scheduleSession', 'Schedule Session')}</DialogTitle>
                        <DialogDescription>
                            {t('campaigns.scheduleSessionDesc', 'Manually schedule a session for a specific module.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Module Status Overview */}
                        <Card className="bg-muted/30">
                            <CardContent className="pt-4 pb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    {t('campaigns.moduleStatus', 'Module Status')}
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {moduleSchedulingStatus.map(mod => (
                                        <div key={mod.id} className="flex items-center justify-between text-sm">
                                            <span className={cn(
                                                "truncate flex-1",
                                                mod.isComplete && "text-muted-foreground line-through"
                                            )}>
                                                {mod.name}
                                            </span>
                                            <span className={cn(
                                                "ml-2 text-xs font-medium",
                                                mod.isComplete ? "text-green-600" : mod.remainingHours > 0 ? "text-orange-600" : "text-muted-foreground"
                                            )}>
                                                {mod.isComplete ? (
                                                    <span className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {t('campaigns.moduleComplete', 'Complete')}
                                                    </span>
                                                ) : (
                                                    `${mod.totalHours}h`
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-2">
                            <Label>{t('sessions.module', 'Module')} *</Label>
                            <Select 
                                value={manualScheduleForm.moduleId}
                                onValueChange={(v) => setManualScheduleForm({ ...manualScheduleForm, moduleId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('campaigns.selectModule', 'Select module')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {moduleSchedulingStatus.map((mod) => (
                                        <SelectItem 
                                            key={mod.id} 
                                            value={mod.id}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{mod.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({mod.durationHours}h)
                                                </span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Selected Module Summary */}
                        {manualScheduleForm.moduleId && (() => {
                            const selectedModStatus = moduleSchedulingStatus.find(m => m.id === manualScheduleForm.moduleId)
                            if (!selectedModStatus) return null
                            return (
                                <Card className="bg-blue-50 border-blue-200 shadow-sm">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="font-medium text-lg">
                                            {selectedModStatus.name}
                                            <span className="ml-2 text-muted-foreground font-normal text-sm">({selectedModStatus.durationHours}h)</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })()}

                        {/* Trainee Selection for Module */}
                        {manualScheduleForm.moduleId && (
                            <Card className="border-dashed">
                                <CardContent className="pt-3 pb-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label className="text-sm font-medium">
                                            {t('campaigns.selectTrainees', 'Select Trainees')}
                                        </Label>
                                        <span className="text-xs text-muted-foreground">
                                            {manualScheduleForm.selectedTraineeIds.length} / {scheduleModuleTrainees.length} {t('common.selected', 'selected')}
                                        </span>
                                    </div>
                                    {loadingScheduleTrainees ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            {t('common.loading', 'Loading...')}
                                        </p>
                                    ) : scheduleModuleTrainees.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            {t('campaigns.noTraineesForModule', 'No trainees enrolled for this campaign')}
                                        </p>
                                    ) : (
                                        <div className="max-h-[200px] overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/20 custom-scrollbar">
                                            {scheduleModuleTrainees.map(trainee => (
                                                <div 
                                                    key={trainee.userId} 
                                                    className={cn(
                                                        "flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                                                        trainee.isComplete ? "bg-green-50/50" : "bg-white hover:bg-muted/50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox 
                                                            id={`trainee-${trainee.userId}`}
                                                            checked={manualScheduleForm.selectedTraineeIds.includes(trainee.userId)}
                                                            disabled={trainee.isComplete}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setManualScheduleForm(prev => ({
                                                                        ...prev,
                                                                        selectedTraineeIds: [...prev.selectedTraineeIds, trainee.userId]
                                                                    }))
                                                                } else {
                                                                    setManualScheduleForm(prev => ({
                                                                        ...prev,
                                                                        selectedTraineeIds: prev.selectedTraineeIds.filter(id => id !== trainee.userId)
                                                                    }))
                                                                }
                                                            }}
                                                        />
                                                        <label 
                                                            htmlFor={`trainee-${trainee.userId}`} 
                                                            className={cn("cursor-pointer", trainee.isComplete && "line-through text-muted-foreground")}
                                                        >
                                                            {trainee.fullName}
                                                        </label>
                                                    </div>
                                                    <div className="text-right text-xs">
                                                        {trainee.hoursAttended === 0 ? (
                                                            <span className="text-orange-600 font-medium">
                                                                {t('campaigns.noSession', 'No session')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                {trainee.hoursAttended}/{trainee.hoursTotal}h {t('campaigns.scheduledHours', 'scheduled')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                const allNonComplete = scheduleModuleTrainees.filter(t => !t.isComplete).map(t => t.userId)
                                                setManualScheduleForm(prev => ({ ...prev, selectedTraineeIds: allNonComplete }))
                                            }}
                                        >
                                            {t('common.selectAll', 'Select All')}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                setManualScheduleForm(prev => ({ ...prev, selectedTraineeIds: [] }))
                                            }}
                                        >
                                            {t('common.deselectAll', 'Deselect All')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('campaigns.sessionDuration', 'Session Duration (hours)')} *</Label>
                                <Select 
                                    value={manualScheduleForm.sessionDurationHours?.toString()}
                                    onValueChange={(v) => setManualScheduleForm({ ...manualScheduleForm, sessionDurationHours: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(hours => {
                                            const selectedModStatus = moduleSchedulingStatus.find(m => m.id === manualScheduleForm.moduleId)
                                            const exceedsRemaining = selectedModStatus && hours > selectedModStatus.remainingHours
                                            return (
                                                <SelectItem key={hours} value={hours.toString()}>
                                                    {hours} {hours === 1 ? t('common.hour', 'hour') : t('common.hours', 'hours')}
                                                    {hours === 8 && ` (${t('common.fullDay', 'full day')})`}
                                                    {exceedsRemaining && ` ⚠️`}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                {(() => {
                                    const selectedModStatus = moduleSchedulingStatus.find(m => m.id === manualScheduleForm.moduleId)
                                    if (selectedModStatus && manualScheduleForm.sessionDurationHours > selectedModStatus.remainingHours) {
                                        return (
                                            <p className="text-xs text-orange-600">
                                                ⚠️ {t('campaigns.exceedsRemaining', 'Exceeds remaining hours for this module')}
                                            </p>
                                        )
                                    }
                                    return null
                                })()}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('sessions.dateTime', 'Date & Time')} *</Label>
                                <Input 
                                    type="datetime-local"
                                    value={manualScheduleForm.dateStart}
                                    onChange={(e) => setManualScheduleForm({ ...manualScheduleForm, dateStart: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox 
                                id="scheduleAll"
                                checked={manualScheduleForm.scheduleAll}
                                onCheckedChange={(checked) => setManualScheduleForm({ 
                                    ...manualScheduleForm, 
                                    scheduleAll: checked as boolean 
                                })}
                            />
                            <label htmlFor="scheduleAll" className="text-sm">
                                {t('campaigns.scheduleAllForModule', 'Schedule all remaining sessions for this module')}
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('sessions.instructor', 'Instructor')}</Label>
                                <Select 
                                    value={manualScheduleForm.instructorId}
                                    onValueChange={(v) => setManualScheduleForm({ ...manualScheduleForm, instructorId: v })}
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
                                <Label>{t('sessions.location', 'Location')}</Label>
                                <Input 
                                    value={manualScheduleForm.location}
                                    onChange={(e) => setManualScheduleForm({ ...manualScheduleForm, location: e.target.value })}
                                    placeholder="e.g., Training Center A"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setManualScheduleDialogOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button 
                            onClick={handleManualSchedule} 
                            disabled={manualScheduling || !manualScheduleForm.moduleId || !manualScheduleForm.dateStart}
                        >
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            {manualScheduling ? t('campaigns.scheduling', 'Scheduling...') : t('campaigns.schedule', 'Schedule')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
