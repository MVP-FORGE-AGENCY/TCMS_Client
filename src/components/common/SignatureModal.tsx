import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSign: (type: 'drawn' | 'typed', data: string) => Promise<void>;
    instructorName: string;
}

export function SignatureModal({ isOpen, onClose, onSign, instructorName }: SignatureModalProps) {
    const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
    const [typedName, setTypedName] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const sigPad = useRef<SignatureCanvas>(null);

    const clearSignature = () => {
        sigPad.current?.clear();
    };

    const handleSign = async () => {
        try {
            if (signatureType === 'drawn') {
                if (sigPad.current?.isEmpty()) {
                    toast.error('Please sign in the box before submitting');
                    return;
                }
                const data = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
                if (!data) return;
                
                setIsSubmitting(true);
                await onSign('drawn', data);
            } else {
                if (!typedName.trim()) {
                    toast.error('Please type your full name');
                    return;
                }
                if (typedName.toLowerCase() !== instructorName.toLowerCase()) {
                    toast.error(`Typed name must match instructor name: ${instructorName}`);
                    return;
                }
                if (!confirmed) {
                    toast.error('You must confirm that this signature is valid');
                    return;
                }

                setIsSubmitting(true);
                // Create a simple canvas with text for consistency if needed, 
                // or just pass the text. Backend stores data string.
                // We'll pass the typed name as data text
                await onSign('typed', typedName);
            }
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit signature');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Sign Session Results</DialogTitle>
                    <DialogDescription>
                        As the instructor, you must digitally sign the attendance and results to finalize this session.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as 'drawn' | 'typed')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="drawn">Draw Signature</TabsTrigger>
                        <TabsTrigger value="typed">Type Name</TabsTrigger>
                    </TabsList>

                    <TabsContent value="drawn" className="space-y-4 py-4">
                        <div className="border rounded-md p-2 bg-slate-50">
                            <SignatureCanvas
                                ref={sigPad}
                                canvasProps={{
                                    className: 'signature-canvas w-full h-[150px] cursor-crosshair',
                                }}
                                backgroundColor="rgba(0,0,0,0)"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={clearSignature}>
                                Clear
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            By drawing my signature, I certify that the recorded attendance and results are accurate.
                        </p>
                    </TabsContent>

                    <TabsContent value="typed" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="typedName">Full Name</Label>
                            <Input
                                id="typedName"
                                placeholder={`Type "${instructorName}"`}
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-start space-x-2 pt-2">
                            <Checkbox id="confirm" checked={confirmed} onCheckedChange={(c) => setConfirmed(!!c)} />
                            <Label htmlFor="confirm" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I, <strong>{instructorName}</strong>, certify that the recorded attendance and results are accurate and final.
                            </Label>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSign} disabled={isSubmitting}>
                        {isSubmitting ? 'Signing...' : 'Sign & Complete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
