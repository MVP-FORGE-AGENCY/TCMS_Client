
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { standards } from '@/lib/api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

const formSchema = z.object({
    code: z.string().min(1, 'Code is required').max(20),
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
})

interface StandardCreationDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: (standard: any) => void
    initialCode?: string
}

export const StandardCreationDialog = ({ isOpen, onClose, onSuccess, initialCode }: StandardCreationDialogProps) => {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: initialCode || '',
            name: '',
            description: '',
        },
    })

    // Reset form when opening with new initialCode
    React.useEffect(() => {
        if (isOpen && initialCode) {
            form.reset({
                code: initialCode,
                name: '',
                description: '',
            })
        }
    }, [isOpen, initialCode, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setIsSubmitting(true)
            const newStandard = await standards.create(values)
            toast.success(t('standards.createSuccess', 'Standard created successfully'))
            onSuccess(newStandard)
            onClose()
        } catch (error: any) {
            console.error('Failed to create standard:', error)
            const message = error.response?.data?.error?.message || t('errors.createError', 'Failed to create standard')
            toast.error(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('standards.createNew', 'Create New Standard')}</DialogTitle>
                    <DialogDescription>
                        {t('standards.createDescription', 'Add a new training standard to the system.')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('standards.code', 'Code / Abbreviation')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. EASA-LVO" {...field} />
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
                                    <FormLabel>{t('standards.name', 'Full Name')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Low Visibility Operations" {...field} />
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
                                    <FormLabel>{t('standards.description', 'Description (Optional)')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Brief description..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? t('common.saving', 'Saving...') : t('common.create', 'Create')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
