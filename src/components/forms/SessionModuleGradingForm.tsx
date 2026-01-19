import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { moduleResults } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface GradingListIn {
    participant: {
        id: string;
        full_name: string;
        email: string;
    };
    attendance: string;
    existingResult?: any;
    canGrade: boolean;
}

interface SessionModuleGradingFormProps {
    sessionId: string;
    moduleData: {
        id: string;
        name: string;
        theory_pass_score?: number;
        practical_pass_score?: number;
        requires_theory?: boolean;
        requires_practical?: boolean;
    };
    gradingList: GradingListIn[];
}

export const SessionModuleGradingForm: React.FC<SessionModuleGradingFormProps> = ({
    sessionId,
    moduleData,
    gradingList
}) => {
    const queryClient = useQueryClient();
    const [grades, setGrades] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    // Initialize grades from existing results
    React.useEffect(() => {
        const initialGrades: Record<string, any> = {};
        gradingList.forEach(item => {
            if (item.existingResult) {
                initialGrades[item.participant.id] = {
                    theory: item.existingResult.theory_score,
                    practical: item.existingResult.practical_score,
                    comments: item.existingResult.comments,
                    result: item.existingResult.result,
                    status: 'saved' // tracked status for UI
                };
            } else {
                initialGrades[item.participant.id] = {
                    theory: '',
                    practical: '',
                    comments: '',
                    result: 'not_graded',
                    status: 'pristine'
                };
            }
        });
        setGrades(initialGrades);
    }, [gradingList]);

    const gradeMutation = useMutation({
        mutationFn: async (data: any) => {
            return moduleResults.gradeModule(moduleData.id, data);
        },
        onSuccess: (data, variables: any) => {
            toast.success("Grade saved");
            setSaving(prev => ({ ...prev, [variables.userId]: false }));
            setGrades(prev => ({
                ...prev,
                [variables.userId]: {
                    ...prev[variables.userId],
                    status: 'saved',
                    result: data.result // Update result from server response
                }
            }));
             // Invalidate session grading query to refresh
             queryClient.invalidateQueries({ queryKey: ['session-module-grading', sessionId] });
        },
        onError: (_error: any, variables: any) => {
            toast.error("Failed to save grade");
            setSaving(prev => ({ ...prev, [variables.userId]: false }));
        }
    });

    const handleSaveRow = (userId: string) => {
        const grade = grades[userId];
        if (!grade) return;
        
        setSaving(prev => ({ ...prev, [userId]: true }));
        
        gradeMutation.mutate({
            userId,
            sessionId,
            theoryScore: grade.theory !== '' ? Number(grade.theory) : undefined,
            practicalScore: grade.practical !== '' ? Number(grade.practical) : undefined,
            comments: grade.comments,
            // We let the backend calculate the result unless we implement manual override UI
        });
    };

    const updateGrade = (userId: string, field: string, value: any) => {
        setGrades(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: value,
                status: 'edited'
            }
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-semibold text-lg">{moduleData.name} - Grading</h3>
                   <div className="text-sm text-muted-foreground flex gap-4">
                        {moduleData.requires_theory && 
                            <span>Theory Pass: {moduleData.theory_pass_score}%</span>
                        }
                        {moduleData.requires_practical && 
                            <span>Practical Pass: {moduleData.practical_pass_score}%</span>
                        }
                   </div>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trainee</TableHead>
                            <TableHead>Attendance</TableHead>
                            {moduleData.requires_theory && <TableHead className="w-[120px]">Theory</TableHead>}
                            {moduleData.requires_practical && <TableHead className="w-[120px]">Practical</TableHead>}
                            <TableHead>Result</TableHead>
                            <TableHead>Comments</TableHead>
                            <TableHead className="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gradingList.map((item) => {
                            const grade = grades[item.participant.id] || {};
                            const isPresent = item.attendance === 'present' || item.attendance === 'late';
                            
                            if (!item.canGrade) {
                                return (
                                    <TableRow key={item.participant.id} className="opacity-60 bg-muted/20">
                                        <TableCell>{item.participant.full_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.attendance}</Badge>
                                        </TableCell>
                                        {moduleData.requires_theory && <TableCell>-</TableCell>}
                                        {moduleData.requires_practical && <TableCell>-</TableCell>}
                                        <TableCell>-</TableCell>
                                        <TableCell>-</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                );
                            }

                            return (
                                <TableRow key={item.participant.id}>
                                    <TableCell className="font-medium">
                                        {item.participant.full_name}
                                    </TableCell>
                                    <TableCell>
                                         <Badge variant={isPresent ? "default" : "secondary"}>
                                            {item.attendance}
                                         </Badge>
                                    </TableCell>
                                    
                                    {moduleData.requires_theory && (
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="0" max="100"
                                                value={grade.theory}
                                                onChange={(e) => updateGrade(item.participant.id, 'theory', e.target.value)}
                                                className={
                                                    grade.theory && moduleData.theory_pass_score && Number(grade.theory) < moduleData.theory_pass_score
                                                    ? "border-red-500 text-red-600 font-bold" 
                                                    : ""
                                                }
                                            />
                                        </TableCell>
                                    )}
                                    
                                    {moduleData.requires_practical && (
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                min="0" max="100"
                                                value={grade.practical}
                                                onChange={(e) => updateGrade(item.participant.id, 'practical', e.target.value)}
                                                className={
                                                    grade.practical && moduleData.practical_pass_score && Number(grade.practical) < moduleData.practical_pass_score
                                                    ? "border-red-500 text-red-600 font-bold" 
                                                    : ""
                                                }
                                            />
                                        </TableCell>
                                    )}

                                    <TableCell>
                                        {grade.result && grade.result !== 'not_graded' && (
                                            <Badge 
                                                variant="outline"
                                                className={
                                                    grade.result === 'pass' || grade.result === 'completed' ? 'border-green-500 text-green-600' :
                                                    grade.result === 'fail' ? 'border-red-500 text-red-600' : ''
                                                }
                                            >
                                                {grade.result}
                                            </Badge>
                                        )}
                                    </TableCell>


                                    <TableCell>
                                        <Input
                                            value={grade.comments || ''}
                                            placeholder="Remarks..."
                                            onChange={(e) => updateGrade(item.participant.id, 'comments', e.target.value)}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleSaveRow(item.participant.id)}
                                            disabled={saving[item.participant.id] || grade.status === 'saved' || grade.status === 'pristine'}
                                            variant={grade.status === 'saved' ? "ghost" : "default"}
                                        >
                                            {saving[item.participant.id] ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : grade.status === 'saved' ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                "Save"
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex gap-2 text-sm text-muted-foreground items-center">
                <AlertCircle className="h-4 w-4" />
                <span>Results are calculated automatically based on thresholds. You can override them by editing the record later.</span>
            </div>
        </div>
    );
};
