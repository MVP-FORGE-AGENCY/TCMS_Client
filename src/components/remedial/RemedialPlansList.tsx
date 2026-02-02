
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { format } from "date-fns";
import { AlertCircle } from "lucide-react";

export const RemedialPlansList = ({ organisationId, userId }: { organisationId?: string, userId?: string }) => {
    const { data: plans, isLoading } = useQuery({
        queryKey: ['remedial-plans', organisationId, userId],
        queryFn: () => {
             // If userId is provided, use a different endpoint or filter?
             // Best to have a specific endpoint or query param.
             // RemedialService.getPlansForTrainee is internal.
             // Let's assume we can filter /remedial-plans by traineeId if we add it to controller.
             // Or we add a new route /users/:id/remedial-plans.
             // Let's modify the standard GET to accept traineeId.
             const params = new URLSearchParams();
             if (userId) params.append('traineeId', userId);
             return api.get(`/remedial-plans?${params.toString()}`);
        }
    });

    if (isLoading) return <div>Loading plans...</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            case 'failed': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Remedial Training Cases
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trainee</TableHead>
                            <TableHead>Standard</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Target Date</TableHead>
                            <TableHead>Instructor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No active remedial cases found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            plans?.data?.map((plan: any) => (
                                <TableRow key={plan.id}>
                                    <TableCell className="font-medium">
                                        {plan.trainee?.fullName}
                                    </TableCell>
                                    <TableCell>{plan.standard?.code}</TableCell>
                                    <TableCell className="capitalize">{plan.type}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusColor(plan.status)}>
                                            {plan.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {plan.targetCompletionDate ? format(new Date(plan.targetCompletionDate), 'dd MMM yyyy') : '-'}
                                    </TableCell>
                                    <TableCell>{plan.instructor?.fullName || 'Unassigned'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
