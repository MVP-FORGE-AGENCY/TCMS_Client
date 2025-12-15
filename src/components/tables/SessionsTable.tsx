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
import { MoreHorizontal, Users, ClipboardCheck, Ban } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session } from "@/types"

interface SessionsTableProps {
    data: Session[]
    onViewParticipants: (session: Session) => void
    onRecordResults: (session: Session) => void
    onCancelSession: (session: Session) => void
}

export function SessionsTable({
    data,
    onViewParticipants,
    onRecordResults,
    onCancelSession,
}: SessionsTableProps) {
    const [filterProgramme, setFilterProgramme] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const filteredData = (data || []).filter((session) => {
        const matchesProgramme = session.programmeId.toLowerCase().includes(filterProgramme.toLowerCase())
        const matchesStatus = filterStatus === "all" || session.status === filterStatus
        return matchesProgramme && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case "planned":
                return "bg-blue-500 hover:bg-blue-600"
            case "in_progress":
                return "bg-amber-500 hover:bg-amber-600"
            case "completed":
                return "bg-green-500 hover:bg-green-600"
            case "cancelled":
                return "bg-gray-500 hover:bg-gray-600"
            default:
                return "bg-gray-500"
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Filter by Programme ID..."
                    value={filterProgramme}
                    onChange={(e) => setFilterProgramme(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Programme</TableHead>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell>
                                    {new Date(session.dateStart).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-medium">{session.programmeId}</TableCell>
                                <TableCell>{session.instructorId}</TableCell>
                                <TableCell>{session.location}</TableCell>
                                <TableCell className="capitalize">{session.sessionType}</TableCell>
                                <TableCell>{session.capacity || "-"}</TableCell>
                                <TableCell>
                                    <Badge className={getStatusColor(session.status)}>
                                        {session.status.replace("_", " ")}
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
                                            <DropdownMenuItem onClick={() => onViewParticipants(session)}>
                                                <Users className="mr-2 h-4 w-4" />
                                                View Participants
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onRecordResults(session)}>
                                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                                Record Results
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onCancelSession(session)}
                                                className="text-red-600"
                                            >
                                                <Ban className="mr-2 h-4 w-4" />
                                                Cancel Session
                                            </DropdownMenuItem>
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
