/**
 * My Actions Component
 * Prioritized task list for the dashboard showing role-specific action items
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
    AlertCircle, Clock, PenTool, CheckSquare, CalendarCheck,
    ChevronRight, Bell, Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import type { ActionItem, ActionItemType, ActionItemPriority } from '@/types'
import { formatDistanceToNow, parseISO, isAfter, addDays } from 'date-fns'

interface ActionItemProps {
    item: ActionItem
    onNavigate: (url: string) => void
}

const PRIORITY_CONFIG: Record<ActionItemPriority, { color: string; bgColor: string; hoverBg: string }> = {
    critical: { 
        color: 'text-red-700', 
        bgColor: 'bg-red-100 dark:bg-red-950/40',
        hoverBg: 'hover:bg-red-200 dark:hover:bg-red-900/60'
    },
    high: { 
        color: 'text-amber-700', 
        bgColor: 'bg-amber-100 dark:bg-amber-950/40',
        hoverBg: 'hover:bg-amber-200 dark:hover:bg-amber-900/60'
    },
    medium: { 
        color: 'text-blue-700', 
        bgColor: 'bg-blue-100 dark:bg-blue-950/40',
        hoverBg: 'hover:bg-blue-200 dark:hover:bg-blue-900/60'
    },
    low: { 
        color: 'text-slate-600', 
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        hoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-700'
    }
}

const TYPE_CONFIG: Record<ActionItemType, { icon: React.ElementType; label: string }> = {
    expiry_warning: { icon: AlertCircle, label: 'Expiry Warning' },
    pending_signature: { icon: PenTool, label: 'Pending Signature' },
    session_approval: { icon: CheckSquare, label: 'Approval Required' },
    acknowledge_training: { icon: CalendarCheck, label: 'Training Acknowledgement' },
    pending_grading: { icon: CheckSquare, label: 'Pending Grading' },
    retake_required: { icon: AlertCircle, label: 'Retake Required' },
    session_reminder: { icon: Clock, label: 'Session Reminder' }
}

function ActionItemRow({ item, onNavigate }: ActionItemProps) {
    const { t } = useTranslation()
    const config = TYPE_CONFIG[item.type] || { icon: Bell, label: item.type }
    const priorityConfig = PRIORITY_CONFIG[item.priority]
    const Icon = config.icon

    const dueInfo = item.dueDate ? {
        text: formatDistanceToNow(parseISO(item.dueDate), { addSuffix: true }),
        isOverdue: isAfter(new Date(), parseISO(item.dueDate)),
        isUrgent: isAfter(new Date(), addDays(parseISO(item.dueDate), -3))
    } : null

    return (
        <div 
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
                priorityConfig.bgColor,
                priorityConfig.hoverBg
            )}
            onClick={() => onNavigate(item.targetUrl)}
        >
            <div className={cn("mt-0.5", priorityConfig.color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-medium text-sm leading-tight">{item.title}</p>
                        {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {item.description}
                            </p>
                        )}
                    </div>
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "shrink-0 text-xs",
                            item.priority === 'critical' && "border-red-500 text-red-700",
                            item.priority === 'high' && "border-amber-500 text-amber-700"
                        )}
                    >
                        {config.label}
                    </Badge>
                </div>
                {dueInfo && (
                    <p className={cn(
                        "text-xs mt-1",
                        dueInfo.isOverdue && "text-red-600 font-medium",
                        !dueInfo.isOverdue && dueInfo.isUrgent && "text-amber-600",
                        !dueInfo.isOverdue && !dueInfo.isUrgent && "text-muted-foreground"
                    )}>
                        {dueInfo.isOverdue ? t('actions.overdue', 'Overdue') : t('actions.due', 'Due')} {dueInfo.text}
                    </p>
                )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
    )
}

export function MyActions() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [actions, setActions] = useState<ActionItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadActions()
    }, [user])

    const loadActions = async () => {
        if (!user) return

        try {
            setLoading(true)
            
            // Generate action items based on role and available data
            const generatedActions: ActionItem[] = []
            const now = new Date()

            // 1. Fetch Upcoming Sessions
            try {
                let sessions: any[] = []
                // For managers, we only want their own assigned sessions in "My Actions", not the whole org's
                if (['admin', 'training_manager', 'auditor'].includes(user.role || '')) {
                    const res = await api.get(`/sessions?status=planned&limit=5&instructorId=${user.id}`);
                    sessions = res.data.data || [];
                } else {
                    const res = await api.get('/sessions?status=planned&limit=5');
                    sessions = res.data.data || [];
                }

                sessions.forEach((session: any) => {
                    const sessionDate = new Date(session.dateStart)
                    const daysUntil = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (daysUntil <= 14 && daysUntil >= 0) {
                        const isInstructor = session.instructorId === user.id;

                        generatedActions.push({
                            id: `session-${session.id}`,
                            type: 'session_reminder',
                            title: isInstructor 
                                ? `Teach: ${session.programme?.name || 'Training Session'}`
                                : `Attend: ${session.programme?.name || 'Training Session'}`,
                            description: `Scheduled for ${sessionDate.toLocaleDateString()}`,
                            priority: daysUntil <= 1 ? 'high' : 'medium',
                            dueDate: session.dateStart,
                            targetUrl: `/sessions/${session.id}`,
                            entityType: 'session',
                            entityId: session.id,
                            createdAt: now.toISOString()
                        })
                    }
                })
            } catch (e) {
                console.error('Failed to fetch sessions for actions:', e)
            }

            // 2. Fetch Checks to Grade (for assessors, managers)
            if (['admin', 'training_manager', 'assessor'].includes(user.role || '')) {
                try {
                    const checksRes = await api.get('/checks?status=planned&limit=5&view=assigned')
                    const checks = checksRes.data.data || []
                    
                    checks.forEach((check: any) => {
                        generatedActions.push({
                            id: `grade-check-${check.id}`,
                            type: 'pending_grading',
                            title: `Complete check for ${check.trainee?.fullName || 'Candidate'}`,
                            description: check.profile?.name || check.trainingStandards?.name || 'Proficiency Check',
                            priority: 'high',
                            targetUrl: `/checks/${check.id}`,
                            entityType: 'check',
                            entityId: check.id,
                            createdAt: now.toISOString()
                        })
                    })
                } catch (e) {
                    console.error('Failed to fetch checks to grade:', e)
                }
            }

            // 3. Fetch Checks to Attend (for everyone)
            try {
                let attendChecks: any[] = []
                if (['admin', 'training_manager', 'auditor'].includes(user.role || '')) {
                    const res = await api.get(`/checks?status=planned&limit=5&traineeId=${user.id}`)
                    attendChecks = res.data.data || []
                } else {
                    const res = await api.get('/checks?status=planned&limit=5')
                    attendChecks = res.data.data || []
                }
                
                attendChecks.forEach((check: any) => {
                    const checkDate = new Date(check.dateStart)
                    const daysUntil = Math.ceil((checkDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysUntil <= 14 && daysUntil >= 0) {
                        // Only add if we aren't already grading it (just in case)
                        if (!generatedActions.find(a => a.id === `grade-check-${check.id}`)) {
                            generatedActions.push({
                                id: `attend-check-${check.id}`,
                                type: 'session_reminder',
                                title: `Attend Check: ${check.profile?.name || check.trainingStandards?.name || 'Proficiency Check'}`,
                                description: `Scheduled for ${checkDate.toLocaleDateString()}`,
                                priority: daysUntil <= 1 ? 'high' : 'medium',
                                dueDate: check.dateStart,
                                targetUrl: `/checks/${check.id}`,
                                entityType: 'check',
                                entityId: check.id,
                                createdAt: now.toISOString()
                            })
                        }
                    }
                })
            } catch (e) {
                console.error('Failed to fetch checks to attend:', e)
            }

            // For managers - get expired and expiring competences
            if (['admin', 'training_manager'].includes(user.role || '')) {
                // Fetch EXPIRED competences (critical items first)
                try {
                    const competenceRes = await api.get('/competence', { params: { limit: 100 } })
                    const resAny = competenceRes as any
                    const expiredCount = resAny?.data?.summary?.expired || resAny?.summary?.expired || 0

                    if (expiredCount > 0) {
                        generatedActions.push({
                            id: 'expired-competences',
                            type: 'expiry_warning',
                            title: t('actions.expiredCompetences', '{{count}} competence(s) have EXPIRED', { count: expiredCount }),
                            description: t('actions.expiredCompetencesDesc', 'Immediate action required - schedule training or reassessment'),
                            priority: 'critical',
                            targetUrl: '/competence?status=expired',
                            entityType: 'competence',
                            createdAt: now.toISOString()
                        })
                    }
                } catch (e) {
                    console.error('Failed to fetch expired competences:', e)
                }

                // Fetch EXPIRING competences (next 30 days)
                try {
                    const expiringRes = await api.get('/reports/expiring?withinDays=30&limit=5')
                    const expiring = expiringRes.data || []
                    
                    if (Array.isArray(expiring) && expiring.length > 0) {
                        generatedActions.push({
                            id: 'expiring-competences',
                            type: 'expiry_warning',
                            title: `${expiring.length} competence(s) expiring soon`,
                            description: 'Review and schedule required training',
                            priority: 'high',
                            targetUrl: '/competence',
                            entityType: 'competence',
                            createdAt: now.toISOString()
                        })
                    }
                } catch (e) {
                    console.error('Failed to fetch expiring competences:', e)
                }
            }

            // Phase 3.3: Password Expiry Warning
            if (user.role !== 'employee') {
                const lastChange = user.passwordChangedAt ? new Date(user.passwordChangedAt) : null;
                // If no date, assume fresh or handled by mustChangePassword flag
                if (lastChange) {
                    const daysSince = Math.floor((new Date().getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
                    const daysRemaining = 90 - daysSince;

                    if (daysRemaining < 10) {
                        const expiryDate = new Date(lastChange.getTime() + 90 * 24 * 60 * 60 * 1000);
                        generatedActions.push({
                            id: 'password-expiry-action',
                            type: 'expiry_warning',
                            title: t('actions.passwordExpiringTitle', 'Password Expiring Soon'),
                            description: t('actions.passwordExpiringDesc', 'You have {{days}} days to change your password', { days: Math.max(0, daysRemaining) }),
                            priority: 'critical',
                            dueDate: expiryDate.toISOString(),
                            targetUrl: '/profile', 
                            entityType: 'competence', // Reusing existing type for icon
                            createdAt: now.toISOString()
                        });
                    }
                }
            }

            // Sort by priority and due date
            const priorityOrder: Record<ActionItemPriority, number> = {
                critical: 0,
                high: 1,
                medium: 2,
                low: 3
            }

            generatedActions.sort((a, b) => {
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
                if (priorityDiff !== 0) return priorityDiff
                
                if (a.dueDate && b.dueDate) {
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                }
                return 0
            })

            setActions(generatedActions.slice(0, 5))
        } catch (error) {
            console.error('Failed to load actions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleNavigate = (url: string) => {
        navigate(url)
    }

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t('dashboard.myActions', 'My Actions')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3 p-3">
                            <Skeleton className="h-5 w-5 rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t('dashboard.myActions', 'My Actions')}
                        {actions.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {actions.length}
                            </Badge>
                        )}
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => loadActions()}
                    >
                        <Loader2 className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
                <CardDescription>
                    {t('dashboard.actionsDesc', 'Tasks that need your attention')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {actions.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{t('dashboard.noActions', 'All caught up! No pending actions.')}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {actions.map((action) => (
                            <ActionItemRow 
                                key={action.id} 
                                item={action} 
                                onNavigate={handleNavigate}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
