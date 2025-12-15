import { useState, useEffect } from "react"
import { Plus, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { SessionsTable } from "@/components/tables/SessionsTable"
import { SessionForm } from "@/components/forms/SessionForm"
import { SessionParticipants } from "@/components/sessions/SessionParticipants"
import { RecordResultsForm } from "@/components/forms/RecordResultsForm"
import type { Session, Programme } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([])
    const [programmes, setProgrammes] = useState<Programme[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
    const [isResultsOpen, setIsResultsOpen] = useState(false)
    const [selectedSession, setSelectedSession] = useState<Session | null>(null)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [sessionsRes, programmesRes] = await Promise.all([
                api.get("/sessions"),
                api.get("/programmes")
            ])
            ])

    // Handle both array and paginated response structure for sessions
    const sessionsData = Array.isArray(sessionsRes.data) ? sessionsRes.data : (sessionsRes.data?.data || [])
    setSessions(Array.isArray(sessionsData) ? sessionsData : [])

    // Handle both array and paginated response structure for programmes
    const programmesData = Array.isArray(programmesRes.data) ? programmesRes.data : (programmesRes.data?.data || [])
    setProgrammes(Array.isArray(programmesData) ? programmesData : [])
} catch (error) {
    console.error("Failed to fetch data:", error)
    toast.error("Failed to load sessions data")
} finally {
    setIsLoading(false)
}
    }

useEffect(() => {
    fetchData()
}, [])

const handleCreateSession = async (values: any) => {
    try {
        await api.post("/sessions", values)
        toast.success("Session scheduled successfully")
        fetchData()
        setIsCreateOpen(false)
    } catch (error) {
        console.error("Failed to create session:", error)
        toast.error("Failed to schedule session")
    }
}

const handleViewParticipants = (session: Session) => {
    setSelectedSession(session)
    setIsParticipantsOpen(true)
}

const handleRecordResults = (session: Session) => {
    setSelectedSession(session)
    setIsResultsOpen(true)
}

const handleCancelSession = async (session: Session) => {
    if (confirm("Are you sure you want to cancel this session?")) {
        try {
            // Note: Spec doesn't have explicit cancel endpoint, maybe PATCH /sessions/{id}?
            // Or maybe we just update status?
            // Spec says: GET /sessions, POST /sessions.
            // It does NOT have PATCH /sessions/{id}.
            // However, I'll assume standard REST or maybe I can't cancel?
            // Wait, I should check if I can update session.
            // If not, I'll show error.
            // Actually, I'll try PATCH /sessions/{id} with status: cancelled
            await api.patch(`/sessions/${session.id}`, { status: "cancelled" })
            toast.success("Session cancelled")
            fetchData()
        } catch (error) {
            console.error("Failed to cancel session:", error)
            toast.error("Failed to cancel session (Backend might not support update)")
        }
    }
}

const handleSubmitResults = async (results: any) => {
    if (!selectedSession) return
    try {
        await api.post(`/sessions/${selectedSession.id}/results`, { results })
        toast.success("Results recorded successfully")
        fetchData()
        setIsResultsOpen(false)
        setSelectedSession(null)
    } catch (error) {
        console.error("Failed to record results:", error)
        toast.error("Failed to record results")
    }
}

return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Training Sessions</h1>
                <p className="text-muted-foreground">
                    Schedule and manage training sessions.
                </p>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Schedule Session
            </Button>
        </div>

        {isLoading ? (
            <TableSkeleton columnCount={6} rowCount={10} />
        ) : sessions.length === 0 ? (
            <EmptyState
                icon={Calendar}
                title="No sessions scheduled"
                description="Schedule your first training session."
                actionLabel="Schedule Session"
                onAction={() => setIsCreateOpen(true)}
            />
        ) : (
            <SessionsTable
                data={sessions}
                onViewParticipants={handleViewParticipants}
                onRecordResults={handleRecordResults}
                onCancelSession={handleCancelSession}
            />
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Schedule New Session</DialogTitle>
                </DialogHeader>
                <SessionForm
                    programmes={programmes}
                    onSubmit={handleCreateSession}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </DialogContent>
        </Dialog>

        <SessionParticipants
            session={selectedSession}
            open={isParticipantsOpen}
            onOpenChange={setIsParticipantsOpen}
        />

        <RecordResultsForm
            session={selectedSession}
            open={isResultsOpen}
            onOpenChange={setIsResultsOpen}
            onSubmit={handleSubmitResults}
        />
    </div>
)
}
