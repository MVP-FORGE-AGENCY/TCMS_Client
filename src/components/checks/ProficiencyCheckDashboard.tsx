import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { checks } from '@/lib/api'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
    Search, 
    CalendarPlus, 
    Users, 
    BookCheck, 
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import { ScheduleCheckModal } from './ScheduleCheckModal'

interface EligibleTrainee {
    id: string
    fullName: string
    email: string
    role: string
    jobTitle: string
    department: string
    eligibleStandards: Array<{
        id: string
        code: string
        name: string
    }>
}

interface StandardWithTrainees {
    id: string
    code: string
    name: string
    eligibleTrainees: Array<{
        id: string
        fullName: string
        email: string
        role: string
    }>
}

export function ProficiencyCheckDashboard() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    
    const [activeTab, setActiveTab] = useState('trainees')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTrainees, setSelectedTrainees] = useState<string[]>([])
    const [selectedStandard, setSelectedStandard] = useState<StandardWithTrainees | null>(null)
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
    const [preselectedCandidates, setPreselectedCandidates] = useState<string[]>([])
    const [preselectedStandardId, setPreselectedStandardId] = useState<string | undefined>()
    const [preselectedEligibleStandards, setPreselectedEligibleStandards] = useState<Array<{id: string; code: string; name: string}>>([])

    // Fetch eligible trainees
    const { data: eligibleData, isLoading: loadingTrainees } = useQuery({
        queryKey: ['eligible-trainees'],
        queryFn: async () => {
            const res = await checks.getEligibleTrainees()
            return res.data as EligibleTrainee[]
        }
    })

    // Fetch standards with eligible trainees
    const { data: standardsData, isLoading: loadingStandards } = useQuery({
        queryKey: ['eligible-by-standard'],
        queryFn: async () => {
            const res = await checks.getEligibleByStandard()
            return res.data as StandardWithTrainees[]
        }
    })

    const filteredTrainees = eligibleData?.filter(trainee =>
        trainee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.department?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const filteredStandards = standardsData?.filter(std =>
        std.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        std.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const handleSelectTrainee = (traineeId: string) => {
        setSelectedTrainees(prev => 
            prev.includes(traineeId) 
                ? prev.filter(id => id !== traineeId)
                : [...prev, traineeId]
        )
    }

    const handleSelectAll = () => {
        if (selectedTrainees.length === filteredTrainees.length) {
            setSelectedTrainees([])
        } else {
            setSelectedTrainees(filteredTrainees.map(t => t.id))
        }
    }

    const handleScheduleSingle = (traineeId: string, standardId?: string) => {
        // Get eligible standards for this trainee
        const trainee = eligibleData?.find(t => t.id === traineeId)
        const standards = trainee?.eligibleStandards || []
        
        setPreselectedCandidates([traineeId])
        setPreselectedStandardId(standardId)
        setPreselectedEligibleStandards(standards)
        setScheduleModalOpen(true)
    }

    const handleScheduleMultiple = () => {
        // Compute intersection of eligible standards across all selected trainees
        const selectedTraineeData = eligibleData?.filter(t => selectedTrainees.includes(t.id)) || []
        
        let commonStandards: Array<{id: string; code: string; name: string}> = []
        if (selectedTraineeData.length > 0) {
            // Start with first trainee's standards
            commonStandards = [...selectedTraineeData[0].eligibleStandards]
            
            // Intersect with each subsequent trainee
            for (let i = 1; i < selectedTraineeData.length; i++) {
                const traineeStandardIds = new Set(selectedTraineeData[i].eligibleStandards.map(s => s.id))
                commonStandards = commonStandards.filter(s => traineeStandardIds.has(s.id))
            }
        }
        
        setPreselectedCandidates(selectedTrainees)
        setPreselectedStandardId(undefined)
        setPreselectedEligibleStandards(commonStandards)
        setScheduleModalOpen(true)
    }

    const handleScheduleFromStandard = (traineeIds: string[], standardId: string) => {
        // When scheduling from a standard view, pass that single standard
        const standard = standardsData?.find(s => s.id === standardId)
        const eligibleStandards = standard 
            ? [{ id: standard.id, code: standard.code, name: standard.name }]
            : []
        
        setPreselectedCandidates(traineeIds)
        setPreselectedStandardId(standardId)
        setPreselectedEligibleStandards(eligibleStandards)
        setScheduleModalOpen(true)
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('checks.dashboard.title', 'Proficiency Checks')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('checks.dashboard.subtitle', 'Schedule and manage EASA-compliant proficiency assessments')}
                    </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/checks/list')}>
                    {t('checks.viewAllChecks', 'View All Checks')}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="trainees" className="gap-2">
                            <Users className="h-4 w-4" />
                            {t('checks.tabs.eligibleTrainees', 'Eligible Trainees')}
                        </TabsTrigger>
                        <TabsTrigger value="standards" className="gap-2">
                            <BookCheck className="h-4 w-4" />
                            {t('checks.tabs.standards', 'Training Standards')}
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('common.search', 'Search...')}
                                className="pl-8 w-[250px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {activeTab === 'trainees' && selectedTrainees.length > 0 && (
                            <Button onClick={handleScheduleMultiple}>
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                {t('checks.scheduleSelected', 'Schedule Selected')} ({selectedTrainees.length})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tab 1: Eligible Trainees */}
                <TabsContent value="trainees" className="space-y-4">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox 
                                            checked={selectedTrainees.length === filteredTrainees.length && filteredTrainees.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>{t('common.name', 'Name')}</TableHead>
                                    <TableHead>{t('common.role', 'Role')}</TableHead>
                                    <TableHead>{t('common.department', 'Department')}</TableHead>
                                    <TableHead>{t('checks.eligibleStandards', 'Eligible Standards')}</TableHead>
                                    <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingTrainees ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            {t('common.loading', 'Loading...')}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTrainees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            {t('checks.noEligibleTrainees', 'No trainees require proficiency checks at this time')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTrainees.map((trainee) => (
                                        <TableRow key={trainee.id}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedTrainees.includes(trainee.id)}
                                                    onCheckedChange={() => handleSelectTrainee(trainee.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(trainee.fullName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{trainee.fullName}</div>
                                                        <div className="text-xs text-muted-foreground">{trainee.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{trainee.jobTitle || trainee.role}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {trainee.department || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {trainee.eligibleStandards.slice(0, 3).map(std => (
                                                        <Badge 
                                                            key={std.id} 
                                                            variant="secondary" 
                                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                            onClick={() => handleScheduleSingle(trainee.id, std.id)}
                                                        >
                                                            {std.code}
                                                        </Badge>
                                                    ))}
                                                    {trainee.eligibleStandards.length > 3 && (
                                                        <Badge variant="outline">
                                                            +{trainee.eligibleStandards.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleScheduleSingle(trainee.id)}
                                                >
                                                    <CalendarPlus className="h-4 w-4 mr-1" />
                                                    {t('common.schedule', 'Schedule')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Tab 2: Training Standards */}
                <TabsContent value="standards" className="space-y-4">
                    {selectedStandard ? (
                        // Drill-down view for a specific standard
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => setSelectedStandard(null)}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    {t('common.back', 'Back')}
                                </Button>
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedStandard.name}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedStandard.code}</p>
                                </div>
                                <div className="ml-auto flex gap-2">
                                    <Button 
                                        onClick={() => handleScheduleFromStandard(
                                            selectedStandard.eligibleTrainees.map(t => t.id), 
                                            selectedStandard.id
                                        )}
                                    >
                                        <CalendarPlus className="h-4 w-4 mr-2" />
                                        {t('checks.scheduleAllEligible', 'Schedule All Eligible')}
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('common.name', 'Name')}</TableHead>
                                            <TableHead>{t('common.role', 'Role')}</TableHead>
                                            <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedStandard.eligibleTrainees.map((trainee) => (
                                            <TableRow key={trainee.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(trainee.fullName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{trainee.fullName}</div>
                                                            <div className="text-xs text-muted-foreground">{trainee.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{trainee.role}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleScheduleSingle(trainee.id, selectedStandard.id)}
                                                    >
                                                        <CalendarPlus className="h-4 w-4 mr-1" />
                                                        {t('common.schedule', 'Schedule')}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ) : (
                        // Card grid view of standards
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {loadingStandards ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-5 w-24 bg-muted rounded" />
                                            <div className="h-4 w-32 bg-muted rounded" />
                                        </CardHeader>
                                    </Card>
                                ))
                            ) : filteredStandards.length === 0 ? (
                                <Card className="col-span-full p-8 text-center">
                                    <p className="text-muted-foreground">
                                        {t('checks.noStandardsWithEligible', 'No standards have eligible trainees at this time')}
                                    </p>
                                </Card>
                            ) : (
                                filteredStandards.map((standard) => (
                                    <Card 
                                        key={standard.id} 
                                        className="cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => setSelectedStandard(standard)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">{standard.name}</CardTitle>
                                                    <CardDescription className="font-mono">
                                                        {standard.code}
                                                    </CardDescription>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    <strong>{standard.eligibleTrainees.length}</strong>{' '}
                                                    {t('checks.eligibleTrainees', 'eligible trainees')}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Schedule Modal */}
            <ScheduleCheckModal
                isOpen={scheduleModalOpen}
                onClose={() => {
                    setScheduleModalOpen(false)
                    setSelectedTrainees([])
                    setPreselectedCandidates([])
                    setPreselectedStandardId(undefined)
                    setPreselectedEligibleStandards([])
                }}
                preselectedCandidates={preselectedCandidates}
                preselectedStandardId={preselectedStandardId}
                eligibleStandards={preselectedEligibleStandards}
            />
        </div>
    )
}
