import { useState, useEffect, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, X } from "lucide-react"
import { employees } from "@/lib/api"

interface Trainee {
    id: string
    fullName: string
    email: string
    areaOfActivity: string | null
    departmentTag: string | null
    role: string
}

interface TraineePickerModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
}

export function TraineePickerModal({
    open,
    onOpenChange,
    selectedIds,
    onSelectionChange,
}: TraineePickerModalProps) {
    const [trainees, setTrainees] = useState<Trainee[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)

    // Sync local selection with parent when modal opens
    useEffect(() => {
        if (open) {
            setLocalSelected(selectedIds)
        }
    }, [open, selectedIds])

    // Fetch trainees on mount
    useEffect(() => {
        const fetchTrainees = async () => {
            try {
                setLoading(true)
                const response = await employees.list({ isActive: true })
                const data = response.data || response
                const allEmployees = Array.isArray(data) ? data : []
                // Filter only employees (trainees in this context)
                const traineeList = allEmployees
                    .filter((u: any) => u.role === 'employee')
                    .map((u: any) => ({
                        id: u.id,
                        fullName: u.fullName || u.full_name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                        email: u.email,
                        areaOfActivity: u.areaOfActivity || u.area_of_activity || null,
                        departmentTag: u.departmentTag || u.department_tag || null,
                        role: u.role
                    }))
                setTrainees(traineeList)
            } catch (error) {
                console.error("Failed to fetch trainees:", error)
            } finally {
                setLoading(false)
            }
        }
        if (open) {
            fetchTrainees()
        }
    }, [open])

    // Filter trainees based on search term
    const filteredTrainees = useMemo(() => {
        if (!searchTerm.trim()) return trainees
        const term = searchTerm.toLowerCase()
        return trainees.filter(t =>
            t.fullName.toLowerCase().includes(term) ||
            t.email.toLowerCase().includes(term) ||
            (t.areaOfActivity && t.areaOfActivity.toLowerCase().includes(term)) ||
            (t.departmentTag && t.departmentTag.toLowerCase().includes(term))
        )
    }, [trainees, searchTerm])

    const toggleTrainee = (id: string) => {
        setLocalSelected(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        )
    }

    const selectAll = () => {
        setLocalSelected(filteredTrainees.map(t => t.id))
    }

    const clearAll = () => {
        setLocalSelected([])
    }

    const handleConfirm = () => {
        onSelectionChange(localSelected)
        onOpenChange(false)
    }

    const handleCancel = () => {
        setLocalSelected(selectedIds) // Reset to original
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select Participants
                    </DialogTitle>
                </DialogHeader>

                {/* Search and filters */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, department, or area..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Selection summary */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {localSelected.length} of {trainees.length} trainees selected
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAll}>
                                Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearAll}>
                                Clear All
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Trainee list */}
                <div className="border rounded-md">
                    {loading ? (
                        <div className="flex items-center justify-center p-8 gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-muted-foreground">Loading trainees...</span>
                        </div>
                    ) : filteredTrainees.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {searchTerm ? "No trainees match your search" : "No trainees available"}
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-1 p-2">
                                {filteredTrainees.map((trainee) => (
                                    <div
                                        key={trainee.id}
                                        className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${
                                            localSelected.includes(trainee.id)
                                                ? "bg-primary/10 border border-primary/30"
                                                : "hover:bg-muted/50"
                                        }`}
                                        onClick={() => toggleTrainee(trainee.id)}
                                    >
                                        <Checkbox
                                            checked={localSelected.includes(trainee.id)}
                                            onCheckedChange={() => toggleTrainee(trainee.id)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate">
                                                    {trainee.fullName}
                                                </span>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {trainee.email}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            {trainee.departmentTag && (
                                                <Badge variant="outline" className="text-xs">
                                                    {trainee.departmentTag}
                                                </Badge>
                                            )}
                                            {trainee.areaOfActivity && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {trainee.areaOfActivity}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm}>
                        Confirm Selection ({localSelected.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
