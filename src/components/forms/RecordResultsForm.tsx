import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileDown, Award, AlertCircle, AlertTriangle } from "lucide-react"
import type { Session } from "@/types"
import { api, reports, sessions } from "@/lib/api"
import { toast } from "sonner"
import { SignatureModal } from "@/components/common/SignatureModal"

import { useTranslation } from "react-i18next"

interface Participant {
    id: string
    userId: string
    fullName: string
    email: string
    attendance: string
}

interface ParticipantResult {
    userId: string
    attendance: string
    theoryScore?: number
    theoryMethod?: string
    theoryResult?: string
    practicalScore?: number
    practicalMethod?: string
    practicalResult?: string
    overallResult?: string
    comments?: string
    remedialNotes?: string
}

// ... (skipping unchanged interfaces)

interface RecordResultsFormProps {
    session: Session | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (results: ParticipantResult[]) => void
}

export function RecordResultsForm({ session, open, onOpenChange, onSubmit }: RecordResultsFormProps) {
    const { t } = useTranslation()
    const [participants, setParticipants] = useState<Participant[]>([])
    const [results, setResults] = useState<Record<string, ParticipantResult>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [hasTheory, setHasTheory] = useState(true)
    const [hasPractical, setHasPractical] = useState(false)
    const [theoryPassScore] = useState(70)
    const [practicalPassScore] = useState(70)
    const [isSignModalOpen, setIsSignModalOpen] = useState(false)

    const handleSign = async (type: 'drawn' | 'typed', data: string) => {
        if (!session) return;
        try {
            await sessions.sign(session.id, { signatureType: type, signatureData: data });
            toast.success("Session signed successfully");
            // Refresh logic would go here ideally, or close
            onOpenChange(false); // Close entire modal
        } catch (error) {
            console.error("Failed to sign:", error);
            toast.error("Failed to save signature");
        }
    };

    useEffect(() => {
        if (session && open) {
            fetchParticipants()
            // TODO: Fetch programme/standard to get hasTheory/hasPractical
            setHasTheory(true)
            setHasPractical(true)
        }
    }, [session, open])

    const fetchParticipants = async () => {
        if (!session) return
        setIsLoading(true)
        try {
            const response = await api.get(`/sessions/${session.id}/participants`)
            const data = response.data?.data || response.data || []
            setParticipants(data)
            
            // Initialize results from existing data
            const initialResults: Record<string, ParticipantResult> = {}
            data.forEach((p: Participant) => {
                initialResults[p.userId] = {
                    userId: p.userId,
                    attendance: p.attendance || "planned",
                    theoryScore: undefined,
                    practicalScore: undefined,
                }
            })
            setResults(initialResults)
        } catch (error) {
            console.error("Failed to fetch participants:", error)
            toast.error("Failed to load participants")
        } finally {
            setIsLoading(false)
        }
    }

    const updateResult = (userId: string, field: keyof ParticipantResult, value: any) => {
        setResults(prev => {
            const updated = { ...prev[userId], [field]: value }
            
            // Auto-calculate theory result
            if (field === "theoryScore" && value !== undefined) {
                updated.theoryResult = value >= theoryPassScore ? "pass" : "fail"
            }
            // Auto-calculate practical result
            if (field === "practicalScore" && value !== undefined) {
                updated.practicalResult = value >= practicalPassScore ? "pass" : "fail"
            }
            
            // Auto-calculate overall result
            if (updated.attendance === "present") {
                if (hasTheory && hasPractical) {
                    if (updated.theoryResult === "pass" && updated.practicalResult === "pass") {
                        updated.overallResult = "pass"
                    } else if (updated.theoryResult === "fail" || updated.practicalResult === "fail") {
                        updated.overallResult = "fail"
                    } else {
                        updated.overallResult = undefined
                    }
                } else if (hasTheory) {
                    updated.overallResult = updated.theoryResult
                } else if (hasPractical) {
                    updated.overallResult = updated.practicalResult
                }
            }
            
            return { ...prev, [userId]: updated }
        })
    }

    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const resultsList = Object.values(results).map(r => ({
                ...r,
                theoryMethod: hasTheory ? "written" : undefined,
                practicalMethod: hasPractical ? "practical" : undefined,
                remedialNotes: r.remedialNotes
            }))
            
            // Validation
            const errors = resultsList.filter(r => {
                if (r.attendance === "present") {
                    if (hasTheory && r.theoryScore === undefined) return true
                    if (hasPractical && r.practicalScore === undefined) return true
                }
                return false
            })
            
            if (errors.length > 0) {
                toast.error(`Please enter all required scores for present participants`)
                setIsSaving(false)
                return
            }
            
            await onSubmit(resultsList)
            // Dialog close is handled by parent or success logic, 
            // but we'll assume onSubmit is the final action here.
            // If parent closes, component unmounts. If not, we reset saving.
        } catch (error) {
            console.error("Failed to submit results:", error)
            toast.error("Failed to submit results")
        } finally {
             // If unmounted this might warn, but typical in React apps to ignore or basic handle.
             // Given the 'onOpenChange(false)' is usually called by parent after success, 
             // or we might call it here if we wanted to control closing.
             // The original code passed 'onOpenChange' as prop but didn't call it in success path explicitly in some versions, 
             // but I see 'onOpenChange(false)' in my STEP 710 attempt. 
             // Let's check the view block again. 
             // Ah, line 61 shows 'open, onOpenChange' props. 
             // In the snippet I viewed in STEP 730, it calls 'onSubmit(resultsList)' (line 163).
             // It does NOT call onOpenChange(false). 
             // I'll keep it consistent with the contract: just call onSubmit. 
             // But wait, the previous attempt I saw 'onOpenChange(false)' in my replacement content.
             // The viewed file DOES NOT have onOpenChange(false) inside handleSubmit.
             // I will stick to the existing behavior but add setIsSaving(false).
             setIsSaving(false)
        }
    }

    const handleGenerateAttendance = async () => {
        if (!session) return
        try {
            const blob = await reports.generateAttendance(session.id)
            const url = URL.createObjectURL(blob)
            window.open(url, "_blank")
            toast.success("Attendance sheet generated")
        } catch (error) {
            toast.error("Failed to generate attendance sheet")
        }
    }

    const handleGenerateCertificates = async () => {
        if (!session) return
        try {
            await reports.generateCertificates(session.id)
            toast.success("Certificates generation started")
        } catch (error) {
            toast.error("Failed to generate certificates")
        }
    }

    const getResultBadge = (result?: string) => {
        if (!result) return null
        if (result === "pass") return <Badge className="bg-green-600">Pass</Badge>
        if (result === "fail") return <Badge className="bg-red-600">Fail</Badge>
        return <Badge variant="secondary">{result}</Badge>
    }

    if (!session) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("sessions.recordResultsTitle", "Record Results")}</DialogTitle>
                    <DialogDescription>
                        {t("sessions.recordResultsDesc", "Record attendance and results for session on {{date}}", { date: session.dateStart })}
                    </DialogDescription>
                </DialogHeader>

                {/* PDF Generation Buttons */}
                <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={handleGenerateAttendance}>
                        <FileDown className="mr-2 h-4 w-4" />
                        {t("sessions.attendanceSheetButton", "Generate Attendance Sheet")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleGenerateCertificates}>
                        <Award className="mr-2 h-4 w-4" />
                        {t("sessions.generateCertificates", "Generate Certificates")}
                    </Button>
                </div>

                <Separator />

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : participants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                        <p>{t("sessions.noParticipants", "No participants enrolled in this session")}</p>
                    </div>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[150px]">{t("sessions.participant", "Participant")}</TableHead>
                                    <TableHead className="w-[100px]">{t("sessions.attendance", "Attendance")}</TableHead>
                                    {hasTheory && (
                                        <>
                                            <TableHead className="w-[80px] text-center">{t("sessions.theory", "Theory")} %</TableHead>
                                            <TableHead className="w-[80px] text-center">{t("sessions.theory", "Theory")}</TableHead>
                                        </>
                                    )}
                                    {hasPractical && (
                                        <>
                                            <TableHead className="w-[80px] text-center">{t("sessions.practical", "Practical")} %</TableHead>
                                            <TableHead className="w-[80px] text-center">{t("sessions.practical", "Practical")}</TableHead>
                                        </>
                                    )}
                                    <TableHead className="w-[80px] text-center">{t("sessions.overall", "Overall")}</TableHead>
                                    <TableHead className="min-w-[150px]">{t("sessions.comments", "Comments")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {participants.map((p) => {
                                    const r = results[p.userId] || { userId: p.userId, attendance: "planned" }
                                    const isPresent = r.attendance === "present"
                                    
                                    return (
                                        <TableRow key={p.userId}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{p.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{p.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={r.attendance}
                                                    onValueChange={(v) => updateResult(p.userId, "attendance", v)}
                                                    disabled={!!session.isSigned}
                                                >
                                                    <SelectTrigger className="w-[100px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="planned">{t("sessions.status.planned", "Planned")}</SelectItem>
                                                        <SelectItem value="present">{t("sessions.status.present", "Present")}</SelectItem>
                                                        <SelectItem value="absent">{t("sessions.status.absent", "Absent")}</SelectItem>
                                                        <SelectItem value="excused">{t("sessions.status.excused", "Excused")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            {hasTheory && (
                                                <>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="w-[70px]"
                                                            disabled={!isPresent || !!session.isSigned}
                                                            value={r.theoryScore ?? ""}
                                                            onChange={(e) => updateResult(p.userId, "theoryScore", e.target.value ? parseInt(e.target.value) : undefined)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isPresent && getResultBadge(r.theoryResult)}
                                                    </TableCell>
                                                </>
                                            )}
                                            {hasPractical && (
                                                <>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="w-[70px]"
                                                            disabled={!isPresent || !!session.isSigned}
                                                            value={r.practicalScore ?? ""}
                                                            onChange={(e) => updateResult(p.userId, "practicalScore", e.target.value ? parseInt(e.target.value) : undefined)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isPresent && getResultBadge(r.practicalResult)}
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-center">
                                                {isPresent && getResultBadge(r.overallResult)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Input
                                                        className="min-w-[120px]"
                                                        placeholder="Notes..."
                                                        value={r.comments || ""}
                                                        disabled={!!session.isSigned}
                                                        onChange={(e) => updateResult(p.userId, "comments", e.target.value)}
                                                    />
                                                    {r.overallResult === 'fail' && (
                                                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1">
                                                            <div className="flex items-center text-xs text-amber-600 font-medium">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                {t("sessions.remedialActionRequired", "Remedial Action Required")}
                                                            </div>
                                                            <Input
                                                                className="min-w-[120px] border-amber-200 focus:ring-amber-200"
                                                                placeholder={t("sessions.remedialActionsPlaceholder", "Remedial actions...")}
                                                                value={r.remedialNotes || ""}
                                                                disabled={!!session.isSigned}
                                                                onChange={(e) => updateResult(p.userId, "remedialNotes", e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t("sessions.cancel", "Cancel")}
                    </Button>
                    {session.isSigned ? (
                        <div className="flex items-center text-green-600 px-4 py-2 bg-green-50 rounded-md border border-green-200">
                           <Award className="w-4 h-4 mr-2" />
                           <span className="font-semibold text-sm">{t("sessions.signedFinalized", "Signed & Finalized")}</span>
                        </div>
                    ) : (
                        <>
                            {session.status === 'completed' && (
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    onClick={() => setIsSignModalOpen(true)}
                                    className="mr-2"
                                >
                                    {t("sessions.signResults", "Sign Results")}
                                </Button>
                            )}
                            <Button onClick={handleSubmit} disabled={isSaving || participants.length === 0}>
                                {isSaving ? t("sessions.saving", "Saving...") : t("sessions.saveResults", "Save Results")}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
            
            {/* Signature Modal */}
            <SignatureModal
                isOpen={isSignModalOpen}
                onClose={() => setIsSignModalOpen(false)}
                onSign={handleSign}
                instructorName={session.instructorId} // In a real app we'd need the instructor name fetching or passing
            />
        </Dialog>
    )
}

