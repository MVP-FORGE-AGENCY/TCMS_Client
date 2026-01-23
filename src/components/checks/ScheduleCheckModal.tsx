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

    // Use passed-in eligible standards if provided, otherwise fetch all (fallback)
    const { data: allStandards } = useQuery({
        queryKey: ['standards-for-checks'],
        queryFn: async () => {
            const res = await api.get('/standards', { params: { isActive: true } })
            return (res.data.data || res.data) as Standard[]
        },
        // Only fetch all if no eligible standards are provided
        enabled: isOpen && eligibleStandards.length === 0
    })

    // Use eligible standards if provided, otherwise fall back to all standards
    const availableStandards: Standard[] = eligibleStandards.length > 0 
        ? eligibleStandards.map(s => ({ ...s, checkDefinition: undefined }))
        : (allStandards || [])

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
            return checks.create({
                standardId: selectedStandardId,
                checkType,
                candidateIds: candidates.map(c => c.id),
                assessorIds: selectedAssessorIds,
                dateStart,
                location: location || undefined
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

    // Filter standards by preselected if provided
    const filteredStandards = preselectedStandardId 
        ? availableStandards?.filter(s => s.id === preselectedStandardId)
        : availableStandards

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[600px]">
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

                    {/* Step 3: Logistics */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-lg font-medium">
                                <Calendar className="h-5 w-5" />
                                {t('checks.step3', 'Step 3: Schedule & Location')}
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dateStart">{t('common.dateTime', 'Date & Time')}</Label>
                                    <Input
                                        id="dateStart"
                                        type="datetime-local"
                                        value={dateStart}
                                        onChange={(e) => setDateStart(e.target.value)}
                                    />
                                </div>
                                
                                <div className="space-y-2">
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
                            {conflicts.length > 0 && (
                                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-medium">
                                        <AlertTriangle className="h-4 w-4" />
                                        {t('checks.conflictWarning', 'Potential Conflicts Detected')}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {conflicts.map((conflict, i) => (
                                            <div key={i} className="text-muted-foreground">
                                                ⚠️ {conflict.message}
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
