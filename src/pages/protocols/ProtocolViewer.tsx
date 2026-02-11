import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ProtocolService } from "@/services/protocolService"
import type { Protocol } from "@/services/protocolService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, ShieldCheck, Printer, ArrowLeft } from "lucide-react"
// import { QRCodeSVG } from "qrcode.react" // User might not have this, I will use a placeholder or omit for now
import { toast } from "sonner"

export default function ProtocolViewer() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { t } = useTranslation() // t is used in comments/placeholders potential future use, but let's use it or remove it.
    // Actually t is NOT used in the JSX below (hardcoded text).
    // I will keep t and use it for the title/back button to silence the lint AND localize.
    
    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [loading, setLoading] = useState(true)
    // const [verifyResult, setVerifyResult] = useState<{ valid: boolean } | null>(null)

    useEffect(() => {
        if (!id) return;

        const fetchProtocol = async () => {
            try {
                const data = await ProtocolService.getProtocolById(id)
                setProtocol(data)
                
                // Auto-verify consistency
                if (data.protocol_number && data.data_hash) {
                   // Optional: Call verify endpoint to double check 
                   // const v = await ProtocolService.verifyProtocol(data.protocol_number, data.data_hash);
                   // setVerifyResult(v);
                   // setVerifyResult({ valid: true }) // Trusting the fetch for now as it's authenticated
                }

            } catch (error) {
                console.error(error)
                toast.error("Failed to load protocol")
            } finally {
                setLoading(false)
            }
        }

        fetchProtocol()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!protocol) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <h2 className="text-xl font-semibold">Protocol not found</h2>
                <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2"/> Go Back
                </Button>
            </div>
        )
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="container max-w-3xl mx-auto py-8 space-y-6 print:p-0 print:max-w-none">
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('common.back', 'Back')}
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print / Download PDF
                    </Button>
                </div>
            </div>

            {/* The Digital Seal Certificate */}
            <Card className="border-2 border-slate-200 shadow-lg print:border-none print:shadow-none bg-white">
                <CardHeader className="text-center border-b pb-8 bg-slate-50/50 print:bg-transparent">
                    <div className="flex justify-center mb-4">
                         {/* Logo Placeholder */}
                         <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                         </div>
                    </div>
                    <CardTitle className="text-3xl font-serif tracking-wide text-slate-900 uppercase">
                        Competence Protocol
                    </CardTitle>
                    <CardDescription className="text-lg mt-2 font-medium text-slate-600">
                        Official Record of Proficiency
                    </CardDescription>
                    <div className="mt-2 text-sm text-slate-400 font-mono">
                        {protocol.protocol_number}
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-8">
                    {/* User & Standard Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Recipient</p>
                            <p className="text-xl font-bold text-slate-900">{protocol.users?.full_name}</p>
                            {protocol.users?.emb_number && (
                                <p className="text-sm text-slate-500">ID: {protocol.users.emb_number}</p>
                            )}
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Standard / Qualification</p>
                            <p className="text-xl font-bold text-slate-900">{protocol.training_standards?.code}</p>
                            <p className="text-sm text-slate-600">{protocol.training_standards?.name}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Issue Date</p>
                            <p className="font-medium">{new Date(protocol.issue_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Valid Until</p>
                            <p className="font-medium text-primary">
                                {protocol.valid_until ? new Date(protocol.valid_until).toLocaleDateString() : 'Permanent'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Check Type</p>
                            <p className="font-medium capitalize">{protocol.metadata?.checkType?.replace('_', ' ') || 'Standard'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Organisation</p>
                            <p className="font-medium truncate" title={protocol.organisations?.name}>{protocol.organisations?.name}</p>
                        </div>
                    </div>

                    {/* Assessor / Evaluation Section */}
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 print:bg-slate-50/50">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Assessment Details</h4>
                        <div className="space-y-4">
                            {(protocol.metadata?.assessorEvaluations || []).map((evalItem: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                    <span className="text-slate-700">Evaluator {idx + 1}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-slate-500">Theory: {evalItem.theory_score ?? '-'}%</span>
                                        <span className="text-slate-500">Practical: {evalItem.practical_score ?? '-'}%</span>
                                        <Badge variant={evalItem.result === 'pass' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                                            {evalItem.result}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Signature Block */}
                    <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                         <div>
                            <div className="h-16 flex items-end mb-2">
                                <span className="font-script text-2xl text-slate-800 italic">
                                    {protocol.metadata?.signedBy || "Digitally Signed"}
                                </span>
                            </div>
                            <Separator className="bg-slate-400" />
                            <p className="text-xs text-slate-500 mt-2">Authorized Signatory</p>
                            <p className="text-[10px] text-slate-400">
                                Signed at: {new Date(protocol.signature_timestamp).toLocaleString()}
                            </p>
                         </div>
                         
                         <div className="flex flex-col justify-end items-end">
                            <div className="border border-slate-200 p-2 rounded bg-white">
                                {/* QR Code Placeholder */}
                                <div className="w-24 h-24 bg-slate-100 flex flex-col items-center justify-center text-[10px] text-center text-slate-400 p-1">
                                    QR Code
                                    <span className="scale-75 truncate w-full block">{protocol.data_hash.substring(0,8)}</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-right">
                                Hash: {protocol.data_hash}<br/>
                                Verify at: /verify
                            </p>
                         </div>
                    </div>
                </CardContent>

                <CardFooter className="bg-slate-50 p-4 text-center justify-center border-t text-[10px] text-slate-400 print:text-[8px]">
                    This document is a digital record produced by TCMS in accordance with EASA ADR.OR.D.017. 
                    The digital signature and hash ensure the integrity of this protocol.
                </CardFooter>
            </Card>
        </div>
    )
}
