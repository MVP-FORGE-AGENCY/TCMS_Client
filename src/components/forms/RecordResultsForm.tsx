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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import type { Session, Employee } from "@/types"

// Mock enrolled employees (in real app, fetch from session)
const MOCK_ENROLLED: Employee[] = [
    { id: "emp1", fullName: "John Doe", organisationId: "ORG001", role: "Pilot", employmentStart: "2020-01-01" },
    { id: "emp2", fullName: "Jane Smith", organisationId: "ORG002", role: "Pilot", employmentStart: "2019-05-15" },
]

interface RecordResultsFormProps {
    session: Session | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (results: any) => void
}

export function RecordResultsForm({ session, open, onOpenChange, onSubmit }: RecordResultsFormProps) {
    // In a real app, we'd have a form array here. For simplicity, we'll just manage state locally or use a simple form structure.
    // For this mock, let's just show the UI and simulate submission.

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            sessionId: session?.id,
            results: MOCK_ENROLLED.map(emp => ({
                userId: emp.id,
                attendance: "present",
                result: "pass"
            }))
        })
    }

    if (!session) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Record Results</DialogTitle>
                    <DialogDescription>
                        Record attendance and results for {session.programmeId}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Attendance</TableHead>
                                    <TableHead>Assessment</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Result</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_ENROLLED.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell className="font-medium">{emp.fullName}</TableCell>
                                        <TableCell>
                                            <RadioGroup defaultValue="present" className="flex gap-2">
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="present" id={`present-${emp.id}`} />
                                                    <Label htmlFor={`present-${emp.id}`}>Present</Label>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="absent" id={`absent-${emp.id}`} />
                                                    <Label htmlFor={`absent-${emp.id}`}>Absent</Label>
                                                </div>
                                            </RadioGroup>
                                        </TableCell>
                                        <TableCell>
                                            <Select defaultValue="practical">
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="written">Written</SelectItem>
                                                    <SelectItem value="practical">Practical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" className="w-[80px]" placeholder="%" />
                                        </TableCell>
                                        <TableCell>
                                            <Select defaultValue="pass">
                                                <SelectTrigger className="w-[100px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pass">Pass</SelectItem>
                                                    <SelectItem value="fail">Fail</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Results</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
