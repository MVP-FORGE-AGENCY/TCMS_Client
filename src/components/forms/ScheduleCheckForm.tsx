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
import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Check, CalendarIcon, ChevronsUpDown, X } from "lucide-react"
import type { ProficiencyProfile, Employee } from "@/types"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useState } from "react"

const formSchema = z.object({
    profileId: z.string().min(1, "Profile is required"),
    traineeId: z.string().min(1, "Trainee is required"),
    assessorIds: z.array(z.string()).min(1, "At least one assessor is required"),
    dateStart: z.date({
        message: "Start date is required",
    }),
    location: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ScheduleCheckFormProps {
    profiles: ProficiencyProfile[]
    employees: Employee[]
    onSubmit: (values: any) => void // Relaxed type to allow array if needed or handled inside
    onCancel: () => void
}

export function ScheduleCheckForm({ profiles, employees, onSubmit, onCancel }: ScheduleCheckFormProps) {
    const { t } = useTranslation()
    const [openAssessor, setOpenAssessor] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            profileId: "",
            traineeId: "",
            assessorIds: [],
            location: "",
        },
    })

    function handleSubmit(values: FormValues) {
        // Mock validation: Check if trainee has "initial" training if profile code is not "INITIAL"
        const profile = profiles.find(p => p.id === values.profileId)
        if (profile && !profile.code.includes("INIT")) {
            if (values.traineeId === "emp3") { // Demo conflict
                form.setError("traineeId", {
                    type: "manual",
                    message: "Trainee has not completed initial training for this profile.",
                })
                return
            }
        }

        // Mock Conflict Detection for Assessors
        // Example: If assessor 'emp1' is selected and date is today, warn about conflict.
        // In real app, we'd check against an API of scheduled checks.
        const conflicts = values.assessorIds.filter(id => {
             // Mock conflict logic: simple deterministic check based on ID for demo
             return id === "emp1" && values.dateStart.getDay() === 1 // Monday conflict for emp1
        })

        if (conflicts.length > 0) {
            const conflictingNames = employees.filter(e => conflicts.includes(e.id)).map(e => e.fullName).join(", ")
            toast.warning(`Scheduling conflict detected: ${conflictingNames} has another check scheduled on this day.`, {
                description: "Proceeding with schedule anyway, but please verify availability.",
                duration: 5000,
            })
            // return // Uncomment to block submission on conflict
        }

        // Transform for backend compatibility if needed (e.g. if backend expects single assessorId, pick first)
        // But we want to support multiple, so we'll pass the whole object.
        // Assuming the parent component or API handles the logic of 'assessorIds' vs 'assessorId'
        onSubmit(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="profileId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("checks.proficiencyProfile")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select profile" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {profiles.map((profile) => (
                                        <SelectItem key={profile.id} value={profile.id}>
                                            {profile.code} - {profile.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="traineeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("checks.trainee")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select trainee" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.fullName} ({emp.role})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="assessorIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("checks.assessor")}</FormLabel>
                                <Popover open={openAssessor} onOpenChange={setOpenAssessor}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between",
                                                    !field.value?.length && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value?.length > 0
                                                    ? `${field.value.length} selected`
                                                    : "Select assessors"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search assessors..." />
                                            <CommandList>
                                                <CommandEmpty>No assessor found.</CommandEmpty>
                                                <CommandGroup>
                                                    {employees
                                                        .filter(e => e.role === "Pilot" || e.role === "admin") // Assuming admins can also assess or filters are broader
                                                        .map((emp) => (
                                                        <CommandItem
                                                            value={emp.fullName}
                                                            key={emp.id}
                                                            onSelect={() => {
                                                                const current = field.value || []
                                                                const updated = current.includes(emp.id)
                                                                    ? current.filter((id) => id !== emp.id)
                                                                    : [...current, emp.id]
                                                                field.onChange(updated)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    field.value?.includes(emp.id)
                                                                        ? "opacity-100"
                                                                        : "opacity-0"
                                                                )}
                                                            />
                                                            {emp.fullName}
                                                            <span className="ml-auto text-xs text-muted-foreground">
                                                                {emp.role}
                                                            </span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {field.value?.map((id) => {
                                        const emp = employees.find(e => e.id === id)
                                        return emp ? (
                                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                                {emp.fullName}
                                                <X
                                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => {
                                                        field.onChange(field.value.filter((i) => i !== id))
                                                    }}
                                                />
                                            </Badge>
                                        ) : null
                                    })}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="dateStart"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t("common.date")}</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>{t("sessions.pickDate")}</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date: Date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("sessions.location")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("sessions.enterLocation")} {...field} />
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
                    <Button type="submit">{t("checks.scheduleCheck")}</Button>
                </div>
            </form>
        </Form>
    )
}
