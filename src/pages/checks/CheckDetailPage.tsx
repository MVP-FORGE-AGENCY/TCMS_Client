import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar, User, CheckCircle, AlertCircle, Play, PenTool, Trash2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import SubmitEvaluationModal from '@/components/checks/SubmitEvaluationModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SignatureModal from './SignatureModal';

import { useBreadcrumb } from "@/context/BreadcrumbContext";

const CheckDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setLabel } = useBreadcrumb();
    
    const [check, setCheck] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<{id: string, name: string} | null>(null);

    useEffect(() => {
        if (check && id) {
            const label = `${check.profile?.code} - ${check.trainee?.full_name}`;
            setLabel(id, label);
        }
    }, [check, id, setLabel]);


    const handleFinalize = async () => {
        try {
            // Recalculate just in case
            const decision = getDerivedDecision();
            const comments = getDerivedComments();

            await api.patch(`/checks/${id}/finalise`, {
                finalDecision: decision,
                comments: comments
            });
            toast.success('Check finalised successfully');
            setIsFinalizeOpen(false);
            fetchCheck();
        } catch (error: any) {
            console.error('Finalize error:', error);
            toast.error(error.response?.data?.error?.message || 'Failed to finalise check');
        }
    };

    const fetchCheck = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/checks/${id}`);
            setCheck(res.data);
        } catch (error) {
            console.error("Failed to fetch check", error);
            toast.error("Failed to load check details");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadProtocol = async (candidateId?: string) => {
        try {
            const url = candidateId 
                ? `/checks/${id}/protocol?candidateId=${candidateId}`
                : `/checks/${id}/protocol`;

            toast.promise(
                api.get(url, { responseType: 'blob' }),
                {
                    loading: 'Generating Protocol PDF...',
                    success: (response) => {
                        const url = window.URL.createObjectURL(new Blob([response.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        // Content-Disposition header usually handles filename, but fallback here
                        link.setAttribute('download', `Protocol.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        return 'Protocol downloaded';
                    },
                    error: 'Failed to download protocol'
                }
            );
        } catch (error) {
            console.error(error);
        }
    };

    const handleStartCheck = async () => {
        try {
            await api.post(`/checks/${id}/start`);
            toast.success('Check started. You can now evaluate.');
            fetchCheck();
        } catch (error: any) {
             console.error(error);
             toast.error(error.response?.data?.error?.message || 'Failed to start check');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this scheduled check? This action cannot be undone.')) return;
        
        try {
            await api.delete(`/checks/${id}`);
            toast.success('Check deleted');
            navigate('/checks');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || 'Failed to delete check');
        }
    };



    const getDerivedDecision = () => {
        if (!check?.assessors) return 'fail';
        const allPass = check.assessors.every((a: any) => a.evaluation?.result === 'pass');
        return allPass ? 'pass' : 'fail';
    };

    const getDerivedComments = () => {
        if (!check?.assessors) return '';
        return check.assessors.map((a: any) => `${a.full_name}: ${a.evaluation?.comments || 'No comments'}`).join('\n');
    };



    useEffect(() => {
        if (id) fetchCheck();
    }, [id]);

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    };

    const getCandidateStatus = (candidate: any) => {
         // Use check_candidates outcome
         if (candidate.outcome && candidate.outcome !== 'pending') return candidate.outcome;
         
         // Or derive from evaluations if outcome not yet finalized 
         return 'pending';
    };



    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading check details...</div>;
    if (!check) return <div className="p-8 text-center text-red-500">Check not found</div>;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate('/checks')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
            </Button>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Info */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{check.profile?.name}</CardTitle>
                            <CardDescription>Code: {check.profile?.code} | Type: <span className="capitalize">{check.check_type || 'combined'}</span></CardDescription>
                        </div>
                        <div className="text-right flex items-center gap-2">
                            {check.finalDecision === 'pending' && <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>}
                            {check.finalDecision === 'in_progress' && <Badge variant="outline" className="text-blue-500 border-blue-500 animate-pulse">In Progress</Badge>}
                            {check.finalDecision === 'pass' && <Badge className="bg-green-500">Passed</Badge>}
                            {check.finalDecision === 'fail' && <Badge variant="destructive">Failed</Badge>}
                            
                            {/* Delete Action - Only for pending checks */}
                            {check.finalDecision === 'pending' && (
                                <Button size="sm" variant="destructive" onClick={handleDelete} title="Delete Check">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Generate Official Protocol - Only for finalized checks */}
                            {(check.finalDecision === 'pass' || check.finalDecision === 'fail') && (
                                <Button size="sm" variant="outline" className="ml-2 gap-2" onClick={() => handleDownloadProtocol()}>
                                    <FileText className="w-4 h-4" /> Generate Official Protocol
                                </Button>
                            )}

                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            {!check.isGroupCheck && (
                            <div className="flex items-center space-x-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Trainee</p>
                                    <p className="text-muted-foreground">{check.trainee?.full_name}</p>
                                </div>
                            </div>
                            )}
                            <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Date & Time</p>
                                    <p className="text-muted-foreground">
                                        {new Date(check.dateStart).toLocaleDateString()} at {new Date(check.dateStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Location</p>
                                    <p className="text-muted-foreground">{check.location || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Candidates List (Group & Single) */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">
                                {check.isGroupCheck ? 'Candidates' : 'Evaluation Status'}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {check.candidates?.map((candidate: any) => {
                                    const status = getCandidateStatus(candidate);
                                    // Check if current user (assessor) has evaluated this candidate
                                    const myEvaluation = candidate.evaluations?.find((e: any) => e.assessor_id === user?.id);
                                    const isAssessor = check.assessors?.some((a: any) => a.id === user?.id);

                                    return (
                                    <div key={candidate.id} className="flex flex-col md:flex-row items-center justify-between border rounded-lg p-4 bg-card hover:bg-muted/10">
                                        <div className="flex items-center space-x-3 w-full md:w-auto">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>{getInitials(candidate.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{candidate.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{candidate.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                                            {/* Status Badge */}
                                            {status === 'pending' && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>}
                                            {status === 'pass' && <Badge className="bg-green-500 hover:bg-green-600">Passed</Badge>}
                                            {status === 'fail' && <Badge variant="destructive">Failed</Badge>}

                                            {/* Protocol Download */}
                                            {status !== 'pending' && (
                                                <Button size="sm" variant="ghost" onClick={() => handleDownloadProtocol(candidate.id)}>
                                                    <FileText className="w-4 h-4 mr-1" /> Protocol
                                                </Button>
                                            )}

                                            {/* Evaluate Action */}
                                            {isAssessor && check.result === 'pending' && (
                                                myEvaluation ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Submitted
                                                    </Badge>
                                                ) : (
                                                    <Button size="sm" onClick={() => {
                                                        setSelectedCandidate({ id: candidate.id, name: candidate.fullName });
                                                        setIsSubmitModalOpen(true);
                                                    }}>
                                                        <PenTool className="w-3 h-3 mr-1" /> Evaluate
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Assessors</h3>
                            <div className="flex flex-col gap-3">
                                {check.assessors?.map((assessor: any) => (
                                    <div key={assessor.id} className="flex flex-col md:flex-row items-start md:items-center justify-between border rounded-lg p-4 bg-card hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center space-x-3 mb-3 md:mb-0">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>{getInitials(assessor.full_name)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm md:text-base">{assessor.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{assessor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto justify-between md:justify-end">
                                            {assessor.evaluationSubmitted ? (
                                                assessor.evaluation ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Submitted
                                                    </Badge>
                                                ) : (
                                                     <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1" title="Evaluation hidden until all assessors submit">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Submitted (Hidden)
                                                    </Badge>
                                                )
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 py-1">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> Pending
                                                </Badge>
                                            )}
                                            
                                            <div className="flex gap-2">
                                                {/* Action for current user */}
                                                {accessToStart(user, assessor, check) && (
                                                    <Button size="sm" className="h-8" variant="secondary" onClick={handleStartCheck}>
                                                        <Play className="w-3 h-3 mr-1" /> Start
                                                    </Button>
                                                )}

                                                {accessToEvaluate(user, assessor, check) && (
                                                    <Button size="sm" className="h-8" onClick={() => setIsSubmitModalOpen(true)}>
                                                        <PenTool className="w-3 h-3 mr-1" /> Evaluate
                                                    </Button>
                                                )}
                                                

                                                
                                                {/* Signature Status Badge */}
                                                {assessor.signatureReceived && (
                                                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 px-3 py-1 ml-2">
                                                        <PenTool className="w-3 h-3 mr-1" /> Signed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Requirements / Elements - Only show if defined */}
                {check.profile?.required_elements && Object.keys(check.profile.required_elements).length > 0 && (
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Assessment Criteria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {Object.values(check.profile.required_elements).map((elem: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0 hover:bg-muted/50 px-2 py-1 rounded">
                                    <span className="font-medium">{elem.name}</span>
                                    {elem.mandatory && <Badge variant="secondary" className="text-xs">Mandatory</Badge>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                )}

            </div>

            <SubmitEvaluationModal 
                open={isSubmitModalOpen}
                onOpenChange={setIsSubmitModalOpen}
                checkId={id!}
                profile={check.profile}
                checkType={check.check_type || 'combined'}
                standard={check.profile?.training_standards}
                traineeName={selectedCandidate?.name || check.trainee?.full_name}
                candidateId={selectedCandidate?.id}
                onSuccess={() => {
                    fetchCheck();
                    setSelectedCandidate(null);
                }}
            />

            <SignatureModal
                open={isSignModalOpen}
                onOpenChange={setIsSignModalOpen}
                checkId={id!}
                traineeName={check.trainee?.full_name}
                onSuccess={fetchCheck}
            />

            <Dialog open={isFinalizeOpen} onOpenChange={setIsFinalizeOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Finalise Proficiency Check</DialogTitle>
                        <DialogDescription>
                            You are about to submit the proficiency check for <strong>{check.trainee?.full_name}</strong>.
                            Review the assessor evaluations below.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <p className="text-sm text-muted-foreground mb-4">
                            Review the evaluations below. This will finalize the check and record competence for passing candidates.
                        </p>

                        {/* Iterate Candidates */}
                        <div className="space-y-6">
                        {check.candidates?.map((candidate: any) => {
                            // Calculate candidate specific status
                            const candidateEvals = candidate.evaluations || [];
                            const allPass = candidateEvals.length > 0 && candidateEvals.length >= check.profile?.required_assessors && candidateEvals.every((e: any) => e.result === 'pass');
                            const outcome = allPass ? 'pass' : 'fail';
                            // If insufficient evals, it's technically a fail or pending, but here we assume validation happened
                            
                            return (
                                <div key={candidate.id} className="border rounded-md p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold">{candidate.fullName}</h4>
                                        <Badge className={outcome === 'pass' ? 'bg-green-600' : 'bg-red-600'}>
                                            PROPOSED: {outcome.toUpperCase()}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid gap-2 pl-4 border-l-2">
                                        {check.assessors?.map((assessor: any) => {
                                            const evaluation = candidateEvals.find((e: any) => e.assessor_id === assessor.id);
                                            return (
                                                <div key={assessor.id} className="flex justify-between items-center text-sm">
                                                    <span>{assessor.fullName}</span>
                                                    {evaluation ? (
                                                        <span className={evaluation.result === 'pass' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                            {evaluation.result.toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-500 italic">Pending</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFinalizeOpen(false)}>Cancel</Button>
                        <Button onClick={handleFinalize}>
                            Confirm & Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Helper
const accessToEvaluate = (currentUser: any, assessor: any, check: any) => {
    if (!currentUser || !assessor) return false;
    // Must match ID, not be submitted, and check is in_progress
    return currentUser.id === assessor.id && !assessor.evaluationSubmitted && check.finalDecision === 'in_progress';
};

const accessToStart = (currentUser: any, assessor: any, check: any) => {
    if (!currentUser || !assessor) return false;
    // Must match ID, check is pending, and user is assigned
    return currentUser.id === assessor.id && check.finalDecision === 'pending';
};

export default CheckDetailPage;
