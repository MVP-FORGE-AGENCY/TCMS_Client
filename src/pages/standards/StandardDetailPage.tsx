import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { standards, materialActions, sessions } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Download, Check, Archive, FileText, History, Pencil, ClipboardCheck } from "lucide-react"
import { EditStandardDialog } from "@/components/standards/EditStandardDialog"
import { RevisionHistoryModal } from "@/components/standards/RevisionHistoryModal"
import { RevisionBadge } from "@/components/standards/RevisionBadge"
import CheckConfigurationEditor from "@/components/standards/CheckConfigurationEditor"

interface Material {
    id: string
    title: string
    type: string
    version: number
    status: string
    storagePath?: string
    uploadedByName?: string
    approvedByName?: string
    approvedAt?: string
    createdAt: string
}

export default function StandardDetailPage() {
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [uploadData, setUploadData] = useState({ title: "", type: "pdf" })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const canManage = user?.role && ["admin", "training_manager"].includes(user.role)
    const canUpload = user?.role && ["admin", "training_manager", "instructor"].includes(user.role)

    const { data: standard, isLoading } = useQuery({
        queryKey: ["standard", id],
        queryFn: () => standards.get(id!),
        enabled: !!id,
    })

    const { data: materialsData } = useQuery({
        queryKey: ["standard-materials", id],
        queryFn: () => standards.getMaterials(id!),
        enabled: !!id,
    })

    const { data: sessionsData, isLoading: isSessionsLoading } = useQuery({
        queryKey: ["standard-sessions", id],
        queryFn: () => sessions.list({ standardId: id!, limit: 100 }),
        enabled: !!id,
    })

    const uploadMutation = useMutation({
        mutationFn: async () => {
            // First create material record and get its ID
            const response = await standards.uploadMaterial(id!, {
                title: uploadData.title,
                type: uploadData.type,
                fileSize: selectedFile?.size,
                mimeType: selectedFile?.type,
            })
            
            // Then upload file via proxy endpoint
            if (response.material?.id && selectedFile) {
                const formData = new FormData()
                formData.append('file', selectedFile)
                
                const token = localStorage.getItem('token')
                const uploadResponse = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/materials/${response.material.id}/upload`,
                    {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
                
                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json().catch(() => ({}))
                    console.error("Upload failed:", uploadResponse.status, errorData)
                    throw new Error(errorData?.error?.message || `File upload failed: ${uploadResponse.statusText}`)
                }
            }
            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standard-materials", id] })
            setIsUploadOpen(false)
            setUploadData({ title: "", type: "pdf" })
            setSelectedFile(null)
            toast.success("Material uploaded successfully")
        },
        onError: (error: any) => {
            toast.error(error?.message || error?.response?.data?.error?.message || "Upload failed")
        },
    })

    const approveMutation = useMutation({
        mutationFn: (materialId: string) => materialActions.approve(materialId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standard-materials", id] })
            toast.success("Material approved")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Approval failed")
        },
    })

    const archiveMutation = useMutation({
        mutationFn: (materialId: string) => materialActions.archive(materialId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standard-materials", id] })
            toast.success("Material archived")
        },
    })

    const handleDownload = async (materialId: string) => {
        try {
            const { url } = await materialActions.getDownloadUrl(materialId)
            window.open(url, "_blank")
        } catch (error) {
            toast.error("Failed to get download URL")
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 mt-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-8 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-[100px]" />
                        <Skeleton className="h-9 w-[100px]" />
                    </div>
                </div>
                <div className="flex gap-4 border-b pb-2">
                    <Skeleton className="h-6 w-[100px]" />
                    <Skeleton className="h-6 w-[100px]" />
                    <Skeleton className="h-6 w-[100px]" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-[120px]" />
                    <Skeleton className="h-[120px]" />
                    <Skeleton className="h-[120px]" />
                </div>
            </div>
        )
    }

    if (!standard) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Standard not found</p>
                <Button variant="link" onClick={() => navigate("/standards")}>Back to Standards</Button>
            </div>
        )
    }

    const statusColor = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-600"
            case "draft": return "bg-yellow-600"
            case "archived": return "bg-gray-500"
            default: return "bg-gray-500"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate("/standards")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{standard.code}</h1>
                        <Badge variant={standard.isActive ? "default" : "secondary"}>
                            {standard.isActive ? t("standards.active", "Active") : t("standards.inactive", "Inactive")}
                        </Badge>
                        <RevisionBadge 
                            revision={standard.revision} 
                            isLatest={standard.isLatestRevision} 
                        />
                    </div>
                    <p className="text-muted-foreground">{standard.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
                        <History className="mr-2 h-4 w-4" />
                        {t("standards.history", "History")}
                    </Button>
                    {canManage && (
                        <Button onClick={() => setIsEditOpen(true)} size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("standards.edit", "Edit")}
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">{t("standards.tabs.overview", "Overview")}</TabsTrigger>
                    <TabsTrigger value="materials">{t("standards.tabs.materials", "Materials")}</TabsTrigger>
                    <TabsTrigger value="sessions">{t("standards.tabs.sessions", "Sessions")}</TabsTrigger>
                    {canManage && <TabsTrigger value="checks">{t("standards.tabs.checks", "Check Configuration")}</TabsTrigger>}
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t("standards.validity", "Validity")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {standard.validityMonths || "-"} {t("common.months", "months")}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t("checks.theoryAssessment", "Theory Assessment")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {standard.hasTheory ? (
                                    <div className="text-2xl font-bold text-green-600">
                                        {standard.theoryPassScore || 70}% {t("standards.toPass", "to pass")}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground">{t("standards.notRequired", "Not required")}</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">{t("checks.practicalAssessment", "Practical Assessment")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {standard.hasPractical ? (
                                    <div className="text-2xl font-bold text-blue-600">
                                        {standard.practicalPassScore || 70}% {t("standards.toPass", "to pass")}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground">{t("standards.notRequired", "Not required")}</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {standard.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("standards.description", "Description")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{standard.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {standard.objectives && standard.objectives.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("standards.learningObjectives", "Learning Objectives")}</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <ul className="list-disc list-inside space-y-1">
                                    {standard.objectives.map((obj: string, i: number) => (
                                        <li key={i}>{obj}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="materials" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{t("standards.materials.title", "Training Materials")}</h2>
                        {canUpload && (
                            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Upload className="mr-2 h-4 w-4" />
                                        {t("standards.materials.upload", "Upload Material")}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t("standards.materials.uploadTitle", "Upload Training Material")}</DialogTitle>
                                        <DialogDescription>
                                            {t("standards.materials.uploadDesc", "Upload a new version of training material")}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">{t("common.title", "Title")}</Label>
                                            <Input
                                                className="col-span-3"
                                                value={uploadData.title}
                                                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                                placeholder={t("standards.materials.titlePlaceholder", "Material title")}
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">{t("common.type", "Type")}</Label>
                                            <Select
                                                value={uploadData.type}
                                                onValueChange={(v) => setUploadData({ ...uploadData, type: v })}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">{t("standards.materials.types.pdf", "PDF Document")}</SelectItem>
                                                    <SelectItem value="video">{t("standards.materials.types.video", "Video")}</SelectItem>
                                                    <SelectItem value="procedure">{t("standards.materials.types.procedure", "Procedure")}</SelectItem>
                                                    <SelectItem value="other">{t("standards.materials.types.other", "Other")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">{t("common.file", "File")}</Label>
                                            <Input
                                                type="file"
                                                className="col-span-3"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => uploadMutation.mutate()}
                                            disabled={uploadMutation.isPending || !uploadData.title || !selectedFile}
                                        >
                                            {uploadMutation.isPending ? t("common.uploading", "Uploading...") : t("common.upload", "Upload")}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("common.title", "Title")}</TableHead>
                                    <TableHead>{t("common.type", "Type")}</TableHead>
                                    <TableHead className="text-center">{t("common.version", "Version")}</TableHead>
                                    <TableHead className="text-center">{t("common.status", "Status")}</TableHead>
                                    <TableHead>{t("standards.materials.uploadedBy", "Uploaded By")}</TableHead>
                                    <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!materialsData || materialsData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {t("standards.materials.empty", "No materials uploaded yet")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    materialsData.map((m: Material) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                    {m.title}
                                                </div>
                                            </TableCell>
                                            <TableCell className="uppercase text-xs">{m.type}</TableCell>
                                            <TableCell className="text-center">v{m.version}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={statusColor(m.status)}>
                                                    {m.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{m.uploadedByName || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Download"
                                                        onClick={() => handleDownload(m.id)}
                                                        title={t("common.download", "Download")}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {canManage && m.status === "draft" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Approve"
                                                            onClick={() => approveMutation.mutate(m.id)}
                                                            disabled={approveMutation.isPending}
                                                            title={t("common.approve", "Approve")}
                                                        >
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    {canManage && m.status === "approved" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Archive"
                                                            onClick={() => archiveMutation.mutate(m.id)}
                                                            disabled={archiveMutation.isPending}
                                                            title={t("common.archive", "Archive")}
                                                        >
                                                            <Archive className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="sessions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("standards.sessions.title", "Related Sessions")}</CardTitle>
                            <CardDescription>
                                {t("standards.sessions.subtitle", "Training sessions linked to this standard")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t("standards.sessions.campaign", "Campaign")}</TableHead>
                                            <TableHead>{t("common.dates", "Dates")}</TableHead>
                                            <TableHead>{t("common.type", "Type")}</TableHead>
                                            <TableHead>{t("common.location", "Location")}</TableHead>
                                            <TableHead>{t("common.status", "Status")}</TableHead>
                                            <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isSessionsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    {t("common.loading", "Loading sessions...")}
                                                </TableCell>
                                            </TableRow>
                                        ) : !sessionsData?.data || sessionsData.data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    {t("standards.sessions.empty", "No sessions found for this standard")}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            sessionsData.data.map((session: any) => (
                                                <TableRow key={session.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{session.campaign?.name || session.programme?.name || "-"}</div>
                                                        <div className="text-xs text-muted-foreground">{session.campaign?.code || session.programme?.code}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {new Date(session.dateStart).toLocaleDateString()}
                                                            {session.dateEnd && ` - ${new Date(session.dateEnd).toLocaleDateString()}`}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="capitalize">
                                                        {session.sessionType ? t(`standards.sessions.types.${session.sessionType}`, session.sessionType) as string : "-"}
                                                    </TableCell>
                                                    <TableCell>{session.location}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            session.status === 'completed' ? 'default' :
                                                            session.status === 'cancelled' ? 'destructive' :
                                                            session.status === 'in_progress' ? 'secondary' : 'outline'
                                                        }>
                                                            {t(`standards.sessions.status.${session.status}`, session.status) as string}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/sessions/${session.id}`)}>
                                                            {t("common.view", "View")}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {canManage && (
                    <TabsContent value="checks" className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">{t("standards.checks.title", "Proficiency Check Configuration")}</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {t("standards.checks.description", "Define the items that will be assessed during proficiency checks for this standard. These items will be available when scheduling checks.")}
                        </p>
                        <CheckConfigurationEditor standardId={id!} />
                    </TabsContent>
                )}
            </Tabs>

            {standard && (
                <>
                    <EditStandardDialog 
                        standard={standard} 
                        open={isEditOpen} 
                        onOpenChange={setIsEditOpen} 
                    />
                    <RevisionHistoryModal 
                        standardId={standard.id} 
                        open={isHistoryOpen} 
                        onOpenChange={setIsHistoryOpen} 
                    />
                </>
            )}
        </div>
    )
}
