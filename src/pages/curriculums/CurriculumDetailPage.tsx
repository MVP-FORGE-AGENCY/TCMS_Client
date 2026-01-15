import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { curriculums, materialActions } from "@/lib/api"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Download, Check, Archive, FileText, Pencil, BookOpen, ClipboardCheck, Clock, Users } from "lucide-react"

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

export default function CurriculumDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploadData, setUploadData] = useState({ title: "", type: "pdf" })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const canManage = user?.role && ["admin", "training_manager"].includes(user.role)
    const canUpload = user?.role && ["admin", "training_manager", "instructor"].includes(user.role)

    const { data: curriculum, isLoading } = useQuery({
        queryKey: ["curriculum", id],
        queryFn: () => curriculums.get(id!),
        enabled: !!id,
    })

    const { data: materialsData } = useQuery({
        queryKey: ["curriculum-materials", id],
        queryFn: () => curriculums.getMaterials(id!),
        enabled: !!id,
    })

    const uploadMutation = useMutation({
        mutationFn: async () => {
            // First create material record and get its ID
            const response = await curriculums.uploadMaterial(id!, {
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
            queryClient.invalidateQueries({ queryKey: ["curriculum-materials", id] })
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
            queryClient.invalidateQueries({ queryKey: ["curriculum-materials", id] })
            toast.success("Material approved")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Approval failed")
        },
    })

    const archiveMutation = useMutation({
        mutationFn: (materialId: string) => materialActions.archive(materialId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["curriculum-materials", id] })
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
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!curriculum?.data) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Curriculum not found</p>
                <Button variant="link" onClick={() => navigate("/curriculums")}>Back to Curriculums</Button>
            </div>
        )
    }

    const data = curriculum.data
    const modules = data.modules || []

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
                <Button variant="ghost" size="icon" onClick={() => navigate("/curriculums")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{data.code}</h1>
                        <Badge variant="outline">{data.type}</Badge>
                    </div>
                    <p className="text-muted-foreground">{data.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Placeholder for history if needed */}
                    {/* <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
                        <History className="mr-2 h-4 w-4" />
                        History
                    </Button> */}
                    {canManage && (
                        <Button onClick={() => navigate(`/curriculums/${id}/edit`)} size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Validity & Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Validity</span>
                                    <span className="font-bold">{data.validityMonths || "-"} months</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={data.isActive ? "default" : "secondary"}>
                                        {data.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Modules</span>
                                    <span className="font-bold">{modules.length}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Regulatory Tags</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.standardTags && data.standardTags.length > 0 ? (
                                        data.standardTags.map((tag: string) => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm">No tags defined</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {data.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{data.description}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="modules" className="space-y-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Training Modules</CardTitle>
                            <CardDescription>
                                Access training and assessment modules in sequence
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {modules.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No modules defined
                                    </div>
                                ) : (
                                    modules.map((module: any, index: number) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                                                module.type === 'instruction' 
                                                    ? "border-l-4 border-l-blue-500 bg-blue-50/50" 
                                                    : "border-l-4 border-l-violet-500 bg-violet-50/50"
                                            }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {module.type === 'instruction' ? (
                                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <ClipboardCheck className="h-4 w-4 text-violet-500" />
                                                    )}
                                                    <span className="font-medium">{module.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {module.type === 'instruction' ? 'Training' : 'Check'}
                                                    </Badge>
                                                </div>
                                                <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {module.durationHours || 0}h
                                                    </span>
                                                    {module.deliveryMethod && (
                                                        <span>{module.deliveryMethod}</span>
                                                    )}
                                                    {module.requiredAssessors && (
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {module.requiredAssessors} assessor(s)
                                                        </span>
                                                    )}
                                                </div>
                                                {module.description && (
                                                     <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="materials" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Training Materials</h2>
                        {canUpload && (
                            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Material
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Upload Training Material</DialogTitle>
                                        <DialogDescription>
                                            Upload a new version of training material
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Title</Label>
                                            <Input
                                                className="col-span-3"
                                                value={uploadData.title}
                                                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                                placeholder="Material title"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">Type</Label>
                                            <Select
                                                value={uploadData.type}
                                                onValueChange={(v) => setUploadData({ ...uploadData, type: v })}
                                            >
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="procedure">Procedure</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label className="text-right">File</Label>
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
                                            {uploadMutation.isPending ? "Uploading..." : "Upload"}
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
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-center">Version</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead>Uploaded By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!materialsData || materialsData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No materials uploaded yet
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
                                                        onClick={() => handleDownload(m.id)}
                                                        title="Download"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {canManage && m.status === "draft" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => approveMutation.mutate(m.id)}
                                                            disabled={approveMutation.isPending}
                                                            title="Approve"
                                                        >
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                    {canManage && m.status === "approved" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => archiveMutation.mutate(m.id)}
                                                            disabled={archiveMutation.isPending}
                                                            title="Archive"
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
            </Tabs>
        </div>
    )
}
