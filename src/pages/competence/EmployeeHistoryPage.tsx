import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, FileText } from "lucide-react"
import { TraineeCompetenceTab } from "@/components/competence/TraineeCompetenceTab"
import { CertificatesList } from "@/components/certificates/CertificatesList"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RemedialPlansList } from "@/components/remedial/RemedialPlansList"
import { RemedialPlanWizard } from "@/components/remedial/RemedialPlanWizard"

import { useBreadcrumb } from "@/context/BreadcrumbContext"

export default function EmployeeHistoryPage() {
    const { id } = useParams()
    const { t } = useTranslation()
    const { setLabel } = useBreadcrumb()
    const navigate = useNavigate()
    const [history, setHistory] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [resultFilter, setResultFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [campaignFilter, setCampaignFilter] = useState('all')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownloadPersonnelFile = async () => {
        if (!id) return;
        setIsGenerating(true);
        try {
            const res = await api.post(`/reports/employees/${id}/training-file`, {
                includeAbsences: true
            });
            if (res.data.url) {
                window.open(res.data.url, '_blank');
            }
        } catch (error) {
            console.error("Failed to generate report", error);
            // Use toast here if available, or alert
            alert("Failed to generate Personnel File");
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (history?.employee && id) {
            setLabel(id, history.employee.fullName)
        }
    }, [history, id, setLabel])


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

    const uniqueCampaigns = Array.from(new Set(trainings?.map((t: any) => t.campaignName).filter(Boolean)))

    const filteredTrainings = (trainings || []).filter((t: any) => {
        const matchesSearch = (t.moduleName || t.programmeCode || t.programmeName || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesResult = resultFilter === 'all' || 
                              (resultFilter === 'pass' && t.result === 'pass') ||
                              (resultFilter === 'fail' && t.result === 'fail') ||
                              (resultFilter === 'absent' && t.attendance === 'absent')
        const matchesType = typeFilter === 'all' || t.type === typeFilter
        const matchesCampaign = campaignFilter === 'all' || t.campaignName === campaignFilter
        return matchesSearch && matchesResult && matchesType && matchesCampaign
    })


    return (
        <div className="space-y-6 max-w-[100vw] overflow-x-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{employee?.fullName}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm md:text-base">
                            <span>{employee?.email}</span>
                            <span className="hidden md:inline">•</span>
                            <Badge variant="outline">{employee?.departmentTag || t("personnel.history.noDept")}</Badge>
                            <span className="hidden md:inline">•</span>
                            <span>{employee?.role}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                     <Button variant="outline" onClick={handleDownloadPersonnelFile} disabled={isGenerating} className="w-full md:w-auto">
                        <FileText className="h-4 w-4 mr-2" />
                        {isGenerating ? t("personnel.history.generating") : t("personnel.history.downloadFile")}
                     </Button>
                </div>
            </div>

            {hasSuspended && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("personnel.history.suspendedAlert.title")}</AlertTitle>
                    <AlertDescription>
                        {t("personnel.history.suspendedAlert.description", { count: suspendedCompetences.length })}
                        {suspendedCompetences.map((c: any) => (
                             <div key={c.id} className="mt-1 text-sm font-semibold">
                                - {c.standardCode}: {c.suspensionReason}
                             </div>
                        ))}
                    </AlertDescription>
                </Alert>
            )}

            {/* Overview Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{t("personnel.history.activeCompetences")}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">
                             {competences?.filter((c: any) => c.status === 'valid' || c.status === 'expiring_soon').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{t("personnel.history.expired")}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">
                             {competences?.filter((c: any) => c.status === 'expired').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{t("personnel.history.totalTrainings")}</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             {trainings?.length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="competence" className="w-full">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList className="w-full justify-start h-auto flex-wrap md:flex-nowrap md:w-auto">
                        <TabsTrigger value="competence" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.competence")}</TabsTrigger>
                        <TabsTrigger value="training" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.training")}</TabsTrigger>
                        <TabsTrigger value="checks" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.checks")}</TabsTrigger>
                        <TabsTrigger value="certificates" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.certificates")}</TabsTrigger>
                        <TabsTrigger value="documents" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.documents")}</TabsTrigger>
                        {absences && absences.length > 0 && <TabsTrigger value="absences" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.absences")}</TabsTrigger>}
                        <TabsTrigger value="remedial" className="flex-grow md:flex-grow-0">{t("personnel.history.tabs.remedial")}</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="remedial" className="mt-4">
                     <RemedialPlansList organisationId={employee?.organisationId || ''} /> 
                </TabsContent>
                
                {/* Certificates Tab */}
                <TabsContent value="certificates" className="mt-4">
                    <CertificatesList 
                        userId={id || ''} 
                        availableCampaigns={(trainings || []).filter((t: any) => t.campaignName && (t.result === 'pass' || t.status === 'COMPLETED'))} // Loose check for passed
                        availableChecks={(checks || []).filter((c: any) => c.result === 'pass')}
                    />
                </TabsContent>

                {/* Training Tab */}
                <TabsContent value="training" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Training Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {/* Filters */}
                             <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-4">
                                <div className="w-full md:w-[200px]">
                                    <Input 
                                        placeholder="Search module..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:flex gap-4 w-full md:w-auto">
                                    <Select value={resultFilter} onValueChange={setResultFilter}>
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Result" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Results</SelectItem>
                                            <SelectItem value="pass">Pass</SelectItem>
                                            <SelectItem value="fail">Fail</SelectItem>
                                            <SelectItem value="absent">Absent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-full md:w-[150px]">
                                            <SelectValue placeholder="Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="theory">Theory</SelectItem>
                                            <SelectItem value="practical">Practical</SelectItem>
                                            <SelectItem value="combined">Combined</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {uniqueCampaigns.length > 0 && (
                                         <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                                            <SelectTrigger className="w-full md:w-[180px]">
                                                <SelectValue placeholder="Campaign" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Campaigns</SelectItem>
                                                {uniqueCampaigns.map((c: any) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <Button variant="outline" onClick={() => {
                                    setSearchTerm('')
                                    setResultFilter('all')
                                    setTypeFilter('all')
                                    setCampaignFilter('all')
                                }} className="md:ml-auto w-full md:w-auto">
                                    Reset
                                </Button>
                             </div>

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Module</TableHead>
                                            <TableHead>Campaign</TableHead>
                                            <TableHead>Result</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTrainings.map((t: any) => (
                                            <TableRow key={t.id || Math.random()}>
                                                <TableCell className="whitespace-nowrap">{t.date ? new Date(t.date).toLocaleDateString() : '-'}</TableCell>
                                                <TableCell className="capitalize">{t.type || 'Training'}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{t.moduleName || t.programmeCode || t.programmeName || '-'}</div>
                                                    {/* Show detailed name if we showed code above */}
                                                    {(t.moduleName || t.programmeCode) && t.programmeName && t.programmeName !== t.moduleName && (
                                                        <div className="text-xs text-muted-foreground">{t.programmeName}</div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {t.campaignName || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        t.attendance === 'absent' || t.status === 'No Show' || t.status === 'Absent'
                                                            ? "bg-orange-500 hover:bg-orange-600"
                                                            : t.result === 'pass'
                                                            ? "bg-green-500 hover:bg-green-600"
                                                            : t.result === 'fail'
                                                            ? "bg-red-500 hover:bg-red-600"
                                                            : "bg-gray-500 hover:bg-gray-600"
                                                    }>
                                                        {t.attendance === 'absent' || t.status === 'No Show' || t.status === 'Absent' 
                                                            ? 'ABSENT' 
                                                            : (t.result ? t.result.toUpperCase() : 'PLANNED')}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredTrainings.length === 0 && (
                                            <TableRow><TableCell colSpan={5} className="text-center">No matching training history found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Checks Tab */}
                <TabsContent value="checks" className="mt-4">
                    <Card>
                         <CardHeader><CardTitle>Proficiency Checks</CardTitle></CardHeader>
                         <CardContent>
                             <div className="overflow-x-auto">
                                 <Table>
                                     <TableHeader>
                                         <TableRow>
                                             <TableHead>Date</TableHead>
                                             <TableHead>Profile</TableHead>
                                             <TableHead>Result</TableHead>
                                             <TableHead>Assessor</TableHead>
                                             <TableHead>Actions</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                     <TableBody>
                                         {(checks || []).map((c: any) => (
                                             <TableRow key={c.id}>
                                                 <TableCell className="whitespace-nowrap">{c.date ? new Date(c.date).toLocaleDateString() : '-'}</TableCell>
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
                                             <TableRow><TableCell colSpan={5} className="text-center">No checks found.</TableCell></TableRow>
                                         )}
                                     </TableBody>
                                 </Table>
                             </div>
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
                             <div className="overflow-x-auto">
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
                                                 <TableCell className="whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</TableCell>
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
                             </div>
                         </CardContent>
                    </Card>
                </TabsContent>

                {/* Absences Tab */}
                {absences && absences.length > 0 && (
                <TabsContent value="absences" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle>Absences</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
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
                                      <TableCell className="whitespace-nowrap">{new Date(a.date_start).toLocaleDateString()}</TableCell>
                                      <TableCell className="whitespace-nowrap">{new Date(a.date_end).toLocaleDateString()}</TableCell>
                                      <TableCell><Badge variant="outline">{a.absence_type}</Badge></TableCell>
                                      <TableCell>{a.reason || '-'}</TableCell>
                                   </TableRow>
                                ))}
                             </TableBody>
                          </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
