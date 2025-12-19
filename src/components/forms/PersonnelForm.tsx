import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Employee } from "@/types"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const formSchema = z.object({
    fullName: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    role: z.string().min(1, {
        message: "Please select a role.",
    }),
    // organisationId: z.string().min(1, {
    //     message: "Please select an organisation.",
    // }),
    areaOfActivity: z.string().optional(),
    employmentStart: z.string().min(1, {
        message: "Start date is required.",
    }),
    createLoginAccount: z.boolean().optional(),
    password: z.string().optional(),
}).refine((data) => {
    if (data.createLoginAccount && !data.password) {
        return false
    }
    return true
}, {
    message: "Password is required for login account",
    path: ["password"],
})

interface PersonnelFormProps {
    initialData?: Employee | null
    onSubmit: (values: z.infer<typeof formSchema>) => void
    onCancel: () => void
}

export function PersonnelForm({ initialData, onSubmit, onCancel }: PersonnelFormProps) {
    const [createLoginAccount, setCreateLoginAccount] = useState(true)

    const { t } = useTranslation()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            role: "",
            // organisationId: "",
            areaOfActivity: "",
            employmentStart: new Date().toISOString().split("T")[0],
            createLoginAccount: true,
            password: "",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                fullName: initialData.fullName,
                email: "mock@example.com", // Mock email as it's not in the type yet
                role: initialData.role,
                // organisationId: initialData.organisationId,
                areaOfActivity: initialData.areaOfActivity || "",
                employmentStart: initialData.employmentStart,
                createLoginAccount: false, // Default to false for editing? Or maybe we shouldn't show it for editing
            })
            setCreateLoginAccount(false) // Assuming editing existing employee doesn't involve creating login account here
        }
    }, [initialData, form])

    // Update createLoginAccount state when form value changes
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "createLoginAccount") {
                setCreateLoginAccount(value.createLoginAccount as boolean)
            }
        })
        return () => subscription.unsubscribe()
    }, [form])


    async function handleSubmit(values: z.infer<typeof formSchema>) {
        onSubmit(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("common.fullName")}</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("common.email")}</FormLabel>
                            <FormControl>
                                <Input placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("common.role")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="training_manager">Manager</SelectItem>
                                        <SelectItem value="instructor">Instructor</SelectItem>
                                        <SelectItem value="employee">Trainee</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {!initialData && (
                    <FormField
                        control={form.control}
                        name="createLoginAccount"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">{t("personnel.createLoginAccount")}</FormLabel>
                                    <div className="text-sm text-muted-foreground">
                                        {t("personnel.grantAccess")}
                                    </div>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                )}

                {!initialData && createLoginAccount && (
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("common.password")}</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="areaOfActivity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("common.department")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Flight Ops" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="employmentStart"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("common.startDate")}</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                        {initialData ? t("personnel.updateEmployee") : t("personnel.createEmployee")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
