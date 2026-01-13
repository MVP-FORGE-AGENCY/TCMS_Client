import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PersonnelTable } from "@/components/tables/PersonnelTable"
import { PersonnelForm } from "@/components/forms/PersonnelForm"
import { PersonnelHistoryModal } from "@/components/PersonnelHistoryModal"
import type { Employee } from "@/types"
import { api, auth, employees as employeesApi } from "@/lib/api"
import { toast } from "sonner"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"

export default function PersonnelPage() {
    const { t } = useTranslation()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

    const fetchEmployees = async () => {
        try {
            setIsLoading(true)
            const response = await api.get("/employees")
            // Handle both array and paginated response structure
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
            setEmployees(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error("Failed to fetch employees:", error)
            toast.error("Failed to load personnel data")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    const { user } = useAuth()

    const handleCreate = async (values: any) => {
        try {
            const payload = {
                ...values,
                organisationId: user?.organisationId
            }
            
            if (values.createLoginAccount) {
                await auth.register(payload)
            } else {
                // Remove password and createLoginAccount from payload for employee creation
                const { password, createLoginAccount, ...employeeData } = payload
                await employeesApi.create(employeeData)
            }
            
            toast.success(t("personnel.toast.created", "Employee created successfully"))
            fetchEmployees()
            setIsFormOpen(false)
        } catch (error) {
            console.error("Failed to create employee:", error)
            toast.error(t("personnel.toast.createError", "Failed to create employee"))
        }
    }

    const handleUpdate = async (values: any) => {
        if (!selectedEmployee) return
        try {
            // Note: PATCH /employees/{id} is not in the spec, assuming standard REST
            await api.patch(`/employees/${selectedEmployee.id}`, values)
            toast.success(t("personnel.toast.updated", "Employee updated successfully"))
            fetchEmployees()
            setIsFormOpen(false)
            setSelectedEmployee(null)
        } catch (error) {
            console.error("Failed to update employee:", error)
            toast.error(t("personnel.toast.updateError", "Failed to update employee"))
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm(t("common.confirmDelete"))) {
            try {
                // Note: DELETE /employees/{id} is not in the spec, assuming standard REST
                await api.delete(`/employees/${id}`)
                toast.success(t("personnel.toast.deleted", "Employee deleted successfully"))
                fetchEmployees()
            } catch (error) {
                console.error("Failed to delete employee:", error)
                toast.error(t("personnel.toast.deleteError", "Failed to delete employee"))
            }
        }
    }

    const navigate = useNavigate()

    const openCreateModal = () => {
        setSelectedEmployee(null)
        setIsFormOpen(true)
    }

    const openEditModal = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsFormOpen(true)
    }

    // Navigate to full page history (Dossier)
    const viewHistory = (employee: Employee) => {
        navigate(`/employees/${employee.id}/history`)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("personnel.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("personnel.subtitle")}
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="mr-2 h-4 w-4" /> {t("personnel.addEmployee")}
                </Button>
            </div>

            {isLoading ? (
                <TableSkeleton columnCount={5} rowCount={10} />
            ) : employees.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={t("common.noData")}
                    description={t("common.getStarted")}
                    actionLabel={t("personnel.addEmployee")}
                    onAction={openCreateModal}
                />
            ) : (
                <PersonnelTable
                    data={employees}
                    onEdit={openEditModal}
                    onViewHistory={viewHistory}
                    onDelete={handleDelete}
                />
            )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedEmployee ? t("personnel.edit") : t("personnel.addEmployee")}
                        </DialogTitle>
                    </DialogHeader>
                    <PersonnelForm
                        initialData={selectedEmployee}
                        onSubmit={selectedEmployee ? handleUpdate : handleCreate}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <PersonnelHistoryModal
                employee={selectedEmployee}
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
            />
        </div>
    )
}
