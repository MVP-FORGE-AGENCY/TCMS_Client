import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { standards } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { RevisionBadge } from "@/components/standards/RevisionBadge"
import { RevisionHistoryModal } from "@/components/standards/RevisionHistoryModal"
import { Plus, Search, BookOpen, MoreHorizontal, Pencil, Trash2, Power, PowerOff, Info, History } from "lucide-react"
import type { Standard } from "@/types"
import { format } from "date-fns"

export default function StandardsPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newStandard, setNewStandard] = useState({
        code: "",
        name: "",
        description: "",
        objectives: "", // Managed as string for textarea input
        validityMonths: 12,
        hasTheory: true,
        hasPractical: false,
        theoryPassScore: 70,
        practicalPassScore: 70,
        allowedMethods: ["written"],
        departmentTag: "",
    })

    const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)

    const canManage = user?.role && ["admin", "training_manager"].includes(user.role)
    const canDelete = user?.role === "admin"

    const { data: standardsData, isLoading } = useQuery({
        queryKey: ["standards"],
        queryFn: () => standards.list(),
    })

    const createMutation = useMutation({
        mutationFn: standards.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standards"] })
            setIsCreateOpen(false)
            setNewStandard({
                code: "",
                name: "",
                description: "",
                objectives: "",
                validityMonths: 12,
                hasTheory: true,
                hasPractical: false,
                theoryPassScore: 70,
                practicalPassScore: 70,
                allowedMethods: ["written"],
                departmentTag: "",
            })
            toast.success(t("standards.toast.created", "Standard created successfully"))
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t("standards.toast.createError", "Failed to create standard"))
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => standards.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standards"] })
            setIsToggleStatusOpen(false)
            toast.success(t("standards.toast.updated", "Standard updated successfully"))
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t("standards.toast.updateError", "Failed to update standard"))
        },
    })

    const deleteMutation = useMutation({
        mutationFn: standards.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standards"] })
            setIsDeleteDialogOpen(false)
            toast.success(t("standards.toast.deleted", "Standard deleted successfully"))
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || t("standards.toast.deleteError", "Failed to delete standard"))
        },
    })

    const filteredStandards = standardsData?.filter((std: Standard) => {
        const matchesSearch = 
            std.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (std.departmentTag && std.departmentTag.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesStatus = 
            statusFilter === "all" ? true :
            statusFilter === "active" ? std.isActive :
            !std.isActive

        return matchesSearch && matchesStatus
    }) || []

    const handleToggleStatus = (standard: Standard) => {
        setSelectedStandard(standard)
        setIsToggleStatusOpen(true)
    }

    const handleDeleteClick = (standard: Standard) => {
        setSelectedStandard(standard)
        setIsDeleteDialogOpen(true)
    }

    const handleHistoryClick = (standard: Standard) => {
        setSelectedStandard(standard)
        setIsHistoryOpen(true)
    }

    // ... existing filter logic

    return (
        <div className="space-y-6">
            {/* ... header and filters ... */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("standards.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("standards.subtitle")}
                    </p>
                </div>
                {canManage && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("standards.newStandard")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                            {/* ... Create Dialog Content ... */}
                            <DialogHeader>
                                <DialogTitle>{t("standards.createDialogTitle")}</DialogTitle>
                                <DialogDescription>
                                    {t("standards.createDialogDesc")}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="code" className="text-right">Code</Label>
                                    <Input
                                        id="code"
                                        className="col-span-3"
                                        value={newStandard.code}
                                        onChange={(e) => setNewStandard({ ...newStandard, code: e.target.value })}
                                        placeholder="e.g., SMS-INIT"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input
                                        id="name"
                                        className="col-span-3"
                                        value={newStandard.name}
                                        onChange={(e) => setNewStandard({ ...newStandard, name: e.target.value })}
                                        placeholder="e.g., Safety Management System Initial"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="description" className="text-right mt-2">Description</Label>
                                    <div className="col-span-3">
                                        <textarea
                                            id="description"
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={newStandard.description}
                                            onChange={(e) => setNewStandard({ ...newStandard, description: e.target.value })}
                                            placeholder="Enter standard description..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="objectives" className="text-right mt-2">Objectives</Label>
                                    <div className="col-span-3 space-y-2">
                                        <textarea
                                            id="objectives"
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={newStandard.objectives}
                                            onChange={(e) => setNewStandard({ ...newStandard, objectives: e.target.value })}
                                            placeholder="Enter one objective per line..."
                                        />
                                        <p className="text-xs text-muted-foreground">Separate each objective with a new line.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="validity" className="text-right">Validity (months)</Label>
                                    <Input
                                        id="validity"
                                        type="number"
                                        className="col-span-3"
                                        value={newStandard.validityMonths}
                                        onChange={(e) => setNewStandard({ ...newStandard, validityMonths: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Has Theory</Label>
                                    <div className="col-span-3 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Switch
                                                checked={newStandard.hasTheory}
                                                onCheckedChange={(checked) => setNewStandard({ ...newStandard, hasTheory: checked })}
                                            />
                                            {newStandard.hasTheory && (
                                                <div className="flex items-center gap-2">
                                                    <Label>Theory Pass %</Label>
                                                    <Input
                                                        type="number"
                                                        className="w-20"
                                                        value={newStandard.theoryPassScore}
                                                        onChange={(e) => setNewStandard({ ...newStandard, theoryPassScore: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {newStandard.hasTheory && (
                                            <div className="space-y-2 rounded-md border p-3">
                                                <Label className="text-xs font-semibold text-muted-foreground uppercase">Allowed Assessment Methods</Label>
                                                <div className="flex flex-wrap gap-4 pt-1">
                                                    {["written", "oral", "computer"].map((method) => (
                                                        <div key={method} className="flex items-center space-x-2">
                                                            <Checkbox 
                                                                id={`method-${method}`} 
                                                                checked={newStandard.allowedMethods.includes(method)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setNewStandard({
                                                                            ...newStandard,
                                                                            allowedMethods: [...newStandard.allowedMethods, method]
                                                                        })
                                                                    } else {
                                                                        setNewStandard({
                                                                            ...newStandard,
                                                                            allowedMethods: newStandard.allowedMethods.filter(m => m !== method)
                                                                        })
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`method-${method}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                                            >
                                                                {method}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                {newStandard.allowedMethods.length === 0 && (
                                                    <p className="text-xs text-destructive font-medium">At least one method must be selected</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Has Practical</Label>
                                    <div className="col-span-3 flex items-center gap-4">
                                        <Switch
                                            checked={newStandard.hasPractical}
                                            onCheckedChange={(checked) => setNewStandard({ ...newStandard, hasPractical: checked })}
                                        />
                                        {newStandard.hasPractical && (
                                            <div className="flex items-center gap-2">
                                                <Label>Pass %</Label>
                                                <Input
                                                    type="number"
                                                    className="w-20"
                                                    value={newStandard.practicalPassScore}
                                                    onChange={(e) => setNewStandard({ ...newStandard, practicalPassScore: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="dept" className="text-right">Department</Label>
                                    <Input
                                        id="dept"
                                        className="col-span-3"
                                        value={newStandard.departmentTag}
                                        onChange={(e) => setNewStandard({ ...newStandard, departmentTag: e.target.value })}
                                        placeholder="e.g., OPS, MAINT"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={() => createMutation.mutate({
                                        ...newStandard,
                                        objectives: newStandard.objectives.split('\n').filter(o => o.trim())
                                    })}
                                    disabled={
                                        createMutation.isPending || 
                                        !newStandard.code || 
                                        !newStandard.name ||
                                        (newStandard.hasTheory && newStandard.allowedMethods.length === 0)
                                    }
                                >
                                    {createMutation.isPending ? t("common.loading") : t("standards.createStandard")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("standards.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Button 
                        variant={statusFilter === "active" ? "default" : "outline"}
                        onClick={() => setStatusFilter("active")}
                        size="sm"
                    >
                        {t("standards.active")}
                    </Button>
                    <Button 
                        variant={statusFilter === "all" ? "default" : "outline"}
                        onClick={() => setStatusFilter("all")}
                        size="sm"
                    >
                        {t("standards.all")}
                    </Button>
                    <Button 
                        variant={statusFilter === "inactive" ? "default" : "outline"}
                        onClick={() => setStatusFilter("inactive")}
                        size="sm"
                    >
                        {t("standards.inactive")}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">{t("standards.code")}</TableHead>
                            <TableHead>{t("standards.name")}</TableHead>
                            <TableHead>{t("standards.description")}</TableHead>
                            <TableHead>{t("standards.objectives")}</TableHead>
                            <TableHead className="text-center">{t("standards.validity")}</TableHead>
                            <TableHead className="text-center">{t("standards.theory")}</TableHead>
                            <TableHead className="text-center">{t("standards.practical")}</TableHead>
                            <TableHead className="text-center">{t("standards.status")}</TableHead>
                            <TableHead className="text-center">{t("standards.rev")}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    Loading standards...
                                </TableCell>
                            </TableRow>
                        ) : filteredStandards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    {t("standards.noStandards")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStandards.map((standard: Standard) => (
                                <TableRow
                                    key={standard.id}
                                    className={`cursor-pointer hover:bg-muted/50 ${!standard.isActive ? "opacity-60 bg-muted/20" : ""}`}
                                    onClick={() => navigate(`/standards/${standard.id}`)}
                                >
                                    <TableCell className="font-mono font-medium">{standard.code}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            {standard.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={standard.description}>
                                        {standard.description || "-"}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                                        {standard.objectives && standard.objectives.length > 0
                                            ? `${standard.objectives.length} objectives`
                                            : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {standard.validityMonths ? `${standard.validityMonths}m` : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {standard.hasTheory ? (
                                            <Badge variant="outline" className="text-xs">
                                                {standard.theoryPassScore || 70}%
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {standard.hasPractical ? (
                                            <Badge variant="outline" className="text-xs">
                                                {standard.practicalPassScore || 70}%
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {standard.isActive ? (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                                        ) : (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge variant="secondary" className="cursor-help flex items-center justify-center gap-1 w-fit mx-auto">
                                                            Inactive
                                                            {standard.deactivatedBy && <Info className="h-3 w-3" />}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs">
                                                            <p>Deactivated by: <span className="font-semibold">{standard.deactivatedBy?.name || 'Unknown'}</span></p>
                                                            {standard.deactivatedAt && (
                                                                <p>Date: {format(new Date(standard.deactivatedAt), "PPP p")}</p>
                                                            )}
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-sm">
                                        <RevisionBadge 
                                            revision={standard.revision} 
                                            isLatest={standard.isLatestRevision} 
                                        />
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                
                                                <DropdownMenuItem onClick={() => handleHistoryClick(standard)}>
                                                    <History className="mr-2 h-4 w-4" />
                                                    History
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => navigate(`/standards/${standard.id}`)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>

                                                {canManage && (
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(standard)}>
                                                        {standard.isActive ? (
                                                            <>
                                                                <PowerOff className="mr-2 h-4 w-4" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Power className="mr-2 h-4 w-4" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                )}
                                                
                                                {canDelete && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDeleteClick(standard)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isToggleStatusOpen} onOpenChange={setIsToggleStatusOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedStandard?.isActive ? t("standards.confirmDeactivateTitle") : t("standards.confirmActivateTitle")}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedStandard?.isActive 
                                ? t("standards.confirmDeactivateDesc")
                                : t("standards.confirmActivateDesc")
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsToggleStatusOpen(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedStandard) {
                                    updateMutation.mutate({
                                        id: selectedStandard.id,
                                        data: { isActive: !selectedStandard.isActive }
                                    })
                                }
                            }}
                            className={selectedStandard?.isActive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            {selectedStandard?.isActive ? t("standards.deactivate") : t("standards.activate")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("standards.confirmDeleteTitle")}</DialogTitle>
                        <DialogDescription>
                            {t("standards.confirmDeleteDesc")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedStandard) {
                                    deleteMutation.mutate(selectedStandard.id)
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t("common.delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <RevisionHistoryModal 
                open={isHistoryOpen} 
                onOpenChange={setIsHistoryOpen} 
                standardId={selectedStandard?.id || null} 
            />
        </div>
    )
}
