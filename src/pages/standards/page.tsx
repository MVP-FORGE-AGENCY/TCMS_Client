import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { standards } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
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
import { Plus, Search, BookOpen } from "lucide-react"

interface Standard {
    id: string
    code: string
    name: string
    description?: string
    validityMonths?: number
    hasTheory: boolean
    hasPractical: boolean
    theoryPassScore?: number
    practicalPassScore?: number
    isActive: boolean
    revision: number
    departmentTag?: string
    createdAt: string
}

export default function StandardsPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newStandard, setNewStandard] = useState({
        code: "",
        name: "",
        description: "",
        validityMonths: 12,
        hasTheory: true,
        hasPractical: false,
        theoryPassScore: 70,
        practicalPassScore: 70,
        departmentTag: "",
    })

    const canManage = user?.role && ["admin", "training_manager"].includes(user.role)

    const { data: standardsData, isLoading } = useQuery({
        queryKey: ["standards"],
        queryFn: () => standards.list(),
    })

    const createMutation = useMutation({
        mutationFn: (data: typeof newStandard) => standards.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["standards"] })
            setIsCreateOpen(false)
            setNewStandard({
                code: "",
                name: "",
                description: "",
                validityMonths: 12,
                hasTheory: true,
                hasPractical: false,
                theoryPassScore: 70,
                practicalPassScore: 70,
                departmentTag: "",
            })
            toast.success("Standard created successfully")
        },
        onError: async (error: any) => {
            const { parseApiError } = await import("@/lib/error-utils")
            toast.error(parseApiError(error), { duration: 5000 })
        },
    })

    const filteredStandards = (standardsData || []).filter((s: Standard) =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Training Standards</h1>
                    <p className="text-muted-foreground">
                        Define competence requirements and pass criteria
                    </p>
                </div>
                {canManage && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Standard
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create Training Standard</DialogTitle>
                                <DialogDescription>
                                    Define a new training standard with pass criteria
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
                                    <div className="col-span-3 flex items-center gap-4">
                                        <Switch
                                            checked={newStandard.hasTheory}
                                            onCheckedChange={(checked) => setNewStandard({ ...newStandard, hasTheory: checked })}
                                        />
                                        {newStandard.hasTheory && (
                                            <div className="flex items-center gap-2">
                                                <Label>Pass %</Label>
                                                <Input
                                                    type="number"
                                                    className="w-20"
                                                    value={newStandard.theoryPassScore}
                                                    onChange={(e) => setNewStandard({ ...newStandard, theoryPassScore: parseInt(e.target.value) })}
                                                />
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
                                    onClick={() => createMutation.mutate(newStandard)}
                                    disabled={createMutation.isPending || !newStandard.code || !newStandard.name}
                                >
                                    {createMutation.isPending ? "Creating..." : "Create Standard"}
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
                        placeholder="Search standards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-center">Validity</TableHead>
                            <TableHead className="text-center">Theory</TableHead>
                            <TableHead className="text-center">Practical</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Rev</TableHead>
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
                                    No standards found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStandards.map((standard: Standard) => (
                                <TableRow
                                    key={standard.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/standards/${standard.id}`)}
                                >
                                    <TableCell className="font-mono font-medium">{standard.code}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                                            {standard.name}
                                        </div>
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
                                            <Badge variant="default" className="bg-green-600">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-sm">
                                        v{standard.revision}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
