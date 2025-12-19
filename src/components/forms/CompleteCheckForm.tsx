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
// Badge unused
import type { ProficiencyCheck, ProficiencyProfile } from "@/types"
import { useEffect } from "react"
// import { useTranslation } from "react-i18next"

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
    // const { t } = useTranslation() // Unused after refactor
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

    const assessorIds = check?.assessorIds?.length ? check.assessorIds : (check?.assessorId ? [check.assessorId] : [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Complete Proficiency Check</DialogTitle>
                    <DialogDescription>
                        Record results and details for the check.
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

                        {/* Required Elements Checklist */}
                        {profile?.requiredElements && (
                            <div className="space-y-2">
                                <Label>Required Elements</Label>
                                <div className="border rounded-md p-4 space-y-4">
                                    {Object.entries(profile.requiredElements).map(([name, description]) => (
                                        <div key={name} className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">{name}</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    {description as string}
                                                </p>
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name={`elementsResults.${name}`}
                                                render={({ field }) => (
                                                    <FormItem className="space-y-0">
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            defaultValue={field.value}
                                                            className="flex gap-2"
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="pass" id={`${name}-pass`} />
                                                                <Label htmlFor={`${name}-pass`}>Pass</Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="fail" id={`${name}-fail`} />
                                                                <Label htmlFor={`${name}-fail`}>Fail</Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Assessor Evaluations & Signatures */}
                        <div className="space-y-4">
                            <Label className="text-lg font-semibold">Assessor Evaluations & Signatures</Label>
                            {assessorIds.map((id, index) => (
                                <div key={id} className="border rounded-md p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                                    <h4 className="font-medium">Assessor {index + 1} (ID: {id})</h4>
                                    {/* In real app, name would be fetched or passed */}
                                    
                                    <FormField
                                        control={form.control}
                                        name="comments" // Shared comments for now, or could use array
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Comments / Evaluation</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder={`Evaluation notes from assessor...`} className="min-h-[80px]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="signature" // Single signature for MVP/Lead Assessor
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Signature (Type Name)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Type full name to sign" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    By typing your name, you certify that the check was conducted according to standards.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                            {assessorIds.length > 1 && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    * Currently, the Lead Assessor submits the final consolidated result.
                                </p>
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="result"
                            render={({ field }) => (
                                <FormItem>
                                    <Label>Overall Result</Label>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex gap-4 mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="pass" id="res-pass" />
                                            <Label htmlFor="res-pass" className="font-bold text-green-600">PASS</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="fail" id="res-fail" />
                                            <Label htmlFor="res-fail" className="font-bold text-red-600">FAIL</Label>
                                        </div>
                                    </RadioGroup>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
