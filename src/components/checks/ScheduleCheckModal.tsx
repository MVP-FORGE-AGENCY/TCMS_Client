import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { checks, api } from '@/lib/api'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'


import { 
    AlertTriangle, 
    Users, 
    Calendar, 
    MapPin,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    CheckCircle
} from 'lucide-react'

interface ScheduleCheckModalProps {
    isOpen: boolean
    onClose: () => void
    preselectedCandidates?: string[]
    preselectedStandardId?: string
    eligibleStandards?: Array<{ id: string; code: string; name: string }>
    onSuccess?: () => void
}

interface Candidate {
    id: string
    fullName: string
    email: string
}

interface Standard {
    id: string
    code: string
    name: string
    checkDefinition?: {
        items: { id: string; text: string; is_mandatory: boolean }[]
        requiredAssessors: number
        intervalMonths: number
    }
    hasTheory?: boolean
    theoryPassScore?: number
    hasPractical?: boolean
    practicalPassScore?: number
}

interface Assessor {
    id: string
    fullName: string
    email: string
    role: string
}

interface Conflict {
    type: 'blocking' | 'warning'
    assessorId?: string
    assessorName?: string
    candidateId?: string
    candidateName?: string
    message: string
}

export function ScheduleCheckModal({ 
    isOpen, 
    onClose, 
    preselectedCandidates = [],
    preselectedStandardId,
    eligibleStandards = [],
    onSuccess
}: ScheduleCheckModalProps) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    
    const [step, setStep] = useState(1)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [selectedStandardId, setSelectedStandardId] = useState<string>('')
    const [checkType, setCheckType] = useState<'full_renewal' | 'partial'>('full_renewal')
    const [dateStart, setDateStart] = useState('')
    const [location, setLocation] = useState('')
    const [selectedAssessorIds, setSelectedAssessorIds] = useState<string[]>([])
    const [conflicts, setConflicts] = useState<Conflict[]>([])
    
    // State for candidate selector
    const [candidateSearch, setCandidateSearch] = useState('')

    // Fetch candidates when preselectedCandidates changes
    useEffect(() => {
        if (preselectedCandidates.length > 0) {
            loadCandidates(preselectedCandidates)
        } else {
            setCandidates([]) // Reset if no preselected
        }
    }, [preselectedCandidates, isOpen])

    // Auto-select standard if preselected
    useEffect(() => {
        if (preselectedStandardId) {
            setSelectedStandardId(preselectedStandardId)
        } else {
             setSelectedStandardId('')
        }
    }, [preselectedStandardId, isOpen])

    // Fetch all eligible trainees for the picker
    const { data: eligibleTrainees } = useQuery({
        queryKey: ['eligible-trainees-modal'],
        queryFn: async () => {
             const res = await checks.getEligibleTrainees();
             return res.data as any[];
        },
        enabled: isOpen && step === 1
    })

    // Use passed-in eligible standards if provided, otherwise fetch suitable standards
    const { data: fetchedStandards } = useQuery({
        queryKey: ['standards-for-checks', candidates.map(c => c.id).join(',')],
        queryFn: async () => {
            // If candidates selected, fetch only eligible standards
            if (candidates.length > 0) {
                const res = await checks.getEligibleStandards(candidates.map(c => c.id))
                return (res.data || []) as Standard[]
            }
            // Otherwise show all active standards
            const res = await api.get('/standards', { params: { isActive: true } })
            return (res.data.data || res.data) as Standard[]
        },
        enabled: isOpen && eligibleStandards.length === 0
    })

    // Use eligible standards if provided via props, otherwise fall back to fetched standards
    const availableStandards: Standard[] = eligibleStandards.length > 0 
        ? eligibleStandards.map(s => ({ ...s, checkDefinition: undefined }))
        : (fetchedStandards || [])

    const selectedStandard = availableStandards.find(s => s.id === selectedStandardId)

    // Filter standards by preselected if provided
    const filteredStandards = preselectedStandardId 
        ? availableStandards.filter(s => s.id === preselectedStandardId)
        : availableStandards

    // Fetch available assessors
    const { data: assessors } = useQuery({
        queryKey: ['assessors'],
        queryFn: async () => {
            const res = await api.get('/employees', { 
                params: { 
                    role: 'instructor,assessor,training_manager,admin',
                    isActive: true 
                } 
            })
            return res.data.data as Assessor[]
        },
        enabled: isOpen && step >= 4
    })

    const loadCandidates = async (ids: string[]) => {
        try {
            const res = await api.get('/employees', { params: { ids: ids.join(',') } })
            const data = res.data.data || res.data
            setCandidates(data.filter((e: any) => ids.includes(e.id)).map((e: any) => ({
                id: e.id,
                fullName: e.fullName || e.full_name,
                email: e.email
            })))
        } catch (error) {
            console.error('Failed to load candidates:', error)
        }
    }

    const toggleCandidate = (trainee: any) => {
        const exists = candidates.find(c => c.id === trainee.id)
        if (exists) {
            setCandidates(prev => prev.filter(c => c.id !== trainee.id))
        } else {
            setCandidates(prev => [...prev, {
                id: trainee.id,
                fullName: trainee.fullName,
                email: trainee.email
            }])
        }
    }

    const createCheckMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStandard) return

            const promises = candidates.map(candidate => 
                checks.create({
                    standardId: selectedStandardId,
                    checkType,
                    candidateIds: [candidate.id], // One check per candidate
                    assessorIds: selectedAssessorIds,
                    dateStart,
                    location: location || undefined,
                    passCriteria: {
                        required: [
                            ...(selectedStandard.hasTheory ? ['theory'] : []),
                            ...(selectedStandard.hasPractical ? ['practical'] : [])
                        ],
                        practical: (selectedStandard.hasPractical ? selectedStandard.practicalPassScore || 70 : 'pass') as any,
                        theory: (selectedStandard.hasTheory ? selectedStandard.theoryPassScore || 70 : undefined) as any
                    }
                })
            )

            return Promise.all(promises)
        },
        onSuccess: (results) => {
            const count = Array.isArray(results) ? results.length : 1
            toast.success(t('checks.scheduledCount', { count }))
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['proficiency-checks'] })
            queryClient.invalidateQueries({ queryKey: ['eligible-trainees'] })
            queryClient.invalidateQueries({ queryKey: ['getting-started-stats'] })
            
            if (onSuccess) onSuccess()
            handleClose()
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Failed to schedule checks'
            toast.error(message)
        }
    })

    const handleClose = () => {
        setStep(1)
        setCandidates([])
        setSelectedStandardId('')
        setCheckType('full_renewal')
        setDateStart('')
        setLocation('')
        setSelectedAssessorIds([])
        setConflicts([])
        setCandidateSearch('')
        onClose()
    }

    const toggleAssessor = (assessorId: string) => {
        setSelectedAssessorIds(prev => 
            prev.includes(assessorId)
                ? prev.filter(id => id !== assessorId)
                : [...prev, assessorId]
        )
    }

    const checkForConflicts = async () => {
        try {
            const res = await checks.checkConflicts({
                candidateIds: candidates.map(c => c.id),
                assessorIds: selectedAssessorIds,
                standardId: selectedStandardId,
                dateStart
            })

            const newConflicts: Conflict[] = []

            // blocking
            res.blocking?.forEach((b: any) => {
                const candidate = candidates.find(c => c.id === b.candidateId)
                newConflicts.push({
                    type: 'blocking',
                    candidateId: b.candidateId,
                    candidateName: candidate?.fullName || 'Unknown',
                    message: b.message
                })
            })

            // warnings
            res.warnings?.forEach((w: any) => {
                let msg = w.message
                let candidateName = w.candidateId ? candidates.find(c => c.id === w.candidateId)?.fullName : undefined
                let assessorName = w.assessorId ? assessors?.find(a => a.id === w.assessorId)?.fullName : undefined

                newConflicts.push({
                    type: 'warning',
                    candidateId: w.candidateId,
                    candidateName,
                    assessorId: w.assessorId,
                    assessorName,
                    message: msg
                })
            })

            setConflicts(newConflicts)
        } catch (err) {
            console.error('Conflict check failed', err)
        }
    }

    const handleNext = async () => {
        if (step === 4) {
            await checkForConflicts()
        }
        setStep(prev => Math.min(prev + 1, 5))
    }

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1))
    }

    const handleSubmit = () => {
        createCheckMutation.mutate()
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const hasBlockingConflicts = conflicts.some(c => c.type === 'blocking')

    const canProceed = () => {
        switch (step) {
            case 1: return candidates.length > 0
            case 2: return !!selectedStandardId
            case 3: return !!dateStart
            case 4: return selectedAssessorIds.length > 0
            case 5: return !hasBlockingConflicts
            default: return false
        }
    }

    // Filter eligible trainees by search
    const filteredTrainees = (eligibleTrainees || []).filter((trainee: any) => {
        if (!candidateSearch) return true
        const q = candidateSearch.toLowerCase()
        return (
            trainee.fullName?.toLowerCase().includes(q) ||
            trainee.email?.toLowerCase().includes(q)
        )
    })

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {t('checks.scheduleCheck')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('checks.scheduleCheckDesc')}
                    </DialogDescription>
                </DialogHeader>

                {/* Step indicators */}
                <div className="flex items-center justify-center gap-2 py-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div 
                            key={s}
                            className={`h-2 w-8 rounded-full transition-colors ${
                                s === step ? 'bg-primary' : 
                                s < step ? 'bg-primary/50' : 'bg-muted'
                            }`}
                        />
                    ))}
                </div>

                <div className="min-h-[300px] py-4">
                    {/* Step 1: Select Candidates */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-lg font-medium">
                                    <Users className="h-5 w-5" />
                                    {t('checks.step1')}
                                </div>
                                {candidates.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {candidates.length} {t('checks.selected')}
                                    </Badge>
                                )}
                            </div>

                            {/* Search input */}
                            <div className="relative">
                                <Input
                                    placeholder={t('checks.searchCandidates', 'Search candidates...')}
                                    value={candidateSearch}
                                    onChange={(e) => setCandidateSearch(e.target.value)}
                                    className="pl-9"
                                />
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Candidate list with checkboxes */}
                            <div className="space-y-1 max-h-[280px] overflow-y-auto border rounded-lg p-1">
                                {filteredTrainees.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        {candidateSearch ? t('common.noResults', 'No results found') : t('checks.noCandidatesAvailable', 'No eligible candidates')}
                                    </div>
                                ) : (
                                    filteredTrainees.map((trainee: any) => {
                                        const isSelected = candidates.some(c => c.id === trainee.id)
                                        return (
                                            <div 
                                                key={trainee.id}
                                                className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'border border-primary bg-primary/5' 
                                                        : 'hover:bg-muted/50 border border-transparent'
                                                }`}
                                                onClick={() => toggleCandidate(trainee)}
                                            >
                                                <Checkbox checked={isSelected} className="pointer-events-none" />
                                                <Avatar className="h-7 w-7">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(trainee.fullName || '')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-sm truncate">{trainee.fullName}</div>
                                                    <div className="text-xs text-muted-foreground truncate">{trainee.email}</div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Select all / deselect all */}
                            {filteredTrainees.length > 0 && (
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <button
                                        type="button"
                                        className="hover:text-primary underline transition-colors"
                                        onClick={() => {
                                            const allFilteredIds = filteredTrainees.map((tr: any) => tr.id)
                                            const allSelected = allFilteredIds.every((id: string) => candidates.some(c => c.id === id))
                                            if (allSelected) {
                                                // Deselect all filtered
                                                setCandidates(prev => prev.filter(c => !allFilteredIds.includes(c.id)))
                                            } else {
                                                // Select all filtered
                                                const newCandidates = filteredTrainees
                                                    .filter((tr: any) => !candidates.some(c => c.id === tr.id))
                                                    .map((tr: any) => ({ id: tr.id, fullName: tr.fullName, email: tr.email }))
                                                setCandidates(prev => [...prev, ...newCandidates])
                                            }
                                        }}
                                    >
                                        {filteredTrainees.every((tr: any) => candidates.some(c => c.id === tr.id))
                                            ? t('common.deselectAll', 'Deselect all')
                                            : t('common.selectAll', 'Select all')
                                        }
                                    </button>
                                    <span>{filteredTrainees.length} {t('checks.candidatesAvailable', 'available')}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Select Standard */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <CheckCircle className="h-5 w-5" />
                                {t('checks.step2')}
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('checks.standard')}</Label>
                                    <Select value={selectedStandardId} onValueChange={setSelectedStandardId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('checks.selectStandard')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredStandards?.map((std: Standard) => (
                                                <SelectItem key={std.id} value={std.id}>
                                                    <span className="font-mono text-xs mr-2">{std.code}</span>
                                                    {std.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('checks.checkType')}</Label>
                                    <Select value={checkType} onValueChange={(v) => setCheckType(v as 'full_renewal' | 'partial')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_renewal">
                                                {t('checks.fullRenewal')}
                                                <span className="text-xs text-muted-foreground ml-2">{t('checks.extendsValidity')}</span>
                                            </SelectItem>
                                            <SelectItem value="partial">
                                                {t('checks.partial')}
                                                <span className="text-xs text-muted-foreground ml-2">{t('checks.noExtendsValidity')}</span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Logistics & Configuration */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <Calendar className="h-5 w-5" />
                                {t('checks.step3')}
                            </div>

                            <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    {t('checks.passCriteria')}
                                    <Badge variant="outline" className="ml-auto font-normal text-xs">
                                        {t('checks.definedByStandard')}
                                    </Badge>
                                </h3>
                                
                                {selectedStandard ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center p-2 rounded bg-background border">
                                            <span className="text-muted-foreground">{t('checks.theoryAssessment')}</span>
                                            {selectedStandard.hasTheory ? (
                                                <span className="font-medium text-green-600">
                                                    {t('checks.required')} ({selectedStandard.theoryPassScore || 70}%)
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">{t('checks.notRequired')}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded bg-background border">
                                            <span className="text-muted-foreground">{t('checks.practicalAssessment')}</span>
                                            {selectedStandard.hasPractical ? (
                                                <span className="font-medium text-green-600">
                                                    {t('checks.required')} ({selectedStandard.practicalPassScore || 70}%)
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">{t('checks.notRequired')}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-sm italic">
                                        {t('checks.selectStandardPrompt')}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dateStart">{t('common.dateTime')}</Label>
                                <Input
                                    id="dateStart"
                                    type="datetime-local"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {t('common.location')}
                                </Label>
                                <Input
                                    id="location"
                                    placeholder={t('checks.locationPlaceholder')}
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Select Assessors */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <UserCheck className="h-5 w-5" />
                                {t('checks.step4')}
                            </div>
                            
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {assessors?.map(assessor => (
                                    <div 
                                        key={assessor.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedAssessorIds.includes(assessor.id) 
                                                ? 'border-primary bg-primary/5' 
                                                : 'hover:bg-muted/50'
                                        }`}
                                        onClick={() => toggleAssessor(assessor.id)}
                                    >
                                        <Checkbox checked={selectedAssessorIds.includes(assessor.id)} />
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {getInitials(assessor.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{assessor.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{assessor.email}</div>
                                        </div>
                                        <Badge variant="outline" className="ml-auto">
                                            {t(`roles.${assessor.role}`, assessor.role)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review & Confirm */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <CheckCircle className="h-5 w-5" />
                                {t('checks.step5')}
                            </div>

                            {/* Conflict warnings */}
                            {/* Conflict warnings */}
                            {/* Conflict warnings */}
                            {conflicts.length > 0 && (
                                <div className={`rounded-lg border p-4 space-y-3 ${hasBlockingConflicts ? 'border-red-500/50 bg-red-500/10' : 'border-amber-500/50 bg-amber-500/10'}`}>
                                    <div className={`flex items-center gap-2 font-bold ${hasBlockingConflicts ? 'text-red-600' : 'text-amber-600'}`}>
                                        <AlertTriangle className="h-5 w-5" />
                                        {hasBlockingConflicts 
                                            ? t('checks.blockingConflictsFound', 'Scheduling blocked due to conflicts') 
                                            : t('checks.warningsFound', 'Scheduling warnings')
                                        }
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        {conflicts.map((conflict, i) => (
                                            <div key={i} className={`flex flex-col gap-1 p-2 border rounded bg-background/50 ${
                                                conflict.type === 'blocking' ? 'border-red-200' : 'border-amber-200'
                                            }`}>
                                                <div className="font-semibold flex items-center gap-2">
                                                    {conflict.type === 'blocking' && <Badge variant="destructive" className="h-5 text-[10px]">BLOCK</Badge>}
                                                    {conflict.candidateName && <span>{t('checks.candidate')}: {conflict.candidateName}</span>}
                                                    {conflict.assessorName && <span> / {t('checks.assessor')}: {conflict.assessorName}</span>}
                                                </div>
                                                <div className="text-xs text-muted-foreground ml-1">
                                                    {conflict.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {candidates.length > 1 && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm flex gap-2 items-start border border-blue-200 dark:border-blue-800">
                                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold">{t('checks.multiCandidateNotice', 'Multiple Checks will be created')}</div>
                                        <div>{t('checks.multiCandidateDesc', `You are about to schedule ${candidates.length} individual proficiency checks.`)}</div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checks.candidates')}:</span>
                                    <span className="font-medium">{candidates.length} {t('checks.selected')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checks.standard')}:</span>
                                    <span className="font-medium">
                                        {availableStandards?.find(s => s.id === selectedStandardId)?.name || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checks.checkType')}:</span>
                                    <span className="font-medium">
                                        {checkType === 'full_renewal' ? t('checks.fullRenewal') : t('checks.partial')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('common.dateTime')}:</span>
                                    <span className="font-medium">
                                        {dateStart ? new Date(dateStart).toLocaleString() : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('common.location')}:</span>
                                    <span className="font-medium">{location || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checks.assessors')}:</span>
                                    <span className="font-medium">{selectedAssessorIds.length} {t('checks.selected')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between">
                    <div>
                        {step > 1 && (
                            <Button variant="outline" onClick={handleBack}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                {t('common.back')}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            {t('common.cancel')}
                        </Button>
                        {step < 5 ? (
                            <Button onClick={handleNext} disabled={!canProceed()}>
                                {t('common.next')}
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleSubmit} 
                                disabled={createCheckMutation.isPending}
                            >
                                {createCheckMutation.isPending 
                                    ? t('common.scheduling')
                                    : t('checks.scheduleCheck')
                                }
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ScheduleCheckModal
