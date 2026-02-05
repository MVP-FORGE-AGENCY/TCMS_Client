import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, List, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

import EligibleTraineesTable from '@/components/checks/EligibleTraineesTable';
import ScheduledChecksTable from '@/components/checks/ScheduledChecksTable';
import ScheduleCheckModal from '@/components/checks/ScheduleCheckModal';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const ChecksPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAuditor = user?.role === 'auditor' || user?.role === 'readonly';
    const queryClient = useQueryClient();
    
    // New modal state for group check support
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [preselectedCandidates, setPreselectedCandidates] = useState<string[]>([]);
    const [preselectedStandardId, setPreselectedStandardId] = useState<string | undefined>();

    // View Mode & Calendar State
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [calendarChecks, setCalendarChecks] = useState<any[]>([]);

    // To refresh lists after scheduling
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    useEffect(() => {
        if (viewMode === 'calendar') {
            fetchCalendarChecks();
        }
    }, [viewMode, calendarDate, refreshTrigger]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ['eligible-trainees'] });
        queryClient.invalidateQueries({ queryKey: ['eligible-by-standard'] });
    };

    const fetchCalendarChecks = async () => {
        try {
            const start = startOfMonth(calendarDate);
            const end = endOfMonth(calendarDate);
            const res = await api.get('/checks', {
                params: {
                    fromDate: start.toISOString(),
                    toDate: end.toISOString(),
                    limit: 100
                }
            });
            setCalendarChecks(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch calendar checks", error);
        }
    };

    const calendarDays = eachDayOfInterval({
        start: startOfMonth(calendarDate),
        end: endOfMonth(calendarDate)
    });

    const getChecksForDay = (day: Date) => {
        return calendarChecks.filter(c => isSameDay(new Date(c.dateStart), day));
    };

    // Handler for EligibleTraineesTable - new signature
    const handleScheduleClick = (traineeId: string, traineeIds?: string[], standardId?: string) => {
        if (traineeIds && traineeIds.length > 0) {
            // Bulk scheduling
            setPreselectedCandidates(traineeIds);
        } else if (traineeId) {
            // Single trainee
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



    return (
        <div className="container mx-auto py-6 space-y-8">
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
            <TabsList className="flex flex-wrap h-auto sm:grid sm:w-full sm:grid-cols-3 lg:w-[600px] mb-6">
                    <TabsTrigger value="eligible">{t("checks.eligibleTrainees")}</TabsTrigger>
                    <TabsTrigger value="allocated">{t("checks.scheduledChecks")}</TabsTrigger>
                    <TabsTrigger value="my_assessments">{t("checks.myAssessments")}</TabsTrigger>
                </TabsList>

                <TabsContent value="eligible" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("checks.eligibleTrainees")}</CardTitle>
                            <CardDescription>
                                {t("checks.eligibleDescription", "Trainees who have completed training and require proficiency checks")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EligibleTraineesTable 
                                onScheduleClick={handleScheduleClick}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="allocated" className="mt-6">
                    <div className="flex justify-end mb-4">
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
                    </div>

                    {viewMode === 'table' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("checks.scheduledChecks")}</CardTitle>
                                <CardDescription>
                                    {t("checks.scheduledDescription")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScheduledChecksTable 
                                    filter="all"
                                    refreshTrigger={refreshTrigger} 
                                />
                            </CardContent>
                        </Card>
                    ) : (
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
                                    {calendarDays.map((day, _dayIdx) => {
                                        const dayChecks = getChecksForDay(day);
                                        return (
                                            <div
                                                key={day.toString()}
                                                className={cn(
                                                    "bg-background p-2 min-h-[100px] hover:bg-muted/50 transition-colors cursor-pointer group relative",
                                                    !isSameMonth(day, calendarDate) && "text-muted-foreground bg-muted/10",
                                                    isToday(day) && "bg-blue-50/50 dark:bg-blue-900/10"
                                                )}
                                                onClick={() => {
                                                    // Optional: Open day view or add check for this day
                                                }}
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
                                                            className="text-[10px] p-1 rounded border bg-card shadow-sm truncate hover:z-10 relative"
                                                            title={`${check.checkType || 'Check'} - ${check.trainee?.full_name || 'Trainee'}`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <span className={cn(
                                                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                                                    check.finalDecision === 'pass' ? "bg-green-500" :
                                                                    check.finalDecision === 'fail' ? "bg-red-500" :
                                                                    "bg-amber-500"
                                                                )} />
                                                                <span className="truncate font-medium">{check.trainee?.full_name || 'Trainee'}</span>
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
                    )}
                </TabsContent>

                <TabsContent value="my_assessments" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("checks.myAssessments")}</CardTitle>
                            <CardDescription>
                                {t("checks.myAssessmentsDescription")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScheduledChecksTable 
                                filter="my_assignments" 
                                refreshTrigger={refreshTrigger}
                            />
                        </CardContent>
                    </Card>
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
