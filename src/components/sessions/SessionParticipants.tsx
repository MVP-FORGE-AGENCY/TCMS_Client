import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import type { Session, Employee } from "@/types"
import { api } from "@/lib/api"


// Mock employees for selection
// Removed Mock employees

interface SessionParticipantsProps {
    session: Session | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SessionParticipants({ session, open, onOpenChange }: SessionParticipantsProps) {
    const { t } = useTranslation()
    const [participants, setParticipants] = useState<Employee[]>([])
    const [isAddMode, setIsAddMode] = useState(false)
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

    const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [overrideError, setOverrideError] = useState<{ message: string, details: string[], canOverride: boolean } | null>(null)
    const [isAdminOverride, setIsAdminOverride] = useState(false)

    // Load participants when modal opens
    useEffect(() => {
        if (open && session) {
            fetchParticipants()
        }
    }, [open, session])

    // Load available employees when entering add mode
    useEffect(() => {
        if (isAddMode && session) {
            fetchAvailableEmployees()
        }
    }, [isAddMode, session])

    const fetchParticipants = async () => {
        if (!session) return
        setIsLoading(true)
        try {
            const res = await api.get(`/sessions/${session.id}/participants`)
            const data = res.data?.data || res.data || []
            setParticipants(data) // Backend returns array of user objects in data or directly
        } catch (error) {
            console.error("Failed to fetch participants:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAvailableEmployees = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/employees?isActive=true&limit=100') // Fetch active employees
            const allUsers = res.data?.data || res.data || []
            // Filter out already enrolled and only show employees (trainees)
            const enrolledIds = participants.map(p => p.id)
            setAvailableEmployees(
                allUsers
                    .filter((u: Employee) => !enrolledIds.includes(u.id) && u.role === 'employee')
            )
        } catch (error) {
            console.error("Failed to fetch employees:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddParticipants = async () => {
        if (!session || selectedEmployees.length === 0) return
        
        try {
            await api.post(`/sessions/${session.id}/enrol`, {
                userIds: selectedEmployees,
                override: isAdminOverride
            })
            
            // Success
            setIsAddMode(false)
            setSelectedEmployees([])
            setOverrideError(null)
            setIsAdminOverride(false)
            fetchParticipants()
        } catch (error: any) {
            console.error("Enrollment failed:", error)
            const errData = error.response?.data?.error
            if (errData?.code === 'ENROLMENT_BLOCKED') {
                setOverrideError({
                    message: errData.message,
                    details: errData.details || [],
                    canOverride: errData.canOverride
                })
            } else {
               // Generic error handling (toast usually)
               alert("Failed to enrol: " + (errData?.message || "Unknown error"))
            }
        }
    }

    const toggleEmployeeSelection = (empId: string) => {
        if (selectedEmployees.includes(empId)) {
            setSelectedEmployees(selectedEmployees.filter(id => id !== empId))
        } else {
            setSelectedEmployees([...selectedEmployees, empId])
        }
    }

    const removeParticipant = async (participantId: string) => {
        if (!session) return
        try {
            await api.delete(`/sessions/${session.id}/participants/${participantId}`)
            // Refresh participants list
            fetchParticipants()
        } catch (error: any) {
            console.error("Failed to remove participant:", error)
            const errMessage = error.response?.data?.error?.message || "Failed to remove participant"
            alert(errMessage)
        }
    }

    if (!session) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t('sessions.participantsModal.title')}</DialogTitle>
                    <DialogDescription>
                        {t('sessions.participantsModal.description', { 
                            programme: session.programmeId, 
                            date: new Date(session.dateStart).toLocaleDateString() 
                        })}
                    </DialogDescription>
                </DialogHeader>

                {!isAddMode ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                {t('sessions.participantsModal.enrolledStatus', { current: participants.length, capacity: session.capacity || 10 })}
                            </div>
                            <Button onClick={() => setIsAddMode(true)} size="sm">
                                <Plus className="mr-2 h-4 w-4" /> {t('sessions.participantsModal.addParticipants')}
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('common.name')}</TableHead>
                                        <TableHead>{t('common.role')}</TableHead>
                                        <TableHead>{t('common.status')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                {t('sessions.participantsModal.noParticipants')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        participants.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.fullName}</TableCell>
                                                <TableCell>{p.role}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{t('sessions.attendanceStatus.planned')}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove participant"
                                                        onClick={() => removeParticipant(p.id)}
                                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                         {overrideError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
                                <p className="font-semibold">{overrideError.message}</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {overrideError.details.map((d, i) => (
                                        <li key={i}>{d}</li>
                                    ))}
                                </ul>
                                {overrideError.canOverride && (
                                    <div className="mt-4 flex items-center space-x-2">
                                        <Checkbox 
                                            id="override" 
                                            checked={isAdminOverride}
                                            onCheckedChange={(c) => setIsAdminOverride(c === true)}
                                        />
                                        <label htmlFor="override" className="font-medium cursor-pointer">
                                            {t('sessions.participantsModal.overrideLabel')}
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="rounded-md border max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>{t('common.name')}</TableHead>
                                        <TableHead>{t('common.role')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                         <TableRow><TableCell colSpan={3} className="text-center">{t('common.loading')}</TableCell></TableRow>
                                    ) : availableEmployees.length === 0 ? (
                                         <TableRow><TableCell colSpan={3} className="text-center">{t('sessions.participantsModal.noEligible')}</TableCell></TableRow>
                                    ) : (
                                        availableEmployees.map((emp) => (
                                        <TableRow key={emp.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedEmployees.includes(emp.id)}
                                                    onCheckedChange={() => toggleEmployeeSelection(emp.id)}
                                                />
                                            </TableCell>
                                            <TableCell>{emp.fullName}</TableCell>
                                            <TableCell>{emp.role}</TableCell>
                                        </TableRow>
                                    )))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => {
                                setIsAddMode(false)
                                setOverrideError(null)
                                setIsAdminOverride(false)
                            }}>
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handleAddParticipants} disabled={selectedEmployees.length === 0}>
                                {isAdminOverride ? t('sessions.participantsModal.enrolOverride') : t('sessions.participantsModal.addSelected')}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
