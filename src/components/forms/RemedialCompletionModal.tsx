import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface RemedialCompletionModalProps {
    attemptId: string | null
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    type: 'training' | 'check'
}

export function RemedialCompletionModal({ 
    attemptId, 
    isOpen, 
    onClose, 
    onSuccess,
    type 
}: RemedialCompletionModalProps) {
    const [notes, setNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!attemptId) return
        if (!notes.trim()) {
            toast.error("Please provide remedial completion notes")
            return
        }

        setIsSubmitting(true)
        try {
            const endpoint = type === 'training' 
                ? `/training-attempts/${attemptId}/complete-remedial`
                : `/check-attempts/${attemptId}/complete-remedial`

            await api.post(endpoint, { notes })
            
            toast.success("Remedial action marked as complete")
            onSuccess()
            onClose()
            setNotes("")
        } catch (error) {
            console.error("Failed to complete remedial:", error)
            toast.error("Failed to complete remedial action")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Complete Remedial Action
                    </DialogTitle>
                    <DialogDescription>
                        Confirm that the required remedial training has been completed for this attempt.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Completion Notes
                        </label>
                        <Textarea
                            placeholder="Describe the remedial training provided..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Completing..." : "Confirm Completion"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
