import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreatePlanParams {
    traineeId: string;
    standardId: string;
    originalCheckId?: string;
    type: 'targeted' | 'partial' | 'full';
    description: string;
    targetCompletionDate: string;
    assignedInstructorId?: string;
}

interface RemedialPlanWizardProps {
    traineeId: string;
    standardId: string;
    failedCheckId?: string; // Optional context
    trigger?: React.ReactNode;
}

export const RemedialPlanWizard: React.FC<RemedialPlanWizardProps> = ({ 
    traineeId, 
    standardId, 
    failedCheckId,
    trigger 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<string>('targeted');
    const [description, setDescription] = useState('');
    const [targetDate, setTargetDate] = useState('');
    const [instructorId, setInstructorId] = useState('');

    const queryClient = useQueryClient();

    // Fetch instructors for assignment
    const { data: instructors } = useQuery({
        queryKey: ['instructors'],
        queryFn: () => api.get('/users?role=instructor')
    });

    const createPlan = useMutation({
        mutationFn: (data: CreatePlanParams) => api.post('/remedial-plans', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['remedial-plans'] });
            queryClient.invalidateQueries({ queryKey: ['trainee-remedial-status'] });
            toast.success("Remedial training plan created");
            setIsOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create plan");
        }
    });

    const resetForm = () => {
        setType('targeted');
        setDescription('');
        setTargetDate('');
        setInstructorId('');
    };

    const handleSubmit = () => {
        if (!description || !targetDate) {
            toast.error("Please fill in required fields");
            return;
        }

        createPlan.mutate({
            traineeId,
            standardId,
            originalCheckId: failedCheckId,
            type: type as any,
            description,
            targetCompletionDate: targetDate,
            assignedInstructorId: instructorId || undefined
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Create Remedial Plan</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Remedial Training Plan</DialogTitle>
                    <DialogDescription>
                        Define the remedial actions required to restore competence.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Remedial Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="targeted">Targeted (Specific Elements)</SelectItem>
                                <SelectItem value="partial">Partial Retraining (Modules)</SelectItem>
                                <SelectItem value="full">Full Retraining (Entire Curriculum)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Description of Required Actions</Label>
                        <Textarea 
                            placeholder="Detail specific elements or modules to be retrained..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Target Completion Date</Label>
                        <Input 
                            type="date" 
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Assign Instructor (Optional)</Label>
                        <Select value={instructorId} onValueChange={setInstructorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select instructor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {instructors?.data?.map((inst: any) => (
                                    <SelectItem key={inst.id} value={inst.id}>
                                        {inst.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={createPlan.isPending}>
                        {createPlan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Plan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
