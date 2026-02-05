import { useEffect, useState } from "react"
import { certificates, api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2, PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Certificate {
    id: string
    certificate_number: string
    issue_date: string
    expiry_date: string | null
    metadata: {
        curriculumName: string
        curriculumCode: string
        campaignName?: string
        type?: string
    }
}

interface CertificatesListProps {
    userId: string
    readOnly?: boolean
    availableCampaigns?: any[]
    availableChecks?: any[]
}

export function CertificatesList({ userId, availableCampaigns = [], availableChecks = [] }: CertificatesListProps) {
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState<string | null>(null)
    const [generating, setGenerating] = useState<string | null>(null)

    const loadCertificates = async () => {
        try {
            const response = await certificates.getUserCertificates(userId)
            // @ts-ignore
            setCerts(response.data || [])
        } catch (error) {
            console.error("Failed to load certificates:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (userId) {
            loadCertificates()
        }
    }, [userId])

    const handleDownload = async (cert: Certificate) => {
        try {
            setDownloading(cert.id)
            const response = await certificates.getDownloadUrl(cert.id)
            // @ts-ignore
            const url = response.data?.url
            
            if (url) {
                window.open(url, '_blank')
            } else {
                toast.error("Failed to generate download link")
            }
        } catch (error) {
            console.error("Download error:", error)
            toast.error("Failed to download certificate")
        } finally {
            setDownloading(null)
        }
    }

    const handleGenerateCampaignCert = async (campaign: any) => {
        try {
            setGenerating(campaign.campaignName)
            // Identify campaign ID from 'trainings' object? 
            // The 'trainings' object in users.js has `campaignName` but maybe not `campaignId` directly if purely merged?
            // Wait, `historyTrainings` in users.js has `sessionId`. `campaignName`.
            // It does NOT have `campaignId`!
            // I need to add `campaignId` to the `historyTrainings` mapping in `users.js`!
            // CRITICAL CHECK: Does `t` have `campaignId`?
            // I added `campaignName`. I need `campaignId`.
            // For now, assuming I will fix `users.js` to include `campaignId` or I can't generate.
            // Let's assume I fix users.js next.
            if (!campaign.campaignId) {
                toast.error("Campaign ID missing");
                return;
            }

            await api.post(`/reports/campaigns/${campaign.campaignId}/certificate`, { userId });
            toast.success("Certificate generated");
            loadCertificates(); // Reload to show new cert
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate certificate");
        } finally {
            setGenerating(null);
        }
    }

    const handleDownloadProtocol = async (check: any) => {
        try {
            setDownloading(check.id)
            // This endpoint streams the PDF directly
            // We need to fetch as blob
            // api.post returns json usually? No, axios can return blob.
            // The `api` wrapper might default to json.
            // Let's use fetch or modify api call.
            // Assuming `api` is axios instance.
            const res = await api.post(`/reports/checks/${check.id}/protocol`, {}, { responseType: 'blob' });
            
            // Create blob link
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `protocol-${check.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error("Protocol download error:", error);
            toast.error("Failed to download protocol");
        } finally {
            setDownloading(null);
        }
    }

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-8">
            {/* 1. Issued Certificates */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Issued Certificates</h3>
                {certs.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground border rounded-lg bg-slate-50">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No certificates issued yet</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {certs.map((cert) => (
                            <Card key={cert.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {cert.certificate_number}
                                        </Badge>
                                        {cert.expiry_date && new Date(cert.expiry_date) < new Date() && (
                                            <Badge variant="destructive">Expired</Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-base mt-2 line-clamp-1" title={cert.metadata.campaignName || cert.metadata.curriculumName}>
                                        {cert.metadata.campaignName || cert.metadata.curriculumName}
                                    </CardTitle>
                                    <CardDescription>{cert.metadata.curriculumCode}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Issued:</span>
                                            <span className="font-medium text-foreground">{new Date(cert.issue_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        className="w-full" 
                                        onClick={() => handleDownload(cert)}
                                        disabled={!!downloading}
                                    >
                                        {downloading === cert.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                                        Download PDF
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Separator />

            {/* 2. Passed Campaigns (Generate) */}
            {(availableCampaigns.length > 0) && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Eligible for Certificate</h3>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {/* Deduplicate campaigns by name or group them? 
                            availableCampaigns is list of sessions. We need unique campaigns. 
                            Users.js returns sessions. We need to group by campaign.
                        */}
                        {Array.from(new Set(availableCampaigns.map(t => t.campaignName))).map(campName => {
                             const session = availableCampaigns.find(t => t.campaignName === campName);
                             // Check if already issued
                             const issued = certs.some(c => c.metadata.campaignName === campName);
                             if (issued) return null; // Don't show if issued

                             return (
                                <Card key={campName} className="border-dashed">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">{campName}</CardTitle>
                                        <CardDescription>Campaign Completed</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button 
                                            size="sm" 
                                            className="w-full" 
                                            onClick={() => handleGenerateCampaignCert(session)} 
                                            disabled={!!generating}
                                        >
                                            {generating === campName ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                                            Generate Certificate
                                        </Button>
                                    </CardContent>
                                </Card>
                             )
                        })}
                    </div>
                </div>
            )}

            <Separator />

            {/* 3. Proficiency Check Protocols */}
            {(availableChecks.length > 0) && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Proficiency Check Protocols</h3>
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {availableChecks.map((check) => (
                            <Card key={check.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{check.profileCode}</CardTitle>
                                    <CardDescription>{check.profileName}</CardDescription>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {new Date(check.date).toLocaleDateString()} • {check.result.toUpperCase()}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => handleDownloadProtocol(check)}
                                        disabled={!!downloading}
                                    >
                                        {downloading === check.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                                        Download Protocol
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
