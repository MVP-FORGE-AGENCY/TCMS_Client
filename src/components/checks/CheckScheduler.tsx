import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";


export const CheckScheduler: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        traineeId: '',
        profileId: '',
        dateStart: '',
        location: '',
        assessorId: '' // Initial assessor
    });

    // Queries for dropdowns
    const { data: trainees } = useQuery({
        queryKey: ['users', 'trainees'],
        queryFn: async () => {
             // In real app, might want a specific endpoint for eligible trainees
             // For now, list all users or specific role
             const res = await api.get('/users?role=trainee'); // Assuming this endpoint handles role filter
             return res.data.data;
        },
        enabled: isOpen
    });

    const { data: profiles } = useQuery({
        queryKey: ['proficiency-profiles'],
        queryFn: async () => {
            // Need an endpoint for profiles. Assuming we have one or mock it.
            // Using /curriculums as placeholder if no profiles endpoint? 
            // WAIT, existing schema had `proficiency_profiles`. 
            // I should use `api.get('/proficiency-profiles')` IF I create that route or reuse existing.
            // `app.js` has `apiRouter.use('/proficiency-profiles', proficiencyProfilesRoutes);`
            // Let's assume it works.
            const res = await api.get('/proficiency-profiles'); 
            return res.data;
        },
        enabled: isOpen
    });

    const { data: assessors } = useQuery({
        queryKey: ['users', 'assessors'],
        queryFn: async () => {
             const res = await api.get('/users?role=instructor'); // Instructors act as assessors
             return res.data.data;
        },
        enabled: isOpen
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Check
            const checkRes = await api.post('/checks', {
                traineeId: formData.traineeId,
                profileId: formData.profileId,
                dateStart: new Date(formData.dateStart).toISOString(),
                location: formData.location
            });
            const checkId = checkRes.data.data.id;

            // 2. Assign Assessor
            if (formData.assessorId) {
                await api.post(`/checks/${checkId}/assessors`, {
                    assessorId: formData.assessorId
                });
            }
            return checkRes.data;
        },
        onSuccess: () => {
            toast.success("Check scheduled successfully");
            setIsOpen(false);
            setFormData({
                traineeId: '',
                profileId: '',
                dateStart: '',
                location: '',
                assessorId: ''
            });
            queryClient.invalidateQueries({ queryKey: ['proficiency-checks'] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to schedule check");
        }
    });

    const handleSubmit = () => {
        if (!formData.traineeId || !formData.profileId || !formData.dateStart || !formData.assessorId) {
            toast.error("Please fill all required fields");
            return;
        }
        createMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Check
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Schedule Proficiency Check</DialogTitle>
                    <DialogDescription>
                        Create a new periodic check session.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Trainee</Label>
                        <Select 
                            value={formData.traineeId} 
                            onValueChange={(v) => setFormData({...formData, traineeId: v})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select trainee" />
                            </SelectTrigger>
                            <SelectContent>
                                {trainees?.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id}>{t.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Check Profile</Label>
                        <Select 
                            value={formData.profileId} 
                            onValueChange={(v) => setFormData({...formData, profileId: v})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select profile" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles?.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Primary Assessor</Label>
                        <Select 
                            value={formData.assessorId} 
                            onValueChange={(v) => setFormData({...formData, assessorId: v})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select assessor" />
                            </SelectTrigger>
                            <SelectContent>
                                {assessors?.map((a: any) => (
                                    <SelectItem key={a.id} value={a.id}>{a.fullName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Note: System will check for conflict of interest (recent instruction).
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Date & Time</Label>
                        <Input 
                            type="datetime-local" 
                            value={formData.dateStart}
                            onChange={(e) => setFormData({...formData, dateStart: e.target.value})}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Location</Label>
                        <Input 
                            placeholder="e.g. Simulator Bay 2" 
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Scheduling..." : "Schedule Check"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
