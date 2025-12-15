import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Employee, EmployeeHistory } from "@/types"
import { useEffect, useState } from "react"

interface PersonnelHistoryModalProps {
    employee: Employee | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PersonnelHistoryModal({
    employee,
    open,
    onOpenChange,
}: PersonnelHistoryModalProps) {
    const [history, setHistory] = useState<EmployeeHistory | null>(null)

    useEffect(() => {
        if (employee && open) {
            // Mock fetching history
            // In real app: api.get(\`/employees/\${employee.id}/history\`)
            setHistory({
                employee,
                trainings: [
                    {
                        sessionId: "sess-1",
                        programmeCode: "OPC-A320",
                        date: "2024-01-15",
                        result: "pass",
                    },
                    {
                        sessionId: "sess-2",
                        programmeCode: "CRM-REC",
                        date: "2023-11-20",
                        result: "pass",
                    },
                ],
                checks: [
                    {
                        checkId: "chk-1",
                        profileCode: "LPC-A320",
                        date: "2024-02-01",
                        result: "pass",
                    },
                    {
                        checkId: "chk-2",
                        profileCode: "OPC-A320",
                        date: "2023-08-10",
                        result: "fail",
                    },
                ],
            })
        } else {
            setHistory(null)
        }
    }, [employee, open])

    if (!employee) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>History: {employee.fullName}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="training" className="w-full">
                    <TabsList>
                        <TabsTrigger value="training">Training Sessions</TabsTrigger>
                        <TabsTrigger value="checks">Proficiency Checks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="training">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Programme</TableHead>
                                        <TableHead>Result</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history?.trainings.map((training, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{training.date}</TableCell>
                                            <TableCell>{training.programmeCode}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        training.result === "pass"
                                                            ? "default" // Greenish in default theme usually, or customize
                                                            : training.result === "fail"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className={
                                                        training.result === "pass" ? "bg-green-600 hover:bg-green-700" : ""
                                                    }
                                                >
                                                    {training.result.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!history?.trainings.length && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">
                                                No training history found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="checks">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Profile</TableHead>
                                        <TableHead>Result</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history?.checks.map((check, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{check.date}</TableCell>
                                            <TableCell>{check.profileCode}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        check.result === "pass"
                                                            ? "default"
                                                            : check.result === "fail"
                                                                ? "destructive"
                                                                : "secondary"
                                                    }
                                                    className={
                                                        check.result === "pass" ? "bg-green-600 hover:bg-green-700" : ""
                                                    }
                                                >
                                                    {check.result.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!history?.checks.length && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">
                                                No check history found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
