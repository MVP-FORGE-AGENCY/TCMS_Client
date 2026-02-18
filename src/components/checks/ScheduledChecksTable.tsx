import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, BookOpen, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ScheduledChecksTableProps {
    filter?: 'all' | 'my_assignments';
    refreshTrigger: number;
    statusFilter?: string;
    assessorFilter?: string;
    standardFilter?: string;
    candidateFilter?: string;
}

const ScheduledChecksTable: React.FC<ScheduledChecksTableProps> = ({ 
    filter = 'all', 
    refreshTrigger,
    statusFilter = 'all',
    assessorFilter = 'all',
    standardFilter = 'all',
    candidateFilter = 'all'
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchChecks = async () => {
            setLoading(true);
            try {
                const params: any = {};
                if (filter === 'my_assignments') {
                    params.view = 'assigned';
                }
                
                const res = await api.get('/checks', { params });
                setChecks(Array.isArray(res.data) ? res.data : res.data.data || res.data.checks || []);
            } catch (error) {
                console.error("Failed to fetch checks", error);
                toast.error("Failed to load checks");
            } finally {
                setLoading(false);
            }
        };
        fetchChecks();
    }, [filter, refreshTrigger, user?.id]);

    // Client-side filtering
    const filteredChecks = useMemo(() => {
        return checks.filter(check => {
            // Status filter
            if (statusFilter !== 'all') {
                const status = check.finalDecision || 'pending';
                if (status !== statusFilter) return false;
            }

            // Assessor filter
            if (assessorFilter !== 'all') {
                const assessorIds: string[] = [];
                check.checkAssessors?.forEach((ca: any) => { if (ca.assessor?.id) assessorIds.push(ca.assessor.id); });
                check.assessors?.forEach((a: any) => { const id = a.user?.id || a.id; if (id) assessorIds.push(id); });
                if (!assessorIds.includes(assessorFilter)) return false;
            }

            // Standard filter
            if (standardFilter !== 'all') {
                if (check.trainingStandards?.code !== standardFilter) return false;
            }

            // Candidate filter
            if (candidateFilter !== 'all') {
                const candidateIds: string[] = [];
                check.checkCandidates?.forEach((cc: any) => { if (cc.candidate?.id) candidateIds.push(cc.candidate.id); });
                check.candidates?.forEach((cc: any) => { const c = cc.candidate || cc; if (c?.id) candidateIds.push(c.id); });
                if (check.trainee?.id) candidateIds.push(check.trainee.id);
                if (!candidateIds.includes(candidateFilter)) return false;
            }

            return true;
        });
    }, [checks, statusFilter, assessorFilter, standardFilter, candidateFilter]);

    const getStatusBadge = (decision: string) => {
        switch (decision) {
            case 'pass':
                return <Badge className="bg-green-500 hover:bg-green-600">{t('common.passed')}</Badge>;
            case 'fail':
                return <Badge variant="destructive">{t('common.statusFailed')}</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-amber-500 border-amber-500">{t('checks.pending')}</Badge>;
            case 'in_progress':
                return <Badge variant="outline" className="text-blue-500 border-blue-500">{t('checks.assessing')}</Badge>;
            case 'cancelled':
                return <Badge variant="secondary">{t('common.cancelled')}</Badge>;
            default:
                return <Badge variant="outline">{decision}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md p-4 bg-muted/20">
                        {t('common.loading')}
                    </div>
                ) : filteredChecks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md p-4 bg-muted/20">
                        {t('checks.noChecksFound')}
                    </div>
                ) : (
                    filteredChecks.map((check) => (
                        <Card key={check.id}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {new Date(check.dateStart).toLocaleDateString()} • {new Date(check.dateStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <CardTitle className="text-base font-medium">
                                            {(check.candidates?.length > 1 || check.checkCandidates?.length > 1) ? (
                                                <span>{t('checks.multipleCandidates', { count: (check.candidates || check.checkCandidates).length })}</span>
                                            ) : (
                                                (check.candidates?.[0]?.candidate?.fullName || check.candidates?.[0]?.candidate?.full_name) ||
                                                (check.checkCandidates?.[0]?.candidate?.fullName || check.checkCandidates?.[0]?.candidate?.full_name) ||
                                                (check.trainee?.full_name || check.trainee?.fullName) || 
                                                '-'
                                            )}
                                        </CardTitle>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {check.check_type === 'full_renewal' ? t('checks.fullRenewal') : 
                                         check.check_type === 'partial' ? t('checks.partial') : 
                                         check.checkType || t('checks.standard')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-start gap-2 text-sm">
                                        <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground min-w-4" />
                                        <div>
                                            <div className="font-medium">{check.trainingStandards?.code || '-'}</div>
                                            <div className="text-xs text-muted-foreground">{check.trainingStandards?.name}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2 text-sm">
                                        <User className="h-4 w-4 mt-0.5 text-muted-foreground min-w-4" />
                                        <div className="flex flex-wrap gap-1">
                                             {/* Handle both single assessor (legacy) and check_assessors (new) */}
                                            {check.assessors && check.assessors.length > 0 ? (
                                                check.assessors.map((a: any) => (
                                                    <span key={a.id} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                                        {a.user?.full_name || a.user?.fullName || a.full_name || a.fullName || 'Assessor'}
                                                    </span>
                                                ))
                                            ) : check.checkAssessors && check.checkAssessors.length > 0 ? (
                                                check.checkAssessors.map((ca: any) => (
                                                    <span key={ca.assessor?.id || ca.id} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                                        {ca.assessor?.full_name || ca.assessor?.fullName || 'Assessor'}
                                                    </span>
                                                ))
                                            ) : check.assessor ? (
                                                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                                    {check.assessor.full_name || check.assessor.fullName}
                                                </span>
                                            ) : '-'}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(check.finalDecision)}
                                            {check.evaluationsSubmitted !== undefined && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    {check.evaluationsSubmitted} / {check.assessors?.length}
                                                </div>
                                            )}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/checks/${check.id}`)}>
                                            <FileText className="h-4 w-4 mr-1" /> {t('checks.view')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="hidden md:block rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('checks.date')}</TableHead>
                        <TableHead>{t('checks.candidate')}</TableHead>
                        <TableHead>{t('checks.standard')}</TableHead>
                        <TableHead>{t('checks.type')}</TableHead>
                        <TableHead>{t('checks.assessors')}</TableHead>
                        <TableHead>{t('checks.status')}</TableHead>
                        <TableHead>{t('checks.progress')}</TableHead>
                        <TableHead>{t('checks.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                {t('common.loading')}
                            </TableCell>
                        </TableRow>
                    ) : filteredChecks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                {t('checks.noChecksFound')}
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredChecks.map((check) => (
                            <TableRow key={check.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {new Date(check.dateStart).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(check.dateStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {(check.candidates?.length > 1 || check.checkCandidates?.length > 1) ? (
                                        <div className="flex flex-col">
                                            <span>{t('checks.candidates')}</span>
                                            <span className="text-xs text-muted-foreground">{t('checks.multipleCandidates', { count: (check.candidates || check.checkCandidates).length })}</span>
                                        </div>
                                    ) : (
                                        // Try candidates array first, then trainee object
                                        (check.candidates?.[0]?.candidate?.fullName || check.candidates?.[0]?.candidate?.full_name) ||
                                        (check.checkCandidates?.[0]?.candidate?.fullName || check.checkCandidates?.[0]?.candidate?.full_name) ||
                                        (check.trainee?.full_name || check.trainee?.fullName) || 
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {check.trainingStandards?.code || '-'}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={check.trainingStandards?.name}>
                                            {check.trainingStandards?.name}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {check.check_type === 'full_renewal' ? t('checks.fullRenewal') : 
                                         check.check_type === 'partial' ? t('checks.partial') : 
                                         check.checkType || t('checks.standard')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {/* Handle both single assessor (legacy) and check_assessors (new) */}
                                        {check.assessors && check.assessors.length > 0 ? (
                                            check.assessors.map((a: any) => (
                                                <span key={a.id} className="text-xs bg-secondary px-2 py-0.5 rounded-full w-fit">
                                                    {a.user?.full_name || a.user?.fullName || a.full_name || a.fullName || 'Assessor'}
                                                </span>
                                            ))
                                        ) : check.checkAssessors && check.checkAssessors.length > 0 ? (
                                            check.checkAssessors.map((ca: any) => (
                                                <span key={ca.assessor?.id || ca.id} className="text-xs bg-secondary px-2 py-0.5 rounded-full w-fit">
                                                    {ca.assessor?.full_name || ca.assessor?.fullName || 'Assessor'}
                                                </span>
                                            ))
                                        ) : check.assessor ? (
                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full w-fit">
                                                {check.assessor.full_name || check.assessor.fullName}
                                            </span>
                                        ) : '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(check.finalDecision)}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        {check.evaluationsSubmitted} / {check.assessors?.length} {t('checks.evaluated')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/checks/${check.id}`)}>
                                        <FileText className="h-4 w-4 mr-1" /> {t('checks.view')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
        </div>
    );
};

export default ScheduledChecksTable;
