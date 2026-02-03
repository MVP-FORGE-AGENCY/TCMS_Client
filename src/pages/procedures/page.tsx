import { useState, useEffect } from "react"
import { FileText, Calendar, ExternalLink, Loader2, Plus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProcedureForm } from "@/components/forms/ProcedureForm"

interface SOP {
    slug: string
    title: string
    description: string
    version: string
    lastReviewed: string
    nextReview: string
}

export default function ProceduresPage() {
    const { t, i18n } = useTranslation()
    const { user } = useAuth()
    const [sops, setSops] = useState<SOP[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canEdit = ["admin", "training_manager", "super_admin"].includes(user?.role || "")

    useEffect(() => {
        fetchSops()
    }, [])

    const fetchSops = async () => {
        try {
            setIsLoading(true)
            const params: any = {}
            if (user?.organisationId) {
                params.organisationId = user.organisationId
            }
            const response = await api.get('/sop', { params })
            setSops(response.data.data || [])
        } catch (error) {
            console.error("Failed to fetch SOPs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB'
        return new Date(dateStr).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleCreate = async (values: any) => {
        try {
            setIsSubmitting(true)
            await api.post('/sop', values)
            toast.success(t("procedures.createSuccess") || "Procedure created successfully")
            setIsCreateOpen(false)
            fetchSops()
        } catch (error) {
            console.error("Failed to create SOP:", error)
            toast.error(t("errors.createError") || "Failed to create procedure")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("procedures.title")}</h1>
                    <p className="text-muted-foreground">
                        {t("procedures.subtitle")}
                    </p>
                </div>
                {canEdit && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("procedures.create") || "New Procedure"}
                    </Button>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sops.map((sop) => (
                    <Card key={sop.slug} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <Badge variant="secondary" className="text-xs">
                                        v{sop.version}
                                    </Badge>
                                </div>
                            </div>
                            <CardTitle className="text-lg mt-2">{sop.title}</CardTitle>
                            <CardDescription>{sop.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                                <Calendar className="h-3 w-3" />
                                <span>{t("procedures.lastReviewed")}: {formatDate(sop.lastReviewed)}</span>
                            </div>
                            <Link to={`/procedures/${sop.slug}`}>
                                <Button className="w-full" variant="outline">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t("procedures.viewProcedure")}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {sops.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t("procedures.noProcedures")}</h3>
                    <p className="text-muted-foreground">
                        {t("errors.notFound")}
                    </p>
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{t("procedures.create") || "Create New Procedure"}</DialogTitle>
                    </DialogHeader>
                    <ProcedureForm
                        onSubmit={handleCreate}
                        onCancel={() => setIsCreateOpen(false)}
                        isLoading={isSubmitting}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
