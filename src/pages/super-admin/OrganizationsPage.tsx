import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { superAdmin } from "@/lib/api"
import type { Organization } from "@/types"
import { Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

export default function OrganizationsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [orgs, setOrgs] = useState<Organization[]>([])
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const fetchOrgs = async () => {
        setIsLoading(true)
        try {
            const data = await superAdmin.listOrganizations({ search })
            setOrgs(data.organizations || [])
        } catch (error) {
            console.error("Failed to fetch organizations", error)
            toast.error("Failed to load organizations")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrgs()
    }, [search]) // Debounce ideally, but for now direct dependency

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
                <CreateOrgModal 
                    open={isCreateOpen} 
                    onOpenChange={setIsCreateOpen} 
                    onSuccess={() => {
                        setIsCreateOpen(false)
                        fetchOrgs()
                    }} 
                />
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search organizations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>License</TableHead>
                            <TableHead>Admins</TableHead>
                            <TableHead>Users</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : orgs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No organizations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orgs.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">{org.code}</TableCell>
                                    <TableCell>{org.name}</TableCell>
                                    <TableCell>{org.country}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            org.status === 'active' ? 'default' : 
                                            org.status === 'trial' ? 'secondary' : 'destructive'
                                        }>
                                            {org.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{org.licenseType || '-'}</TableCell>
                                    <TableCell>{org.adminCount ?? '-'}</TableCell>
                                    <TableCell>{org.userCount ?? '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function CreateOrgModal({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Generate random password
    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
        let pass = ""
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setValue("adminUser.temporaryPassword", pass)
    }

    const onSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            await superAdmin.createOrganization(data)
            toast.success("Organization created successfully")
            reset()
            onSuccess()
        } catch (error: any) {
            console.error("Failed to create org", error)
            toast.error(error.response?.data?.error?.message || "Failed to create organization")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organization
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                        Set up a new tenant and provision the first admin user.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input {...register("name", { required: true })} placeholder="Acme Aviation" />
                            {errors.name && <span className="text-red-500 text-xs">Required</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>Code (2-6 Uppercase)</Label>
                            <Input {...register("code", { required: true, pattern: /^[A-Z]{2,6}$/ })} placeholder="ACME" />
                            {errors.code && <span className="text-red-500 text-xs">Invalid code format</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>Country (ISO 2-char)</Label>
                            <Input {...register("country", { required: true, maxLength: 2 })} placeholder="US" />
                        </div>
                         <div className="space-y-2">
                            <Label>License Type</Label>
                            <Select onValueChange={(val) => setValue("licenseType", val)} defaultValue="trial">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select license" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-sm font-medium mb-4">Initial Admin Administrator</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input {...register("adminUser.fullName", { required: true })} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" {...register("adminUser.email", { required: true })} placeholder="admin@acme.com" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Temporary Password</Label>
                                <div className="flex gap-2">
                                    <Input {...register("adminUser.temporaryPassword", { required: true, minLength: 8 })} />
                                    <Button type="button" variant="outline" onClick={generatePassword}>Generate</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Organization
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
