import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ScheduleCheckModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialProfileId?: string;
    initialTraineeId?: string;
    initialTraineeName?: string;
}

const ScheduleCheckModal: React.FC<ScheduleCheckModalProps> = ({ 
    open, onOpenChange, onSuccess, initialProfileId, initialTraineeId, initialTraineeName
}) => {
    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [trainees, setTrainees] = useState<any[]>([]);
    const [assessors, setAssessors] = useState<any[]>([]);
    
    // Form State
    const [profileId, setProfileId] = useState(initialProfileId || '');
    
    // Trainee State: Single (string) or Group (array)
    // If initialTraineeId is present, we are in "Single Mode" (fixed trainee).
    // If not, we are in "Group Mode" (multi-select).
    const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);
    
    const [selectedAssessors, setSelectedAssessors] = useState<string[]>([]);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('10:00');
    const [location, setLocation] = useState('');
    const [isRetake, setIsRetake] = useState(false);
    const [checkType, setCheckType] = useState('combined');

    // Derived
    const isSingleMode = !!initialTraineeId;


    // Fetch Profiles & Assessors on distinct mounts or open
    useEffect(() => {
        if (open) {
            fetchProfiles();
            fetchAssessors();
            // Reset if not provided
            if (!initialProfileId) setProfileId('');
            
            if (initialTraineeId) {
                setSelectedTraineeIds([initialTraineeId]);
            } else {
                setSelectedTraineeIds([]);
            }
            
            setSelectedAssessors([]);
            setDate(new Date());
            setTime('10:00');
            setLocation('');
            setIsRetake(false);
        }
    }, [open, initialProfileId, initialTraineeId]);

    // Fetch Trainees when Profile changes (Only needed for Group Mode)
    useEffect(() => {
        if (profileId && !isSingleMode) {
            fetchEligibleTrainees(profileId);
        } else if (!profileId) {
            setTrainees([]);
        }
    }, [profileId, isSingleMode]);

    const fetchProfiles = async () => {
        try {
            const res = await api.get('/proficiency-profiles');
            setProfiles(res.data.data);
            if (initialProfileId) setProfileId(initialProfileId);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAssessors = async () => {
        try {
            // Fetch users with role assessor or training_manager
            // Endpoint is /employees (mounted at root of api v1)
            // Default limit is 20, we need more to filter client side effectively
            const allRes = await api.get('/employees', { params: { limit: 100 } });
            
            // Response structure is { data: [...], pagination: {...} }
            const users = allRes.data.data || [];
            
            // Filter: Assessor or Training Manager (or Admin)
            const filtered = users.filter((u: any) => 
                ['assessor', 'training_manager', 'admin'].includes(u.role)
            );
            setAssessors(filtered);
        } catch (error) {
            console.error("Failed to fetch assessors", error);
        }
    };
    

    const fetchEligibleTrainees = async (pId: string) => {
        try {
            const res = await api.get('/checks/eligible', { params: { profileId: pId, withinDays: 365 } }); 
            setTrainees(res.data.trainees);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        if (!processForm()) return;

        setLoading(true);
        try {
            // Combine date and time
            const dateStart = new Date(date!);
            const [hours, minutes] = time.split(':').map(Number);
            dateStart.setHours(hours, minutes);

            // Loop through selected trainees and create a check for each
            const promises = selectedTraineeIds.map(tId => 
                api.post('/checks', {
                    profileId,
                    traineeId: tId,
                    assessorIds: selectedAssessors,
                    dateStart: dateStart.toISOString(),
                    location,
                    checkType
                })
            );

            await Promise.all(promises);

            toast.success(`Scheduled ${selectedTraineeIds.length} check(s) successfully`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            // Handle error (show first error?)
             if (error.response?.status === 409) {
                toast.error(`Conflict of Interest: ${error.response.data.error.message}`);
            } else {
                toast.error('Failed to schedule checks');
            }
        } finally {
            setLoading(false);
        }
    };

    const processForm = () => {
        if (!profileId) { toast.error('Select a profile'); return false; }
        if (selectedTraineeIds.length === 0) { toast.error('Select at least one trainee'); return false; }
        if (selectedAssessors.length === 0) { toast.error('Select at least one assessor'); return false; }
        if (!date) { toast.error('Select a date'); return false; }
        
        // Check profile requirements
        const selectedProfile = profiles.find(p => p.id === profileId);
        if (selectedProfile && selectedAssessors.length < selectedProfile.requiredAssessors) {
             toast.error(`This profile requires at least ${selectedProfile.requiredAssessors} assessors`);
             return false;
        }
        
        return true;
    };

    const toggleAssessor = (id: string) => {
        setSelectedAssessors(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleTrainee = (id: string) => {
        if (isSingleMode) return; // Cannot toggle in single mode
        setSelectedTraineeIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };
    
    // Select all available trainees
    const selectAllTrainees = () => {
        if (isSingleMode) return;
        const allIds = trainees.map(t => t.userId);
        if (selectedTraineeIds.length === allIds.length) {
            setSelectedTraineeIds([]);
        } else {
            setSelectedTraineeIds(allIds);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{isSingleMode ? 'Schedule Proficiency Check' : 'Schedule Group Check'}</DialogTitle>
                    <DialogDescription>Assign assessors and schedule checks for selected trainees.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 px-6 py-2 overflow-y-auto flex-1">
                    {/* Profile & Standard */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Profile</label>
                        <Select value={profileId} onValueChange={setProfileId} disabled={!!initialProfileId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select profile" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.code} - {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {profileId && (
                             <div className="text-sm text-muted-foreground mt-1">
                                <span className="font-semibold">Standard:</span> {profiles.find(p => p.id === profileId)?.standard?.code} - {profiles.find(p => p.id === profileId)?.standard?.name}
                                <span className="ml-4"><span className="font-semibold">Req. Assessors:</span> {profiles.find(p => p.id === profileId)?.requiredAssessors}</span>
                             </div>
                        )}
                    </div>

                    {/* Check Type */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Check Type</label>
                         <div className="flex space-x-4 pt-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="type-combined" checked={checkType === 'combined'} onCheckedChange={() => setCheckType('combined')} />
                                <label htmlFor="type-combined" className="text-sm">Combined</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="type-theory" checked={checkType === 'theory'} onCheckedChange={() => setCheckType('theory')} />
                                <label htmlFor="type-theory" className="text-sm">Theory</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="type-practical" checked={checkType === 'practical'} onCheckedChange={() => setCheckType('practical')} />
                                <label htmlFor="type-practical" className="text-sm">Practical</label>
                            </div>
                        </div>
                    </div>

                    {/* Trainee Selection */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Trainees {selectedTraineeIds.length > 0 && `(${selectedTraineeIds.length})`}</label>
                        
                        {isSingleMode ? (
                            <div className="p-2 border rounded-md bg-muted/50 text-sm">
                                {initialTraineeName || trainees.find(t => t.userId === initialTraineeId)?.fullName || 'Loading...'}
                            </div>
                        ) : (
                            <div className="border rounded-md">
                                <div className="p-2 border-b bg-muted/20 flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Select Eligible Trainees</span>
                                    <Button variant="ghost" size="sm" onClick={selectAllTrainees} className="h-6 text-xs">
                                        {selectedTraineeIds.length === trainees.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                <div className="p-2 h-[150px] overflow-y-auto space-y-1">
                                    {trainees.length === 0 ? (
                                        <div className="text-sm text-muted-foreground p-2">Select a profile to see eligible trainees.</div>
                                    ) : (
                                        trainees.map(t => (
                                            <div key={t.userId} className="flex items-center space-x-2 p-1 hover:bg-muted/50 rounded">
                                                <Checkbox 
                                                    id={`trainee-${t.userId}`} 
                                                    checked={selectedTraineeIds.includes(t.userId)}
                                                    onCheckedChange={() => toggleTrainee(t.userId)}
                                                />
                                                <label htmlFor={`trainee-${t.userId}`} className="flex-1 text-sm cursor-pointer">
                                                    <span className="font-medium">{t.fullName}</span>
                                                    <span className="text-muted-foreground text-xs ml-2">({t.department || 'N/A'})</span>
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Assessors */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Assessors</label>
                        <div className="border rounded-md p-2 h-[120px] overflow-y-auto space-y-2">
                            {assessors.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs space-y-1">
                                    <span>No assessors found.</span>
                                    <span>Check your network or permissions.</span>
                                </div>
                            ) : (
                                assessors.map(u => (
                                    <div key={u.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`users-${u.id}`} 
                                            checked={selectedAssessors.includes(u.id)}
                                            onCheckedChange={() => toggleAssessor(u.id)}
                                        />
                                        <label htmlFor={`users-${u.id}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {u.fullName || u.full_name}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Time</label>
                            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Location</label>
                        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Simulator B" />
                    </div>

                    {/* Retake */}
                    <div className="flex items-center space-x-2 pt-2">
                         <Checkbox id="retake" checked={isRetake} onCheckedChange={(c) => setIsRetake(!!c)} />
                         <label htmlFor="retake" className="text-sm font-medium">Is Retake?</label>
                    </div>

                </div>



                <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Scheduling...' : 'Schedule Check(s)'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleCheckModal;
