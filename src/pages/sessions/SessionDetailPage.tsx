import { useParams, useNavigate } from "react-router-dom"
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
    Award
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

export default function SessionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    
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
    }, [id])

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

    if (isLoading) return <div className="p-8">Loading...</div>
    if (!session) return <div className="p-8">Session not found</div>

    const isPlanned = session.status === 'planned'
    const isInProgress = session.status === 'in_progress'
    const isCompleted = session.status === 'completed'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/sessions")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {session.programme?.code} - {session.programme?.name}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant={
                                isCompleted ? "default" : 
                                isInProgress ? "destructive" : "secondary"
                            }>
                                {session.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span>•</span>
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(session.dateStart).toLocaleDateString()}</span>
                            <span>•</span>
                            <MapPin className="h-4 w-4" />
                            <span>{session.location}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2">
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
                            <Button onClick={handleStartSession}>
                                <Play className="mr-2 h-4 w-4" /> Start Session
                            </Button>
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
            <div className="grid gap-6">
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
                    <CardContent>
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
                                                        <SelectItem value="absent">Absent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant={p.attendance === 'present' ? 'default' : 'secondary'}>
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

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
        </div>
    )
}
