import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api, checks } from '@/lib/api';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';

import { useTranslation } from 'react-i18next';

interface SubmitEvaluationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkId: string;
    profile: any;
    checkType?: string;
    passCriteria?: {
        required: string[];
        theory?: number;
        practical?: string;
    };
    standard?: any;
    traineeName: string;
    candidateId?: string;
    // candidates, skipSignature, startStep removed
    currentAssessorId?: string;
    onSuccess: () => void;
}

const SubmitEvaluationModal: React.FC<SubmitEvaluationModalProps> = ({ 
    open, onOpenChange, checkId, profile, checkType = 'combined', passCriteria, standard, traineeName, candidateId, onSuccess 
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    
    // State
    const [elementsResults, setElementsResults] = useState<Record<string, string>>({});
    const [overallResult, setOverallResult] = useState<'pass'|'fail'|''>('');
    const [comments, setComments] = useState('');
    const [theoryScore, setTheoryScore] = useState<string>('');
    const [practicalScore, setPracticalScore] = useState<string>('');
    const [password, setPassword] = useState('');
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [signaturePreview, setSignaturePreview] = useState<string>('');

    const [step, setStep] = useState(1);

    const clearSignature = () => sigCanvas.current?.clear();

    const handleScoreSubmit = async () => {
         // Validate Step 1
         if (!overallResult) {
            toast.error(t('checks.evalModal.resultRequired'));
            return;
        }

        const isTheoryRequired = passCriteria ? passCriteria.required?.includes('theory') : (checkType === 'theory' || checkType === 'combined');
        const isPracticalRequired = passCriteria ? passCriteria.required?.includes('practical') : (checkType === 'practical' || checkType === 'combined');

        if (isTheoryRequired && !theoryScore) {
             toast.error(t('checks.evalModal.theoryRequired'));
             return;
        }
        if (isPracticalRequired && !practicalScore) {
             toast.error(t('checks.evalModal.practicalRequired'));
             return;
        }

        if (profile?.requiredElements) {
             for (const [key, elem] of Object.entries(profile.requiredElements) as any) {
                 if (elem.mandatory && !elementsResults[key]) {
                     toast.error(t('checks.evalModal.mandatoryElementError', { name: elem.name }));
                     return;
                 }
              }
        }
        
        // Submit Evaluation Score
        setLoading(true);
        try {
            await checks.submitEvaluation(checkId, {
                candidateId, 
                elementsResults,
                result: overallResult,
                comments,
                // Using 'as any' or extending the type definition if needed, sending scores
                // The submitEvaluation signature in api.ts might need updating if it doesn't accept scores yet
                // Let's assume I need to pass them in additional fields or update apis.ts definition too if strict
                // For now, let's look at api.ts signature in step 4937/4940...
                // It defined: elementsResults, result, comments. MISSING scores.
                ...({ theoryScore: theoryScore ? parseInt(theoryScore) : null }),
                ...({ practicalScore: practicalScore ? parseInt(practicalScore) : null })
            } as any);
            
            setStep(2);
        } catch (error: any) {
             console.error(error);
             toast.error(error.response?.data?.error?.message || t('checks.evalModal.submitError'));
        } finally {
             setLoading(false);
        }
    };

    const handleSignSubmit = () => {
        // Validate Signature
        if (sigCanvas.current?.isEmpty()) {
            toast.error(t('checks.evalModal.signatureRequired'));
            return;
        }
        setSignaturePreview(sigCanvas.current?.toDataURL('image/png') || '');
        setStep(3);
    };

    const handleFinalizeSubmit = async () => {
        if (!password) {
            toast.error("Password is required");
            return;
        }

        setLoading(true);
        try {
            const signatureData = sigCanvas.current?.toDataURL('image/png');

            await api.post(`/checks/${checkId}/sign`, {
                signatureData,
                password
            });
            
            toast.success(t('checks.evalModal.protocolSigned'));
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || t('checks.evalModal.signError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 ? t('checks.evalModal.titleStep1') : step === 2 ? t('checks.evalModal.titleStep2') : t('checks.finalizeDialog.title', 'Finalize & Sign')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 
                            ? t('checks.evalModal.descStep1', { 
                                trainee: traineeName || t('checks.candidate'), 
                                standard: standard?.code || profile?.code || 'Standard' 
                              })
                            : step === 2 
                                ? t('checks.evalModal.descStep2')
                                : t('checks.finalizeDialog.enterPasswordLabel', 'Enter your password to confirm identity and sign.')}

                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    
                    {step === 1 && (
                        <>
                            {/* Scores Section */}
                            <div className="grid grid-cols-2 gap-4">
                                {(passCriteria ? passCriteria.required?.includes('theory') : (checkType === 'theory' || checkType === 'combined' || checkType === 'full_renewal')) && (
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            {t('checks.evalModal.theoryScore')}
                                            {passCriteria?.theory ? (
                                                <span className="text-xs text-muted-foreground">{t('checks.evalModal.minPass')} {passCriteria.theory}%</span>
                                            ) : (standard?.theoryPassScore || standard?.theory_pass_score) ? (
                                                <span className="text-xs text-muted-foreground">{t('checks.evalModal.passScore')} {standard.theoryPassScore || standard.theory_pass_score}%</span>
                                            ) : null}
                                        </Label>
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            value={theoryScore} 
                                            onChange={(e) => setTheoryScore(e.target.value)} 
                                        />
                                    </div>
                                )}
                                {(passCriteria ? passCriteria.required?.includes('practical') : (checkType === 'practical' || checkType === 'combined' || checkType === 'full_renewal')) && (
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            {t('checks.evalModal.practicalScore')}
                                            {(standard?.practicalPassScore || standard?.practical_pass_score) && (
                                                <span className="text-xs text-muted-foreground">{t('checks.evalModal.passScore')} {standard.practicalPassScore || standard.practical_pass_score}%</span>
                                            )}
                                        </Label>
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            value={practicalScore} 
                                            onChange={(e) => setPracticalScore(e.target.value)} 
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Elements */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">{t('checks.evalModal.assessmentElements')}</h4>
                                {profile?.requiredElements && Object.entries(profile.requiredElements).map(([key, elem]: [string, any]) => (
                                    <div key={key} className="flex flex-col space-y-2 p-3 border rounded-md bg-muted/20">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Label className="text-base font-semibold">{elem.name}</Label>
                                                {elem.mandatory && <span className="ml-2 text-xs text-red-500 font-medium">{t('checks.evalModal.mandatory')}</span>}
                                            </div>
                                            <RadioGroup 
                                                className="flex gap-4" 
                                                value={elementsResults[key]} 
                                                onValueChange={(v) => setElementsResults(prev => ({...prev, [key]: v}))}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="pass" id={`${key}-pass`} />
                                                    <Label htmlFor={`${key}-pass`} className="cursor-pointer text-green-600">{t('checks.evalModal.pass')}</Label>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="fail" id={`${key}-fail`} />
                                                    <Label htmlFor={`${key}-fail`} className="cursor-pointer text-red-600">{t('checks.evalModal.fail')}</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Overall Result */}
                            <div className="space-y-2">
                                <Label>{t('checks.evalModal.overallResult')}</Label>
                                <RadioGroup value={overallResult} onValueChange={(v: any) => setOverallResult(v)} className="flex gap-4">
                                     <div className="flex items-center space-x-2 border p-3 rounded-md w-full hover:bg-green-50/50 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-50">
                                        <RadioGroupItem value="pass" id="res-pass" />
                                        <Label htmlFor="res-pass" className="flex-1 cursor-pointer font-semibold text-green-700">{t('checks.evalModal.pass')}</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md w-full hover:bg-red-50/50 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-50">
                                        <RadioGroupItem value="fail" id="res-fail" />
                                        <Label htmlFor="res-fail" className="flex-1 cursor-pointer font-semibold text-red-700">{t('checks.evalModal.fail')}</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('checks.evalModal.comments')}</Label>
                                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder={t('checks.evalModal.enterObservations')} />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        /* Signature Step */
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground">
                                {t('checks.evalModal.confirmationText')}
                            </div>
                            <div className="space-y-2">
                                <Label>{t('checks.evalModal.assessorSignature')}</Label>
                                <div className="border-2 border-dashed rounded-md bg-white border-muted-foreground/30">
                                    <SignatureCanvas 
                                        ref={sigCanvas}
                                        canvasProps={{
                                            className: 'w-full h-[200px] rounded-md cursor-crosshair'
                                        }}
                                        backgroundColor="rgba(255,255,255,1)"
                                    />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-muted-foreground">{t('checks.evalModal.signInstruction')}</span>
                                    <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs text-destructive h-6">{t('checks.evalModal.clearSignature')}</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        /* Password Step & Summary */
                        <div className="space-y-6">
                            
                            {/* Signature Preview */}
                            <div className="bg-muted/30 p-4 rounded-md border flex flex-col items-center justify-center">
                                <span className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{t('checks.evalModal.signaturePreview', 'Signature Preview')}</span>
                                {signaturePreview ? (
                                    <img src={signaturePreview} alt="Signature" className="h-16 object-contain" />
                                ) : (
                                    <span className="text-sm italic text-muted-foreground">No signature captured</span>
                                )}
                            </div>

                            {/* Candidates Summary Removed - Single candidate flow */}

                            <div className="space-y-2 pt-2 border-t">
                                <Label>{t('checks.finalizeDialog.enterPasswordLabel')}</Label>
                                <Input 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('checks.finalizeDialog.passwordPlaceholder')}
                                />
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => {
                        if (step === 3) setStep(2);
                        else if (step === 2) setStep(1);
                        else onOpenChange(false);
                    }} disabled={loading}>
                        {step === 1 ? t('checks.evalModal.cancel') : t('checks.evalModal.back')}
                    </Button>
                    

                    {step === 1 ? (
                         <Button onClick={handleScoreSubmit}>
                             {t('checks.evalModal.nextSign')}
                         </Button>
                    ) : step === 2 ? (
                         <Button onClick={handleSignSubmit}>
                             {t('checks.evalModal.nextSign', 'Next')}
                         </Button>
                    ) : (
                         <Button onClick={handleFinalizeSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                             {loading ? t('checks.evalModal.submitting') : t('checks.finalizeDialog.confirm')}
                         </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SubmitEvaluationModal;
