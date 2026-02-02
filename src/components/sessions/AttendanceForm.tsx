import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Check, Clock, X, AlertCircle, Save, Loader2 } from "lucide-react"
import { api } from "@/lib/api"

interface Participant {
    id: string
    userId: string
    fullName: string
    email?: string
    attendance?: string
    hoursAttended?: number
    absenceReason?: string
}

interface AttendanceRecord {
    status: 'present' | 'absent' | 'late' | 'excused'
    hoursAttended?: number
    reason?: string
}

interface AttendanceFormProps {
    sessionId: string
    participants: Participant[]
    sessionDuration: number
    onSave: () => void
    isReadOnly?: boolean
}

export function AttendanceForm({ 
    sessionId, 
    participants, 
    sessionDuration, 
    onSave,
    isReadOnly = false 
}: AttendanceFormProps) {
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasChanges, setHasChanges] = useState(false)

    // Initialize with existing attendance data
    useEffect(() => {
        const initial: Record<string, AttendanceRecord> = {}
        participants.forEach(p => {
            if (p.attendance && p.attendance !== 'planned') {
                initial[p.userId] = {
                    status: p.attendance as AttendanceRecord['status'],
                    hoursAttended: p.hoursAttended,
                    reason: p.absenceReason
                }
            }
        })
        setAttendance(initial)
    }, [participants])

    const updateAttendance = (userId: string, updates: Partial<AttendanceRecord>) => {
        setAttendance(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                ...updates
            } as AttendanceRecord
        }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setError(null)

        try {
            const payload = Object.entries(attendance).map(([userId, record]) => ({
                userId,
                attendance: record.status,
                reason: record.reason,
                hoursAttended: record.hoursAttended
            }))

            await api.post(`/sessions/${sessionId}/attendance`, { participants: payload })
            setHasChanges(false)
            onSave()
        } catch (err: any) {
            console.error('Error saving attendance:', err)
            setError(err.response?.data?.error?.message || 'Failed to save attendance')
        } finally {
            setIsSaving(false)
        }
    }

    const markAllPresent = () => {
        const allPresent: Record<string, AttendanceRecord> = {}
        participants.forEach(p => {
            allPresent[p.userId] = { status: 'present' }
        })
        setAttendance(allPresent)
        setHasChanges(true)
    }

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'present':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Check className="h-3 w-3 mr-1" /> Present
                </Badge>
            case 'late':
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Clock className="h-3 w-3 mr-1" /> Late
                </Badge>
            case 'absent':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    <X className="h-3 w-3 mr-1" /> Absent
                </Badge>
            case 'excused':
                return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> Excused
                </Badge>
            default:
                return <Badge variant="outline">Not Marked</Badge>
        }
    }

    const unmarkedCount = participants.filter(p => !attendance[p.userId]?.status).length

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Mark Attendance</CardTitle>
                        <CardDescription>
                            Session Duration: {sessionDuration}h • {participants.length} Participants
                            {unmarkedCount > 0 && (
                                <span className="text-orange-600 ml-2">
                                    ({unmarkedCount} not marked)
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    {!isReadOnly && (
                        <Button variant="outline" size="sm" onClick={markAllPresent}>
                            Mark All Present
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {participants.map(participant => (
                        <div 
                            key={participant.userId} 
                            className="border rounded-lg p-4 space-y-3"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium">{participant.fullName}</div>
                                    {participant.email && (
                                        <div className="text-sm text-muted-foreground">{participant.email}</div>
                                    )}
                                </div>
                                {getStatusBadge(attendance[participant.userId]?.status)}
                            </div>

                            {!isReadOnly && (
                                <>
                                    <RadioGroup
                                        value={attendance[participant.userId]?.status || ''}
                                        onValueChange={(value) => updateAttendance(participant.userId, { 
                                            status: value as AttendanceRecord['status'],
                                            hoursAttended: value === 'late' ? sessionDuration : undefined
                                        })}
                                        className="flex flex-wrap gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="present" id={`present-${participant.userId}`} />
                                            <Label htmlFor={`present-${participant.userId}`} className="cursor-pointer">
                                                Present
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="late" id={`late-${participant.userId}`} />
                                            <Label htmlFor={`late-${participant.userId}`} className="cursor-pointer">
                                                Late/Partial
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="absent" id={`absent-${participant.userId}`} />
                                            <Label htmlFor={`absent-${participant.userId}`} className="cursor-pointer">
                                                Absent
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="excused" id={`excused-${participant.userId}`} />
                                            <Label htmlFor={`excused-${participant.userId}`} className="cursor-pointer">
                                                Excused
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {attendance[participant.userId]?.status === 'late' && (
                                        <div className="flex items-center gap-2 ml-6">
                                            <Label htmlFor={`hours-${participant.userId}`}>Hours Attended:</Label>
                                            <Input
                                                type="number"
                                                id={`hours-${participant.userId}`}
                                                step="0.5"
                                                min="0"
                                                max={sessionDuration}
                                                value={attendance[participant.userId]?.hoursAttended || ''}
                                                onChange={(e) => updateAttendance(participant.userId, {
                                                    hoursAttended: parseFloat(e.target.value) || 0
                                                })}
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                / {sessionDuration}h
                                            </span>
                                        </div>
                                    )}

                                    {['absent', 'late', 'excused'].includes(attendance[participant.userId]?.status || '') && (
                                        <div className="ml-6">
                                            <Label htmlFor={`reason-${participant.userId}`}>Reason (optional):</Label>
                                            <Input
                                                type="text"
                                                id={`reason-${participant.userId}`}
                                                placeholder="Enter reason for absence/late arrival"
                                                value={attendance[participant.userId]?.reason || ''}
                                                onChange={(e) => updateAttendance(participant.userId, {
                                                    reason: e.target.value
                                                })}
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {isReadOnly && (
                                <div className="text-sm text-muted-foreground">
                                    {attendance[participant.userId]?.status === 'late' && (
                                        <span>Hours: {attendance[participant.userId]?.hoursAttended}/{sessionDuration}h</span>
                                    )}
                                    {attendance[participant.userId]?.reason && (
                                        <span className="ml-2">• Reason: {attendance[participant.userId]?.reason}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>

            {!isReadOnly && (
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || !hasChanges}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Attendance
                            </>
                        )}
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
