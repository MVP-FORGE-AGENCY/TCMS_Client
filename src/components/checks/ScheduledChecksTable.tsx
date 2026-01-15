import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ScheduledChecksTableProps {
    filter?: 'all' | 'my_assignments';
    refreshTrigger: number;
}

const ScheduledChecksTable: React.FC<ScheduledChecksTableProps> = ({ filter = 'all', refreshTrigger }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [checks, setChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchChecks = async () => {
            setLoading(true);
            try {
                const params: any = {};
                if (filter === 'my_assignments' && user?.id) {
                    params.assessorId = user.id;
                }
                
                const res = await api.get('/checks', { params });
                setChecks(Array.isArray(res.data) ? res.data : res.data.checks || []);
            } catch (error) {
                console.error("Failed to fetch checks", error);
                toast.error("Failed to load checks");
            } finally {
                setLoading(false);
            }
        };
        fetchChecks();
    }, [filter, refreshTrigger, user?.id]);

    const getStatusBadge = (decision: string) => {
        switch (decision) {
            case 'pass':
                return <Badge className="bg-green-500 hover:bg-green-600">Pass</Badge>;
            case 'fail':
                return <Badge variant="destructive">Fail</Badge>;
            case 'pending':
                return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
            case 'in_progress':
                return <Badge variant="outline" className="text-blue-500 border-blue-500 animate-pulse">Assessing</Badge>;
            case 'cancelled':
                return <Badge variant="secondary">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{decision}</Badge>;
        }
    };

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Trainee</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Assessors</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                Loading checks...
                            </TableCell>
                        </TableRow>
                    ) : checks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                No scheduled checks found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        checks.map((check) => (
                            <TableRow key={check.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {new Date(check.dateStart).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(check.dateStart).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{check.trainee?.full_name}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{check.profile?.code}</span>
                                        <span className="text-xs text-muted-foreground">{check.profile?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">{check.check_type || 'Combined'}</Badge>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {check.assessors?.map((a: any) => (
                                            <span key={a.id} className="text-xs bg-secondary px-2 py-0.5 rounded-full w-fit">
                                                {a.full_name}
                                            </span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(check.finalDecision)}
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        {check.evaluationsSubmitted} / {check.assessors?.length} Evaluated
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => navigate(`/checks/${check.id}`)}>
                                        <FileText className="h-4 w-4 mr-1" /> View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ScheduledChecksTable;
