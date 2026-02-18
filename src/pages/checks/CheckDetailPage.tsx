import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Calendar, User, CheckCircle, AlertCircle, Play, PenTool, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import SubmitEvaluationModal from '@/components/checks/SubmitEvaluationModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// SignatureModal removed

import { useBreadcrumb } from "@/context/BreadcrumbContext";

const CheckDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setLabel } = useBreadcrumb();
    const { t } = useTranslation();
    
    const [check, setCheck] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    // Removed isFinalizeOpen, isSignModalOpen, password state
    const [conflicts, setConflicts] = useState<any[]>([]);

    useEffect(() => {
        if (check?.candidates?.[0]?.candidate?.id && check?.dateStart && check.trainingStandards?.id) {
             // Check for conflicts on mount (non-blocking alerts)
             api.get('/checks/conflicts', { 
                 params: { 
                     candidateIds: [check.candidates[0].candidate.id],
                     standardId: check.trainingStandards.id,
                     dateStart: check.dateStart
                 } 
             }).then(res => {
                 if (res.data?.warnings?.length > 0) {
                     setConflicts(res.data.warnings);
                 }
             }).catch(console.error);
        }
    }, [check]);

    useEffect(() => {
        if (check && id) {
            const code = check.profile?.code || (check.checkType ? (
                check.checkType === 'full_renewal' ? t('checks.fullRenewal') : 
                check.checkType === 'partial' ? t('checks.partial') : 
                check.checkType.toUpperCase()
            ) : 'CHECK');
            
            const name = check.candidates?.length > 1 
                ? t('checks.multipleCandidates', { count: check.candidates.length })
                : (check.trainee?.fullName || check.candidates?.[0]?.candidate?.fullName || t('checks.trainee'));
            
            const label = `${code} - ${name}`;
            setLabel(id, label);
        }
    }, [check, id, setLabel]);

    const canStartCheck = () => {
        if (!check || check.finalDecision !== 'pending') return { allowed: false };
        
        // 1. Role Check - Only assigned assessors can start
        const isAssessor = check.assessors?.some((a: any) => a.user?.id === user?.id);
        
        if (!isAssessor) return { allowed: false, reason: t('checks.notAuthorizedToStart', 'Only assigned assessors can start this check') };

        // 2. Date Check
        const today = new Date();
        const checkDate = new Date(check.dateStart);
        // Allow if today is same day or after (if missed? usually strict, user said "only on the day")
        // User said: "only on the day that it was scheduled for (until then...)"
        // Assuming strict same day or maybe "not before". "Until then" implies future is blocked.
        // What if it's yesterday and missed? Usually should be allowed to start late?
        // Detailed request: "only on the day that it was scheduled for (until then the 'start' button should be disabled...)"
        // This implies prevention of EARLY start. I'll allow Today and After.
        // Actually "on the day" might be strict. I'll stick to "Not Before".
        const isFuture = checkDate.setHours(0,0,0,0) > today.setHours(0,0,0,0);
        
        if (isFuture) {
             return { 
                 allowed: false, 
                 reason: `Cannot start before ${new Date(check.dateStart).toLocaleDateString()}` 
             };
        }

        return { allowed: true };
    };

    const startStatus = canStartCheck();

    // Finalize logic now handled via Sign in SubmitEvaluationModal (auto-finalize on last signature)

    const fetchCheck = async () => {
        if (!check) setLoading(true);
        try {
            const res = await api.get(`/checks/${id}`);
            setCheck(res.data.data);
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
                        // Use a more descriptive filename
                        // Filename: Protocol_CandidateName_Date.pdf
                        // We need candidate name here. It's passed as arg? No, just ID.
                        // We can get it from the candidates list in the component scope
                        const candidate = check.candidates?.find((c: any) => c.candidateId === candidateId);
                        const candidateName = candidate?.candidate?.fullName || candidate?.candidate?.full_name || 'Candidate';
                        // Sanitize filename
                        const safeName = candidateName.replace(/[^a-z0-9а-я ]/gi, '_').trim();
                        const dateStr = new Date().toISOString().split('T')[0];
                        
                        link.setAttribute('download', `Protocol_${safeName}_${dateStr}.pdf`);
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
        try {
            await api.delete(`/checks/${id}`);
            toast.success('Check deleted');
            navigate('/checks');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || 'Failed to delete check');
        }
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

    if (loading) return <div className="p-8 text-center text-muted-foreground">{t('common.loading', 'Loading check details...')}</div>;
    if (!check) return <div className="p-8 text-center text-red-500">{t('checks.noChecksFound', 'Check not found')}</div>;

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Button variant="ghost" onClick={() => navigate('/checks')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('checks.backToList')}
            </Button>

            {/* Conflict Banner */}
            {conflicts.length > 0 && (
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-amber-600 mb-1">{t('checks.warningsFound', 'Scheduling warnings')}</h4>
                        <div className="space-y-1">
                            {conflicts.map((c, i) => (
                                <div key={i} className="text-sm text-muted-foreground">
                                    {c.message}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Main Info */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{check.profile?.name}</CardTitle>
                            <CardDescription>{t('standards.code')}: {check.profile?.code || check.trainingStandards?.code || 'N/A'} | {t('checks.type')}: <span className="capitalize">
                                {check.checkType === 'full_renewal' ? t('checks.fullRenewal') : 
                                 check.checkType === 'partial' ? t('checks.partial') : 
                                 ((!check.checkType || check.checkType?.toLowerCase() === 'combined') ? t('checks.combined') : check.checkType)}
                            </span></CardDescription>
                        </div>
                        <div className="text-right flex items-center gap-2">
                            {check.finalDecision === 'pending' && <Badge variant="outline" className="text-amber-500 border-amber-500">{t('checks.pending')}</Badge>}
                            {check.finalDecision === 'in_progress' && <Badge variant="outline" className="text-blue-500 border-blue-500">{t('checks.assessing')}</Badge>}
                            {check.finalDecision === 'pass' && <Badge className="bg-green-500">{t('common.passed')}</Badge>}
                            {check.finalDecision === 'fail' && <Badge variant="destructive">{t('common.statusFailed')}</Badge>}

                            {/* Start Check Action - Only assigned assessors */}
                            {check.assessors?.some((a: any) => a.user?.id === user?.id) && check.finalDecision === 'pending' && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span tabIndex={0}>
                                                <Button 
                                                    size="sm" 
                                                    className="ml-2 gap-2 bg-blue-600 hover:bg-blue-700" 
                                                    onClick={handleStartCheck}
                                                    disabled={!startStatus.allowed}
                                                >
                                                    <Play className="w-4 h-4" /> {t('checks.startCheck')}
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        {!startStatus.allowed && (
                                            <TooltipContent>
                                                <p>{startStatus.reason}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            
                            {/* Delete Action - Only unstarted (pending) checks, Admin/Manager only */}
                            {(check.finalDecision === 'pending' && check.finalDecision !== 'in_progress' && user?.role && ['admin', 'training_manager'].includes(user.role)) && (
                                <Button size="sm" variant="destructive" onClick={() => setIsDeleteAlertOpen(true)} title={t('checks.deleteCheck')}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}

                            {/* Generate Official Protocol - Moved to candidate list */}

                            {/* Manual Finalize Removed - Auto-finalization in place */}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            {!check.isGroupCheck && (
                            <div className="flex items-center space-x-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{t('checks.trainee')}</p>
                                    <p className="text-muted-foreground">{check.trainee?.fullName}</p>
                                </div>
                            </div>
                            )}
                            <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{t('common.dateTime')}</p>
                                    <p className="text-muted-foreground">
                                        {new Date(check.dateStart).toLocaleDateString()} {t('common.at', 'at')} {new Date(check.dateStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">{t('common.location')}</p>
                                    <p className="text-muted-foreground">{check.location || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Candidates List (Group & Single) */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">
                                {check.isGroupCheck ? t('checks.candidates') : t('checks.evaluationStatus')}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {check.candidates?.length === 0 && (
                                    <div className="p-4 text-center border rounded-lg bg-muted/20 text-muted-foreground">
                                        {t('checks.noCandidates')}
                                    </div>
                                )}
                                {check.candidates?.map((candidate: any) => {
                                    const status = getCandidateStatus(candidate);
                                    // Check if current user (assessor) has evaluated this candidate
                                    const myEvaluation = candidate.evaluations?.find((e: any) => e.assessorId === user?.id);
                                    const isAssessor = check.assessors?.some((a: any) => a.user?.id === user?.id);

                                    return (
                                    <div key={candidate.candidateId} className="flex flex-col md:flex-row items-center justify-between border rounded-lg p-4 bg-card hover:bg-muted/10">
                                        <div className="flex items-center space-x-3 w-full md:w-auto">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>{getInitials(candidate.candidate?.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{candidate.candidate?.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{candidate.candidate?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-3 md:mt-0">
                                            {/* Status Badge */}
                                            {status === 'pending' && <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">{t('checks.pending')}</Badge>}
                                            {status === 'pass' && <Badge className="bg-green-500 hover:bg-green-600">{t('common.passed')}</Badge>}
                                            {status === 'fail' && <Badge variant="destructive">{t('common.statusFailed')}</Badge>}

                                            {/* Protocol/Certificate Download (Combined) */}
                                            {status !== 'pending' && (
                                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleDownloadProtocol(candidate.candidateId)}>
                                                    <FileText className="w-4 h-4 mr-1" /> {t('checks.generateProtocol')}
                                                </Button>
                                            )}

                                            {/* Evaluate Action */}
                                            {isAssessor && check.finalDecision === 'in_progress' && (
                                                myEvaluation ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {t('checks.submitted')}
                                                    </Badge>
                                                ) : (
                                                    <Button size="sm" onClick={() => setIsSubmitModalOpen(true)}>
                                                        <PenTool className="w-3 h-3 mr-1" /> {t('checks.evaluate')}
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
                            <h3 className="text-lg font-semibold mb-3">{t('checks.assessors')}</h3>
                            <div className="flex flex-col gap-3">
                                {check.assessors?.map((assessor: any) => (
                                    <div key={assessor.id} className="flex flex-col md:flex-row items-start md:items-center justify-between border rounded-lg p-4 bg-card hover:bg-muted/10 transition-colors">
                                        <div className="flex items-center space-x-3 mb-3 md:mb-0">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback>{getInitials(assessor.user?.fullName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm md:text-base">{assessor.user?.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{assessor.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto justify-between md:justify-end">
                                            {assessor.evaluationSubmitted ? (
                                                assessor.evaluation ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {t('checks.submitted')}
                                                    </Badge>
                                                ) : (
                                                     <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1" title={t('checks.submittedHidden')}>
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {t('checks.submittedHidden')}
                                                    </Badge>
                                                )
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 py-1">
                                                    <AlertCircle className="w-3 h-3 mr-1" /> {t('checks.pending')}
                                                </Badge>
                                            )}
                                            
                                            <div className="flex gap-2">
                                                {/* Action for current user (Assessor) */}
                                                {user?.id === assessor.user?.id && check.finalDecision === 'pending' && (
                                                     <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span tabIndex={0}>
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="h-8" 
                                                                        variant="secondary" 
                                                                        onClick={handleStartCheck}
                                                                        disabled={!startStatus.allowed}
                                                                    >

                                                                        <Play className="w-3 h-3 mr-1" /> {t('checks.start')}
                                                                    </Button>
                                                                </span>
                                                            </TooltipTrigger>
                                                            {!startStatus.allowed && (
                                                                <TooltipContent>
                                                                    <p>{startStatus.reason}</p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}

                                                {/* Evaluate Button - Show if Started and NOT signed */}
                                                {(user?.id === assessor.user?.id && check.finalDecision === 'in_progress' && !assessor.evaluationSubmitted && !assessor.signatureReceived) && (
                                                    <Button size="sm" className="h-8" onClick={() => setIsSubmitModalOpen(true)}>
                                                        <PenTool className="w-3 h-3 mr-1" /> {t('checks.evaluate')}
                                                    </Button>
                                                )}
                                                
                                                {/* Finished Evaluating / Signed Status for Me */}
                                                {(user?.id === assessor.user?.id && (assessor.evaluationSubmitted || assessor.signatureReceived)) && (
                                                     <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-3 py-1 ml-2">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> {t('checks.evaluationCompleted')}
                                                    </Badge>
                                                )}
                                                

                                                
                                                {/* Signature Status Badge */}
                                                {assessor.signatureReceived && (
                                                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 px-3 py-1 ml-2">
                                                        <PenTool className="w-3 h-3 mr-1" /> {t('checks.signed')}
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
                {check.profile?.requiredElements && Object.keys(check.profile.requiredElements).length > 0 && (
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('checks.assessmentCriteria')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Pass Criteria Display */}
                        {check.passCriteria && (
                            <div className="mb-6 pb-6 border-b">
                                <h4 className="font-semibold text-sm mb-3">{t('checks.passingStandards')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {check.passCriteria.required?.includes('theory') && (
                                        <div className="flex flex-col p-3 bg-muted/30 rounded-md border">
                                            <span className="text-xs text-muted-foreground uppercase font-medium">{t('standards.theory')}</span>
                                            <span className="font-semibold text-lg">
                                                Min {check.passCriteria.theory}%
                                            </span>
                                        </div>
                                    )}
                                    {check.passCriteria.required?.includes('practical') && (
                                        <div className="flex flex-col p-3 bg-muted/30 rounded-md border">
                                            <span className="text-xs text-muted-foreground uppercase font-medium">{t('standards.practical')}</span>
                                            <span className="font-semibold text-lg capitalize">
                                                {check.passCriteria.practical === 'pass' ? 'Pass / Fail' : check.passCriteria.practical}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm mb-2">{t('checks.requiredElements')}</h4>
                            {Object.values(check.profile.requiredElements).map((elem: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0 hover:bg-muted/50 px-2 py-1 rounded">
                                    <span className="font-medium">{elem.name}</span>
                                    {elem.mandatory && <Badge variant="secondary" className="text-xs">{t('common.required', 'Mandatory')}</Badge>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                )}


            </div>

            {/* Batch Signing Button for Multi-Candidate */}
            {/* Batch Signing Removed */}

            <SubmitEvaluationModal 
                open={isSubmitModalOpen}
                onOpenChange={setIsSubmitModalOpen}
                checkId={id!}
                profile={check.profile}
                checkType={check.checkType || 'combined'}
                passCriteria={check.passCriteria}
                standard={check.trainingStandards || check.profile?.trainingStandards}
                traineeName={check.trainee?.full_name || check.candidates?.[0]?.candidate?.fullName}
                candidateId={check.candidates?.[0]?.candidateId}
                onSuccess={() => {
                    fetchCheck();
                }}
            />
            {/* SignatureModal Removed */}
            {/* Finalize Dialog Removed */}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the scheduled check
                            and remove all associated data, including evaluations and signatures.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Finalize Dialog Removed */}
        </div>
    );
};

// Helper
// (accessToEvaluate and accessToStart logic moved inline)

export default CheckDetailPage;
