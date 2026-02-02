import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";

export default function CheckExecutionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    
    // Evaluation state
    const [evalResults, setEvalResults] = useState<Record<string, string>>({});
    const [overallResult, setOverallResult] = useState<string>('');
    const [comments, setComments] = useState('');

    const { data: check, isLoading } = useQuery({
        queryKey: ['proficiency-check', id],
        queryFn: async () => {
            const res = await api.get(`/checks/${id}`);
            return res.data.data;
        },
        enabled: !!id
    });

    const submitEvaluationMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/checks/${id}/evaluation`, {
                results: evalResults,
                result: overallResult,
                comments
            });
        },
        onSuccess: () => {
            toast.success("Evaluation submitted successfully");
            queryClient.invalidateQueries({ queryKey: ['proficiency-check', id] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to submit evaluation");
        }
    });

    const finalizeMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/checks/${id}/finalize`);
        },
        onSuccess: () => {
            toast.success("Check finalized successfully");
            queryClient.invalidateQueries({ queryKey: ['proficiency-check', id] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error?.message || "Failed to finalize check");
        }
    });

    if (isLoading || !check) {
        return <div className="p-8 text-center">Loading check details...</div>;
    }

    const { profile, trainee, assessors, evaluations, finalDecision } = check;
    const requiredElements = profile.requiredElements || {}; // Assuming JSON structure { "elem1": "mandatory", ... }
    const elementKeys = Object.keys(requiredElements);

    // Determine if current user can grade? 
    // In real app, we check if current user ID is in assessor list.
    // For simplicity, we just show the form.

    const isPending = finalDecision === 'pending';
    const canFinalize = isPending && evaluations.length >= profile.requiredAssessors;

    return (
        <div className="space-y-6 container py-6 mx-auto max-w-5xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Proficiency Check: {profile.code}
                        <Badge variant={isPending ? "secondary" : (finalDecision === 'pass' ? 'default' : 'destructive')}>
                            {finalDecision.toUpperCase()}
                        </Badge>
                        {/* Show Standard Type Badges */}
                        <div className="flex gap-1 ml-2">
                             {profile.hasTheory && <Badge variant="outline" className="text-xs">Theory</Badge>}
                             {profile.hasPractical !== false && <Badge variant="outline" className="text-xs">Practical</Badge>}
                        </div>
                    </h1>
                    <p className="text-muted-foreground">Trainee: {trainee.fullName} | Date: {new Date(check.dateStart).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {canFinalize && (
                        <Button onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Finalize Check
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Evaluation Form */}
                    {isPending && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Assessor Evaluation</CardTitle>
                                <CardDescription>Record your assessment of the required elements.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    {profile.hasPractical !== false ? (
                                        elementKeys.length === 0 ? (
                                            <p className="text-muted-foreground italic">No specific elements defined in profile.</p>
                                        ) : (
                                            elementKeys.map(key => (
                                                <div key={key} className="flex items-center justify-between border-b pb-2">
                                                    <div className="font-medium">{key}</div>
                                                    <RadioGroup 
                                                        className="flex gap-4" 
                                                        value={evalResults[key] || ''}
                                                        onValueChange={(v) => setEvalResults(prev => ({...prev, [key]: v}))}
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="pass" id={`pass-${key}`} />
                                                            <Label htmlFor={`pass-${key}`} className="text-green-600">Pass</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="fail" id={`fail-${key}`} />
                                                            <Label htmlFor={`fail-${key}`} className="text-red-600">Fail</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            ))
                                        )
                                    ) : (
                                        <div className="p-4 bg-muted/20 rounded text-muted-foreground text-sm italic">
                                            Practical assessment not required for this standard.
                                        </div>
                                    )}
                                </div>
                                
                                <Separator />

                                <div className="space-y-2">
                                    <Label>Comments</Label>
                                    <Textarea 
                                        placeholder="Enter overall observations..." 
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Overall Result</Label>
                                    <RadioGroup 
                                        className="flex gap-4" 
                                        value={overallResult}
                                        onValueChange={setOverallResult}
                                    >
                                         <div className="flex items-center space-x-2 border rounded p-2 cursor-pointer hover:bg-green-50">
                                            <RadioGroupItem value="pass" id="r-pass" />
                                            <Label htmlFor="r-pass" className="text-green-700 font-bold cursor-pointer">PASS</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border rounded p-2 cursor-pointer hover:bg-red-50">
                                            <RadioGroupItem value="fail" id="r-fail" />
                                            <Label htmlFor="r-fail" className="text-red-700 font-bold cursor-pointer">FAIL</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <Button 
                                    className="w-full" 
                                    onClick={() => submitEvaluationMutation.mutate()}
                                    disabled={!overallResult || submitEvaluationMutation.isPending}
                                >
                                    Submit Evaluation
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Previous Evaluations */}
                    {evaluations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Submitted Evaluations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {evaluations.map((ev: any) => (
                                        <div key={ev.id} className="border rounded p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-semibold">
                                                     Assessor ID: {ev.assessorId} {/* Ideally resolve name */}
                                                </div>
                                                <Badge variant={ev.result === 'pass' ? 'outline' : 'destructive'}>
                                                    {ev.result.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{ev.comments}</p>
                                            <div className="text-xs text-muted-foreground">
                                                Submitted: {new Date(ev.submittedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                             <CardTitle>Assigned Assessors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {assessors.map((a: any) => (
                                    <div key={a.id} className="flex items-center gap-2 text-sm">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            {a.user.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium">{a.user.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{a.user.email}</div>
                                        </div>
                                    </div>
                                ))}
                                {assessors.length < profile.requiredAssessors && (
                                     <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded text-sm">
                                         <AlertTriangle className="h-4 w-4" />
                                         <span>Need {profile.requiredAssessors - assessors.length} more assessor(s)</span>
                                     </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                         <CardContent className="text-sm space-y-2">
                             <div className="flex justify-between">
                                 <span className="text-muted-foreground">Type</span>
                                 <span>{profile.name}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-muted-foreground">Interval</span>
                                 <span>{profile.intervalMonths} months</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-muted-foreground">Location</span>
                                 <span>{check.location || '-'}</span>
                             </div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
