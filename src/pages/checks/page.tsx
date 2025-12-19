import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ProficiencyProfilesTable } from "@/components/tables/ProficiencyProfilesTable"
import { ProfileForm } from "@/components/forms/ProfileForm"
import { ChecksTable } from "@/components/tables/ChecksTable"
import { ScheduleCheckForm } from "@/components/forms/ScheduleCheckForm"
import { CompleteCheckForm } from "@/components/forms/CompleteCheckForm"
import type { ProficiencyProfile, ProficiencyCheck, Employee } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function ChecksPage() {
    const { t } = useTranslation()
    const [profiles, setProfiles] = useState<ProficiencyProfile[]>([])
    const [checks, setChecks] = useState<ProficiencyCheck[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [isProfileFormOpen, setIsProfileFormOpen] = useState(false)
    const [isScheduleCheckOpen, setIsScheduleCheckOpen] = useState(false)
    const [isCompleteCheckOpen, setIsCompleteCheckOpen] = useState(false)

    const [selectedProfile, setSelectedProfile] = useState<ProficiencyProfile | null>(null)
    const [selectedCheck, setSelectedCheck] = useState<ProficiencyCheck | null>(null)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const [profilesRes, checksRes, employeesRes] = await Promise.all([
                api.get("/proficiency-profiles"),
                api.get("/checks"),
                api.get("/employees")
            ]) 

        // Handle both array and paginated response structure for profiles
        const profilesData = Array.isArray(profilesRes.data) ? profilesRes.data : (profilesRes.data?.data || [])
        setProfiles(Array.isArray(profilesData) ? profilesData : [])

        // Handle both array and paginated response structure for checks
        const checksData = Array.isArray(checksRes.data) ? checksRes.data : (checksRes.data?.data || [])
        setChecks(Array.isArray(checksData) ? checksData : [])

        // Handle both array and paginated response structure for employees
        const employeesData = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data?.data || [])
        setEmployees(Array.isArray(employeesData) ? employeesData : [])
    } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error(t("checks.toast.fetchError"))
    } finally {
        setIsLoading(false)
    }
        }

useEffect(() => {
    fetchData()
}, [])

// Profile Handlers
const handleCreateProfile = async (values: any) => {
    try {
        if (selectedProfile) {
            // Note: Spec doesn't mention PATCH /proficiency-profiles/{id}, assuming standard REST
            await api.patch(`/proficiency-profiles/${selectedProfile.id}`, values)
            toast.success(t("checks.toast.profileUpdated"))
        } else {
            await api.post("/proficiency-profiles", values)
            toast.success(t("checks.toast.profileCreated"))
        }
        fetchData()
        setIsProfileFormOpen(false)
        setSelectedProfile(null)
    } catch (error) {
        console.error("Failed to save profile:", error)
        toast.error(t("checks.toast.saveProfileError"))
    }
}

const handleEditProfile = (profile: ProficiencyProfile) => {
    setSelectedProfile(profile)
    setIsProfileFormOpen(true)
}

const handleDeleteProfile = async (profile: ProficiencyProfile) => {
    if (confirm(t("checks.confirmDeleteProfile"))) {
        try {
            // Note: DELETE /proficiency-profiles/{id} is not in the spec
            await api.delete(`/proficiency-profiles/${profile.id}`)
            toast.success(t("checks.toast.profileDeleted"))
            fetchData()
        } catch (error) {
            console.error("Failed to delete profile:", error)
            toast.error(t("checks.toast.deleteProfileError"))
        }
    }
}

// Check Handlers
const handleScheduleCheck = async (values: any) => {
    try {
        await api.post("/checks", values)
        toast.success(t("checks.toast.checkScheduled"))
        fetchData()
        setIsScheduleCheckOpen(false)
    } catch (error) {
        console.error("Failed to schedule check:", error)
        toast.error(t("checks.toast.scheduleCheckError"))
    }
}

const handleCompleteCheck = (check: ProficiencyCheck) => {
    setSelectedCheck(check)
    setIsCompleteCheckOpen(true)
}

const handleSubmitCompletion = async (values: any) => {
    if (!selectedCheck) return
    try {
        await api.patch(`/checks/${selectedCheck.id}/complete`, values)
        toast.success(t("checks.toast.checkCompleted"))
        fetchData()
        setIsCompleteCheckOpen(false)
        setSelectedCheck(null)
    } catch (error) {
        console.error("Failed to complete check:", error)
        toast.error(t("checks.toast.completeCheckError"))
    }
}

const handleViewProtocol = (check: ProficiencyCheck) => {
    // In a real app, this would open the PDF URL
    if (check.protocolUrl) {
        window.open(check.protocolUrl, "_blank")
    } else {
        toast.info(t("checks.toast.protocolNotAvailable"))
    }
}

return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t("checks.title")}</h1>
                <p className="text-muted-foreground">
                    {t("checks.subtitle")}
                </p>
            </div>
        </div>

        <Tabs defaultValue="checks" className="space-y-4">
            <TabsList>
                <TabsTrigger value="checks">{t("checks.scheduledChecks")}</TabsTrigger>
                <TabsTrigger value="profiles">{t("checks.proficiencyProfiles")}</TabsTrigger>
            </TabsList>

            <TabsContent value="checks" className="space-y-4">
                <div className="flex justify-end">
                    <Button onClick={() => setIsScheduleCheckOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t("checks.scheduleCheck")}
                    </Button>
                </div>
                {isLoading ? (
                    <TableSkeleton columnCount={6} rowCount={10} />
                ) : checks.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title={t("common.noData")}
                        description={t("common.getStarted")}
                        actionLabel={t("checks.scheduleCheck")}
                        onAction={() => setIsScheduleCheckOpen(true)}
                    />
                ) : (
                    <ChecksTable
                        data={checks}
                        onComplete={handleCompleteCheck}
                        onViewProtocol={handleViewProtocol}
                    />
                )}
            </TabsContent>

            <TabsContent value="profiles" className="space-y-4">
                <div className="flex justify-end">
                    <Button onClick={() => {
                        setSelectedProfile(null)
                        setIsProfileFormOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> {t("checks.createProfile")}
                    </Button>
                </div>
                {isLoading ? (
                    <TableSkeleton columnCount={4} rowCount={5} />
                ) : profiles.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle}
                        title={t("common.noData")}
                        description={t("common.getStarted")}
                        actionLabel={t("checks.createProfile")}
                        onAction={() => {
                            setSelectedProfile(null)
                            setIsProfileFormOpen(true)
                        }}
                    />
                ) : (
                    <ProficiencyProfilesTable
                        data={profiles}
                        onEdit={handleEditProfile}
                        onDelete={handleDeleteProfile}
                    />
                )}
            </TabsContent>
        </Tabs>

        {/* Profile Form Dialog */}
        <Dialog open={isProfileFormOpen} onOpenChange={setIsProfileFormOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{selectedProfile ? t("checks.updateProfile") : t("checks.createProfile")}</DialogTitle>
                </DialogHeader>
                <ProfileForm
                    initialData={selectedProfile}
                    onSubmit={handleCreateProfile}
                    onCancel={() => setIsProfileFormOpen(false)}
                />
            </DialogContent>
        </Dialog>

        {/* Schedule Check Dialog */}
        <Dialog open={isScheduleCheckOpen} onOpenChange={setIsScheduleCheckOpen}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{t("checks.scheduleCheckDialogTitle")}</DialogTitle>
                </DialogHeader>
                <ScheduleCheckForm
                    profiles={profiles}
                    employees={employees}
                    onSubmit={handleScheduleCheck}
                    onCancel={() => setIsScheduleCheckOpen(false)}
                />
            </DialogContent>
        </Dialog>

        {/* Complete Check Dialog */}
        <CompleteCheckForm
            check={selectedCheck}
            profile={selectedCheck ? profiles.find(p => p.id === selectedCheck.profileId) || null : null}
            open={isCompleteCheckOpen}
            onOpenChange={setIsCompleteCheckOpen}
            onSubmit={handleSubmitCompletion}
        />
    </div>
)
}
