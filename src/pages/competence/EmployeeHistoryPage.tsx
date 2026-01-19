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
import { TraineeCompetenceTab } from "@/components/competence/TraineeCompetenceTab"
import { CertificatesList } from "@/components/certificates/CertificatesList"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RemedialPlansList } from "@/components/remedial/RemedialPlansList"
import { RemedialPlanWizard } from "@/components/remedial/RemedialPlanWizard"

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

    const { employee, competences, trainings, checks, absences, documents } = history

    const suspendedCompetences = competences?.filter((c: any) => c.status === 'suspended') || []
    const hasSuspended = suspendedCompetences.length > 0


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

            {hasSuspended && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Competence Suspended</AlertTitle>
                    <AlertDescription>
                        This employee has {suspendedCompetences.length} suspended competence(s). 
                        Remedial training is required before they can be reinstated.
                        {suspendedCompetences.map((c: any) => (
                             <div key={c.id} className="mt-1 text-sm font-semibold">
                                - {c.standardCode}: {c.suspensionReason}
                             </div>
                        ))}
                    </AlertDescription>
                </Alert>
            )}

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

            <Tabs defaultValue="competence" className="w-full">
                <TabsList>
                    <TabsTrigger value="competence">Competence Status</TabsTrigger>
                    <TabsTrigger value="training">Training History</TabsTrigger>
                    <TabsTrigger value="checks">Proficiency Checks</TabsTrigger>
                    <TabsTrigger value="certificates">Certificates</TabsTrigger>
                    <TabsTrigger value="documents">Signed Protocols</TabsTrigger>
                    {absences && absences.length > 0 && <TabsTrigger value="absences">Absences</TabsTrigger>}
                    <TabsTrigger value="remedial">Remedial Plans</TabsTrigger>
                </TabsList>
                
                <TabsContent value="remedial" className="mt-4">
                     <RemedialPlansList organisationId={employee?.organisationId || ''} /> 
                     {/* Pass filtered to user via backend or filter frontend? 
                         Logic says RemedialPlansList takes organisationId but we might want to filter by user. 
                         Let's just re-use the component but maybe add a userId prop to filter in backend? 
                         Ah, RemedialService.getPlansForTrainee exists. 
                         I should probably update RemedialPlansList to support userId prop or create a new RemedialPlansTable for single user.
                         Actually, let's create a specialized use for this page or update RemedialPlansList to accept userId.
                         I'll update RemedialPlansList to accept userId optional prop.
                     */}
                </TabsContent>
                
                {/* Certificates Tab */}
                <TabsContent value="certificates" className="mt-4">
                    <CertificatesList userId={id || ''} />
                </TabsContent>

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
                                            <TableCell>{t.type || t.sessionType || 'Training'}</TableCell>
                                            <TableCell>
                                                <Badge variant={t.result === 'pass' ? 'default' : t.result === 'fail' ? 'destructive' : 'secondary'}>
                                                    {t.result ? t.result.toUpperCase() : 'N/A'}
                                                </Badge>
                                                {t.status === 'No Show' && <Badge variant="destructive" className="ml-2">NO SHOW</Badge>}
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
                                                <Badge variant={c.result === 'pass' ? 'default' : c.result === 'fail' ? 'destructive' : 'secondary'}>
                                                    {c.result ? c.result.toUpperCase() : 'UNKNOWN'}
                                                </Badge>
                                             </TableCell>
                                             <TableCell>{c.assessor}</TableCell>
                                             <TableCell>
                                                 {c.result === 'fail' && (
                                                     <RemedialPlanWizard 
                                                         traineeId={id || ''}
                                                         standardId={c.standardId || ''} // We need standardId from check
                                                         failedCheckId={c.id}
                                                         trigger={<Button size="sm" variant="outline">Create Remedial Plan</Button>}
                                                     />
                                                 )}
                                             </TableCell>
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
                     <TraineeCompetenceTab userId={id || ''} />
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="mt-4">
                     <Card>
                         <CardHeader><CardTitle>Signed Protocols</CardTitle></CardHeader>
                         <CardContent>
                             <Table>
                                 <TableHeader>
                                     <TableRow>
                                         <TableHead>Date</TableHead>
                                         <TableHead>Document</TableHead>
                                         <TableHead>Action</TableHead>
                                     </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                     {(documents || []).map((d: any) => (
                                         <TableRow key={d.id}>
                                             <TableCell>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</TableCell>
                                             <TableCell>
                                                 <div className="font-medium">{d.document_type === 'protocol' ? 'Evaluation Protocol' : d.document_type}</div>
                                                 <div className="text-xs text-muted-foreground">{d.file_path}</div>
                                             </TableCell>
                                             <TableCell>
                                                 {d.file_path ? (
                                                     <Button variant="ghost" size="sm" onClick={() => window.open(d.file_path, '_blank')}>
                                                        <FileText className="h-4 w-4 mr-1" /> View/Download
                                                     </Button>
                                                 ) : '-'}
                                             </TableCell>
                                         </TableRow>
                                     ))}
                                     {(!documents || documents.length === 0) && (
                                         <TableRow><TableCell colSpan={3} className="text-center">No signed protocols found.</TableCell></TableRow>
                                     )}
                                 </TableBody>
                             </Table>
                         </CardContent>
                    </Card>
                </TabsContent>

                {/* Absences Tab */}
                {absences && absences.length > 0 && (
                <TabsContent value="absences" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Absences</CardTitle></CardHeader>
                    <CardContent>
                      <Table>
                         <TableHeader>
                            <TableRow>
                               <TableHead>Start Date</TableHead>
                               <TableHead>End Date</TableHead>
                               <TableHead>Type</TableHead>
                               <TableHead>Reason</TableHead>
                            </TableRow>
                         </TableHeader>
                         <TableBody>
                            {absences.map((a: any) => (
                               <TableRow key={a.id}>
                                  <TableCell>{new Date(a.date_start).toLocaleDateString()}</TableCell>
                                  <TableCell>{new Date(a.date_end).toLocaleDateString()}</TableCell>
                                  <TableCell><Badge variant="outline">{a.absence_type}</Badge></TableCell>
                                  <TableCell>{a.reason || '-'}</TableCell>
                               </TableRow>
                            ))}
                         </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
