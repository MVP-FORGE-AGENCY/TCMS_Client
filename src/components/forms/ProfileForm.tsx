import { useForm, useFieldArray } from "react-hook-form"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import type { ProficiencyProfile } from "@/types"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

const formSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    intervalMonths: z.coerce.number().min(1).max(24, "Interval cannot exceed 24 months"),
    requiredAssessors: z.coerce.number().min(1),
    elements: z.array(
        z.object({
            name: z.string().min(1, "Element name is required"),
            isMandatory: z.boolean().default(false),
        })
    ),
})

type FormValues = z.infer<typeof formSchema>

interface ProfileFormProps {
    initialData?: ProficiencyProfile | null
    onSubmit: (values: any) => void
    onCancel: () => void
}

export function ProfileForm({ initialData, onSubmit, onCancel }: ProfileFormProps) {
    const { t } = useTranslation()
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            code: "",
            name: "",
            intervalMonths: 6,
            requiredAssessors: 1,
            elements: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "elements",
    })

    useEffect(() => {
        if (initialData) {
            // Convert requiredElements object to array for form
            const elementsArray = initialData.requiredElements
                ? Object.entries(initialData.requiredElements).map(([name, isMandatory]) => ({
                    name,
                    isMandatory: Boolean(isMandatory),
                }))
                : []

            form.reset({
                code: initialData.code,
                name: initialData.name,
                intervalMonths: initialData.intervalMonths,
                requiredAssessors: initialData.requiredAssessors,
                elements: elementsArray,
            })
        }
    }, [initialData, form])

    function handleSubmit(values: FormValues) {
        // Convert array back to object for API
        const requiredElements = values.elements.reduce((acc, curr) => {
            acc[curr.name] = curr.isMandatory
            return acc
        }, {} as Record<string, boolean>)

        onSubmit({
            ...values,
            requiredElements,
        })
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
                                    <Input placeholder="OPC" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("common.name")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Operator Proficiency Check" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="intervalMonths"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("checks.validityMonths")}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="requiredAssessors"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("checks.assessor")}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <FormLabel>{t("checks.elementAssessment")}</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ name: "", isMandatory: false })}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("common.add")}
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name={`elements.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder="Element name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`elements.${index}.isMandatory`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-2 space-y-0 pt-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-xs">{t("checks.mandatory")}</FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="text-red-500 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                        {initialData ? t("checks.updateProfile") : t("checks.createProfile")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
