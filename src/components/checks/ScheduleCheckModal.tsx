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
    X, 
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
    assessorId: string
    assessorName: string
    candidateId: string
    candidateName: string
    message: string
}

export function ScheduleCheckModal({ 
    isOpen, 
    onClose, 
    preselectedCandidates = [],
    preselectedStandardId,
    eligibleStandards = []
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

    // Fetch candidates when preselectedCandidates changes
    useEffect(() => {
        if (preselectedCandidates.length > 0) {
            loadCandidates(preselectedCandidates)
        }
    }, [preselectedCandidates])

    // Auto-select standard if preselected
    useEffect(() => {
        if (preselectedStandardId) {
            setSelectedStandardId(preselectedStandardId)
        }
    }, [preselectedStandardId])

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
                    role: 'assessor,training_manager,admin',
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

    const createCheckMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStandard) return // Should be blocked by step validation

            return checks.create({
                standardId: selectedStandardId,
                checkType,
                candidateIds: candidates.map(c => c.id),
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
        },
        onSuccess: (data) => {
            toast.success(t('checks.scheduled', 'Proficiency check scheduled'))
            queryClient.invalidateQueries({ queryKey: ['proficiency-checks'] })
            queryClient.invalidateQueries({ queryKey: ['eligible-trainees'] })
            queryClient.invalidateQueries({ queryKey: ['eligible-by-standard'] })
            
            if (data.conflicts && data.conflicts.length > 0) {
                toast.warning(t('checks.conflictsDetected', 'Some conflicts were detected'))
            }
            
            handleClose()
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Failed to schedule check'
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
        onClose()
    }

    const removeCandidate = (candidateId: string) => {
        setCandidates(prev => prev.filter(c => c.id !== candidateId))
    }

    const toggleAssessor = (assessorId: string) => {
        setSelectedAssessorIds(prev => 
            prev.includes(assessorId)
                ? prev.filter(id => id !== assessorId)
                : [...prev, assessorId]
        )
    }

    const checkForConflicts = async () => {
        const newConflicts: Conflict[] = []
        
        for (const assessorId of selectedAssessorIds) {
            for (const candidate of candidates) {
                try {
                    const res = await checks.checkConflict(candidate.id, assessorId, dateStart)
                    if (res.hasConflict) {
                        const assessor = assessors?.find(a => a.id === assessorId)
                        newConflicts.push({
                            assessorId,
                            assessorName: assessor?.fullName || 'Unknown',
                            candidateId: candidate.id,
                            candidateName: candidate.fullName,
                            message: res.message || `${assessor?.fullName} has a potential conflict with ${candidate.fullName}`
                        })
                    }
                } catch {
                    // Ignore conflict check errors
                }
            }
        }
        
        setConflicts(newConflicts)
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

    const canProceed = () => {
        switch (step) {
            case 1: return candidates.length > 0
            case 2: return !!selectedStandardId
            case 3: return !!dateStart
            case 4: return selectedAssessorIds.length > 0
            case 5: return true
            default: return false
        }
    }

    // Removed duplicates

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {t('checks.scheduleCheck', 'Schedule Proficiency Check')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('checks.scheduleCheckDesc', 'Follow the steps to schedule a proficiency assessment')}
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
                    {/* Step 1: Confirm Candidates */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <Users className="h-5 w-5" />
                                {t('checks.step1', 'Step 1: Confirm Candidates')}
                            </div>
                            
                            {candidates.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    {t('checks.noCandidatesSelected', 'No candidates selected')}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {candidates.map(candidate => (
                                        <div 
                                            key={candidate.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(candidate.fullName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{candidate.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{candidate.email}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => removeCandidate(candidate.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Select Standard */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <CheckCircle className="h-5 w-5" />
                                {t('checks.step2', 'Step 2: Select Standard')}
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('checks.standard', 'Training Standard')}</Label>
                                    <Select value={selectedStandardId} onValueChange={setSelectedStandardId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('checks.selectStandard', 'Select a standard...')} />
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
                                    <Label>{t('checks.checkType', 'Check Type')}</Label>
                                    <Select value={checkType} onValueChange={(v) => setCheckType(v as 'full_renewal' | 'partial')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full_renewal">
                                                {t('checks.fullRenewal', 'Full Renewal')}
                                                <span className="text-xs text-muted-foreground ml-2">- Extends validity</span>
                                            </SelectItem>
                                            <SelectItem value="partial">
                                                {t('checks.partial', 'Partial / Custom')}
                                                <span className="text-xs text-muted-foreground ml-2">- Does not extend validity</span>
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
                                {t('checks.step3', 'Step 3: Schedule & Configuration')}
                            </div>

                            <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                                <h3 className="font-medium text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                    {t('checks.passCriteria', 'Pass Criteria')}
                                    <Badge variant="outline" className="ml-auto font-normal text-xs">
                                        Defined by Standard
                                    </Badge>
                                </h3>
                                
                                {selectedStandard ? (
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center p-2 rounded bg-background border">
                                            <span className="text-muted-foreground">{t('checks.theoryAssessment', 'Theory Assessment')}</span>
                                            {selectedStandard.hasTheory ? (
                                                <span className="font-medium text-green-600">
                                                    Required ({selectedStandard.theoryPassScore || 70}%)
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Not Required</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded bg-background border">
                                            <span className="text-muted-foreground">{t('checks.practicalAssessment', 'Practical Assessment')}</span>
                                            {selectedStandard.hasPractical ? (
                                                <span className="font-medium text-green-600">
                                                    Required ({selectedStandard.practicalPassScore || 70}%)
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic">Not Required</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-sm italic">
                                        Please select a standard to view criteria.
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dateStart">{t('common.dateTime', 'Date & Time')}</Label>
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
                                    {t('common.location', 'Location')}
                                </Label>
                                <Input
                                    id="location"
                                    placeholder={t('checks.locationPlaceholder', 'e.g., Sim Room 1, Training Center')}
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
                                {t('checks.step4', 'Step 4: Select Assessors')}
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
                                        <Badge variant="outline" className="ml-auto">{assessor.role}</Badge>
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
                                {t('checks.step5', 'Step 5: Review & Confirm')}
                            </div>

                            {/* Conflict warnings */}
                            {/* Conflict warnings */}
                            {conflicts.length > 0 && (
                                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                                        <AlertTriangle className="h-5 w-5" />
                                        {t('checks.conflictWarning', 'Conflict of Interest Detected')}
                                    </div>
                                    <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded">
                                        The following assessor-candidate pairs violate the "No Self-Checking" rule (training conducted within restricted window).
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        {conflicts.map((conflict, i) => (
                                            <div key={i} className="flex flex-col gap-1 p-2 border border-red-200 dark:border-red-900/50 rounded bg-background/50">
                                                <div className="font-semibold flex items-center gap-2">
                                                    <span className="text-red-600">Assessor: {conflict.assessorName}</span>
                                                    <span className="text-muted-foreground">→</span>
                                                    <span>Candidate: {conflict.candidateName}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground ml-4">
                                                    Reason: {conflict.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('common.candidates', 'Candidates')}:</span>
                                    <span className="font-medium">{candidates.length} selected</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checks.standard', 'Standard')}:</span>
                                    <span className="font-medium">
                                        {availableStandards?.find(s => s.id === selectedStandardId)?.name || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('checks.checkType', 'Check Type')}:</span>
                                    <span className="font-medium">
                                        {checkType === 'full_renewal' ? t('checks.fullRenewal', 'Full Renewal') : t('checks.partial', 'Partial')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('common.dateTime', 'Date/Time')}:</span>
                                    <span className="font-medium">
                                        {dateStart ? new Date(dateStart).toLocaleString() : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('common.location', 'Location')}:</span>
                                    <span className="font-medium">{location || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('common.assessors', 'Assessors')}:</span>
                                    <span className="font-medium">{selectedAssessorIds.length} selected</span>
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
                                {t('common.back', 'Back')}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        {step < 5 ? (
                            <Button onClick={handleNext} disabled={!canProceed()}>
                                {t('common.next', 'Next')}
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleSubmit} 
                                disabled={createCheckMutation.isPending}
                            >
                                {createCheckMutation.isPending 
                                    ? t('common.scheduling', 'Scheduling...')
                                    : t('checks.scheduleCheck', 'Schedule Check')
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
