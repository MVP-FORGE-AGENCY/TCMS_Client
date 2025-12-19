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
import type { Employee } from "@/types"
import { useEffect, useState } from "react"
import { AbsencesTab } from "@/components/personnel/AbsencesTab"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { RemedialCompletionModal } from "@/components/forms/RemedialCompletionModal"

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
    const [history, setHistory] = useState<any>(null)
    const [selectedAttempt, setSelectedAttempt] = useState<{ id: string, type: 'training' | 'check' } | null>(null)

    useEffect(() => {
        if (employee && open) {
            api.get(`/attempts/employee/${employee.id}`)
                .then(res => setHistory(res.data))
                .catch(err => {
                    console.error("Failed to fetch history:", err)
                    setHistory({ employee, trainings: [], checks: [] } as any)
                })
        } else {
            setHistory(null)
        }
    }, [employee, open])

    if (!employee) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>History: {employee.fullName}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="training" className="w-full">
                    <TabsList>
                        <TabsTrigger value="training">Training Sessions</TabsTrigger>
                        <TabsTrigger value="checks">Proficiency Checks</TabsTrigger>
                        <TabsTrigger value="absences">Absences</TabsTrigger>
                    </TabsList>

                    <TabsContent value="training">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Programme</TableHead>
                                        <TableHead>Attempt</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history?.trainings.map((training: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{training.date}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{training.programmeCode}</div>
                                                    <div className="text-xs text-muted-foreground">{training.programmeName}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Attempt {training.attemptNumber}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge
                                                        variant={
                                                            training.result === "pass"
                                                                ? "default" // Greenish in default theme usually, or customize
                                                                : training.result === "fail"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }
                                                        className={
                                                            training.result === "pass" ? "bg-green-600 w-fit" : "w-fit"
                                                        }
                                                    >
                                                        {training.result?.toUpperCase() || '-'}
                                                    </Badge>
                                                    {training.requiresRemedial && !training.remedialCompletedAt && (
                                                        <div className="flex items-center text-xs text-amber-600 font-medium">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Remedial Required
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {training.requiresRemedial && !training.remedialCompletedAt && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                                        onClick={() => setSelectedAttempt({ id: training.id, type: 'training' })}
                                                    >
                                                        Review & Complete
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!history?.trainings || history.trainings.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                        <TableHead>Attempt</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history?.checks.map((check: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{check.date}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{check.profileCode}</div>
                                                    <div className="text-xs text-muted-foreground">{check.profileName}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Attempt {check.attemptNumber}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge
                                                        variant={
                                                            check.result === "pass"
                                                                ? "default"
                                                                : check.result === "fail"
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }
                                                        className={
                                                            check.result === "pass" ? "bg-green-600 w-fit" : "w-fit"
                                                        }
                                                    >
                                                        {check.result?.toUpperCase() || '-'}
                                                    </Badge>
                                                    {check.requiresRemedial && !check.remedialCompletedAt && (
                                                        <div className="flex items-center text-xs text-amber-600 font-medium">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            Remedial Required
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {check.requiresRemedial && !check.remedialCompletedAt && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                                                        onClick={() => setSelectedAttempt({ id: check.id, type: 'check' })}
                                                    >
                                                        Review & Complete
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!history?.checks || history.checks.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No check history found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="absences">
                        <AbsencesTab userId={employee.id} userName={employee.fullName} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
            
            <RemedialCompletionModal
                attemptId={selectedAttempt?.id || null}
                type={selectedAttempt?.type || 'training'}
                isOpen={!!selectedAttempt}
                onClose={() => setSelectedAttempt(null)}
                onSuccess={() => {
                    // Refetch history
                    if (employee) {
                         api.get(`/attempts/employee/${employee.id}`)
                            .then(res => setHistory(res.data))
                            .catch(console.error)
                    }
                }}
            />
        </Dialog>
    )
}

