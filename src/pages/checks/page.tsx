import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, List, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

import EligibleTraineesTable from '@/components/checks/EligibleTraineesTable';
import ScheduledChecksTable from '@/components/checks/ScheduledChecksTable';
import ScheduleCheckModal from '@/components/checks/ScheduleCheckModal';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const ChecksPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAuditor = user?.role === 'auditor' || user?.role === 'readonly';
    const queryClient = useQueryClient();
    
    // New modal state for group check support
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [preselectedCandidates, setPreselectedCandidates] = useState<string[]>([]);
    const [preselectedStandardId, setPreselectedStandardId] = useState<string | undefined>();

    // View Mode & Calendar State — separate for each tab
    const [allocatedViewMode, setAllocatedViewMode] = useState<'table' | 'calendar'>('table');
    const [myViewMode, setMyViewMode] = useState<'table' | 'calendar'>('table');
    const [allocatedCalendarDate, setAllocatedCalendarDate] = useState(new Date());
    const [myCalendarDate, setMyCalendarDate] = useState(new Date());
    const [allocatedCalendarChecks, setAllocatedCalendarChecks] = useState<any[]>([]);
    const [myCalendarChecks, setMyCalendarChecks] = useState<any[]>([]);

    // Filter state — separate for each tab
    const [allocatedStatusFilter, setAllocatedStatusFilter] = useState('all');
    const [allocatedAssessorFilter, setAllocatedAssessorFilter] = useState('all');
    const [allocatedStandardFilter, setAllocatedStandardFilter] = useState('all');
    const [allocatedCandidateFilter, setAllocatedCandidateFilter] = useState('all');

    const [myStatusFilter, setMyStatusFilter] = useState('all');
    const [myAssessorFilter, setMyAssessorFilter] = useState('all');
    const [myStandardFilter, setMyStandardFilter] = useState('all');
    const [myCandidateFilter, setMyCandidateFilter] = useState('all');

    // All checks data for building filter options and filtering
    const [allChecks, setAllChecks] = useState<any[]>([]);
    const [myChecks, setMyChecks] = useState<any[]>([]);

    // To refresh lists after scheduling
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch all checks for filter options and calendar
    useEffect(() => {
        fetchAllChecks();
        fetchMyChecks();
    }, [refreshTrigger]);

    useEffect(() => {
        if (allocatedViewMode === 'calendar') {
            fetchAllocatedCalendarChecks();
        }
    }, [allocatedViewMode, allocatedCalendarDate, refreshTrigger]);

    useEffect(() => {
        if (myViewMode === 'calendar') {
            fetchMyCalendarChecks();
        }
    }, [myViewMode, myCalendarDate, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ['eligible-trainees'] });
        queryClient.invalidateQueries({ queryKey: ['eligible-by-standard'] });
    };

    const fetchAllChecks = async () => {
        try {
            const res = await api.get('/checks');
            setAllChecks(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch all checks", error);
        }
    };

    const fetchMyChecks = async () => {
        try {
            const res = await api.get('/checks', { params: { view: 'assigned' } });
            setMyChecks(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch my checks", error);
        }
    };

    const fetchAllocatedCalendarChecks = async () => {
        try {
            const start = startOfMonth(allocatedCalendarDate);
            const end = endOfMonth(allocatedCalendarDate);
            const res = await api.get('/checks', {
                params: {
                    fromDate: start.toISOString(),
                    toDate: end.toISOString(),
                    limit: 100
                }
            });
            setAllocatedCalendarChecks(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch calendar checks", error);
        }
    };

    const fetchMyCalendarChecks = async () => {
        try {
            const start = startOfMonth(myCalendarDate);
            const end = endOfMonth(myCalendarDate);
            const res = await api.get('/checks', {
                params: {
                    view: 'assigned',
                    fromDate: start.toISOString(),
                    toDate: end.toISOString(),
                    limit: 100
                }
            });
            setMyCalendarChecks(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch my calendar checks", error);
        }
    };

    // Extract unique filter options from checks data
    const extractFilterOptions = (checksData: any[]) => {
        const statuses = new Set<string>();
        const assessors = new Map<string, string>(); // id -> name
        const standards = new Map<string, string>(); // id -> code+name
        const candidates = new Map<string, string>(); // id -> name

        checksData.forEach(check => {
            // Status
            if (check.finalDecision) statuses.add(check.finalDecision);
            else statuses.add('pending');

            // Assessors
            if (check.checkAssessors) {
                check.checkAssessors.forEach((ca: any) => {
                    if (ca.assessor?.id) {
                        assessors.set(ca.assessor.id, ca.assessor.fullName || ca.assessor.full_name || 'Assessor');
                    }
                });
            }
            if (check.assessors) {
                check.assessors.forEach((a: any) => {
                    const id = a.user?.id || a.id;
                    const name = a.user?.fullName || a.user?.full_name || a.fullName || a.full_name || 'Assessor';
                    if (id) assessors.set(id, name);
                });
            }

            // Standards
            if (check.trainingStandards?.code) {
                standards.set(check.trainingStandards.code, `${check.trainingStandards.code} - ${check.trainingStandards.name || ''}`);
            }

            // Candidates
            if (check.checkCandidates) {
                check.checkCandidates.forEach((cc: any) => {
                    if (cc.candidate?.id) {
                        candidates.set(cc.candidate.id, cc.candidate.fullName || cc.candidate.full_name || '');
                    }
                });
            }
            if (check.candidates) {
                check.candidates.forEach((cc: any) => {
                    const c = cc.candidate || cc;
                    if (c?.id) {
                        candidates.set(c.id, c.fullName || c.full_name || '');
                    }
                });
            }
            // Legacy trainee
            if (check.trainee?.id) {
                candidates.set(check.trainee.id, check.trainee.fullName || check.trainee.full_name || '');
            }
        });

        return {
            statuses: Array.from(statuses),
            assessors: Array.from(assessors.entries()),
            standards: Array.from(standards.entries()),
            candidates: Array.from(candidates.entries())
        };
    };

    const allFilterOptions = useMemo(() => extractFilterOptions(allChecks), [allChecks]);
    const myFilterOptions = useMemo(() => extractFilterOptions(myChecks), [myChecks]);

    // Handler for EligibleTraineesTable - new signature
    const handleScheduleClick = (traineeId: string, traineeIds?: string[], standardId?: string) => {
        if (traineeIds && traineeIds.length > 0) {
            setPreselectedCandidates(traineeIds);
        } else if (traineeId) {
            setPreselectedCandidates([traineeId]);
        } else {
            setPreselectedCandidates([]);
        }
        setPreselectedStandardId(standardId);
        setIsScheduleModalOpen(true);
    };

    const openScheduleGroupCheck = () => {
        setPreselectedCandidates([]);
        setPreselectedStandardId(undefined);
        setIsScheduleModalOpen(true);
    };

    const handleModalClose = () => {
        setIsScheduleModalOpen(false);
        setPreselectedCandidates([]);
        setPreselectedStandardId(undefined);
        handleRefresh();
    };

    // Render filter bar
    const renderFilters = (
        statusFilter: string, setStatusFilter: (v: string) => void,
        assessorFilter: string, setAssessorFilter: (v: string) => void,
        standardFilter: string, setStandardFilter: (v: string) => void,
        candidateFilter: string, setCandidateFilter: (v: string) => void,
        filterOptions: ReturnType<typeof extractFilterOptions>
    ) => (
        <div className="flex flex-wrap gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                    <SelectValue placeholder={t('checks.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('checks.allStatuses')}</SelectItem>
                    {filterOptions.statuses.map(s => (
                        <SelectItem key={s} value={s}>
                            {s === 'pass' ? t('common.passed') :
                             s === 'fail' ? t('common.statusFailed') :
                             s === 'pending' ? t('checks.pending') :
                             s === 'in_progress' ? t('checks.assessing') :
                             s === 'cancelled' ? (t('common.cancelled', 'Cancelled')) : s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {filterOptions.assessors.length > 0 && (
                <Select value={assessorFilter} onValueChange={setAssessorFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-sm">
                        <SelectValue placeholder={t('checks.filterByAssessor')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('checks.allAssessors')}</SelectItem>
                        {filterOptions.assessors.map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {filterOptions.standards.length > 0 && (
                <Select value={standardFilter} onValueChange={setStandardFilter}>
                    <SelectTrigger className="w-[200px] h-9 text-sm">
                        <SelectValue placeholder={t('checks.filterByStandard')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('checks.allStandards')}</SelectItem>
                        {filterOptions.standards.map(([code, label]) => (
                            <SelectItem key={code} value={code}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {filterOptions.candidates.length > 0 && (
                <Select value={candidateFilter} onValueChange={setCandidateFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-sm">
                        <SelectValue placeholder={t('checks.filterByCandidate')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('checks.allCandidates')}</SelectItem>
                        {filterOptions.candidates.map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );

    // Render view toggle buttons
    const renderViewToggle = (
        viewMode: 'table' | 'calendar',
        setViewMode: (v: 'table' | 'calendar') => void
    ) => (
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
            >
                <List className="h-4 w-4 mr-2" />
                {t("checks.tableView", "Table View")}
            </Button>
            <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="h-8"
            >
                <LayoutGrid className="h-4 w-4 mr-2" />
                {t("checks.calendarView", "Calendar View")}
            </Button>
        </div>
    );

    // Filter checks client-side
    const filterChecks = (checksData: any[], statusFilter: string, assessorFilter: string, standardFilter: string, candidateFilter: string) => {
        return checksData.filter(check => {
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
    };

    // Render calendar view
    const renderCalendar = (
        calendarDate: Date,
        setCalendarDate: (d: Date) => void,
        calendarChecks: any[],
        statusFilter: string,
        assessorFilter: string,
        standardFilter: string,
        candidateFilter: string
    ) => {
        const calendarDays = eachDayOfInterval({
            start: startOfMonth(calendarDate),
            end: endOfMonth(calendarDate)
        });

        const filteredCalChecks = filterChecks(calendarChecks, statusFilter, assessorFilter, standardFilter, candidateFilter);

        const getChecksForDay = (day: Date) => {
            return filteredCalChecks.filter(c => isSameDay(new Date(c.dateStart), day));
        };

        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                        {format(calendarDate, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                        <Button variant="outline" size="icon" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCalendarDate(new Date())}>
                            <CalendarIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="bg-background p-2 text-center text-xs font-medium text-muted-foreground">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((day) => {
                            const dayChecks = getChecksForDay(day);
                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "bg-background p-2 min-h-[100px] hover:bg-muted/50 transition-colors cursor-pointer group relative",
                                        !isSameMonth(day, calendarDate) && "text-muted-foreground bg-muted/10",
                                        isToday(day) && "bg-blue-50/50 dark:bg-blue-900/10"
                                    )}
                                >
                                    <time dateTime={format(day, 'yyyy-MM-dd')} className={cn(
                                        "text-xs font-medium flex h-6 w-6 items-center justify-center rounded-full mb-1",
                                        isToday(day) && "bg-primary text-primary-foreground",
                                    )}>
                                        {format(day, 'd')}
                                    </time>
                                    <div className="space-y-1">
                                        {dayChecks.map(check => (
                                            <div 
                                                key={check.id} 
                                                className="text-[10px] p-1 rounded border bg-card shadow-sm truncate hover:z-10 relative cursor-pointer hover:bg-accent transition-colors"
                                                title={`${check.trainingStandards?.code || 'Check'} - ${check.trainee?.full_name || t('checks.check')}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/checks/${check.id}`);
                                                }}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="font-semibold truncate">
                                                        {check.trainingStandards?.code || check.checkType || 'Standard'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn(
                                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                                            check.finalDecision === 'pass' ? "bg-green-500" :
                                                            check.finalDecision === 'fail' ? "bg-red-500" :
                                                            "bg-amber-500"
                                                        )} />
                                                        <span className="truncate text-muted-foreground">
                                                            {(check.candidates?.length > 1 || check.checkCandidates?.length > 1) 
                                                                ? `${(check.candidates || check.checkCandidates).length} ${t('checks.candidates')}`
                                                                : (check.trainee?.full_name || check.candidates?.[0]?.candidate?.fullName || t('checks.check'))
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        );
    };


    return (
        <div className="space-y-8 w-full min-w-0">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div>
                     <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("checks.title")}</h1>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            {t("nav.checking")}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{t("checks.subtitle")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {!isAuditor && (
                    <Button onClick={openScheduleGroupCheck} className="w-full sm:w-auto">
                        <Calendar className="mr-2 h-4 w-4" /> {t("checks.scheduleGroupCheck", "Schedule Check")}
                    </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="eligible" className="w-full">
            <TabsList className="grid w-full grid-cols-1 h-auto gap-2 sm:grid-cols-3 lg:w-[600px] mb-6">
                    <TabsTrigger value="eligible">{t("checks.eligibleTrainees")}</TabsTrigger>
                    <TabsTrigger value="allocated">{t("checks.scheduledChecks")}</TabsTrigger>
                    <TabsTrigger value="my_assessments">{t("checks.myAssessments")}</TabsTrigger>
                </TabsList>

                <TabsContent value="eligible" className="mt-6">
                    <Card className="border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                        <CardHeader className="px-0 md:px-6">
                            <CardTitle>{t("checks.eligibleTrainees")}</CardTitle>
                            <CardDescription>
                                {t("checks.eligibleDescription", "Trainees who have completed training and require proficiency checks")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 md:p-6">
                            <EligibleTraineesTable 
                                onScheduleClick={handleScheduleClick}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* All Checks Tab */}
                <TabsContent value="allocated" className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div />
                        {renderViewToggle(allocatedViewMode, setAllocatedViewMode)}
                    </div>

                    {renderFilters(
                        allocatedStatusFilter, setAllocatedStatusFilter,
                        allocatedAssessorFilter, setAllocatedAssessorFilter,
                        allocatedStandardFilter, setAllocatedStandardFilter,
                        allocatedCandidateFilter, setAllocatedCandidateFilter,
                        allFilterOptions
                    )}

                    {allocatedViewMode === 'table' ? (
                        <Card className="border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                            <CardHeader className="px-0 md:px-6">
                                <CardTitle>{t("checks.scheduledChecks")}</CardTitle>
                                <CardDescription>
                                    {t("checks.scheduledDescription")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 md:p-6">
                                <ScheduledChecksTable 
                                    filter="all"
                                    refreshTrigger={refreshTrigger}
                                    statusFilter={allocatedStatusFilter}
                                    assessorFilter={allocatedAssessorFilter}
                                    standardFilter={allocatedStandardFilter}
                                    candidateFilter={allocatedCandidateFilter}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        renderCalendar(
                            allocatedCalendarDate, setAllocatedCalendarDate, allocatedCalendarChecks,
                            allocatedStatusFilter, allocatedAssessorFilter, allocatedStandardFilter, allocatedCandidateFilter
                        )
                    )}
                </TabsContent>

                {/* My Checks Tab */}
                <TabsContent value="my_assessments" className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div />
                        {renderViewToggle(myViewMode, setMyViewMode)}
                    </div>

                    {renderFilters(
                        myStatusFilter, setMyStatusFilter,
                        myAssessorFilter, setMyAssessorFilter,
                        myStandardFilter, setMyStandardFilter,
                        myCandidateFilter, setMyCandidateFilter,
                        myFilterOptions
                    )}

                    {myViewMode === 'table' ? (
                        <Card className="border-0 shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                            <CardHeader className="px-0 md:px-6">
                                <CardTitle>{t("checks.myAssessments")}</CardTitle>
                                <CardDescription>
                                    {t("checks.myAssessmentsDescription")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 md:p-6">
                                <ScheduledChecksTable 
                                    filter="my_assignments" 
                                    refreshTrigger={refreshTrigger}
                                    statusFilter={myStatusFilter}
                                    assessorFilter={myAssessorFilter}
                                    standardFilter={myStandardFilter}
                                    candidateFilter={myCandidateFilter}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        renderCalendar(
                            myCalendarDate, setMyCalendarDate, myCalendarChecks,
                            myStatusFilter, myAssessorFilter, myStandardFilter, myCandidateFilter
                        )
                    )}
                </TabsContent>


            </Tabs>

            {/* New Schedule Check Modal with group support */}
            <ScheduleCheckModal 
                isOpen={isScheduleModalOpen} 
                onClose={handleModalClose}
                preselectedCandidates={preselectedCandidates}
                preselectedStandardId={preselectedStandardId}
            />


        </div>
    );
};

export default ChecksPage;
