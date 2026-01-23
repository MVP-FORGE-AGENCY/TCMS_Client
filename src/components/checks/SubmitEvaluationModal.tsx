import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';

interface SubmitEvaluationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkId: string;
    profile: any;
    checkType?: string;
    standard?: any;
    traineeName: string;
    candidateId?: string; // Add optional candidateId
    onSuccess: () => void;
}

const SubmitEvaluationModal: React.FC<SubmitEvaluationModalProps> = ({ 
    open, onOpenChange, checkId, profile, checkType = 'combined', standard, traineeName, candidateId, onSuccess 
}) => {
    const [loading, setLoading] = useState(false);
    
    // State
    const [elementsResults, setElementsResults] = useState<Record<string, string>>({});
    const [overallResult, setOverallResult] = useState<'pass'|'fail'|''>('');
    const [comments, setComments] = useState('');
    const [theoryScore, setTheoryScore] = useState<string>('');
    const [practicalScore, setPracticalScore] = useState<string>('');
    const sigCanvas = useRef<SignatureCanvas>(null);

    const [step, setStep] = useState(1);

    const clearSignature = () => sigCanvas.current?.clear();

    const handleNext = () => {
         // Validate Step 1
         if (!overallResult) {
            toast.error('Overall result is required');
            return;
        }

        if ((checkType === 'theory' || checkType === 'combined') && !theoryScore) {
             toast.error('Theory score is required');
             return;
        }
        if ((checkType === 'practical' || checkType === 'combined') && !practicalScore) {
             toast.error('Practical score is required');
             return;
        }

        if (profile?.requiredElements) {
             for (const [key, elem] of Object.entries(profile.requiredElements) as any) {
                 if (elem.mandatory && !elementsResults[key]) {
                     toast.error(`Mandatory element "${elem.name}" must be evaluated`);
                     return;
                 }
              }
        }
        
        setStep(2);
    };

    const handleSubmit = async () => {
        // Validate Signature
        if (sigCanvas.current?.isEmpty()) {
            toast.error('Signature is required');
            return;
        }

        setLoading(true);
        try {
            const signatureData = sigCanvas.current?.toDataURL('image/png');

            await api.post(`/checks/${checkId}/assessor-evaluations`, {
                candidateId, // Include candidateId
                elementsResults,
                result: overallResult,
                comments,
                theoryScore: theoryScore ? parseInt(theoryScore) : null,
                practicalScore: practicalScore ? parseInt(practicalScore) : null,
                signatureUrl: signatureData, // Base64 string
                signedAt: new Date().toISOString()
            });
            toast.success('Evaluation submitted and protocol signed.');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || 'Failed to submit evaluation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 ? 'Submit Evaluation (Step 1/2)' : 'Sign Protocol (Step 2/2)'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 
                            ? `Evaluate proficiency for ${traineeName} against ${profile?.code}.` 
                            : 'Please sign below to certify this evaluation protocol.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    
                    {step === 1 && (
                        <>
                            {/* Scores Section */}
                            <div className="grid grid-cols-2 gap-4">
                                {(checkType === 'theory' || checkType === 'combined') && (
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            Theory Score (0-100)
                                            {standard?.theory_pass_score && (
                                                <span className="text-xs text-muted-foreground">Pass: {standard.theory_pass_score}%</span>
                                            )}
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
                                {(checkType === 'practical' || checkType === 'combined') && (
                                    <div className="space-y-2">
                                        <Label className="flex justify-between">
                                            Practical Score (0-100)
                                            {standard?.practical_pass_score && (
                                                <span className="text-xs text-muted-foreground">Pass: {standard.practical_pass_score}%</span>
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
                                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Assessment Elements</h4>
                                {profile?.requiredElements && Object.entries(profile.requiredElements).map(([key, elem]: [string, any]) => (
                                    <div key={key} className="flex flex-col space-y-2 p-3 border rounded-md bg-muted/20">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Label className="text-base font-semibold">{elem.name}</Label>
                                                {elem.mandatory && <span className="ml-2 text-xs text-red-500 font-medium">(Mandatory)</span>}
                                            </div>
                                            <RadioGroup 
                                                className="flex gap-4" 
                                                value={elementsResults[key]} 
                                                onValueChange={(v) => setElementsResults(prev => ({...prev, [key]: v}))}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="pass" id={`${key}-pass`} />
                                                    <Label htmlFor={`${key}-pass`} className="cursor-pointer text-green-600">Pass</Label>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <RadioGroupItem value="fail" id={`${key}-fail`} />
                                                    <Label htmlFor={`${key}-fail`} className="cursor-pointer text-red-600">Fail</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Overall Result */}
                            <div className="space-y-2">
                                <Label>Overall Assessor Result</Label>
                                <RadioGroup value={overallResult} onValueChange={(v: any) => setOverallResult(v)} className="flex gap-4">
                                     <div className="flex items-center space-x-2 border p-3 rounded-md w-full hover:bg-green-50/50 data-[state=checked]:border-green-500 data-[state=checked]:bg-green-50">
                                        <RadioGroupItem value="pass" id="res-pass" />
                                        <Label htmlFor="res-pass" className="flex-1 cursor-pointer font-semibold text-green-700">Pass</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border p-3 rounded-md w-full hover:bg-red-50/50 data-[state=checked]:border-red-500 data-[state=checked]:bg-red-50">
                                        <RadioGroupItem value="fail" id="res-fail" />
                                        <Label htmlFor="res-fail" className="flex-1 cursor-pointer font-semibold text-red-700">Fail</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label>Comments</Label>
                                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Enter observations..." />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        /* Signature Step */
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground">
                                I confirm that I have evaluated the trainee according to the standards and the results recorded are accurate and final.
                            </div>
                            <div className="space-y-2">
                                <Label>Assessor Signature</Label>
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
                                    <span className="text-xs text-muted-foreground">Sign above using your mouse or touch screen.</span>
                                    <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs text-destructive h-6">Clear Signature</Button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => {
                        if (step === 2) setStep(1);
                        else onOpenChange(false);
                    }} disabled={loading}>
                        {step === 1 ? 'Cancel' : 'Back'}
                    </Button>
                    
                    {step === 1 ? (
                         <Button onClick={handleNext}>Next: Sign Protocol</Button>
                    ) : (
                         <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                             {loading ? 'Submitting...' : 'Sign & Complete Evaluation'}
                         </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SubmitEvaluationModal;
