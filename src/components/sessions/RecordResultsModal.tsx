import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { Session, SessionResult } from "@/types"

import { ConfirmationModal } from "@/components/common/ConfirmationModal"

interface RecordResultsModalProps {
    session: Session | any
    participants: SessionResult[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved: () => void
}

export function RecordResultsModal({
    session,
    participants,
    open,
    onOpenChange,
    onSaved
}: RecordResultsModalProps) {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [results, setResults] = useState<any[]>([])
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean,
        title: string,
        description: string,
        action: () => void,
        variant?: 'default' | 'destructive'
    }>({ open: false, title: '', description: '', action: () => {} })

    // Initialize/Reset results when opening
    useEffect(() => {
        if (open && participants) {
            console.log('RecordResultsModal: Resetting results from participants', participants);
            setResults(participants.map(p => ({
                userId: p.userId,
                attendance: p.attendance,
                theoryMethod: p.theoryMethod || 'computer', // Default
                theoryScore: p.theoryScore ?? '',
                practicalMethod: p.practicalMethod || 'practical', // Default
                practicalScore: p.practicalScore ?? '',
                comments: p.comments || ''
            })))
        }
    }, [open, participants])

    // Determine thresholds
    const theoryPass = session?.programme?.passScorePercent || 75
    const practicalPass = session?.programme?.passScorePercent || 75 // Or separate if available
    
    // Check if we need both (assuming standard/programme logic available)
    // For now, simplify: if hours > 0 or standard flags say so.
    // Falling back to displaying both but making them optional if not relevant?
    // Let's assume consistent with backend: pass generic 'score' or specific.
    // We'll implement specific fields.

    const updateResult = (userId: string, field: string, value: any) => {
        console.log(`Updating ${field} for ${userId} to:`, value);
        setResults(prev => prev.map(r => 
            r.userId === userId ? { ...r, [field]: value } : r
        ))
    }

    const handleSubmit = async () => {
        try {
            setIsLoading(true)
            
            // Format payload
            const formattedResults = results.map(r => {
                const item: any = {
                    userId: r.userId,
                    attendance: r.attendance,
                    comments: r.comments
                }

                if (r.attendance === 'present') {
                    // Only send scores if present
                    if (r.theoryScore !== '') item.theoryScore = Number(r.theoryScore)
                    item.theoryMethod = r.theoryMethod
                    
                    if (r.practicalScore !== '') item.practicalScore = Number(r.practicalScore)
                    item.practicalMethod = r.practicalMethod
                }

                return item
            })

            await api.post(`/sessions/${session.id}/results`, { results: formattedResults })
            toast.success("Results recorded successfully")
            onSaved()
        } catch (error: any) {
            console.error("Failed to record results:", error)
            toast.error(error.response?.data?.error?.message || "Failed to save results")
        } finally {
            setIsLoading(false)
        }
    }

    const completeSession = async () => {
        // Ensure all are marked
        const hasUnmarked = results.some(r => r.attendance === 'planned')
        if (hasUnmarked) {
            toast.error("Please mark attendance for all participants first (Present/Absent)")
            return
        }

        setConfirmModal({
            open: true,
            title: t('sessions.completeSessionTitle', "Complete Session"),
            description: t('sessions.completeSessionConfirm', "This will complete the session and create competence records for passed participants. Are you sure you want to continue?"),
            action: async () => {
                 setConfirmModal(prev => ({ ...prev, open: false }))
                 await handleSubmit()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('sessions.recordResultsTitle', "Record Session Results")}</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div className="flex gap-4 text-sm text-muted-foreground bg-muted p-2 rounded">
                         <div>{t('sessions.passCriteria', "Pass Criteria:")}</div>
                         <div>{t('sessions.theoryCriteria', { score: theoryPass })}</div>
                         <div>{t('sessions.practicalCriteria', { score: practicalPass })}</div>
                    </div>

                    <div className="space-y-4">
                        {results.map((r) => {
                            const user = participants.find(p => p.userId === r.userId)
                            const isPresent = r.attendance === 'present'

                            return (
                                <div key={r.userId} className="border rounded-md p-4 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold">{user?.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{user?.email}</div>
                                        </div>
                                        <Badge variant={
                                            r.attendance === 'present' ? 'default' : 
                                            r.attendance === 'absent' ? 'secondary' : 'outline'
                                        }>
                                            {r.attendance?.toUpperCase()}
                                        </Badge>
                                    </div>

                                    {isPresent ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Theory */}
                                            <div className="space-y-2">
                                                <Label>{t('sessions.results.theoryScore', "Theory Score (%)")}</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={r.theoryScore}
                                                        onChange={(e) => updateResult(r.userId, 'theoryScore', e.target.value)}
                                                        className={r.theoryScore !== '' && Number(r.theoryScore) < theoryPass ? "border-red-500" : ""}
                                                    />
                                                </div>
                                            </div>

                                            {/* Practical */}
                                            <div className="space-y-2">
                                                <Label>{t('sessions.results.practicalScore', "Practical Score (%)")}</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={r.practicalScore}
                                                        onChange={(e) => updateResult(r.userId, 'practicalScore', e.target.value)}
                                                        className={r.practicalScore !== '' && Number(r.practicalScore) < practicalPass ? "border-red-500" : ""}
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-span-2 space-y-2">
                                                <Label>{t('sessions.comments', "Comments")}</Label>
                                                <Input 
                                                    value={r.comments} 
                                                    onChange={(e) => updateResult(r.userId, 'comments', e.target.value)}
                                                    placeholder={t('sessions.commentsPlaceholder', "Optional comments...")}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">
                                            {t('sessions.attendanceMarkedAs', { status: r.attendance })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('sessions.cancel', "Cancel")}</Button>
                    <Button onClick={completeSession} disabled={isLoading}>
                        {isLoading ? t('sessions.saving', "Saving...") : t('sessions.saveComple', "Save Results & Complete Session")}
                    </Button>
                </DialogFooter>
            </DialogContent>
            
            <ConfirmationModal 
                open={confirmModal.open}
                onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, open }))}
                title={confirmModal.title}
                description={confirmModal.description}
                onConfirm={confirmModal.action}
                variant={confirmModal.variant}
            />
        </Dialog>
    )
}
