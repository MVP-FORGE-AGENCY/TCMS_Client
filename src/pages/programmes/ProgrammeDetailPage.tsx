import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Calendar, Clock } from "lucide-react"
import type { Programme, Session } from "@/types"

import { MOCK_PROGRAMMES } from "@/lib/mock-data"

const MOCK_SESSIONS: Session[] = [
    {
        id: "s1",
        programmeId: "1",
        dateStart: "2024-03-15T09:00:00",
        dateEnd: "2024-03-15T13:00:00",
        location: "SIM-1",
        instructorId: "inst-1",
        sessionType: "combined",
        status: "completed",
    },
    {
        id: "s2",
        programmeId: "1",
        dateStart: "2024-04-20T14:00:00",
        dateEnd: "2024-04-20T18:00:00",
        location: "SIM-2",
        instructorId: "inst-2",
        sessionType: "combined",
        status: "planned",
    },
]

export default function ProgrammeDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [programme, setProgramme] = useState<Programme | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])

    useEffect(() => {
        if (id) {
            const savedProgrammes = localStorage.getItem("programmes")
            const allProgrammes = savedProgrammes ? JSON.parse(savedProgrammes) : MOCK_PROGRAMMES
            const found = allProgrammes.find((p: Programme) => p.id === id)

            if (found) {
                setProgramme(found)
                setSessions(MOCK_SESSIONS) // Still using static sessions for now
            }
        }
    }, [id])

    if (!programme) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate("/programmes")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{programme.name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline">{programme.code}</Badge>
                        <span>•</span>
                        <span className="capitalize">{programme.type}</span>
                    </div>
                </div>
                <Button className="ml-auto">Schedule Session</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Validity</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{programme.validityMonths} Months</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{programme.durationHours} Hours</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Frequency</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Every {programme.frequencyMonths} Months</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Session History</h2>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        {new Date(session.dateStart).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{session.location}</TableCell>
                                    <TableCell className="capitalize">{session.sessionType}</TableCell>
                                    <TableCell>
                                        <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                                            {session.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
