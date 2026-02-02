import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface RetakeCandidate {
    user: {
        id: string;
        fullName: string;
        email: string;
    };
    modules: {
        moduleId: string;
        moduleName: string;
        attempt: number;
        result: string;
    }[];
}

interface RetakeWizardProps {
    curriculumId: string;
}

export const RetakeWizard: React.FC<RetakeWizardProps> = ({ curriculumId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
    const [sessionData, setSessionData] = useState({
        dateStart: '',
        location: '',
        instructorId: ''
    });

    const queryClient = useQueryClient();

    const { data: candidates, isLoading } = useQuery({
        queryKey: ['retake-candidates', curriculumId],
        queryFn: async () => {
            const res = await api.get(`/curriculums/${curriculumId}/retake-candidates`);
            return res.data.data as RetakeCandidate[];
        },
        enabled: isOpen
    });

    const handleSchedule = async () => {
        if (!selectedCandidateId || selectedModuleIds.size === 0 || !sessionData.dateStart) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            
            if (!currentUser) {
                toast.error("User not found");
                return;
            }

            const promises = Array.from(selectedModuleIds).map(moduleId => {
                 return api.post('/sessions', {
                     curriculumId,
                     curriculumModuleId: moduleId,
                     dateStart: new Date(sessionData.dateStart).toISOString(),
                     location: sessionData.location || "TBD",
                     instructorId: currentUser.id,
                     sessionType: 'combined', 
                     capacity: 10,
                     participantIds: [selectedCandidateId]
                 });
            });

            await Promise.all(promises);
            toast.success(`Scheduled ${selectedModuleIds.size} retake sessions`);
            setIsOpen(false);
            setSessionData({ dateStart: '', location: '', instructorId: '' });
            setSelectedCandidateId(null);
            setSelectedModuleIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['retake-candidates', curriculumId] });
            
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || "Failed to schedule retakes");
        }
    };

    const toggleModule = (moduleId: string) => {
        const next = new Set(selectedModuleIds);
        if (next.has(moduleId)) next.delete(moduleId);
        else next.add(moduleId);
        setSelectedModuleIds(next);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Schedule Retake
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Schedule Retake Session</DialogTitle>
                    <DialogDescription>
                        Select a trainee and the modules they need to retake. A separate session will be created for each module.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : !candidates || candidates.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        No trainees found needing retakes.
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Trainee</Label>
                            <div className="col-span-3 space-y-2">
                                {candidates.map(candidate => (
                                    <div 
                                        key={candidate.user.id} 
                                        className={`flex items-center justify-between p-3 border rounded cursor-pointer ${selectedCandidateId === candidate.user.id ? 'border-primary bg-primary/5' : ''}`}
                                        onClick={() => {
                                            setSelectedCandidateId(candidate.user.id);
                                            setSelectedModuleIds(new Set()); 
                                        }}
                                    >
                                        <div>
                                            <div className="font-medium">{candidate.user.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{candidate.modules.length} failed module(s)</div>
                                        </div>
                                        {selectedCandidateId === candidate.user.id && <CheckIcon className="h-4 w-4 text-primary" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedCandidateId && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right mt-2">Modules</Label>
                                <div className="col-span-3 space-y-2 border rounded p-3 bg-muted/20">
                                    {candidates
                                        .find(c => c.user.id === selectedCandidateId)
                                        ?.modules.map(mod => (
                                            <div key={mod.moduleId} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={mod.moduleId} 
                                                    checked={selectedModuleIds.has(mod.moduleId)}
                                                    onCheckedChange={() => toggleModule(mod.moduleId)}
                                                />
                                                <Label htmlFor={mod.moduleId} className="flex-1 cursor-pointer">
                                                    {mod.moduleName} 
                                                    <span className="text-xs text-muted-foreground ml-2">(Attempt {mod.attempt})</span>
                                                </Label>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Start Date</Label>
                            <Input 
                                type="datetime-local" 
                                className="col-span-3"
                                value={sessionData.dateStart}
                                onChange={e => setSessionData({...sessionData, dateStart: e.target.value})}
                            />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Location</Label>
                            <Input 
                                placeholder="e.g. Simulator A" 
                                className="col-span-3"
                                value={sessionData.location}
                                onChange={e => setSessionData({...sessionData, location: e.target.value})}
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSchedule} disabled={!selectedCandidateId || selectedModuleIds.size === 0 || !sessionData.dateStart}>
                        Schedule Sessions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

function CheckIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
}
