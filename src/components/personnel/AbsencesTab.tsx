import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { absences } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, CalendarOff } from "lucide-react"
import { format } from "date-fns"

interface Absence {
    id: string
    userId: string
    absenceType: string
    dateStart: string
    dateEnd: string
    reason?: string
    status: string
    createdAt: string
}

interface AbsencesTabProps {
    userId: string
    userName: string
}

function ExpandableText({ text }: { text: string }) {
    const [isExpanded, setIsExpanded] = useState(false)
    if (text.length <= 50) return <TableCell className="max-w-[200px]">{text}</TableCell>
    
    return (
        <TableCell className="max-w-[200px]">
            <div className="flex flex-col items-start gap-1">
                <span className={isExpanded ? "whitespace-pre-wrap text-sm" : "truncate w-full block text-sm"}>
                    {text}
                </span>
                <button 
                    onClick={(e) => {
                        e.preventDefault()
                        setIsExpanded(!isExpanded)
                    }}
                    className="text-xs text-blue-600 hover:underline focus:outline-none"
                >
                    {isExpanded ? "Show less" : "Show more"}
                </button>
            </div>
        </TableCell>
    )
}

export function AbsencesTab({ userId, userName }: AbsencesTabProps) {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null)
    const [formData, setFormData] = useState({
        absenceType: "sick",
        dateStart: "",
        dateEnd: "",
        reason: "",
        status: "approved",
    })

    const canManage = user?.role && ["admin", "training_manager"].includes(user.role)

    const { data: absencesList = [], isLoading } = useQuery({
        queryKey: ["absences", userId],
        queryFn: () => absences.list({ userId }),
    })

    const createMutation = useMutation({
        mutationFn: (data: any) => absences.create({ ...data, userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["absences", userId] })
            setIsDialogOpen(false)
            resetForm()
            toast.success("Absence recorded")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to record absence")
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => absences.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["absences", userId] })
            setIsDialogOpen(false)
            setEditingAbsence(null)
            resetForm()
            toast.success("Absence updated")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to update absence")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => absences.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["absences", userId] })
            toast.success("Absence deleted")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to delete absence")
        },
    })

    const resetForm = () => {
        setFormData({
            absenceType: "sick",
            dateStart: "",
            dateEnd: "",
            reason: "",
            status: "approved",
        })
    }

    const handleEdit = (absence: Absence) => {
        setEditingAbsence(absence)
        setFormData({
            absenceType: absence.absenceType,
            dateStart: absence.dateStart.split("T")[0],
            dateEnd: absence.dateEnd.split("T")[0],
            reason: absence.reason || "",
            status: absence.status,
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = () => {
        if (editingAbsence) {
            updateMutation.mutate({ id: editingAbsence.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const handleDelete = (id: string) => {
        if (confirm("Delete this absence record?")) {
            deleteMutation.mutate(id)
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "sick": return "bg-red-100 text-red-800"
            case "vacation": return "bg-blue-100 text-blue-800"
            case "training": return "bg-green-100 text-green-800"
            case "other": return "bg-gray-100 text-gray-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-600"
            case "pending": return "bg-yellow-600"
            case "rejected": return "bg-red-600"
            default: return "bg-gray-500"
        }
    }

    // Handle both flat array and paginated response
    const absencesData = Array.isArray(absencesList) ? absencesList : (absencesList?.data || [])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Absences</h3>
                    <p className="text-sm text-muted-foreground">
                        Absence history for {userName}
                    </p>
                </div>
                {canManage && (
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) {
                            setEditingAbsence(null)
                            resetForm()
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Record Absence
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingAbsence ? "Edit Absence" : "Record Absence"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingAbsence ? "Update absence details" : "Record a new absence for this employee"}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Type</Label>
                                    <Select
                                        value={formData.absenceType}
                                        onValueChange={(v) => setFormData({ ...formData, absenceType: v })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sick">Sick Leave</SelectItem>
                                            <SelectItem value="vacation">Vacation</SelectItem>
                                            <SelectItem value="training">Training Leave</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="col-span-3"
                                        value={formData.dateStart}
                                        onChange={(e) => setFormData({ ...formData, dateStart: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">End Date</Label>
                                    <Input
                                        type="date"
                                        className="col-span-3"
                                        value={formData.dateEnd}
                                        onChange={(e) => setFormData({ ...formData, dateEnd: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(v) => setFormData({ ...formData, status: v })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Reason</Label>
                                    <Textarea
                                        className="col-span-3"
                                        placeholder="Optional notes..."
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={createMutation.isPending || updateMutation.isPending || !formData.dateStart || !formData.dateEnd}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reason</TableHead>
                            {canManage && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : absencesData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    <CalendarOff className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                    No absences recorded
                                </TableCell>
                            </TableRow>
                        ) : (
                            absencesData.map((a: Absence) => (
                                <TableRow key={a.id}>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-medium ${getTypeColor(a.absenceType)}`}>
                                            {a.absenceType}
                                        </span>
                                    </TableCell>
                                    <TableCell>{a.dateStart ? format(new Date(a.dateStart), "MMM d, yyyy") : "-"}</TableCell>
                                    <TableCell>{a.dateEnd ? format(new Date(a.dateEnd), "MMM d, yyyy") : "-"}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                                    </TableCell>
                                    <ExpandableText text={a.reason || "-"} />
                                    {canManage && (
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(a)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(a.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
