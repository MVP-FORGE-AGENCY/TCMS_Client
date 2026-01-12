
import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Eraser, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface SignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    checkId: string;
    traineeName?: string;
    onSuccess: () => void;
}

const SignatureModal = ({ open, onOpenChange, checkId, traineeName, onSuccess }: SignatureModalProps) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [loading, setLoading] = useState(false);
    
    // Acknowledgements
    const [agreedAccurate, setAgreedAccurate] = useState(false);
    const [agreedFair, setAgreedFair] = useState(false);
    const [agreedMatch, setAgreedMatch] = useState(false);

    const clear = () => sigCanvas.current?.clear();

    const handleSign = async () => {
        if (!agreedAccurate || !agreedFair || !agreedMatch) {
            toast.error("Please confirm all acknowledgements before signing.");
            return;
        }

        if (sigCanvas.current?.isEmpty()) {
            toast.error("Please draw your signature.");
            return;
        }

        // Get signature as base64
        const signatureData = sigCanvas.current?.toDataURL('image/png');

        setLoading(true);
        try {
            await api.post(`/checks/${checkId}/sign`, { signatureData });
            toast.success("Signature submitted successfully.");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Signature error:", error);
            toast.error(error.response?.data?.error?.message || "Failed to submit signature.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Electronic Signature</DialogTitle>
                    <DialogDescription>
                        Proficiency Check for <strong>{traineeName || 'Trainee'}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-3 bg-muted/20 p-3 rounded-md border">
                        <p className="text-sm font-medium mb-2">By signing, you confirm that:</p>
                        <div className="flex items-start space-x-2">
                            <Checkbox id="ack1" checked={agreedAccurate} onCheckedChange={(c) => setAgreedAccurate(!!c)} />
                            <Label htmlFor="ack1" className="text-sm leading-none pt-0.5 cursor-pointer">
                                The evaluation is accurate and complete
                            </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Checkbox id="ack2" checked={agreedFair} onCheckedChange={(c) => setAgreedFair(!!c)} />
                            <Label htmlFor="ack2" className="text-sm leading-none pt-0.5 cursor-pointer">
                                The assessment was conducted fairly
                            </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Checkbox id="ack3" checked={agreedMatch} onCheckedChange={(c) => setAgreedMatch(!!c)} />
                            <Label htmlFor="ack3" className="text-sm leading-none pt-0.5 cursor-pointer">
                                The trainee's performance matches the recorded result
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Draw your signature below:</Label>
                        <div className="border-2 border-dashed border-input rounded-md bg-white hover:border-primary/50 transition-colors">
                            <SignatureCanvas 
                                ref={sigCanvas}
                                canvasProps={{
                                    className: 'w-full h-40 rounded-md cursor-crosshair',
                                    style: { width: '100%', height: '160px' }
                                }}
                                backgroundColor="rgba(255,255,255,1)"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground h-8">
                                <Eraser className="w-3 h-3 mr-1" /> Clear Signature
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSign} disabled={loading || !agreedAccurate || !agreedFair || !agreedMatch}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
                        Sign & Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SignatureModal;
