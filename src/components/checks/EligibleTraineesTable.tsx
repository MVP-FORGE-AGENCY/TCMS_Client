import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EligibleTraineesTableProps {
    onScheduleClick: (profileId: string, traineeId: string) => void;
    refreshTrigger: number;
}

const EligibleTraineesTable: React.FC<EligibleTraineesTableProps> = ({ onScheduleClick, refreshTrigger }) => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [trainees, setTrainees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch Profiles
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                const res = await api.get('/proficiency-profiles');
                setProfiles(res.data.data);
                if (res.data.data.length > 0 && !selectedProfileId) {
                    setSelectedProfileId(res.data.data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch profiles", error);
                toast.error("Failed to load proficiency profiles");
            }
        };
        fetchProfiles();
    }, [refreshTrigger]);

    // Fetch Trainees when profile changes
    useEffect(() => {
        if (!selectedProfileId) return;

        const fetchTrainees = async () => {
            setLoading(true);
            try {
                const res = await api.get('/checks/eligible', {
                    params: { profileId: selectedProfileId }
                });
                setTrainees(res.data.trainees);
            } catch (error) {
                console.error("Failed to fetch trainees", error);
                toast.error("Failed to load eligible trainees");
            } finally {
                setLoading(false);
            }
        };
        fetchTrainees();
    }, [selectedProfileId, refreshTrigger]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'overdue':
                return <Badge variant="destructive">Overdue</Badge>;
            case 'due_soon':
                return <Badge className="bg-amber-500 hover:bg-amber-600">Due Soon</Badge>;
            case 'never_checked':
                return <Badge variant="secondary">Never Checked</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-[300px]">
                    <label className="text-sm font-medium mb-1 block">Profile</label>
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select profile..." />
                        </SelectTrigger>
                        <SelectContent>
                            {profiles.map(p => (
                                <SelectItem key={p.id} value={p.id}>
                                    {p.code} - {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Last Check</TableHead>
                            <TableHead>Next Due</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Conflict</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Loading trainees...
                                </TableCell>
                            </TableRow>
                        ) : trainees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No eligible trainees found for this profile.
                                </TableCell>
                            </TableRow>
                        ) : (
                            trainees.map((t) => (
                                <TableRow key={t.userId}>
                                    <TableCell className="font-medium">{t.fullName}</TableCell>
                                    <TableCell>{t.department || '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {t.lastCheckDate ? new Date(t.lastCheckDate).toLocaleDateString() : '-'}
                                            {t.lastCheckResult === 'pass' && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                    Passed
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{t.nextDueDate ? new Date(t.nextDueDate).toLocaleDateString() : '-'}</span>
                                            {t.nextDueDate && (
                                                <span className={`text-xs ${t.daysToDue < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                    {t.daysToDue} days
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(t.status)}
                                    </TableCell>
                                    <TableCell>
                                        {t.hasConflict && (
                                            <div className="flex items-center text-amber-600 text-sm" title="Warning: You were an instructor for this trainee recently. check.schedule API will block or warn.">
                                                <AlertTriangle className="h-4 w-4 mr-1" />
                                                Possible Conflict
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => onScheduleClick(selectedProfileId, t.userId)}>
                                            Schedule
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default EligibleTraineesTable;
