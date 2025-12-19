import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { standards, materialActions } from "@/lib/api"
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
import { ArrowLeft, Upload, Download, Check, Archive, FileText } from "lucide-react"

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
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [isUploadOpen, setIsUploadOpen] = useState(false)
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

    const uploadMutation = useMutation({
        mutationFn: async () => {
            // First get signed upload URL
            const response = await standards.uploadMaterial(id!, {
                title: uploadData.title,
                type: uploadData.type,
                fileSize: selectedFile?.size,
                mimeType: selectedFile?.type,
            })
            
            // Then upload to signed URL if available
            if (response.uploadUrl && selectedFile) {
                const uploadResponse = await fetch(response.uploadUrl, {
                    method: "PUT",
                    body: selectedFile,
                    headers: { "Content-Type": selectedFile.type },
                })
                if (!uploadResponse.ok) {
                    throw new Error(`File upload failed: ${uploadResponse.statusText}`)
                }
            } else if (!response.uploadUrl) {
                console.warn("No upload URL returned - storage may not be configured")
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
            toast.error(error?.response?.data?.error?.message || "Upload failed")
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
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
                <Button variant="ghost" size="icon" onClick={() => navigate("/standards")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{standard.code}</h1>
                        <Badge variant={standard.isActive ? "default" : "secondary"}>
                            {standard.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">v{standard.revision}</Badge>
                    </div>
                    <p className="text-muted-foreground">{standard.name}</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="materials">Materials</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Validity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {standard.validityMonths || "-"} months
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Theory Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {standard.hasTheory ? (
                                    <div className="text-2xl font-bold text-green-600">
                                        {standard.theoryPassScore || 70}% to pass
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground">Not required</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Practical Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {standard.hasPractical ? (
                                    <div className="text-2xl font-bold text-blue-600">
                                        {standard.practicalPassScore || 70}% to pass
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground">Not required</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {standard.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>{standard.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {standard.objectives && standard.objectives.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Learning Objectives</CardTitle>
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

                <TabsContent value="sessions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Sessions</CardTitle>
                            <CardDescription>
                                Training sessions linked to this standard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Sessions list will be displayed here when programmes are linked to this standard.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
