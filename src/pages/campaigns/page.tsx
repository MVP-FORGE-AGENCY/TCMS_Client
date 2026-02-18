/**
 * Campaigns Page
 * Lists all campaigns with ability to create new ones
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Calendar, Users, TrendingUp, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { Campaign, CampaignCreate, Curriculum } from '@/types'
import { format } from 'date-fns'
import { useAuth } from '@/context/AuthContext'

export default function CampaignsPage() {
    const { t } = useTranslation()
    const { user } = useAuth()

    const navigate = useNavigate()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [curriculums, setCurriculums] = useState<Curriculum[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // New campaign dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newCampaign, setNewCampaign] = useState<Partial<CampaignCreate>>({
        name: '',
        curriculumId: '',
        dateRangeStart: '',
        dateRangeEnd: '',
        maxPerSession: 4,
        defaultLocation: ''
    })

    useEffect(() => {
        loadData()
    }, [statusFilter])

    const loadData = async () => {
        try {
            setLoading(true)
            const params: Record<string, string> = {}
            if (statusFilter !== 'all') params.status = statusFilter

            const [campaignsRes, curriculumsRes] = await Promise.all([
                api.get('/campaigns', { params }),
                api.get('/curriculums', { params: { is_active: 'true' } })
            ])
            setCampaigns(campaignsRes.data.data || [])
            setCurriculums(curriculumsRes.data.data || [])
        } catch (error) {
            console.error('Failed to load campaigns:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCampaign = async () => {
        if (!newCampaign.name || !newCampaign.curriculumId || !newCampaign.dateRangeStart) {
            toast.error(t('validation.required', 'All fields are required'))
            return
        }

        try {
            setCreating(true)
            const payload = {
                ...newCampaign,
                dateRangeEnd: newCampaign.dateRangeEnd || null
            }
            const response = await api.post('/campaigns', payload)
            toast.success(t('campaigns.created', 'Campaign created'))
            setDialogOpen(false)
            setNewCampaign({
                name: '',
                curriculumId: '',
                dateRangeStart: '',
                dateRangeEnd: '',
                maxPerSession: 4
            })
            navigate(`/campaigns/${response.data.data.id}`)
        } catch (error: any) {
            console.error('Failed to create campaign:', error)
            const message = error.response?.data?.error?.message || t('errors.createError', 'Failed to create')
            toast.error(message)
        } finally {
            setCreating(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-slate-500'
            case 'active': return 'bg-blue-500'
            case 'paused': return 'bg-amber-500'
            case 'completed': return 'bg-green-500'
            case 'cancelled': return 'bg-red-500'
            default: return 'bg-slate-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('campaigns.title', 'Campaigns')}</h1>
                    <p className="text-muted-foreground">
                        {t('campaigns.subtitle', 'Manage training campaigns and bulk scheduling.')}
                    </p>
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('campaigns.title', 'Campaigns')}</h1>
                    <p className="text-muted-foreground">
                        {t('campaigns.subtitle', 'Manage training campaigns and bulk scheduling.')}
                    </p>
                </div>
                {['admin', 'training_manager'].includes(user?.role || '') && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('campaigns.createCampaign', 'Create Campaign')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('campaigns.createCampaign', 'Create Campaign')}</DialogTitle>
                            <DialogDescription>
                                {t('campaigns.createDesc', 'Set up a new training campaign for bulk scheduling.')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('campaigns.name', 'Campaign Name')}</Label>
                                <Input 
                                    value={newCampaign.name}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                    placeholder="e.g., Winter 2026 Recurrent"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('campaigns.curriculum', 'Curriculum')}</Label>
                                <Select 
                                    value={newCampaign.curriculumId}
                                    onValueChange={(v) => setNewCampaign({ ...newCampaign, curriculumId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('campaigns.selectCurriculum', 'Select curriculum')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {curriculums.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('campaigns.startDate', 'Start Date')}</Label>
                                    <Input 
                                        type="date"
                                        value={newCampaign.dateRangeStart}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, dateRangeStart: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('campaigns.endDate', 'End Date')}</Label>
                                    <Input 
                                        type="date"
                                        value={newCampaign.dateRangeEnd}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, dateRangeEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('campaigns.maxPerSession', 'Max Trainees per Session')}</Label>
                                    <Select 
                                        value={newCampaign.maxPerSession?.toString()}
                                        onValueChange={(v) => setNewCampaign({ ...newCampaign, maxPerSession: parseInt(v) })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                                                <SelectItem key={n} value={n.toString()}>
                                                    {n} {t('campaigns.trainees', 'trainees')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('campaigns.defaultLocation', 'Default Location')}</Label>
                                    <Input 
                                        value={newCampaign.defaultLocation || ''}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, defaultLocation: e.target.value })}
                                        placeholder={t('campaigns.locationPlaceholder', 'e.g., Training Center A')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('campaigns.description', 'Description (Optional)')}</Label>
                                <Textarea 
                                    value={newCampaign.description || ''}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button onClick={handleCreateCampaign} disabled={creating}>
                                {creating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={t('common.status', 'Status')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('common.all', 'All')}</SelectItem>
                        <SelectItem value="draft">{t('campaigns.status.draft', 'Draft')}</SelectItem>
                        <SelectItem value="active">{t('campaigns.status.active', 'Active')}</SelectItem>
                        <SelectItem value="paused">{t('campaigns.status.paused', 'Paused')}</SelectItem>
                        <SelectItem value="completed">{t('campaigns.status.completed', 'Completed')}</SelectItem>
                    </SelectContent>
                </Select>
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
            ) : curriculums.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('campaigns.noCurriculums', 'No curriculums found')}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t('campaigns.createCurriculumFirst', 'You need to create a curriculum before starting a campaign.')}
                    </p>
                    <Button onClick={() => navigate('/curriculums')}>
                        {t('campaigns.goToCurriculums', 'Go to Curriculums')}
                    </Button>
                </Card>
            ) : campaigns.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('campaigns.noCampaigns', 'No campaigns found')}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t('campaigns.getStarted', 'Get started by creating your first campaign.')}
                    </p>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('campaigns.createCampaign', 'Create Campaign')}
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <Card 
                            key={campaign.id} 
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                                        <CardDescription>
                                            {campaign.curriculum?.name || campaign.curriculumId}
                                        </CardDescription>
                                    </div>
                                    <Badge className={getStatusColor(campaign.status)}>
                                        {campaign.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Progress */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{t('campaigns.progress', 'Progress')}</span>
                                            <span className="font-medium">{campaign.progressPercent}%</span>
                                        </div>
                                        <Progress value={campaign.progressPercent} className="h-2" />
                                    </div>

                                    {/* Date range */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {format(new Date(campaign.dateRangeStart), 'MMM d')} - {new Date(campaign.dateRangeEnd).getFullYear() >= 2099 ? t('common.ongoing', 'Ongoing') : format(new Date(campaign.dateRangeEnd), 'MMM d, yyyy')}
                                        </span>
                                    </div>

                                    {/* Enrollment stats */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>{campaign.totalEnrollments || 0} {t('campaigns.enrolled', 'enrolled')}</span>
                                        </div>
                                        {campaign.completedCount !== undefined && campaign.completedCount > 0 && (
                                            <div className="flex items-center gap-1.5 text-green-600">
                                                <TrendingUp className="h-4 w-4" />
                                                <span>{campaign.completedCount} {t('campaigns.completed', 'completed')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
