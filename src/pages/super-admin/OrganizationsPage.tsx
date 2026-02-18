import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { useTranslation } from "react-i18next"

export default function OrganizationsPage() {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(true)
    const [orgs, setOrgs] = useState<Organization[]>([])
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const fetchOrgs = async () => {
        setIsLoading(true)
        try {
            const data = await superAdmin.listOrganizations({ search })
            console.log("Fetched Orgs Data:", data)
            
            // Ensure organizations is an array
            if (Array.isArray(data.organizations)) {
                setOrgs(data.organizations)
            } else if (Array.isArray(data)) {
                 // Fallback if API returns array directly
                 setOrgs(data)
            } else {
                console.error("Invalid organizations data format", data)
                setOrgs([])
            }
        } catch (error) {
            console.error("Failed to fetch organizations", error)
            toast.error(t("nav.superAdmin.organizations.createModal.errorMessage"))
            setOrgs([])
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
                <h1 className="text-3xl font-bold tracking-tight">{t("nav.superAdmin.organizations.title")}</h1>
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
                    placeholder={t("nav.superAdmin.organizations.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 border rounded-md bg-muted/20">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </div>
                ) : orgs.length === 0 ? (
                    <div className="text-center py-10 border rounded-md bg-muted/20">
                        {t("nav.superAdmin.organizations.table.empty")}
                    </div>
                ) : (
                    orgs.map((org) => (
                        <Card key={org.id}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {org.name}
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground font-mono mt-1">{org.code}</div>
                                    </div>
                                    <Badge variant={
                                        org.status === 'active' ? 'default' : 
                                        org.status === 'trial' ? 'secondary' : 'destructive'
                                    }>
                                        {org.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">{t("nav.superAdmin.organizations.table.country")}</span>
                                        <span>{org.country}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">{t("nav.superAdmin.organizations.table.license")}</span>
                                        <span className="capitalize">{org.licenseType || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">{t("nav.superAdmin.organizations.table.admins")}</span>
                                        <span>{org.adminCount ?? '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">{t("nav.superAdmin.organizations.table.users")}</span>
                                        <span>{org.userCount ?? '-'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("nav.superAdmin.organizations.table.code")}</TableHead>
                            <TableHead>{t("nav.superAdmin.organizations.table.name")}</TableHead>
                            <TableHead>{t("nav.superAdmin.organizations.table.country")}</TableHead>
                            <TableHead>{t("nav.superAdmin.organizations.table.status")}</TableHead>
                            <TableHead>{t("nav.superAdmin.organizations.table.license")}</TableHead>
                            <TableHead>{t("nav.superAdmin.organizations.table.admins")}</TableHead>
                            <TableHead>{t("nav.superAdmin.organizations.table.users")}</TableHead>
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
                                    {t("nav.superAdmin.organizations.table.empty")}
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
    const { t } = useTranslation()
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
            // Set default department for the initial admin
            if (data.adminUser) {
                data.adminUser.areaOfActivity = "admin"
                data.adminUser.departmentTag = "ADMIN"
            }

            await superAdmin.createOrganization(data)
            toast.success(t("nav.superAdmin.organizations.createModal.successMessage"))
            reset()
            onSuccess()
        } catch (error: any) {
            console.error("Failed to create org", error)
            toast.error(error.response?.data?.error?.message || t("nav.superAdmin.organizations.createModal.errorMessage"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("nav.superAdmin.organizations.createButton")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t("nav.superAdmin.organizations.createModal.title")}</DialogTitle>
                    <DialogDescription>
                        {t("nav.superAdmin.organizations.createModal.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t("nav.superAdmin.organizations.createModal.nameLabel")}</Label>
                            <Input {...register("name", { required: true })} placeholder={t("nav.superAdmin.organizations.createModal.namePlaceholder")} />
                            {errors.name && <span className="text-red-500 text-xs">{t("nav.superAdmin.organizations.createModal.validation.required")}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>{t("nav.superAdmin.organizations.createModal.codeLabel")}</Label>
                            <Input {...register("code", { required: true, pattern: /^[A-Z]{2,6}$/ })} placeholder={t("nav.superAdmin.organizations.createModal.codePlaceholder")} />
                            {errors.code && <span className="text-red-500 text-xs">{t("nav.superAdmin.organizations.createModal.validation.invalidCode")}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>{t("nav.superAdmin.organizations.createModal.countryLabel")}</Label>
                            <Input {...register("country", { required: true, maxLength: 2 })} placeholder={t("nav.superAdmin.organizations.createModal.countryPlaceholder")} />
                        </div>
                         <div className="space-y-2">
                            <Label>{t("nav.superAdmin.organizations.createModal.licenseLabel")}</Label>
                            <Select onValueChange={(val) => setValue("licenseType", val)} defaultValue="trial">
                                <SelectTrigger>
                                    <SelectValue placeholder={t("nav.superAdmin.organizations.createModal.selectLicense")} />
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
                        <h3 className="text-sm font-medium mb-4">{t("nav.superAdmin.organizations.createModal.adminSectionTitle")}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t("nav.superAdmin.organizations.createModal.fullNameLabel")}</Label>
                                <Input {...register("adminUser.fullName", { required: true })} placeholder={t("nav.superAdmin.organizations.createModal.fullNamePlaceholder")} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t("nav.superAdmin.organizations.createModal.emailLabel")}</Label>
                                <Input 
                                    type="text" 
                                    {...register("adminUser.email", { 
                                        required: t("nav.superAdmin.organizations.createModal.validation.required"),
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                                            message: t("nav.superAdmin.organizations.createModal.validation.invalidEmail")
                                        }
                                    })} 
                                    placeholder={t("nav.superAdmin.organizations.createModal.emailPlaceholder")} 
                                />
                                {errors.adminUser && (errors.adminUser as any).email && <span className="text-red-500 text-xs">{(errors.adminUser as any).email.message as string}</span>}
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>{t("nav.superAdmin.organizations.createModal.tempPasswordLabel")}</Label>
                                <div className="flex gap-2">
                                    <Input {...register("adminUser.temporaryPassword", { required: true, minLength: 8 })} />
                                    <Button type="button" variant="outline" onClick={generatePassword}>{t("nav.superAdmin.organizations.createModal.generateButton")}</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("nav.superAdmin.organizations.createModal.cancelButton")}</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("nav.superAdmin.organizations.createModal.submitButton")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
