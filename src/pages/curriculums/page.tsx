/**
 * Curriculums Page
 * Lists all curriculums with ability to create new ones
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, BookOpen, Search, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { Curriculum, CurriculumType } from '@/types'
import { cn } from '@/lib/utils'
import { CurriculumHistoryModal } from '@/components/curriculums/CurriculumHistoryModal'
import { useAuth } from '@/context/AuthContext'


export default function CurriculumsPage() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const isAuditor = user?.role === 'auditor' || user?.role === 'readonly'
    const navigate = useNavigate()
    const [curriculums, setCurriculums] = useState<Curriculum[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [historyModalOpen, setHistoryModalOpen] = useState(false)
    const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null)

    useEffect(() => {
        loadCurriculums()
    }, [typeFilter, statusFilter])

    const loadCurriculums = async () => {
        try {
            setLoading(true)
            const params: Record<string, string> = {}
            if (typeFilter !== 'all') params.type = typeFilter
            if (statusFilter !== 'all') params.is_active = statusFilter === 'active' ? 'true' : 'false'
            if (search) params.search = search

            const response = await api.get('/curriculums', { params })
            setCurriculums(response.data.data || [])
        } catch (error) {
            console.error('Failed to load curriculums:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        loadCurriculums()
    }

    const filteredCurriculums = curriculums.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    )

    const getTypeColor = (type: CurriculumType) => {
        switch (type) {
            case 'initial': return 'bg-blue-500'
            case 'recurrent': return 'bg-green-500'
            case 'refresher': return 'bg-amber-500'
            case 'conversion': return 'bg-purple-500'
            case 'differences': return 'bg-pink-500'
            default: return 'bg-slate-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('curriculums.title', 'Curriculums')}</h1>
                    <p className="text-muted-foreground">
                        {t('curriculums.subtitle', 'Define training and assessment modules for your organization.')}
                    </p>
                </div>
            </div>
            {/* Header Actions */}
            <div className="flex justify-end">
                {!isAuditor && (
                <Button onClick={() => navigate('/curriculums/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('curriculums.createCurriculum', 'Create Curriculum')}
                </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('curriculums.searchPlaceholder', 'Search curriculums...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </form>
                <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder={t('common.type', 'Type')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                            <SelectItem value="initial">{t('curriculums.types.initial', 'Initial')}</SelectItem>
                            <SelectItem value="recurrent">{t('curriculums.types.recurrent', 'Recurrent')}</SelectItem>
                            <SelectItem value="refresher">{t('curriculums.types.refresher', 'Refresher')}</SelectItem>
                            <SelectItem value="conversion">{t('curriculums.types.conversion', 'Conversion')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder={t('common.status', 'Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                            <SelectItem value="active">{t('common.active', 'Active')}</SelectItem>
                            <SelectItem value="inactive">{t('common.inactive', 'Inactive')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredCurriculums.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('curriculums.noCurriculums', 'No curriculums found')}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t('curriculums.getStarted', 'Get started by creating your first curriculum.')}
                    </p>
                    <Button onClick={() => navigate('/curriculums/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('curriculums.createCurriculum', 'Create Curriculum')}
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCurriculums.map((curriculum) => (
                        <Card 
                            key={curriculum.id} 
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => navigate(`/curriculums/${curriculum.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{curriculum.name}</CardTitle>
                                        <CardDescription className="font-mono text-xs">
                                            {curriculum.code}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedCurriculumId(curriculum.id)
                                                setHistoryModalOpen(true)
                                            }}
                                            title="View version history"
                                        >
                                            <History className="h-4 w-4" />
                                        </Button>
                                        <Badge 
                                            variant={curriculum.isActive ? 'default' : 'secondary'}
                                            className={cn(
                                                curriculum.isActive ? getTypeColor(curriculum.type) : ''
                                            )}
                                        >
                                            {curriculum.type}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {/* Module counts */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span className="text-muted-foreground">
                                                {curriculum.instructionModulesCount || 0} {t('curriculums.instruction', 'Training')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-violet-500" />
                                            <span className="text-muted-foreground">
                                                {curriculum.assessmentModulesCount || 0} {t('curriculums.assessment', 'Checks')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {curriculum.totalHours || 0}h {t('curriculums.totalHours', 'total')}
                                        </span>
                                        {curriculum.validityMonths && (
                                            <span className="text-muted-foreground">
                                                {curriculum.validityMonths} {t('common.months', 'months')} {t('curriculums.validity', 'validity')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Standard tags */}
                                    {curriculum.standardTags && curriculum.standardTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {curriculum.standardTags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {curriculum.standardTags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{curriculum.standardTags.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* History Modal */}
            <CurriculumHistoryModal
                open={historyModalOpen}
                onOpenChange={setHistoryModalOpen}
                curriculumId={selectedCurriculumId}
            />
        </div>
    )
}
