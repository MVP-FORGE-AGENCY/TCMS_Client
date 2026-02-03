/**
 * Curriculum Builder
 * Drag-and-drop interface for building curriculum modules
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
    ArrowLeft, Save, Plus, Trash2, 
    BookOpen, ClipboardCheck, Clock, Users, Settings2,
    Check, ChevronsUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { api, standards } from '@/lib/api'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { StandardCreationDialog } from '@/components/standards/StandardCreationDialog'
import type { 
    CurriculumCreate, CurriculumModule, CurriculumModuleCreate, 
    CurriculumType, DeliveryMethod 
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

    const [standardTags, setStandardTags] = useState<string[]>([])
    const [description, setDescription] = useState('')
    const [modules, setModules] = useState<CurriculumModuleCreate[]>([])

    // Standard combobox state
    const [openCombobox, setOpenCombobox] = useState(false)
    const [availableStandards, setAvailableStandards] = useState<any[]>([])
    const [creationDialogOpen, setCreationDialogOpen] = useState(false)
    const [creationDialogCode, setCreationDialogCode] = useState('')
    const [searchValue, setSearchValue] = useState('')

    // Module dialog
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
    const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null)
    const [moduleForm, setModuleForm] = useState<CurriculumModuleCreate>({
        type: 'instruction',
        name: '',
        durationHours: 2,
        deliveryMethod: 'classroom',
        requiresTheory: false,
        requiresPractical: false,
        allowsNotScored: true,
        requiresFinalAssessment: false
    })

    // Grading type helpers
    const getGradingType = (mod: CurriculumModuleCreate): string => {
        if (mod.requiresTheory && mod.requiresPractical) return 'both'
        if (mod.requiresTheory) return 'theory'
        if (mod.requiresPractical) return 'practical'
        return 'none'
    }

    const handleGradingTypeChange = (type: string) => {
        setModuleForm({
            ...moduleForm,
            requiresTheory: type === 'theory' || type === 'both',
            requiresPractical: type === 'practical' || type === 'both',
            allowsNotScored: type === 'none',
            // Set default pass scores or clear them based on type
            theoryPassScore: (type === 'theory' || type === 'both') ? (moduleForm.theoryPassScore || 70) : undefined,
            practicalPassScore: (type === 'practical' || type === 'both') ? (moduleForm.practicalPassScore || 80) : undefined
        })
    }

    // Load existing curriculum and standards
    useEffect(() => {
        loadStandards()
        if (isEditing) {
            loadCurriculum()
        }
    }, [id])

    const loadStandards = async () => {
        try {
            const data = await standards.list({ isActive: true })
            setAvailableStandards(data || [])
        } catch (error) {
            console.error('Failed to load standards:', error)
        }
    }

    const loadCurriculum = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/curriculums/${id}`)
            const curriculum = response.data.data
            
            setCode(curriculum.code)
            setName(curriculum.name)
            setType(curriculum.type)
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
                requiredAssessors: m.requiredAssessors,
                // Map explicit grading config with fallback to passCriteria
                requiresTheory: (m as any).requiresTheory ?? !!m.passCriteria?.theoryPassScore,
                requiresPractical: (m as any).requiresPractical ?? !!m.passCriteria?.practicalPassScore,
                allowsNotScored: (m as any).allowsNotScored,
                theoryPassScore: (m as any).theoryPassScore ?? m.passCriteria?.theoryPassScore,
                practicalPassScore: (m as any).practicalPassScore ?? m.passCriteria?.practicalPassScore,
                requiresFinalAssessment: (m as any).requiresFinalAssessment
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

        if (standardTags.length === 0) {
            toast.error(t('validation.standardRequired', 'At least one standard must be selected'))
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

    const addStandardTag = (tag: string) => {
        if (tag && !standardTags.includes(tag)) {
            setStandardTags([...standardTags, tag])
        }
        setOpenCombobox(false)
        setSearchValue('')
    }

    const handleCreateStandard = (std: any) => {
        // Add new standard to the available list so it appears in suggestions
        setAvailableStandards(prev => [...prev, std])
        // Also add it to the selected tags
        addStandardTag(std.code)
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
                deliveryMethod: 'classroom',
                requiresTheory: false,
                requiresPractical: false,
                allowsNotScored: true,
                requiresFinalAssessment: false
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
                                    placeholder={t('curriculums.placeholderCode', 'e.g., A320-REC-2024')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">{t('curriculums.name', 'Name')}</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('curriculums.placeholderName', 'e.g., A320 Recurrent Training')}
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
                            <div className="flex flex-col gap-2">
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between"
                                        >
                                            {t('curriculums.selectStandard', 'Select standard...')}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <div className="p-2 border-b">
                                            <Input
                                                placeholder={t('curriculums.searchStandards', 'Search or type new...')}
                                                value={searchValue}
                                                onChange={(e) => setSearchValue(e.target.value)}
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {/* Create New Option - Always at top when typing */}
                                            {searchValue && (
                                                <div
                                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 border-l-transparent hover:border-l-primary transition-colors"
                                                    onClick={() => {
                                                        setCreationDialogCode(searchValue)
                                                        setCreationDialogOpen(true)
                                                        setOpenCombobox(false)
                                                        setSearchValue('')
                                                    }}
                                                >
                                                    <Plus className="h-4 w-4 text-primary" />
                                                    <span className="font-medium text-primary">{t('curriculums.createStandard', { val: searchValue })}</span>
                                                </div>
                                            )}
                                            
                                            {/* Existing Standards */}
                                            {availableStandards
                                                .filter(std => 
                                                    !searchValue || 
                                                    std.code.toLowerCase().includes(searchValue.toLowerCase()) || 
                                                    std.name.toLowerCase().includes(searchValue.toLowerCase())
                                                )
                                                .map((std) => (
                                                    <div
                                                        key={std.id}
                                                        className="flex items-center gap-2 px-3 py-2 cursor-pointer border-l-2 border-l-transparent hover:border-l-primary transition-colors"
                                                        onClick={() => {
                                                            addStandardTag(std.code)
                                                            setSearchValue('')
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "h-4 w-4",
                                                                standardTags.includes(std.code) ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">{std.code}</span>
                                                            <span className="text-xs text-muted-foreground">{std.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            
                                            {availableStandards.length === 0 && !searchValue && (
                                                <div className="py-4 text-center text-sm text-muted-foreground">
                                                    {t('curriculums.noStandardsFound', 'Type to search or create a new standard.')}
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
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
                                                    {module.requiresFinalAssessment ? (
                                                        <ClipboardCheck className="h-4 w-4 text-violet-500" />
                                                    ) : (
                                                        <BookOpen className="h-4 w-4 text-blue-500" />
                                                    )}
                                                    <span className="font-medium">{module.name}</span>
                                                    {module.requiresFinalAssessment && (
                                                        <Badge variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                                                            Assessment
                                                        </Badge>
                                                    )}
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
                                                            {module.requiredAssessors} {t('checks.assessors', 'assessors')}
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
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">


                        <div className="space-y-2">
                            <Label>{t('curriculums.moduleName', 'Module Name')}</Label>
                            <Input 
                                value={moduleForm.name}
                                onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                                placeholder={t('curriculums.placeholderModuleName', 'e.g., Ground School Theory')}
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

                        <div className="space-y-3">
                            <Label>{t('curriculums.assessmentStrategy', 'Assessment Strategy')}</Label>
                            <RadioGroup
                                value={moduleForm.requiresFinalAssessment ? "dedicated" : "integrated"}
                                onValueChange={(v) => setModuleForm({ ...moduleForm, requiresFinalAssessment: v === "dedicated" })}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem value="integrated" id="integrated" className="peer sr-only" />
                                    <Label
                                        htmlFor="integrated"
                                        className="cursor-pointer flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 transition-all duration-200"
                                    >
                                        <BookOpen className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <div className="font-semibold">{t('curriculums.integratedGrading', 'Integrated Grading')}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {t('curriculums.integratedGradingDesc', 'Grading occurs during the last training session. Best for shorter modules.')}
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="dedicated" id="dedicated" className="peer sr-only" />
                                    <Label
                                        htmlFor="dedicated"
                                        className="cursor-pointer flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-transparent p-4 hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 transition-all duration-200"
                                    >
                                        <ClipboardCheck className="mb-3 h-6 w-6" />
                                        <div className="text-center">
                                            <div className="font-semibold">{t('curriculums.dedicatedAssessment', 'Dedicated Assessment')}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {t('curriculums.dedicatedAssessmentDesc', 'Adds an extra session specifically for assessment. Best for long modules.')}
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

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



                        <div className="space-y-4 pt-2 border-t">
                            <Label className="text-base">{t('curriculums.gradingCriteria', 'Grading Criteria')}</Label>
                            
                            {/* Grading Type Selector */}
                            <div className="space-y-2">
                                <Label>{t('curriculums.gradingType', 'Grading Type')}</Label>
                                <Select 
                                    value={getGradingType(moduleForm)} 
                                    onValueChange={handleGradingTypeChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                {t('curriculums.grading.none', 'No Scoring (Instruction Only)')}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="theory">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-blue-500" />
                                                {t('curriculums.grading.theory', 'Theory Only')}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="practical">
                                            <div className="flex items-center gap-2">
                                                <ClipboardCheck className="h-4 w-4 text-violet-500" />
                                                {t('curriculums.grading.practical', 'Practical Only')}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="both">
                                            <div className="flex items-center gap-2">
                                                <ClipboardCheck className="h-4 w-4 text-green-500" />
                                                {t('curriculums.grading.both', 'Both Theory & Practical')}
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* Conditional Pass Score Inputs */}
                            {(moduleForm.requiresTheory || moduleForm.requiresPractical) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {moduleForm.requiresTheory && (
                                        <div className="space-y-2">
                                            <Label>{t('curriculums.theoryPassScore', 'Theory Pass Score (%)')}</Label>
                                            <Input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={moduleForm.theoryPassScore || ''}
                                                onChange={(e) => setModuleForm({ 
                                                    ...moduleForm, 
                                                    theoryPassScore: parseFloat(e.target.value) || undefined
                                                })}
                                                placeholder={t('curriculums.placeholderPassScore', 'e.g., 70')}
                                            />
                                        </div>
                                    )}
                                    {moduleForm.requiresPractical && (
                                        <div className="space-y-2">
                                            <Label>{t('curriculums.practicalPassScore', 'Practical Pass Score (%)')}</Label>
                                            <Input 
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={moduleForm.practicalPassScore || ''}
                                                onChange={(e) => setModuleForm({ 
                                                    ...moduleForm, 
                                                    practicalPassScore: parseFloat(e.target.value) || undefined
                                                })}
                                                placeholder={t('curriculums.placeholderPassScore', 'e.g., 80')}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
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
            {/* Standard Creation Dialog */}
            <StandardCreationDialog 
                isOpen={creationDialogOpen}
                onClose={() => setCreationDialogOpen(false)}
                onSuccess={handleCreateStandard}
                initialCode={creationDialogCode}
            />
        </div>
    )
}
