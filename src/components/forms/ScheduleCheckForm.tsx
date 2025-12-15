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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { ProficiencyProfile, Employee } from "@/types"

const formSchema = z.object({
    profileId: z.string().min(1, "Profile is required"),
    traineeId: z.string().min(1, "Trainee is required"),
    assessorId: z.string().min(1, "Assessor is required"),
    dateStart: z.date({
        message: "Start date is required",
    }),
    location: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ScheduleCheckFormProps {
    profiles: ProficiencyProfile[]
    employees: Employee[]
    onSubmit: (values: FormValues) => void
    onCancel: () => void
}

export function ScheduleCheckForm({ profiles, employees, onSubmit, onCancel }: ScheduleCheckFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            profileId: "",
            traineeId: "",
            assessorId: "",
            location: "",
        },
    })

    function handleSubmit(values: FormValues) {
        // Mock validation: Check if trainee has "initial" training if profile code is not "INITIAL"
        // In a real app, this would check backend history
        const profile = profiles.find(p => p.id === values.profileId)
        if (profile && !profile.code.includes("INIT")) {
            // Simulate validation error for demo purposes if trainee is "emp3" (Bob Johnson)
            if (values.traineeId === "emp3") {
                form.setError("traineeId", {
                    type: "manual",
                    message: "Trainee has not completed initial training for this profile.",
                })
                return
            }
        }
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
                            <FormLabel>Proficiency Profile</FormLabel>
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
                                <FormLabel>Trainee</FormLabel>
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
                        name="assessorId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assessor</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select assessor" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {employees.filter(e => e.role === "Pilot").map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.fullName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <FormLabel>Date</FormLabel>
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
                                                    <span>Pick a date</span>
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
                                                date < new Date()
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
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="SIM-1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">Schedule Check</Button>
                </div>
            </form>
        </Form>
    )
}
