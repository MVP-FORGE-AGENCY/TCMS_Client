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
import { CalendarIcon, Loader2, UserPlus } from "lucide-react"
import type { Session, Programme } from "@/types"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { employees } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { TraineePickerModal } from "@/components/modals/TraineePickerModal"

interface Instructor {
    id: string
    fullName: string
    role: string
}

const formSchema = z.object({
    programmeId: z.string().min(1, "Programme is required"),
    dateStart: z.date({
        message: "Start date is required",
    }),
    dateEnd: z.date().optional(),
    location: z.string().min(1, "Location is required"),
    instructorId: z.string().min(1, "Instructor is required"),
    sessionType: z.enum(["theory", "practical", "combined"]),
    capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
    participantIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface SessionFormProps {
    initialData?: Session | null
    programmes: Programme[]
    onSubmit: (values: FormValues) => void
    onCancel: () => void
}

export function SessionForm({ initialData, programmes, onSubmit, onCancel }: SessionFormProps) {
    const { t } = useTranslation()
    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [loadingInstructors, setLoadingInstructors] = useState(true)
    const [selectedParticipants, setSelectedParticipants] = useState<any[]>([])
    const [isTraineeModalOpen, setIsTraineeModalOpen] = useState(false)
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            programmeId: "",
            location: "",
            instructorId: "",
            sessionType: "combined",
            capacity: 10,
            participantIds: [],
        },
    })

    // Fetch instructors on mount
    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoadingInstructors(true)
                const response = await employees.list()
                // Filter for users who can be instructors
                const instructorRoles = ['instructor', 'training_manager', 'admin', 'assessor']
                const data = response.data || response
                const filtered = (Array.isArray(data) ? data : []).filter((u: any) => 
                    instructorRoles.includes(u.role) && u.isActive !== false
                )
                setInstructors(filtered.map((u: any) => ({
                    id: u.id,
                    fullName: u.fullName || u.full_name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
                    role: u.role
                })))
            } catch (error) {
                console.error("Failed to fetch instructors:", error)
            } finally {
                setLoadingInstructors(false)
            }
        }
        fetchInstructors()
    }, [])


    useEffect(() => {
        if (initialData) {
            form.reset({
                programmeId: initialData.programmeId,
                dateStart: new Date(initialData.dateStart),
                dateEnd: initialData.dateEnd ? new Date(initialData.dateEnd) : undefined,
                location: initialData.location,
                instructorId: initialData.instructorId,
                sessionType: initialData.sessionType,
                capacity: initialData.capacity || 10,
            })
        }
    }, [initialData, form])

    function handleSubmit(values: FormValues) {
        // Include selected participants
        onSubmit({ ...values, participantIds: selectedParticipants.map(p => p.id) })
    }


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="programmeId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("sessions.programme")}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select programme" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {programmes.filter(p => p.isActive).map((prog) => (
                                        <SelectItem key={prog.id} value={prog.id}>
                                            {prog.code} - {prog.name}
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
                        name="dateStart"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t("sessions.startDate")}</FormLabel>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "flex-1 pl-3 text-left font-normal",
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
                                                onSelect={(date) => {
                                                    if (!date) return;
                                                    const newDate = new Date(date);
                                                    // Preserve time if exists, else default 09:00
                                                    if (field.value) {
                                                        newDate.setHours(field.value.getHours(), field.value.getMinutes());
                                                    } else {
                                                        newDate.setHours(9, 0);
                                                    }
                                                    field.onChange(newDate);
                                                }}
                                                disabled={(date: Date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input 
                                        type="time"
                                        className="w-[110px]"
                                        value={field.value ? format(field.value, 'HH:mm') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const [h, m] = val.split(':').map(Number);
                                            const newDate = new Date(field.value || new Date());
                                            newDate.setHours(h, m);
                                            field.onChange(newDate);
                                        }}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="dateEnd"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>{t("sessions.endDate")}</FormLabel>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "flex-1 pl-3 text-left font-normal",
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
                                                onSelect={(date) => {
                                                    if (!date) {
                                                        field.onChange(undefined);
                                                        return;
                                                    }
                                                    const newDate = new Date(date);
                                                    if (field.value) {
                                                        newDate.setHours(field.value.getHours(), field.value.getMinutes());
                                                    } else {
                                                        newDate.setHours(17, 0); // Default end 17:00
                                                    }
                                                    field.onChange(newDate);
                                                }}
                                                disabled={(date: Date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Input 
                                        type="time" 
                                        className="w-[110px]"
                                        value={field.value ? format(field.value, 'HH:mm') : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!val) return;
                                            const [h, m] = val.split(':').map(Number);
                                            const newDate = new Date(field.value || new Date());
                                            newDate.setHours(h, m);
                                            field.onChange(newDate);
                                        }}
                                    />
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("sessions.location")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="SIM-1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("sessions.capacity")}</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="instructorId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("sessions.instructor")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger disabled={loadingInstructors}>
                                            {loadingInstructors ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Loading...</span>
                                                </div>
                                            ) : (
                                                <SelectValue placeholder="Select instructor" />
                                            )}
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {instructors.length === 0 && !loadingInstructors && (
                                            <SelectItem value="" disabled>No instructors available</SelectItem>
                                        )}
                                        {instructors.map((inst) => (
                                            <SelectItem key={inst.id} value={inst.id}>
                                                {inst.fullName} ({inst.role})
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
                        name="sessionType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("sessions.sessionType")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="theory">Theory</SelectItem>
                                        <SelectItem value="practical">Practical</SelectItem>
                                        <SelectItem value="combined">Combined</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Trainee/Participant Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Participants
                    </label>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTraineeModalOpen(true)}
                            className="w-full justify-start"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {selectedParticipants.length > 0 
                                ? `${selectedParticipants.length} trainee(s) selected` 
                                : "Add Participants..."
                            }
                        </Button>
                        {selectedParticipants.length > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedParticipants([])}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                    {selectedParticipants.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {selectedParticipants.slice(0, 5).map(p => (
                                <Badge key={p.id} variant="secondary" className="text-xs">
                                    {p.fullName}
                                </Badge>
                            ))}
                            {selectedParticipants.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{selectedParticipants.length - 5} more
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                <TraineePickerModal
                    open={isTraineeModalOpen}
                    onOpenChange={setIsTraineeModalOpen}
                    selectedIds={selectedParticipants.map(p => p.id)}
                    onSelectionChange={setSelectedParticipants}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit">
                        {initialData ? t("sessions.updateSession") : t("sessions.scheduleSession")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
