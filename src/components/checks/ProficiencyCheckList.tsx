import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Clock } from "lucide-react";
import { CheckScheduler } from './CheckScheduler'; 

export const ProficiencyCheckList: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Fetch checks
    const { data: checks, isLoading } = useQuery({
        queryKey: ['proficiency-checks', statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            
            const res = await api.get(`/checks?${params.toString()}`);
            return res.data.data;
        }
    });

    const filteredChecks = checks?.filter((check: any) => 
        check.trainee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        check.profile.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pass': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'fail': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pass': return <CheckCircle className="h-4 w-4 mr-1" />;
            case 'fail': return <XCircle className="h-4 w-4 mr-1" />;
            case 'pending': return <Clock className="h-4 w-4 mr-1" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search checks..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="pass">Passed</SelectItem>
                            <SelectItem value="fail">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* CheckScheduler component will be the trigger button */}
                <CheckScheduler />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Candidates</TableHead>
                            <TableHead>Assessors</TableHead>
                            <TableHead>Standard</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                            </TableRow>
                        ) : filteredChecks?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No checks found</TableCell>
                            </TableRow>
                        ) : (
                            filteredChecks?.map((check: any) => {
                                // Candidates Logic
                                const candidatesList = check.checkCandidates?.length > 0 
                                    ? check.checkCandidates.map((c: any) => c.candidate?.fullName).filter(Boolean)
                                    : [check.users?.fullName || check.trainee?.fullName].filter(Boolean);

                                // Assessors Logic
                                const assessorsList = check.checkAssessors?.map((a: any) => a.assessor?.fullName).filter(Boolean) || [];

                                // Progress Logic (Unique Assessors who submitted evaluations)
                                const totalAssessors = check.checkAssessors?.length || 0;
                                const evaluators = new Set(check.checkAssessorEvaluations?.map((e: any) => e.assessorId));
                                const evaluatedCount = evaluators.size;

                                return (
                                <TableRow key={check.id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {format(new Date(check.dateStart), 'MMM d, yyyy')}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(check.dateStart), 'HH:mm')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {candidatesList.length > 0 ? (
                                            <div className="space-y-1">
                                                {candidatesList.slice(0, 2).map((name: string, i: number) => (
                                                    <div key={i} className="font-medium text-sm">{name}</div>
                                                ))}
                                                {candidatesList.length > 2 && (
                                                    <div className="text-xs text-muted-foreground">+{candidatesList.length - 2} more</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                         {assessorsList.length > 0 ? (
                                            <div className="space-y-1">
                                                {assessorsList.slice(0, 2).map((name: string, i: number) => (
                                                    <div key={i} className="text-sm">{name}</div>
                                                ))}
                                                {assessorsList.length > 2 && (
                                                    <div className="text-xs text-muted-foreground">+{assessorsList.length - 2} more</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{check.profile?.code || check.proficiencyProfiles?.code}</Badge>
                                        <div className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                                            {check.profile?.name || check.proficiencyProfiles?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm font-medium">
                                            {evaluatedCount}/{totalAssessors} Evaluated
                                        </div>
                                        <div className="w-full bg-secondary h-1.5 mt-1 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-primary h-full transition-all" 
                                                style={{ width: `${totalAssessors ? (evaluatedCount / totalAssessors) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`flex w-fit items-center ${getStatusColor(check.finalDecision)}`}>
                                            {getStatusIcon(check.finalDecision)}
                                            {check.finalDecision.charAt(0).toUpperCase() + check.finalDecision.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => navigate(`/checks/${check.id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
