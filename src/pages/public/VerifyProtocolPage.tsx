import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Search, ShieldCheck, User, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

const VerifyProtocolPage = () => {
    const [searchParams] = useSearchParams();
    const [protocolId, setProtocolId] = useState(searchParams.get('id') || '');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            verify(idFromUrl);
        }
    }, [searchParams]);

    const verify = async (id: string) => {
        if (!id) return;
        setLoading(true);
        setError('');
        setResult(null);
        setSearched(true);

        try {
            // Public endpoint check
            const response = await api.get(`/public/verify/${id}`);
            setResult(response.data);
        } catch (err: any) {
            console.error('Verification failed', err);
            setError(err.response?.data?.message || 'Protocol check failed or invalid ID');
            setResult({ valid: false });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        verify(protocolId);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <ShieldCheck className="mx-auto h-12 w-12 text-blue-900" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
                        Protocol Validator
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Verify the authenticity of a digital competence protocol.
                    </p>
                </div>

                {/* Search Box */}
                <Card className="shadow-lg border-t-4 border-t-blue-900">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input 
                                placeholder="Enter Protocol ID (e.g. PROTO-2026-...)" 
                                value={protocolId}
                                onChange={(e) => setProtocolId(e.target.value)}
                                className="font-mono"
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Checking...' : <Search className="h-4 w-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Result Display */}
                {searched && (
                    <div className="transition-all duration-500 ease-in-out">
                        {error || (result && !result.valid) ? (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="pt-6 flex flex-col items-center text-center">
                                    <XCircle className="h-16 w-16 text-red-500 mb-4" />
                                    <h3 className="text-xl font-bold text-red-700">Invalid Protocol</h3>
                                    <p className="text-red-600 mt-2">
                                        The protocol ID <strong>{protocolId}</strong> could not be verified in our records.
                                    </p>
                                    <p className="text-sm text-red-500 mt-4">
                                        If you believe this is an error, please contact support.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : result?.valid ? (
                            <Card className="border-green-200 bg-white shadow-xl overflow-hidden">
                                <div className="bg-green-500 py-4 px-6 flex items-center justify-center">
                                    <CheckCircle2 className="h-8 w-8 text-white mr-3" />
                                    <h3 className="text-xl font-bold text-white">Valid Protocol</h3>
                                </div>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex justify-between items-start border-b pb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Issued To</p>
                                            <p className="text-lg font-bold text-slate-800 flex items-center">
                                                <User className="h-4 w-4 mr-2 text-slate-400" />
                                                {result.issuedTo}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Valid Until</p>
                                            <p className="text-lg font-bold text-green-700 flex items-center justify-end">
                                                <Calendar className="h-4 w-4 mr-2 text-green-500" />
                                                {result.validUntil ? new Date(result.validUntil).toLocaleDateString() : 'Indefinite'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Standard</p>
                                            <p className="font-medium">{result.standard}</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Protocol No</p>
                                                <p className="font-mono text-sm">{result.protocolNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Issue Date</p>
                                                <p className="font-mono text-sm">{new Date(result.issueDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-md border border-slate-100 mt-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-500">DIGITAL SEAL SIGNATURE</span>
                                                <Badge variant="outline" className="text-[10px] bg-white">SHA-256</Badge>
                                            </div>
                                            <p className="text-sm text-slate-700 font-medium">Signed by: {result.signedBy}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-1 break-all">
                                                {result.dataHashPreview || 'Hash verification pending'}...
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            Verified by CertifyCloud Trust Platform
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyProtocolPage;
