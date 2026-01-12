import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Plus, BookOpen, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ProgrammesTable } from "@/components/tables/ProgrammesTable"
import { ProgrammeForm } from "@/components/forms/ProgrammeForm"
import type { Programme } from "@/types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function ProgrammesPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [programmes, setProgrammes] = useState<Programme[]>([])
    const [filteredProgrammes, setFilteredProgrammes] = useState<Programme[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null)
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

    const fetchProgrammes = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/programmes")
            // Handle both array and paginated response structure
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
            setProgrammes(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch programmes:", error)
            toast.error(t("programmes.toast.loadError", "Failed to load programmes"))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProgrammes()
    }, [])

    // Filter programmes based on status
    useEffect(() => {
        if (statusFilter === "all") {
            setFilteredProgrammes(programmes)
        } else if (statusFilter === "active") {
            setFilteredProgrammes(programmes.filter(p => p.isActive))
        } else {
            setFilteredProgrammes(programmes.filter(p => !p.isActive))
        }
    }, [programmes, statusFilter])

    const handleCreate = async (values: any) => {
        try {
            console.log('[page.tsx handleCreate] Values to send:', JSON.stringify(values))
            await api.post("/programmes", values)
            toast.success(t("programmes.toast.created", "Programme created successfully"))
            fetchProgrammes()
            setIsFormOpen(false)
        } catch (error: any) {
            console.error("Failed to create programme:", error)
            const { parseApiError } = await import("@/lib/error-utils")
            toast.error(parseApiError(error) || t("programmes.toast.createError", "Failed to create programme"), { duration: 5000 })
        }
    }

    const handleUpdate = async (values: any) => {
        if (!selectedProgramme) return
        try {
            await api.patch(`/programmes/${selectedProgramme.id}`, values)
            toast.success(t("programmes.toast.updated", "Programme updated successfully"))
            fetchProgrammes()
            setIsFormOpen(false)
            setSelectedProgramme(null)
        } catch (error: any) {
            console.error("Failed to update programme:", error)
            const { parseApiError } = await import("@/lib/error-utils")
            toast.error(parseApiError(error) || t("programmes.toast.updateError", "Failed to update programme"), { duration: 5000 })
        }
    }

    const handleToggleActive = async (id: string, isActive: boolean) => {
        try {
            await api.patch(`/programmes/${id}`, { isActive })
            toast.success(isActive ? t("programmes.toast.activated", "Programme activated") : t("programmes.toast.deactivated", "Programme deactivated"))
            fetchProgrammes()
        } catch (error) {
            console.error("Failed to update programme status:", error)
            toast.error(t("programmes.toast.statusError", "Failed to update status"))
        }
    }

    const openCreateModal = () => {
        setSelectedProgramme(null)
        setIsFormOpen(true)
    }

    const openEditModal = (programme: Programme) => {
        setSelectedProgramme(programme)
        setIsFormOpen(true)
    }

    const handleView = (programme: Programme) => {
        navigate(`/programmes/${programme.id}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("programmes.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("programmes.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Select
                        value={statusFilter}
                        onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder={t("programmes.filterPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("programmes.all")}</SelectItem>
                            <SelectItem value="active">{t("programmes.active")}</SelectItem>
                            <SelectItem value="inactive">{t("programmes.inactive")}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" /> {t("programmes.addProgramme")}
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton columnCount={6} rowCount={10} />
            ) : filteredProgrammes.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title={statusFilter === "all" ? t("common.noData") : t("programmes.noProgrammes", { status: statusFilter })}
                    description={statusFilter === "all" ? t("common.getStarted") : t("programmes.tryDifferentFilter")}
                    actionLabel={t("programmes.addProgramme")}
                    onAction={openCreateModal}
                />
            ) : (
                <ProgrammesTable
                    data={filteredProgrammes}
                    onEdit={openEditModal}
                    onToggleActive={handleToggleActive}
                    onView={handleView}
                />
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedProgramme ? t("programmes.updateProgramme") : t("programmes.createProgramme")}
                        </DialogTitle>
                    </DialogHeader>
                    <ProgrammeForm
                        initialData={selectedProgramme}
                        onSubmit={selectedProgramme ? handleUpdate : handleCreate}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
