
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { moduleResults } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ModuleGradingCard from "@/components/ModuleGradingCard"; 
import { Search, User, BarChart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface ModuleResult {
    id: string;
    user_id: string;
    result: string;
    curriculum_module_id: number;
    users: {
        id: string;
        full_name: string;
        email: string;
    };
    curriculum_modules: {
        id: string;
        name: string;
        type: string;
    };
    theory_score?: number;
    practical_score?: number;
    attempt_number: number;
    graded_at: string;
    graders?: any;
    comments?: string;
}

interface ModuleResultsTableProps {
    curriculumId: string;
    modules: any[]; // Definition of modules to calculate completion
}

export const ModuleResultsTable: React.FC<ModuleResultsTableProps> = ({ curriculumId, modules }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const { data: results, isLoading } = useQuery({
        queryKey: ['curriculum-module-results', curriculumId],
        queryFn: () => moduleResults.getCurriculumResults(curriculumId)
    });

    const userProgress = useMemo(() => {
        if (!results) return [];

        const grouped: Record<string, any> = {};
        
        results.forEach((r: any) => {
            if (!grouped[r.user_id]) {
                grouped[r.user_id] = {
                    user: r.users,
                    results: [],
                    completedCount: 0,
                    modulesCount: modules.length
                };
            }
            grouped[r.user_id].results.push(r);
        });

        // Calculate progress based on latest attempt per module
        Object.values(grouped).forEach((g: any) => {
            const passedModuleIds = new Set();
            g.results.forEach((r: any) => {
                if (r.result === 'pass' || r.result === 'completed') {
                    passedModuleIds.add(r.curriculum_module_id);
                }
            });
            g.completedCount = passedModuleIds.size;
        });

        return Object.values(grouped).sort((a, b) => 
            a.user.full_name.localeCompare(b.user.full_name)
        );
    }, [results, modules]);

    const filteredUsers = userProgress.filter(u => 
        u.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div>Loading results...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search trainees..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground ml-auto">
                    Showing {filteredUsers.length} trainees
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-zinc-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trainee</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No results found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((item) => {
                                const percent = Math.round((item.completedCount / (item.modulesCount || 1)) * 100);
                                return (
                                    <TableRow key={item.user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{item.user.full_name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.user.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1 w-[180px]">
                                                <div className="flex justify-between text-xs">
                                                    <span>{item.completedCount}/{item.modulesCount} modules</span>
                                                    <span>{percent}%</span>
                                                </div>
                                                <Progress value={percent} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={percent === 100 ? 'default' : 'secondary'}>
                                                {percent === 100 ? 'Completed' : 'In Progress'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setSelectedUser(item)}
                                            >
                                                <BarChart className="mr-2 h-4 w-4" />
                                                Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Module Results: {selectedUser?.user.full_name}</DialogTitle>
                        <DialogDescription>
                            Detailed breakdown of module grades and attempts.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4 md:grid-cols-2">
                        {modules.map((mod) => {
                             // Get all attempts for this module, sorted by attempt number desc
                            const moduleAttempts = selectedUser?.results
                                .filter((r: any) => r.curriculum_module_id === mod.id)
                                .sort((a: any, b: any) => b.attempt_number - a.attempt_number) || [];
                            
                            const latestResult = moduleAttempts[0];

                            return (
                                <div key={mod.id} className="space-y-2">
                                    <div className="font-semibold">{mod.name}</div>
                                    {moduleAttempts.length > 0 ? (
                                        moduleAttempts.map((result: any) => (
                                            <ModuleGradingCard
                                                key={result.id}
                                                moduleName={`${mod.name} (Attempt ${result.attempt_number})`}
                                                moduleType={mod.type}
                                                result={{
                                                    id: result.id,
                                                    result: result.result,
                                                    theoryScore: result.theory_score,
                                                    practicalScore: result.practical_score,
                                                    attemptNumber: result.attempt_number,
                                                    gradedAt: result.graded_at,
                                                    gradedBy: result.graders,
                                                    comments: result.comments
                                                }}
                                                passCriteria={{
                                                    theoryPassScore: mod.theoryPassScore || mod.pass_criteria?.theory_pass_score, 
                                                    practicalPassScore: mod.practicalPassScore || mod.pass_criteria?.practical_pass_score,
                                                    requiresTheory: mod.requiresTheory,
                                                    requiresPractical: mod.requiresPractical
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-500 italic p-4 border rounded">No attempts recorded</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
