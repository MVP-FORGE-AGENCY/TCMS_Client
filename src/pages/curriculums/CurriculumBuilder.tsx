/**
 * Curriculum Builder
 * Drag-and-drop interface for building curriculum modules
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
    ArrowLeft, Save, Plus, Trash2, 
    BookOpen, ClipboardCheck, Clock, Users, Settings2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { 
    CurriculumCreate, CurriculumModule, CurriculumModuleCreate, 
    CurriculumType, ModuleType, DeliveryMethod 
} from '@/types'
import { cn } from '@/lib/utils'

export default function CurriculumBuilder() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEditing = Boolean(id && id !== 'new')

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form state
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [type, setType] = useState<CurriculumType>('recurrent')
    const [validityMonths, setValidityMonths] = useState<number | undefined>(12)
    const [standardTags, setStandardTags] = useState<string[]>([])
    const [standardTagInput, setStandardTagInput] = useState('')
    const [description, setDescription] = useState('')
    const [modules, setModules] = useState<CurriculumModuleCreate[]>([])

    // Module dialog
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
    const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null)
    const [moduleForm, setModuleForm] = useState<CurriculumModuleCreate>({
        type: 'instruction',
        name: '',
        durationHours: 2,
        deliveryMethod: 'classroom'
    })

    // Load existing curriculum
    useEffect(() => {
        if (isEditing) {
            loadCurriculum()
        }
    }, [id])

    const loadCurriculum = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/curriculums/${id}`)
            const curriculum = response.data.data
            
            setCode(curriculum.code)
            setName(curriculum.name)
            setType(curriculum.type)
            setValidityMonths(curriculum.validityMonths)
            setStandardTags(curriculum.standardTags || [])
            setDescription(curriculum.description || '')
            setModules(curriculum.modules?.map((m: CurriculumModule) => ({
                type: m.type,
                name: m.name,
                description: m.description,
                durationHours: m.durationHours,
                sequence: m.sequence,
                deliveryMethod: m.deliveryMethod,
                gradingElements: m.gradingElements,
                passCriteria: m.passCriteria,
                requiredAssessors: m.requiredAssessors
            })) || [])
        } catch (error) {
            console.error('Failed to load curriculum:', error)
            toast.error(t('curriculums.loadError', 'Failed to load curriculum'))
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!code || !name) {
            toast.error(t('validation.required', 'Code and name are required'))
            return
        }

        try {
            setSaving(true)

            // Add sequence to modules
            const modulesWithSequence = modules.map((m, i) => ({
                ...m,
                sequence: i + 1
            }))

            if (isEditing) {
                await api.put(`/curriculums/${id}`, {
                    name,
                    type,
                    validityMonths,
                    standardTags,
                    description
                })
                await api.put(`/curriculums/${id}/modules`, { modules: modulesWithSequence })
                toast.success(t('curriculums.updated', 'Curriculum updated'))
            } else {
                const payload: CurriculumCreate = {
                    code,
                    name,
                    type,
                    validityMonths,
                    standardTags,
                    description,
                    modules: modulesWithSequence
                }
                await api.post('/curriculums', payload)
                toast.success(t('curriculums.created', 'Curriculum created'))
            }

            navigate('/curriculums')
        } catch (error: any) {
            console.error('Failed to save curriculum:', error)
            const message = error.response?.data?.error?.message || t('errors.saveError', 'Failed to save')
            toast.error(message)
        } finally {
            setSaving(false)
        }
    }

    const addStandardTag = () => {
        if (standardTagInput.trim() && !standardTags.includes(standardTagInput.trim())) {
            setStandardTags([...standardTags, standardTagInput.trim().toUpperCase()])
            setStandardTagInput('')
        }
    }

    const removeStandardTag = (tag: string) => {
        setStandardTags(standardTags.filter(t => t !== tag))
    }

    const openModuleDialog = (index?: number) => {
        if (index !== undefined) {
            setEditingModuleIndex(index)
            setModuleForm(modules[index])
        } else {
            setEditingModuleIndex(null)
            setModuleForm({
                type: 'instruction',
                name: '',
                durationHours: 2,
                deliveryMethod: 'classroom'
            })
        }
        setModuleDialogOpen(true)
    }

    const saveModule = () => {
        if (!moduleForm.name) {
            toast.error(t('validation.required', 'Module name is required'))
            return
        }

        if (editingModuleIndex !== null) {
            const updated = [...modules]
            updated[editingModuleIndex] = moduleForm
            setModules(updated)
        } else {
            setModules([...modules, moduleForm])
        }

        setModuleDialogOpen(false)
    }

    const deleteModule = (index: number) => {
        setModules(modules.filter((_, i) => i !== index))
    }

    const moveModule = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= modules.length) return
        
        const updated = [...modules]
        const temp = updated[index]
        updated[index] = updated[newIndex]
        updated[newIndex] = temp
        setModules(updated)
    }

    const totalHours = modules.reduce((sum, m) => sum + (m.durationHours || 0), 0)
    const instructionCount = modules.filter(m => m.type === 'instruction').length
    const assessmentCount = modules.filter(m => m.type === 'assessment').length

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/curriculums')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEditing ? t('curriculums.editCurriculum', 'Edit Curriculum') : t('curriculums.createCurriculum', 'Create Curriculum')}
                        </h1>
                        <p className="text-muted-foreground">
                            {t('curriculums.builderSubtitle', 'Define training and assessment modules.')}
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Basic Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('curriculums.basicInfo', 'Basic Information')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">{t('curriculums.code', 'Code')}</Label>
                                <Input 
                                    id="code" 
                                    value={code} 
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    disabled={isEditing}
                                    placeholder="e.g., A320-REC-2024"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">{t('curriculums.name', 'Name')}</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., A320 Recurrent Training"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">{t('curriculums.type', 'Type')}</Label>
                                <Select value={type} onValueChange={(v) => setType(v as CurriculumType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="initial">{t('curriculums.types.initial', 'Initial')}</SelectItem>
                                        <SelectItem value="recurrent">{t('curriculums.types.recurrent', 'Recurrent')}</SelectItem>
                                        <SelectItem value="refresher">{t('curriculums.types.refresher', 'Refresher')}</SelectItem>
                                        <SelectItem value="conversion">{t('curriculums.types.conversion', 'Conversion')}</SelectItem>
                                        <SelectItem value="differences">{t('curriculums.types.differences', 'Differences')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validity">{t('curriculums.validity', 'Validity (Months)')}</Label>
                                <Select 
                                    value={validityMonths?.toString() || ''} 
                                    onValueChange={(v) => setValidityMonths(parseInt(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('curriculums.selectValidity', 'Select validity')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="6">6 {t('common.months', 'months')}</SelectItem>
                                        <SelectItem value="12">12 {t('common.months', 'months')}</SelectItem>
                                        <SelectItem value="24">24 {t('common.months', 'months')}</SelectItem>
                                        <SelectItem value="36">36 {t('common.months', 'months')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t('curriculums.description', 'Description')}</Label>
                                <Textarea 
                                    id="description" 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Standard Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('curriculums.standardTags', 'Regulatory Tags')}</CardTitle>
                            <CardDescription>
                                {t('curriculums.standardTagsDesc', 'Link to regulatory standards (e.g., EASA-LVO)')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input 
                                    value={standardTagInput}
                                    onChange={(e) => setStandardTagInput(e.target.value)}
                                    placeholder="e.g., EASA-ORO-FC-230"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStandardTag())}
                                />
                                <Button variant="outline" onClick={addStandardTag}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {standardTags.map((tag) => (
                                    <Badge 
                                        key={tag} 
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => removeStandardTag(tag)}
                                    >
                                        {tag} ×
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('curriculums.summary', 'Summary')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('curriculums.totalModules', 'Total Modules')}</span>
                                    <span className="font-medium">{modules.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        {t('curriculums.instruction', 'Training')}
                                    </span>
                                    <span className="font-medium">{instructionCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-violet-500" />
                                        {t('curriculums.assessment', 'Checks')}
                                    </span>
                                    <span className="font-medium">{assessmentCount}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('curriculums.totalHours', 'Total Hours')}</span>
                                    <span className="font-medium">{totalHours}h</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Modules Builder */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{t('curriculums.modules', 'Modules')}</CardTitle>
                                <CardDescription>
                                    {t('curriculums.modulesDesc', 'Drag to reorder. Blue = Training, Purple = Assessment.')}
                                </CardDescription>
                            </div>
                            <Button onClick={() => openModuleDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t('curriculums.addModule', 'Add Module')}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {modules.length === 0 ? (
                                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                                    <div className="text-center">
                                        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {t('curriculums.noModules', 'No modules yet. Add your first module.')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {modules.map((module, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                                                module.type === 'instruction' 
                                                    ? "border-l-4 border-l-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20" 
                                                    : "border-l-4 border-l-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                                            )}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6"
                                                    onClick={() => moveModule(index, 'up')}
                                                    disabled={index === 0}
                                                >
                                                    ↑
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6"
                                                    onClick={() => moveModule(index, 'down')}
                                                    disabled={index === modules.length - 1}
                                                >
                                                    ↓
                                                </Button>
                                            </div>

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
                                            </div>

                                            <div className="flex gap-1">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8"
                                                    onClick={() => openModuleDialog(index)}
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => deleteModule(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Module Dialog */}
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingModuleIndex !== null 
                                ? t('curriculums.editModule', 'Edit Module') 
                                : t('curriculums.addModule', 'Add Module')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('curriculums.moduleType', 'Module Type')}</Label>
                            <Select 
                                value={moduleForm.type} 
                                onValueChange={(v) => setModuleForm({ ...moduleForm, type: v as ModuleType })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="instruction">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-blue-500" />
                                            {t('curriculums.instruction', 'Training')}
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="assessment">
                                        <div className="flex items-center gap-2">
                                            <ClipboardCheck className="h-4 w-4 text-violet-500" />
                                            {t('curriculums.assessment', 'Check/Assessment')}
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('curriculums.moduleName', 'Module Name')}</Label>
                            <Input 
                                value={moduleForm.name}
                                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                                placeholder="e.g., Ground School Theory"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('curriculums.duration', 'Duration (Hours)')}</Label>
                            <Input 
                                type="number"
                                value={moduleForm.durationHours || ''}
                                onChange={(e) => setModuleForm({ ...moduleForm, durationHours: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        {moduleForm.type === 'instruction' && (
                            <div className="space-y-2">
                                <Label>{t('curriculums.deliveryMethod', 'Delivery Method')}</Label>
                                <Select 
                                    value={moduleForm.deliveryMethod || 'classroom'} 
                                    onValueChange={(v) => setModuleForm({ ...moduleForm, deliveryMethod: v as DeliveryMethod })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="classroom">{t('curriculums.delivery.classroom', 'Classroom')}</SelectItem>
                                        <SelectItem value="elearning">{t('curriculums.delivery.elearning', 'E-Learning')}</SelectItem>
                                        <SelectItem value="practical">{t('curriculums.delivery.practical', 'Practical')}</SelectItem>
                                        <SelectItem value="simulator">{t('curriculums.delivery.simulator', 'Simulator')}</SelectItem>
                                        <SelectItem value="self_study">{t('curriculums.delivery.selfStudy', 'Self Study')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {moduleForm.type === 'assessment' && (
                            <div className="space-y-2">
                                <Label>{t('curriculums.requiredAssessors', 'Required Assessors')}</Label>
                                <Select 
                                    value={moduleForm.requiredAssessors?.toString() || '1'} 
                                    onValueChange={(v) => setModuleForm({ ...moduleForm, requiredAssessors: parseInt(v) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Assessor</SelectItem>
                                        <SelectItem value="2">2 Assessors</SelectItem>
                                        <SelectItem value="3">3 Assessors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-4 pt-2 border-t">
                            <Label className="text-base">{t('curriculums.gradingCriteria', 'Grading Criteria')}</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{t('curriculums.theoryPassScore', 'Theory Pass Score (%)')}</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={moduleForm.passCriteria?.theoryPassScore || ''}
                                        onChange={(e) => setModuleForm({ 
                                            ...moduleForm, 
                                            passCriteria: { 
                                                ...moduleForm.passCriteria, 
                                                theoryPassScore: parseFloat(e.target.value) || undefined
                                            } 
                                        })}
                                        placeholder="e.g., 75"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('curriculums.practicalPassScore', 'Practical Pass Score (%)')}</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={moduleForm.passCriteria?.practicalPassScore || ''}
                                        onChange={(e) => setModuleForm({ 
                                            ...moduleForm, 
                                            passCriteria: { 
                                                ...moduleForm.passCriteria, 
                                                practicalPassScore: parseFloat(e.target.value) || undefined
                                            } 
                                        })}
                                        placeholder="e.g., 80"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('curriculums.moduleDescription', 'Description (Optional)')}</Label>
                            <Textarea 
                                value={moduleForm.description || ''}
                                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button onClick={saveModule}>
                            {t('common.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
