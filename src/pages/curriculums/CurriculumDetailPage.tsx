import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
    ArrowLeft, 
    Clock, 
    MoreVertical, 
    Shield, 
    Upload
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import type { Curriculum } from "@/types"
import { 
    Table, 
    TableBody, 
    TableCell,
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { useTranslation } from "react-i18next"
import { useBreadcrumb } from "@/context/BreadcrumbContext"
import ScheduleCheckModal from "@/components/checks/ScheduleCheckModal"
import { toast } from "sonner"

// Types
interface Material {
    id: string
    title: string
    type: 'pdf' | 'video' | 'presentation' | 'other'
    url: string
    moduleId?: string // Optional link to specific module
    uploadedBy: string
    uploadDate: string
    size: string
}

interface TraineeProgress {
    id: string
    name: string
    userId: string // Added to match usage
    email: string
    campaignName: string // Added to match usage
    eligibleStandards: { id: string, code: string }[] // Added to match usage
    status: 'ready_for_check' | 'check_scheduled' | 'completed' | 'ready' // Updated to match usage
    completedModules: number
    totalModules: number
}

export default function CurriculumDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { setLabel } = useBreadcrumb()
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [scheduleInitialTraineeId, setScheduleInitialTraineeId] = useState<string | undefined>()

    const { data: curriculum, isLoading } = useQuery<Curriculum>({
        queryKey: ['curriculum', id],
        queryFn: async () => {
            const res = await api.get(`/curriculums/${id}`)
            return res.data.data  // Backend returns { data: curriculum }
        }
    })

    // Update breadcrumb when curriculum loads
    useEffect(() => {
        if (curriculum?.code) {
            setLabel(id!, curriculum.code)
        } else if (curriculum?.name) {
            setLabel(id!, curriculum.name)
        }
        
        return () => {
             // Cleanup if needed
        }
    }, [curriculum, id, setLabel])


    // Mock data for materials and trainees (replace with real API later)
    const [materials] = useState<Material[]>([])
    const [trainees] = useState<TraineeProgress[]>([])

    const openScheduleCheck = (traineeId: string) => {
        setScheduleInitialTraineeId(traineeId)
        setIsScheduleModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-[200px]" />
                        <Skeleton className="h-4 w-[300px]" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full max-w-md" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[200px]" />
                    <Skeleton className="h-[200px]" />
                </div>
            </div>
        )
    }
    if (!curriculum) return <div>{t('errors.notFound')}</div>

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate("/curriculums")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{curriculum.code}</h1>
                        <Badge variant="outline">{curriculum.type}</Badge>
                    </div>
                    <p className="text-muted-foreground">{curriculum.name}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/curriculums/${id}/edit`)}>
                        {t('common.edit')}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="More options">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive">
                                {t('common.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">{t('curriculums.tabs.overview')}</TabsTrigger>
                    <TabsTrigger value="modules">{t('curriculums.tabs.modules')}</TabsTrigger>
                    <TabsTrigger value="materials">{t('curriculums.tabs.materials')}</TabsTrigger>
                    <TabsTrigger value="trainees">{t('curriculums.tabs.trainees')}</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('curriculums.sections.validityStatus')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">{t('curriculums.validityLabel')}</span>
                                    <span className="font-medium">{curriculum.validityMonths} {t('common.months')}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">{t('curriculums.statusLabel')}</span>
                                    <Badge variant={curriculum.isActive ? "default" : "secondary"}>
                                        {curriculum.isActive ? t('common.active') : t('common.inactive')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">{t('curriculums.totalModules')}</span>
                                    <span className="font-medium">{curriculum.modules?.length ?? 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('curriculums.sections.regulatoryTags')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {curriculum.standardTags && curriculum.standardTags.length > 0 ? (
                                        curriculum.standardTags.map(tag => (
                                            <Badge key={tag} variant="secondary">
                                                <Shield className="mr-1 h-3 w-3" />
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm">{t('curriculums.noTags')}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('curriculums.sections.description')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {curriculum.description || 'No description provided.'}
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Modules Tab */}
                <TabsContent value="modules" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('curriculums.sections.trainingModules')}</CardTitle>
                            <CardDescription>
                                {t('curriculums.modulesDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative space-y-4">
                                {/* Vertical Timeline Line */}
                                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-muted" />

                                {curriculum.modules && curriculum.modules.length > 0 ? (
                                    curriculum.modules.map((module, index) => (
                                        <div key={module.id} className="relative flex gap-4 bg-card p-4 rounded-lg border">
                                            <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm">
                                                <span className="text-sm font-bold">{index + 1}</span>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{module.name}</h4>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Badge variant={module.type === 'instruction' ? 'default' : 'secondary'} className={module.type === 'assessment' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30' : ''}>
                                                                {module.type === 'instruction' ? 'Training' : 'Assessment'}
                                                            </Badge>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {module.durationHours}h
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{module.description}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground pl-12">
                                        {t('curriculums.noModules')}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t('curriculums.tabs.materials')}</CardTitle>
                            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {t('curriculums.materials.upload')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('curriculums.materials.uploadTitle')}</DialogTitle>
                                        <DialogDescription>{t('curriculums.materials.uploadDesc')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>{t('curriculums.materials.title')}</Label>
                                            <Input placeholder="e.g., Module 1 Workbook" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('curriculums.materials.type')}</Label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="presentation">Presentation</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('curriculums.materials.module')}</Label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('curriculums.materials.allModules')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">{t('curriculums.materials.allModules')}</SelectItem>
                                                    {curriculum.modules?.map(m => (
                                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('curriculums.materials.file')}</Label>
                                            <Input type="file" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>{t('common.cancel')}</Button>
                                        <Button>{t('curriculums.materials.upload')}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {materials.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('curriculums.noMaterials')}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('curriculums.table.title')}</TableHead>
                                            <TableHead>{t('curriculums.table.module')}</TableHead>
                                            <TableHead>{t('curriculums.table.type')}</TableHead>
                                            <TableHead>{t('curriculums.table.uploadedBy')}</TableHead>
                                            <TableHead>{t('curriculums.table.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* Render materials here */}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Trainees Tab - Monitoring progress */}
                <TabsContent value="trainees">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('curriculums.sections.readyForCheck')}</CardTitle>
                            </CardHeader>
                            {/* Re-implementing trainee table logic with dummy data structure if api doesn't return */}
                            <CardContent>
                                {trainees.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        {t('curriculums.noTrainees')}
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('curriculums.table.trainee')}</TableHead>
                                                <TableHead>{t('curriculums.table.campaign')}</TableHead>
                                                <TableHead>{t('curriculums.table.eligibleStandards')}</TableHead>
                                                <TableHead>{t('curriculums.table.status')}</TableHead>
                                                <TableHead className="text-right">{t('curriculums.table.actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trainees.map((trainee) => (
                                                <TableRow key={trainee.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{trainee.name}</span>
                                                            <span className="text-xs text-muted-foreground">{trainee.email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{trainee.campaignName}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {trainee.eligibleStandards.map((std: any) => (
                                                                <Badge key={std.id} variant="outline" className="text-xs">
                                                                    {std.code}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            trainee.status === 'ready_for_check' ? 'bg-green-500' :
                                                            trainee.status === 'check_scheduled' ? 'bg-blue-500' : 'bg-gray-500'
                                                        }>
                                                            {trainee.status === 'ready_for_check' ? t('curriculums.trainees.ready') :
                                                            trainee.status === 'check_scheduled' ? t('curriculums.trainees.scheduled') : t('curriculums.trainees.completed')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {trainee.status === 'ready_for_check' && (
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => openScheduleCheck(trainee.userId)}
                                                            >
                                                                {t('curriculums.trainees.scheduleCheck')}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <ScheduleCheckModal 
                isOpen={isScheduleModalOpen} 
                onClose={() => setIsScheduleModalOpen(false)}
                onSuccess={() => {
                    toast.success("Proficiency check scheduled successfully")
                    setIsScheduleModalOpen(false)
                    // If we had a query for trainees we would invalidate it here
                }}
                preselectedCandidates={scheduleInitialTraineeId ? [scheduleInitialTraineeId] : []}
            />
        </div>
    )
}
