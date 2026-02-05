
import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { standards } from "@/lib/api"
import type { Standard } from "@/types"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EditStandardDialogProps {
    standard: Standard
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditStandardDialog({ standard, open, onOpenChange }: EditStandardDialogProps) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        name: standard.name,
        description: standard.description || "",
        objectives: (standard.objectives || []).join("\n"),
        validityMonths: standard.validityMonths || 12,
        hasTheory: standard.hasTheory,
        hasPractical: standard.hasPractical,
        theoryPassScore: standard.theoryPassScore || 70,
        practicalPassScore: standard.practicalPassScore || 70,
        allowedMethods: standard.allowedMethods || ["written"],
        departmentTag: standard.departmentTag || "",
        isActive: standard.isActive,
    })

    const [showMajorWarning, setShowMajorWarning] = useState(false)

    useEffect(() => {
        if (open) {
            setFormData({
                name: standard.name,
                description: standard.description || "",
                objectives: (standard.objectives || []).join("\n"),
                validityMonths: standard.validityMonths || 12,
                hasTheory: standard.hasTheory,
                hasPractical: standard.hasPractical,
                theoryPassScore: standard.theoryPassScore || 70,
                practicalPassScore: standard.practicalPassScore || 70,
                allowedMethods: standard.allowedMethods || ["written"],
                departmentTag: standard.departmentTag || "",
                isActive: standard.isActive
            })
            setShowMajorWarning(false)
        }
    }, [open, standard])

    const isMajorUpdate = () => {
        if (standard.validityMonths !== formData.validityMonths) return true
        if (standard.hasTheory !== formData.hasTheory) return true
        if (standard.hasPractical !== formData.hasPractical) return true
        if (standard.theoryPassScore !== formData.theoryPassScore) return true
        if (standard.practicalPassScore !== formData.practicalPassScore) return true
        
        // Array comparison for allowedMethods
        const currentMethods = new Set(standard.allowedMethods || [])
        const newMethods = new Set(formData.allowedMethods)
        if (currentMethods.size !== newMethods.size) return true
        for (let method of newMethods) {
            if (!currentMethods.has(method)) return true
        }

        return false
    }

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                objectives: data.objectives
                    .split("\n")
                    .map(o => o.trim())
                    .filter(o => o.length > 0)
            }
            return standards.update(standard.id, payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standard", standard.id] })
            queryClient.invalidateQueries({ queryKey: ["standards"] })
            onOpenChange(false)
            toast.success(showMajorWarning ? "Major revision created (v" + (standard.revision + 1).toFixed(1) + ")" : "Standard updated successfully")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to update standard")
        },
    })

    const handleSubmit = () => {
        if (!showMajorWarning && isMajorUpdate()) {
            setShowMajorWarning(true)
            return
        }
        updateMutation.mutate(formData)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Standard: {standard.code}</DialogTitle>
                    <DialogDescription>
                        Update standard details. Major changes will trigger a new revision.
                    </DialogDescription>
                </DialogHeader>
                
                {showMajorWarning ? (
                    <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Major Revision Detected</AlertTitle>
                            <AlertDescription>
                                You have modified fields that affect regulatory compliance (Validity, Assessment Criteria, etc.).
                                <br /><br />
                                This will:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Create a new version <strong>v{(Math.floor(standard.revision) + 1).toFixed(1)}</strong></li>
                                    <li>Archive the current version <strong>v{standard.revision}</strong></li>
                                    <li>Existing training records will remain linked to v{standard.revision}</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowMajorWarning(false)}>Back to Edit</Button>
                            <Button onClick={() => updateMutation.mutate(formData)}>Confirm Major Revision</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isActive" className="text-right">Status</Label>
                                <div className="col-span-3 flex items-center gap-2">
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                    <Label htmlFor="isActive" className="font-normal text-muted-foreground">
                                        {formData.isActive ? "Active" : "Inactive"}
                                    </Label>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    className="col-span-3"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="description" className="text-right mt-2">Description</Label>
                                <div className="col-span-3">
                                    <textarea
                                        id="description"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="objectives" className="text-right mt-2">Objectives</Label>
                                <div className="col-span-3">
                                    <textarea
                                        id="objectives"
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={formData.objectives}
                                        onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
                                <Label className="text-right font-semibold">Critical Fields</Label>
                                <div className="col-span-3 text-xs text-muted-foreground">Changes below trigger Major Revision</div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="validity" className="text-right">Validity (months)</Label>
                                <Input
                                    id="validity"
                                    type="number"
                                    className="col-span-3"
                                    value={formData.validityMonths}
                                    onChange={(e) => setFormData({ ...formData, validityMonths: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Has Theory</Label>
                                <div className="col-span-3 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Switch
                                            checked={formData.hasTheory}
                                            onCheckedChange={(checked) => setFormData({ ...formData, hasTheory: checked })}
                                        />
                                        {formData.hasTheory && (
                                            <div className="flex items-center gap-2">
                                                <Label>Pass %</Label>
                                                <Input
                                                    type="number"
                                                    className="w-20"
                                                    value={formData.theoryPassScore}
                                                    onChange={(e) => setFormData({ ...formData, theoryPassScore: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {formData.hasTheory && (
                                        <div className="space-y-2 rounded-md border p-3">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase">Allowed Assessment Methods</Label>
                                            <div className="flex flex-wrap gap-4 pt-1">
                                                {["written", "oral", "computer"].map((method) => (
                                                    <div key={method} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`edit-method-${method}`} 
                                                            checked={formData.allowedMethods.includes(method)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        allowedMethods: [...formData.allowedMethods, method]
                                                                    })
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        allowedMethods: formData.allowedMethods.filter(m => m !== method)
                                                                    })
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            htmlFor={`edit-method-${method}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                                        >
                                                            {method}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Has Practical</Label>
                                <div className="col-span-3 flex items-center gap-4">
                                    <Switch
                                        checked={formData.hasPractical}
                                        onCheckedChange={(checked) => setFormData({ ...formData, hasPractical: checked })}
                                    />
                                    {formData.hasPractical && (
                                        <div className="flex items-center gap-2">
                                            <Label>Pass %</Label>
                                            <Input
                                                type="number"
                                                className="w-20"
                                                value={formData.practicalPassScore}
                                                onChange={(e) => setFormData({ ...formData, practicalPassScore: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={updateMutation.isPending || !formData.name}
                            >
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
