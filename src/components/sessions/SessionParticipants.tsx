import { useState } from "react"
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

// Mock employees for selection
const MOCK_EMPLOYEES: Employee[] = [
    { id: "emp1", fullName: "John Doe", organisationId: "ORG001", role: "Pilot", employmentStart: "2020-01-01" },
    { id: "emp2", fullName: "Jane Smith", organisationId: "ORG002", role: "Pilot", employmentStart: "2019-05-15" },
    { id: "emp3", fullName: "Bob Johnson", organisationId: "ORG003", role: "Cabin Crew", employmentStart: "2021-03-10" },
    { id: "emp4", fullName: "Alice Brown", organisationId: "ORG004", role: "Cabin Crew", employmentStart: "2022-08-20" },
]

interface SessionParticipantsProps {
    session: Session | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SessionParticipants({ session, open, onOpenChange }: SessionParticipantsProps) {
    const [participants, setParticipants] = useState<Employee[]>([])
    const [isAddMode, setIsAddMode] = useState(false)
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

    const handleAddParticipants = () => {
        const newParticipants = MOCK_EMPLOYEES.filter(emp => selectedEmployees.includes(emp.id))
        setParticipants([...participants, ...newParticipants])
        setIsAddMode(false)
        setSelectedEmployees([])
    }

    const toggleEmployeeSelection = (empId: string) => {
        if (selectedEmployees.includes(empId)) {
            setSelectedEmployees(selectedEmployees.filter(id => id !== empId))
        } else {
            setSelectedEmployees([...selectedEmployees, empId])
        }
    }

    const removeParticipant = (empId: string) => {
        setParticipants(participants.filter(p => p.id !== empId))
    }

    if (!session) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Session Participants</DialogTitle>
                    <DialogDescription>
                        Manage participants for session {session.programmeId} on {new Date(session.dateStart).toLocaleDateString()}
                    </DialogDescription>
                </DialogHeader>

                {!isAddMode ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                {participants.length} / {session.capacity || 10} Enrolled
                            </div>
                            <Button onClick={() => setIsAddMode(true)} size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Add Participants
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No participants enrolled yet.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        participants.map((p) => (
                                            <TableRow key={p.id}>
                                                <TableCell>{p.fullName}</TableCell>
                                                <TableCell>{p.role}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">Planned</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
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
                        <div className="rounded-md border max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {MOCK_EMPLOYEES.filter(e => !participants.find(p => p.id === e.id)).map((emp) => (
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
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddMode(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddParticipants} disabled={selectedEmployees.length === 0}>
                                Add Selected
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
