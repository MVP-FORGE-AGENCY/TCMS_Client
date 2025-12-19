import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
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
import type { Programme } from "@/types"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

const formSchema = z.object({
    code: z.string().min(2, {
        message: "Code must be at least 2 characters.",
    }),
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    type: z.enum(["initial", "recurrent", "refresher", "continuation"]),
    validityMonths: z.preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z.number().min(0).optional()
    ),
    durationHours: z.preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z.number().min(0).optional()
    ),
    frequencyMonths: z.preprocess(
        (val) => (val === "" || val === undefined ? undefined : Number(val)),
        z.number().min(0).optional()
    ),
    departmentTag: z.string().optional(),
    isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface ProgrammeFormProps {
    initialData?: Programme | null
    onSubmit: (values: FormValues) => void
    onCancel: () => void
}

export function ProgrammeForm({ initialData, onSubmit, onCancel }: ProgrammeFormProps) {
    const { t } = useTranslation()
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: "",
            name: "",
            type: "initial",
            validityMonths: 12,
            durationHours: 4,
            frequencyMonths: 0,
            departmentTag: "",
            isActive: true,
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                code: initialData.code,
                name: initialData.name,
                type: initialData.type,
                validityMonths: initialData.validityMonths || 0,
                durationHours: initialData.durationHours || 0,
                frequencyMonths: initialData.frequencyMonths || 0,
                departmentTag: initialData.departmentTag || "",
                isActive: initialData.isActive,
            })
        }
    }, [initialData, form])

    function handleSubmit(values: z.infer<typeof formSchema>) {
        onSubmit(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("programmes.code")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="OPC-A320" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("programmes.programmeType")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("programmes.programmeType")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="initial">Initial</SelectItem>
                                        <SelectItem value="recurrent">Recurrent</SelectItem>
                                        <SelectItem value="refresher">Refresher</SelectItem>
                                        <SelectItem value="continuation">Continuation</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("common.name")}</FormLabel>
                            <FormControl>
                                <Input placeholder="Operator Proficiency Check A320" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="validityMonths"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("programmes.validityMonths")}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="durationHours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duration (Hours)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="frequencyMonths"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frequency (Months)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="departmentTag"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("common.department")}</FormLabel>
                            <FormControl>
                                <Input placeholder="Flight Ops" {...field} />
                            </FormControl>
                            <FormDescription>Optional tag for filtering.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>{t("common.status")}</FormLabel>
                                <FormDescription>
                                    Enable or disable this programme.
                                </FormDescription>
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

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                        {initialData ? t("programmes.updateProgramme") : t("programmes.createProgramme")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
