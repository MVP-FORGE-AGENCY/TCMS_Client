import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { 
    ArrowLeft, 
    Calendar, 
    Play, 
    CheckCircle, 
    MapPin,
    FileText,
    Award,
    RotateCcw
} from "lucide-react"
import type { Session, SessionResult } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RecordResultsModal } from "../../components/sessions/RecordResultsModal"
import { SessionParticipants } from "../../components/sessions/SessionParticipants"
import { Users } from "lucide-react"

import { ConfirmationModal } from "@/components/common/ConfirmationModal"
import { useAuth } from "@/context/AuthContext"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { ScheduleRetakeRequest, Employee } from "@/types"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { moduleResults } from "@/lib/api"
import { SessionModuleGradingForm } from "@/components/forms/SessionModuleGradingForm"

const ModuleGradingSection = ({ sessionId }: { sessionId: string }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['session-module-grading', sessionId],
        queryFn: () => moduleResults.getSessionGrading(sessionId)
    });

    if (isLoading) return <div>Loading grading data...</div>;

    if (!data?.applicable && data?.message) {
        return (
            <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                    {data.message}
                </CardContent>
            </Card>
        );
    }
    
    if (!data?.gradingList) return null;

    return (
        <Card>
            <CardContent className="pt-6">
                <SessionModuleGradingForm 
                    sessionId={sessionId}
                    moduleData={data.session.module}
                    gradingList={data.gradingList}
                />
            </CardContent>
        </Card>
    );
};

export default function SessionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user } = useAuth()
    const { setLabel } = useBreadcrumb()
    
    // Campaign context from URL params
    const campaignId = searchParams.get('campaignId')
    const campaignName = searchParams.get('campaignName')
    
    // Modal states
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean,
        title: string,
        description: string,
        action: () => void,
        variant?: 'default' | 'destructive'
    }>({ open: false, title: '', description: '', action: () => {} })

    const [session, setSession] = useState<Session | null>(null)
    const [participants, setParticipants] = useState<SessionResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
    const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)
    
    // Retake dialog state
    const [retakeDialogOpen, setRetakeDialogOpen] = useState(false)
    const [retakeForm, setRetakeForm] = useState<ScheduleRetakeRequest>({
        traineeId: '',
        dateStart: '',
        location: '',
        instructorId: ''
    })
    const [selectedTrainee, setSelectedTrainee] = useState<SessionResult | null>(null)
    const [scheduling, setScheduling] = useState(false)
    const [instructors, setInstructors] = useState<Employee[]>([])

    const fetchData = async () => {
        if (!id) return
        try {
            setIsLoading(true)
            const [sessionRes, participantsRes] = await Promise.all([
                api.get(`/sessions/${id}`),
                api.get(`/sessions/${id}/participants`)
            ])
            setSession(sessionRes.data)
            setParticipants(participantsRes.data.data || [])
        } catch (error) {
            console.error("Failed to fetch session data:", error)
            toast.error("Failed to load session details")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        loadInstructors()
        return () => {
            if (id) setLabel(id, '')
        }
    }, [id])

    const loadInstructors = async () => {
        try {
            const response = await api.get('/employees')
            const allEmployees = response.data.data || []
            setInstructors(allEmployees.filter((e: Employee) => 
                e.role === 'instructor' || e.role === 'training_manager' || e.role === 'admin'
            ))
        } catch (error) {
            console.error('Failed to load instructors:', error)
        }
    }

    useEffect(() => {
        if (session && id) {
            if (campaignId && campaignName) {
                // Campaign context - show campaign name > module name
                const moduleName = (session as any).curriculumModule?.name || session.programme?.code
                setLabel(id, `${decodeURIComponent(campaignName)} > ${moduleName}`)
            } else {
                // Default context
                setLabel(id, `${session.programme?.code} - ${new Date(session.dateStart).toLocaleDateString()}`)
            }
        }
    }, [session, id, campaignId, campaignName])

    const handleStartSession = async () => {
        if (!confirm("Are you sure you want to start this session?")) return
        try {
            await api.patch(`/sessions/${id}/start`)
            toast.success("Session started successfully")
            fetchData()
        } catch (error: any) {
            console.error("Failed to start session:", error)
            toast.error(error.response?.data?.error?.message || "Failed to start session")
        }
    }

    const handleUpdateAttendance = async (participantId: string, attendance: string) => {
        try {
            await api.patch(`/sessions/${id}/participants/${participantId}/attendance`, { attendance })
            // Optimistic update or refresh
            setParticipants(prev => prev.map(p => 
                p.id === participantId ? { ...p, attendance: attendance as any } : p
            ))
            toast.success("Attendance updated")
        } catch (error) {
            toast.error("Failed to update attendance")
            fetchData() // Revert on error
        }
    }

    const handleUpdateComments = async (participantId: string, comments: string) => {
        try {
            await api.patch(`/sessions/${id}/participants/${participantId}/comments`, { comments })
            toast.success("Comments saved")
        } catch (error) {
            toast.error("Failed to update comments")
        }
    }

    const handleGenerateAttendance = async () => {
        try {
            const res = await api.post(`/sessions/${id}/attendance-sheet`)
            // open in new tab
            // If the URL is signed/remote, window.open works.
            // If it needs download, we might need a hidden link.
            if (res.data.url) {
                 window.open(res.data.url, '_blank')
                 toast.success("Attendance sheet generated")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate attendance sheet")
        }
    }

    const handleGenerateCertificates = async () => {
        setConfirmModal({
            open: true,
            title: "Generate Certificates",
            description: "This will generate certificates for all passed participants and email them. Continue?",
            action: async () => {
                try {
                    const res = await api.post(`/sessions/${id}/certificates`)
                    toast.success(`Generated ${res.data.count} certificates`)
                    fetchData()
                    setConfirmModal(prev => ({ ...prev, open: false }))
                } catch (error) {
                    console.error("Failed to generate certificates:", error)
                    toast.error("Failed to generate certificates")
                }
            }
        })
    }

    const handleResultsSaved = () => {
        fetchData()
        setIsResultsModalOpen(false)
    }

    const openRetakeDialog = (participant: SessionResult) => {
        setSelectedTrainee(participant)
        setRetakeForm({
            traineeId: participant.userId,
            dateStart: '',
            location: session?.location || '',
            instructorId: session?.instructorId || ''
        })
        setRetakeDialogOpen(true)
    }

    const handleScheduleRetake = async () => {
        if (!retakeForm.dateStart) {
            toast.error('Please select a date')
            return
        }

        try {
            setScheduling(true)
            const response = await api.post(`/sessions/${id}/schedule-retake`, retakeForm)
            toast.success(response.data.message || 'Retake session scheduled')
            setRetakeDialogOpen(false)
            // Navigate to the new session
            navigate(`/sessions/${response.data.data.id}`)
        } catch (error: any) {
            console.error('Failed to schedule retake:', error)
            toast.error(error.response?.data?.error?.message || 'Failed to schedule retake')
        } finally {
            setScheduling(false)
        }
    }

    if (isLoading) return <div className="p-8">Loading...</div>
    if (!session) return <div className="p-8">Session not found</div>

    const isPlanned = session.status === 'planned'
    const isInProgress = session.status === 'in_progress'
    const isCompleted = session.status === 'completed'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(campaignId ? `/campaigns/${campaignId}` : "/sessions")} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                            {session.programme?.code} - {session.programme?.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground mt-1 text-sm">
                            <Badge variant={
                                isCompleted ? "default" : 
                                isInProgress ? "destructive" : "secondary"
                            }>
                                {session.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(session.dateStart).toLocaleDateString()}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {session.location}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {session.instructor?.fullName || 'Unassigned'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {(isPlanned || isInProgress || isCompleted) && (
                        <Button variant="outline" onClick={handleGenerateAttendance}>
                            <FileText className="mr-2 h-4 w-4" /> Attendance Sheet
                        </Button>
                    )}
                    {isCompleted && (
                        <>
                            <Button variant="outline" onClick={handleGenerateCertificates}>
                                <Award className="mr-2 h-4 w-4" /> Generate Certificates
                            </Button>
                            {participants.some(p => p.certificateUrl) && (
                                <Button 
                                    variant="outline" 
                                    onClick={async () => {
                                        setConfirmModal({
                                            open: true,
                                            title: "Send All Certificates",
                                            description: "This will email certificates to all participants who have them. Continue?",
                                            action: async () => {
                                                try {
                                                    const res = await api.post(`/sessions/${id}/certificates/send`)
                                                    toast.success(res.data.message)
                                                    setConfirmModal(prev => ({ ...prev, open: false }))
                                                } catch (error) {
                                                    toast.error('Failed to send certificates')
                                                }
                                            }
                                        })
                                    }}
                                >
                                    <Award className="mr-2 h-4 w-4" /> Send All by Email
                                </Button>
                            )}
                        </>
                    )}
                    {isPlanned && (
                        <>
                            <Button variant="outline" onClick={() => setIsParticipantsModalOpen(true)}>
                                <Users className="mr-2 h-4 w-4" /> Manage Participants
                            </Button>
                            {(['admin', 'training_manager'].includes(user?.role || '') || user?.id === session.instructorId) && (
                                <Button onClick={handleStartSession}>
                                    <Play className="mr-2 h-4 w-4" /> Start Session
                                </Button>
                            )}
                        </>
                    )}
                    {isInProgress && (
                        <Button variant="default" onClick={() => setIsResultsModalOpen(true)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> End & Record Results
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="details">Session Details</TabsTrigger>
                    {(isInProgress || isCompleted) && (
                        <TabsTrigger value="grading">Module Grading</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                    {/* Pass Criteria Info (for In Progress/Completed) */}
                    {(isInProgress || isCompleted) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Assessment Criteria
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-8">
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Theory Pass Score</div>
                                        <div className="text-2xl font-bold">
                                            {session.programme?.passScorePercent || 75}%
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium">Practical Pass Score</div>
                                        <div className="text-2xl font-bold">
                                            {session.programme?.passScorePercent || 75}%
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Participants Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Participants ({participants.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <div className="overflow-x-auto">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Attendance</TableHead>
                                        <TableHead>Comments</TableHead>
                                        {(isCompleted) && <TableHead>Result</TableHead>}
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="font-medium">{p.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{p.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {isInProgress ? (
                                                    <Select 
                                                        value={p.attendance} 
                                                        onValueChange={(val) => handleUpdateAttendance(p.id, val)}
                                                    >
                                                        <SelectTrigger className="w-[130px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="planned">Planned</SelectItem>
                                                            <SelectItem value="present">Present</SelectItem>
                                                            <SelectItem value="late">Late</SelectItem>
                                                            <SelectItem value="absent">Absent</SelectItem>
                                                            <SelectItem value="excused">Excused</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Badge variant={
                                                        p.attendance === 'present' ? 'default' : 
                                                        p.attendance === 'late' ? 'secondary' :
                                                        p.attendance === 'excused' ? 'outline' : 
                                                        'destructive'
                                                    }>
                                                        {p.attendance}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isInProgress ? (
                                                    <Input 
                                                        defaultValue={p.comments || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== p.comments) {
                                                                handleUpdateComments(p.id, e.target.value)
                                                            }
                                                        }}
                                                        className="max-w-[300px]"
                                                        placeholder="Add comments..."
                                                    />
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">{p.comments || '-'}</span>
                                                )}
                                            </TableCell>
                                            {isCompleted && (
                                                <TableCell>
                                                    <Badge variant={p.overallResult === 'pass' ? 'default' : p.overallResult === 'fail' ? 'destructive' : 'secondary'}>
                                                        {p.overallResult ? p.overallResult.toUpperCase() : 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            <TableCell className="flex gap-1">
                                                {/* Certificate actions */}
                                                {p.certificateUrl && (
                                                    <>
                                                        <Button variant="ghost" size="sm" onClick={() => p.certificateUrl && window.open(p.certificateUrl, '_blank')}>
                                                            <FileText className="h-4 w-4 mr-1" /> View
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={async () => {
                                                                try {
                                                                    await api.post(`/sessions/${id}/certificates/send`, { userIds: [p.userId] })
                                                                    toast.success(`Certificate sent to ${p.email}`)
                                                                } catch (error) {
                                                                    toast.error('Failed to send certificate')
                                                                }
                                                            }}
                                                        >
                                                            <Award className="h-4 w-4 mr-1" /> Email
                                                        </Button>
                                                    </>
                                                )}
                                                {/* Schedule Retake for failed trainees */}
                                                {isCompleted && p.overallResult === 'fail' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="text-amber-600 border-amber-600 hover:bg-amber-50"
                                                        onClick={() => openRetakeDialog(p)}
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-1" /> Retake
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="grading">
                    <ModuleGradingSection sessionId={id || ''} />
                </TabsContent>
            </Tabs>


            <RecordResultsModal 
                session={session}
                participants={participants}
                open={isResultsModalOpen}
                onOpenChange={setIsResultsModalOpen}
                onSaved={handleResultsSaved}
            />

            <SessionParticipants
                session={session}
                open={isParticipantsModalOpen}
                onOpenChange={(open) => {
                    setIsParticipantsModalOpen(open)
                    if (!open) fetchData() // Refresh on close
                }}
            />

            <ConfirmationModal 
                open={confirmModal.open}
                onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, open }))}
                title={confirmModal.title}
                description={confirmModal.description}
                onConfirm={confirmModal.action}
                variant={confirmModal.variant}
            />

            {/* Schedule Retake Dialog */}
            <Dialog open={retakeDialogOpen} onOpenChange={setRetakeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Retake</DialogTitle>
                        <DialogDescription>
                            Schedule a retake session for {selectedTrainee?.fullName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Trainee</Label>
                            <Input 
                                value={selectedTrainee?.fullName || ''}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Retake Date *</Label>
                            <Input 
                                type="datetime-local"
                                value={retakeForm.dateStart}
                                onChange={(e) => setRetakeForm({ ...retakeForm, dateStart: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Input 
                                value={retakeForm.location}
                                onChange={(e) => setRetakeForm({ ...retakeForm, location: e.target.value })}
                                placeholder={session?.location || 'Enter location'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Instructor</Label>
                            <Select 
                                value={retakeForm.instructorId}
                                onValueChange={(v) => setRetakeForm({ ...retakeForm, instructorId: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select instructor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {instructors.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.fullName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                            <CardContent className="pt-4">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    This will create a new session linked to the original attempt. 
                                    The trainee will be automatically enrolled.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRetakeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleScheduleRetake} disabled={scheduling}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {scheduling ? 'Scheduling...' : 'Schedule Retake'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
