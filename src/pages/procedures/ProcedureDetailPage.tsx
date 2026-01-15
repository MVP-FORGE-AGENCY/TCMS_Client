import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ArrowLeft, Printer, Calendar, FileText, Loader2, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProcedureForm } from "@/components/forms/ProcedureForm"

interface TOCItem {
    level: number
    text: string
    id: string
}

interface SOPDetail {
    slug: string
    title: string
    description: string
    version: string
    lastReviewed: string
    nextReview: string
    content: string
    tableOfContents: TOCItem[]
}

export default function ProcedureDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const { t, i18n } = useTranslation()
    const { user } = useAuth()
    const [sop, setSop] = useState<SOPDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const canEdit = ["admin", "training_manager", "super_admin"].includes(user?.role || "")

    useEffect(() => {
        if (slug) {
            fetchSop(slug)
        }
    }, [slug])

    const fetchSop = async (sopSlug: string) => {
        try {
            setIsLoading(true)
            const response = await api.get(`/sop/${sopSlug}`)
            setSop(response.data)
        } catch (error) {
            console.error("Failed to fetch SOP:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdate = async (values: any) => {
        if (!sop) return
        try {
            setIsSubmitting(true)
            const res = await api.put(`/sop/${sop.slug}`, values)
            setSop(prev => prev ? { ...prev, ...res.data } : null)
            toast.success(t("procedures.updateSuccess") || "Procedure updated successfully")
            setIsEditOpen(false)
            // Refresh full content (renderer might need it)
            fetchSop(sop.slug)
        } catch (error) {
            console.error("Failed to update SOP:", error)
            toast.error(t("errors.updateError") || "Failed to update procedure")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!sop) return
        if (!window.confirm(t("procedures.deleteConfirm") || "Are you sure you want to delete this procedure?")) return

        try {
            await api.delete(`/sop/${sop.slug}`)
            toast.success(t("procedures.deleteSuccess") || "Procedure deleted successfully")
            navigate("/procedures")
        } catch (error) {
            console.error("Failed to delete SOP:", error)
            toast.error(t("errors.deleteError") || "Failed to delete procedure")
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const formatDate = (dateStr: string) => {
        const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-GB'
        return new Date(dateStr).toLocaleDateString(locale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!sop) {
        return (
            <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{t("procedures.noProcedures")}</h3>
                <p className="text-muted-foreground mb-4">
                    {t("errors.loadError")}
                </p>
                <Link to="/procedures">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("common.back")}
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Link to="/procedures">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t("common.back")}
                        </Button>
                    </Link>
                        <h1 className="text-2xl font-bold tracking-tight">{sop.title}</h1>
                        <p className="text-muted-foreground text-sm">{sop.description}</p>
                    </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        {t("common.print")}
                    </Button>
                    {canEdit && (
                        <>
                            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
                {/* Table of Contents - Sidebar */}
                <aside className="hidden lg:block print:hidden">
                    <div className="sticky top-20">
                        <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                            {t("procedures.contents")}
                        </h3>
                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                            <nav className="space-y-1">
                                {sop.tableOfContents.map((item, index) => (
                                    <a
                                        key={index}
                                        href={`#${item.id}`}
                                        className={`block text-sm py-1 hover:text-primary transition-colors ${
                                            item.level === 1 
                                                ? 'font-medium' 
                                                : item.level === 2 
                                                    ? 'pl-4 text-muted-foreground' 
                                                    : 'pl-8 text-muted-foreground text-xs'
                                        }`}
                                    >
                                        {item.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="min-w-0">
                    <div className="rounded-lg border bg-card p-6 sm:p-8">
                        {/* Print Header */}
                        <div className="hidden print:block mb-8 pb-4 border-b">
                            <h1 className="text-2xl font-bold">{sop.title}</h1>
                            <p className="text-gray-600">{sop.description}</p>
                        </div>

                        {/* Rendered Markdown Content */}
                        <article 
                            className="prose prose-slate dark:prose-invert max-w-none
                                prose-headings:scroll-mt-20 
                                prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4
                                prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4
                                prose-h3:text-lg prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3
                                prose-p:leading-7
                                prose-table:border-collapse prose-table:border prose-table:w-full
                                prose-th:border prose-th:p-2 prose-th:bg-muted prose-th:font-semibold prose-th:text-left
                                prose-td:border prose-td:p-2
                                prose-ul:list-disc prose-ul:pl-6
                                prose-ol:list-decimal prose-ol:pl-6
                                prose-li:my-1
                                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                                prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: sop.content }}
                        />

                        {/* Footer */}
                        <div className="mt-8 pt-4 border-t text-sm text-muted-foreground flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{t("procedures.version")} {sop.version}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{t("procedures.lastReviewed")}: {formatDate(sop.lastReviewed)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{t("procedures.nextReview")}: {formatDate(sop.nextReview)}</span>
                            </div>
                        </div>
                    </div>
                </main>

            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>{t("procedures.edit") || "Edit Procedure"}</DialogTitle>
                    </DialogHeader>
                    {sop && (
                        <ProcedureForm
                            initialData={{
                                title: sop.title,
                                description: sop.description,
                                // We need raw content for editing, but API returns HTML in 'content'. 
                                // We also receive 'markdown' from backend now.
                                content: (sop as any).markdown || "" 
                            }}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditOpen(false)}
                            isLoading={isSubmitting}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
