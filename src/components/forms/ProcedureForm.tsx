import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "react-i18next"

const formSchema = z.object({
    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }),
    description: z.string().optional(),
    content: z.string().min(10, {
        message: "Content must be at least 10 characters.",
    }),
})

interface ProcedureFormProps {
    initialData?: {
        title: string
        description: string
        content: string
    }
    onSubmit: (values: z.infer<typeof formSchema>) => void
    onCancel: () => void
    isLoading?: boolean
}

export function ProcedureForm({ initialData, onSubmit, onCancel, isLoading }: ProcedureFormProps) {
    const { t } = useTranslation()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: initialData?.title || "",
            description: initialData?.description || "",
            content: initialData?.content || "",
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("procedures.form.title") || "Title"}</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Training Process" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("procedures.form.description") || "Description"}</FormLabel>
                            <FormControl>
                                <Input placeholder="Brief summary of the procedure" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("procedures.form.content") || "Content (Markdown)"}</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="# Heading\n\nContent..." 
                                    className="min-h-[300px] font-mono text-sm"
                                    {...field} 
                                />
                            </FormControl>
                            <FormDescription>
                                {t("procedures.form.markdownHint") || "Supports Markdown formatting."}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? t("common.saving") : t("common.save")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
