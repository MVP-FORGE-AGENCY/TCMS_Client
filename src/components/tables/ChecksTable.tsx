import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, FileText, CheckCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProficiencyCheck } from "@/types"

interface ChecksTableProps {
    data: ProficiencyCheck[]
    onComplete: (check: ProficiencyCheck) => void
    onViewProtocol: (check: ProficiencyCheck) => void
}

export function ChecksTable({
    data,
    onComplete,
    onViewProtocol,
}: ChecksTableProps) {
    const [filterTrainee, setFilterTrainee] = useState("")
    const [filterResult, setFilterResult] = useState<string>("all")

    const filteredData = data.filter((check) => {
        const matchesTrainee = check.traineeId.toLowerCase().includes(filterTrainee.toLowerCase())
        const matchesResult = filterResult === "all" || check.result === filterResult
        return matchesTrainee && matchesResult
    })

    const getResultColor = (result: string) => {
        switch (result) {
            case "planned":
                return "bg-blue-500"
            case "pass":
                return "bg-green-500"
            case "fail":
                return "bg-red-500"
            case "cancelled":
                return "bg-gray-500"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Filter by Trainee ID..."
                    value={filterTrainee}
                    onChange={(e) => setFilterTrainee(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filterResult} onValueChange={setFilterResult}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Result" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Results</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Trainee</TableHead>
                            <TableHead>Profile</TableHead>
                            <TableHead>Assessor</TableHead>
                            <TableHead>Conditions</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((check) => (
                            <TableRow key={check.id}>
                                <TableCell>
                                    {new Date(check.dateStart).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{check.traineeId}</TableCell>
                                <TableCell>{check.profileId}</TableCell>
                                <TableCell>{check.assessorId}</TableCell>
                                <TableCell className="capitalize">{check.conditions || "-"}</TableCell>
                                <TableCell>
                                    <Badge className={getResultColor(check.result)}>
                                        {check.result.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            {check.result === "planned" && (
                                                <DropdownMenuItem onClick={() => onComplete(check)}>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Complete Check
                                                </DropdownMenuItem>
                                            )}
                                            {check.protocolUrl && (
                                                <DropdownMenuItem onClick={() => onViewProtocol(check)}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Protocol
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
