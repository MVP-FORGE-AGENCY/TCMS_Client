import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

import EligibleTraineesTable from '@/components/checks/EligibleTraineesTable';
import ScheduledChecksTable from '@/components/checks/ScheduledChecksTable';
import ScheduleCheckModal from '@/components/checks/ScheduleCheckModal';
import { ProficiencyProfilesTable } from '@/components/tables/ProficiencyProfilesTable';
import { ProfileForm } from '@/components/forms/ProfileForm';

import { useTranslation } from 'react-i18next';

const ChecksPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('eligible');
    
    // New modal state for group check support
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [preselectedCandidates, setPreselectedCandidates] = useState<string[]>([]);
    const [preselectedStandardId, setPreselectedStandardId] = useState<string | undefined>();
    
    // Profile Management State
    const [profiles, setProfiles] = useState<any[]>([]);
    const [standards, setStandards] = useState<any[]>([]);
    const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<any>(null);
    const [loadingProfiles, setLoadingProfiles] = useState(false);

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

    // Initial Data Fetch (Profiles & Standards)
    useEffect(() => {
        fetchProfiles();
        fetchStandards();
    }, [refreshTrigger]);

    const fetchProfiles = async () => {
        setLoadingProfiles(true);
        try {
            const res = await api.get('/proficiency-profiles');
            setProfiles(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch profiles", error);
            toast.error(t("checks.toast.loadError", "Failed to load proficiency profiles"));
        } finally {
            setLoadingProfiles(false);
        }
    };

    const fetchStandards = async () => {
        try {
            const res = await api.get('/standards');
            setStandards(res.data.data || res.data || []); 
        } catch (error) {
            console.error("Failed to fetch standards", error);
        }
    };

    // Profile Handlers
    const handleCreateProfile = async (values: any) => {
        try {
            await api.post('/proficiency-profiles', values);
            toast.success(t("checks.toast.profileCreated", "Profile created successfully"));
            setIsProfileFormOpen(false);
            handleRefresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || t("checks.toast.createError", "Failed to create profile"));
        }
    };

    const handleUpdateProfile = async (values: any) => {
        if (!selectedProfile) return;
        try {
            await api.put(`/proficiency-profiles/${selectedProfile.id}`, values);
            toast.success(t("checks.toast.profileUpdated", "Profile updated successfully"));
            setIsProfileFormOpen(false);
            setSelectedProfile(null);
            fetchProfiles();
            handleRefresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || t("checks.toast.updateError", "Failed to update profile"));
        }
    };

    const handleDeleteProfile = async (profile: any) => {
        if (!window.confirm(t("checks.confirmDeleteProfile", { code: profile.code }))) return;
        try {
            await api.delete(`/proficiency-profiles/${profile.id}`);
            toast.success(t("checks.toast.profileDeleted", "Profile deleted successfully"));
            fetchProfiles();
            handleRefresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || t("checks.toast.deleteError", "Failed to delete profile"));
        }
    };

    const openCreateProfile = () => {
        setSelectedProfile(null);
        setIsProfileFormOpen(true);
    };

    const openEditProfile = (profile: any) => {
        setSelectedProfile(profile);
        setIsProfileFormOpen(true);
    };

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("checks.title")}</h1>
                    <p className="text-muted-foreground text-sm">{t("checks.subtitle")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeTab === 'profiles' ? (
                        <Button onClick={openCreateProfile} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> {t("checks.createProfile")}
                        </Button>
                    ) : (
                        <Button onClick={openScheduleGroupCheck} className="w-full sm:w-auto">
                            <Calendar className="mr-2 h-4 w-4" /> {t("checks.scheduleGroupCheck", "Schedule Check")}
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="eligible" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="eligible">{t("checks.eligibleTrainees")}</TabsTrigger>
                    <TabsTrigger value="allocated">{t("checks.scheduledChecks")}</TabsTrigger>
                    <TabsTrigger value="my_assessments">{t("checks.myAssessments")}</TabsTrigger>
                    <TabsTrigger value="profiles">{t("checks.profiles")}</TabsTrigger>
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

                <TabsContent value="profiles" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("checks.profiles")}</CardTitle>
                            <CardDescription>
                                {t("checks.profilesDescription")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingProfiles ? (
                                <div className="text-center py-4">{t("checks.loadingProfiles")}</div>
                            ) : (
                                <ProficiencyProfilesTable 
                                    data={profiles}
                                    onEdit={openEditProfile}
                                    onDelete={handleDeleteProfile}
                                />
                            )}
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

            <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedProfile ? t("checks.editProfile") : t("checks.createProfile")}</DialogTitle>
                    </DialogHeader>
                    <ProfileForm 
                        initialData={selectedProfile}
                        standards={standards}
                        onSubmit={selectedProfile ? handleUpdateProfile : handleCreateProfile}
                        onCancel={() => setIsProfileFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ChecksPage;
