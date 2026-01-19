import { useEffect, useState } from "react"
import { certificates } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Certificate {
    id: string
    certificate_number: string
    issue_date: string
    expiry_date: string | null
    metadata: {
        curriculumName: string
        curriculumCode: string
    }
}

interface CertificatesListProps {
    userId: string
    readOnly?: boolean
}

export function CertificatesList({ userId, readOnly = false }: CertificatesListProps) {
    const [certs, setCerts] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState<string | null>(null)

    useEffect(() => {
        const loadCertificates = async () => {
            try {
                const response = await certificates.getUserCertificates(userId)
                // @ts-ignore - API wrapper returns { data: [...] } structure usually
                setCerts(response.data || [])
            } catch (error) {
                console.error("Failed to load certificates:", error)
            } finally {
                setLoading(false)
            }
        }
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
                // Open in new tab or trigger download
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

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>

    if (certs.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground border rounded-lg bg-slate-50">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No certificates issued yet</p>
            </div>
        )
    }

    return (
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
                        <CardTitle className="text-base mt-2 line-clamp-1" title={cert.metadata.curriculumName}>
                            {cert.metadata.curriculumName}
                        </CardTitle>
                        <CardDescription>{cert.metadata.curriculumCode}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4 space-y-1">
                            <div className="flex justify-between">
                                <span>Issued:</span>
                                <span className="font-medium text-foreground">{new Date(cert.issue_date).toLocaleDateString()}</span>
                            </div>
                            {cert.expiry_date && (
                                <div className="flex justify-between">
                                    <span>Valid Until:</span>
                                    <span className="font-medium text-foreground">{new Date(cert.expiry_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => handleDownload(cert)}
                            disabled={!!downloading}
                        >
                            {downloading === cert.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                            ) : (
                                <Download className="h-4 w-4 mr-2" />
                            )}
                            Download PDF
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
