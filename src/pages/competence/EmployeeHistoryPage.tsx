import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, FileText } from "lucide-react"

export default function EmployeeHistoryPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [history, setHistory] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return
            try {
                const res = await api.get(`/employees/${id}/history`)
                setHistory(res.data)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id])

    if (isLoading) return <div className="p-8">Loading...</div>
    if (!history) return <div className="p-8">Employee not found</div>

    const { employee, competences, trainings, checks, absences } = history

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{employee?.fullName}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{employee?.email}</span>
                        <span>•</span>
                        <Badge variant="outline">{employee?.departmentTag || 'No Dept'}</Badge>
                        <span>•</span>
                        <span>{employee?.role}</span>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Active Competences</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">
                             {competences?.filter((c: any) => c.status === 'valid').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Expired</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                             {competences?.filter((c: any) => c.status === 'expired').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Total Trainings</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             {trainings?.length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="training" className="w-full">
                <TabsList>
                    <TabsTrigger value="training">Training History</TabsTrigger>
                    <TabsTrigger value="checks">Proficiency Checks</TabsTrigger>
                    <TabsTrigger value="competence">Competence Status</TabsTrigger>
                    {absences && absences.length > 0 && <TabsTrigger value="absences">Absences</TabsTrigger>}
                </TabsList>

                {/* Training Tab */}
                <TabsContent value="training" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Training Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Programme</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead>Certificate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(trainings || []).map((t: any) => (
                                        <TableRow key={t.id || Math.random()}>
                                            <TableCell>{t.date ? new Date(t.date).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{t.programme || t.programmeCode}</div>
                                                <div className="text-xs text-muted-foreground">{t.programmeName}</div>
                                            </TableCell>
                                            <TableCell>{t.type || t.sessionType}</TableCell>
                                            <TableCell>
                                                <Badge variant={t.result === 'pass' ? 'default' : t.result === 'fail' ? 'destructive' : 'secondary'}>
                                                    {t.result ? t.result.toUpperCase() : 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {t.certificateUrl ? (
                                                     <Button variant="ghost" size="sm" onClick={() => window.open(t.certificateUrl, '_blank')}>
                                                        <FileText className="h-4 w-4 mr-1" /> {t.certificateNumber || 'View'}
                                                     </Button>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!trainings || trainings.length === 0) && (
                                        <TableRow><TableCell colSpan={5} className="text-center">No training history found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Checks Tab */}
                <TabsContent value="checks" className="mt-4">
                    <Card>
                         <CardHeader><CardTitle>Proficiency Checks</CardTitle></CardHeader>
                         <CardContent>
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead>Date</TableHead>
                                         <TableHead>Profile</TableHead>
                                         <TableHead>Result</TableHead>
                                         <TableHead>Assessor</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {(checks || []).map((c: any) => (
                                         <TableRow key={c.id}>
                                             <TableCell>{c.date ? new Date(c.date).toLocaleDateString() : '-'}</TableCell>
                                             <TableCell>
                                                 <div className="font-medium">{c.profile || c.profileCode}</div>
                                                 <div className="text-xs text-muted-foreground">{c.profileName}</div>
                                             </TableCell>
                                             <TableCell>
                                                <Badge variant={c.result === 'pass' ? 'default' : 'destructive'}>
                                                    {c.result ? c.result.toUpperCase() : 'UNKNOWN'}
                                                </Badge>
                                             </TableCell>
                                             <TableCell>{c.assessor}</TableCell>
                                         </TableRow>
                                     ))}
                                     {(!checks || checks.length === 0) && (
                                         <TableRow><TableCell colSpan={4} className="text-center">No checks found.</TableCell></TableRow>
                                     )}
                                 </TableBody>
                             </Table>
                         </CardContent>
                    </Card>
                </TabsContent>

                {/* Competence Status Tab */}
                <TabsContent value="competence" className="mt-4">
                     <Card>
                         <CardHeader><CardTitle>Current Competence Status</CardTitle></CardHeader>
                         <CardContent>
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead>Competence</TableHead>
                                         <TableHead>Type</TableHead>
                                         <TableHead>Acquired Date</TableHead>
                                         <TableHead>Valid Until</TableHead>
                                         <TableHead>Status</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {(competences || []).map((c: any, idx: number) => (
                                         <TableRow key={idx}>
                                             <TableCell>
                                                 <div className="font-medium">{c.standardCode || c.code}</div>
                                                 <div className="text-xs text-muted-foreground">{c.standardName || c.name}</div>
                                             </TableCell>
                                             <TableCell><Badge variant="outline">{c.type || 'Combined'}</Badge></TableCell>
                                             <TableCell>{c.acquiredDate ? new Date(c.acquiredDate).toLocaleDateString() : '-'}</TableCell>
                                             <TableCell>{c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'Permanent'}</TableCell>
                                             <TableCell>
                                                <Badge variant={c.status === 'valid' ? 'default' : c.status === 'expired' ? 'destructive' : 'secondary'}>
                                                    {c.status ? c.status.toUpperCase().replace('_', ' ') : 'UNKNOWN'}
                                                </Badge>
                                             </TableCell>
                                         </TableRow>
                                     ))}
                                 </TableBody>
                             </Table>
                         </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}
