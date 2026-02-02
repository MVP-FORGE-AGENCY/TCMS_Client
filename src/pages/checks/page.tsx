import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

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

    // To refresh lists after scheduling
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
        queryClient.invalidateQueries({ queryKey: ['eligible-trainees'] });
        queryClient.invalidateQueries({ queryKey: ['eligible-by-standard'] });
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
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("checks.title")}</h1>
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[600px]">
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
