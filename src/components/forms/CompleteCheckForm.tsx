import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import type { ProficiencyCheck, ProficiencyProfile } from "@/types"
import { useEffect } from "react"

const formSchema = z.object({
    dateEnd: z.string().min(1, "End date is required"),
    conditions: z.enum(["normal", "abnormal", "emergency", "mixed"]),
    elementsResults: z.record(z.string(), z.string()), // Element Name -> Result (pass/fail)
    result: z.enum(["pass", "fail"]),
    comments: z.string().optional(),
    signature: z.string().min(1, "Signature is required"),
})

type FormValues = z.infer<typeof formSchema>

interface CompleteCheckFormProps {
    check: ProficiencyCheck | null
    profile: ProficiencyProfile | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (values: any) => void
}

export function CompleteCheckForm({ check, profile, open, onOpenChange, onSubmit }: CompleteCheckFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            dateEnd: new Date().toISOString().split('T')[0],
            conditions: "mixed",
            elementsResults: {},
            result: "pass",
            comments: "",
            signature: "",
        },
    })

    // Reset form when opening
    useEffect(() => {
        if (open && check) {
            form.reset({
                dateEnd: new Date().toISOString().split('T')[0],
                conditions: "mixed",
                elementsResults: {},
                result: "pass",
                comments: "",
                signature: "",
            })
        }
    }, [open, check, form])

    // Auto-calculate result based on elements
    const elementsResults = form.watch("elementsResults")
    useEffect(() => {
        if (!profile?.requiredElements) return

        const hasFail = Object.entries(elementsResults).some(([name, result]) => {
            const isMandatory = profile.requiredElements?.[name]
            return isMandatory && result === "fail"
        })

        if (hasFail) {
            form.setValue("result", "fail")
        }
    }, [elementsResults, profile, form])

    function handleSubmit(values: FormValues) {
        // Validate all mandatory elements are assessed
        if (profile?.requiredElements) {
            const missingMandatory = Object.entries(profile.requiredElements).some(([name, isMandatory]) => {
                return isMandatory && !values.elementsResults[name]
            })

            if (missingMandatory) {
                form.setError("root", {
                    message: "All mandatory elements must be assessed.",
                })
                return
            }
        }

        onSubmit({
            ...values,
            checkId: check?.id,
        })
    }

    if (!check || !profile) return null

    const elements = profile.requiredElements
        ? Object.entries(profile.requiredElements).map(([name, isMandatory]) => ({ name, isMandatory }))
        : []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Proficiency Check</DialogTitle>
                    <DialogDescription>
                        Record results for {check.traineeId} ({profile.code})
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dateEnd"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Completion Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="conditions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conditions</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select conditions" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="abnormal">Abnormal</SelectItem>
                                                <SelectItem value="emergency">Emergency</SelectItem>
                                                <SelectItem value="mixed">Mixed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium">Element Assessment</h4>
                            <div className="rounded-md border p-4 space-y-4">
                                {elements.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No required elements defined for this profile.</p>
                                ) : (
                                    elements.map((element) => (
                                        <div key={element.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{element.name}</span>
                                                {element.isMandatory && <Badge variant="secondary" className="text-xs">Mandatory</Badge>}
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name={`elementsResults.${element.name}`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value as string}
                                                                className="flex gap-2"
                                                            >
                                                                <div className="flex items-center space-x-1">
                                                                    <RadioGroupItem value="pass" id={`${element.name}-pass`} />
                                                                    <Label htmlFor={`${element.name}-pass`} className="text-green-600">Pass</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-1">
                                                                    <RadioGroupItem value="fail" id={`${element.name}-fail`} />
                                                                    <Label htmlFor={`${element.name}-fail`} className="text-red-600">Fail</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="result"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Overall Result</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pass">Pass</SelectItem>
                                                <SelectItem value="fail">Fail</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Automatically set to Fail if any mandatory element fails.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="comments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Comments</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="signature"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Assessor Signature</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Type full name to sign" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {form.formState.errors.root && (
                            <div className="text-red-500 text-sm font-medium">
                                {form.formState.errors.root.message}
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Complete Check</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
