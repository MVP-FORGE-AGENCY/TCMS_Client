import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { standards } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, AlertCircle } from "lucide-react"
import { HistoryTimelineCard } from "./HistoryTimelineCard"


interface RevisionHistoryModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    standardId: string | null
}

import { useTranslation } from "react-i18next"

export function RevisionHistoryModal({ open, onOpenChange, standardId }: RevisionHistoryModalProps) {
    const { t } = useTranslation()
    const [expandedRevisionId, setExpandedRevisionId] = useState<string | null>(null)

    // Fetch revision history
    const { data, isLoading, error } = useQuery({
        queryKey: ["standards", standardId, "revisions"],
        queryFn: () => standardId ? standards.getRevisions(standardId) : Promise.reject("No ID"),
        enabled: !!standardId && open,
    })

    const handleToggle = (revId: string) => {
        setExpandedRevisionId(current => current === revId ? null : revId)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {t("standards.revisionHistory.title", "Revision History")}
                    </DialogTitle>
                    <DialogDescription>
                        {data ? (
                            <span>
                                <span className="font-mono font-medium text-foreground">{data.code}</span>
                                <span className="mx-2">•</span>
                                {data.totalRevisions} {t("standards.revisionHistory.found", "revisions found")}
                            </span>
                        ) : (
                            t("standards.revisionHistory.loading", "Loading history...")
                        )}
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 p-6 bg-muted/10">
                    <div className="max-w-3xl mx-auto">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p>{t("standards.revisionHistory.loadingTimeline", "Loading revisions timeline...")}</p>
                            </div>
                        )}

                        {error && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-destructive">
                                <AlertCircle className="h-10 w-10" />
                                <p>{t("standards.revisionHistory.error", "Failed to load revision history.")}</p>
                            </div>
                        )}

                        {!isLoading && data && data.history.length > 0 && (
                            <div className="mt-2">
                                {data.history.map((rev: any, index: number) => (
                                    <HistoryTimelineCard 
                                        key={rev.id} 
                                        revision={rev} 
                                        isExpanded={expandedRevisionId === rev.id}
                                        onToggle={() => handleToggle(rev.id)}
                                        isLast={index === data.history.length - 1}
                                    />
                                ))}
                            </div>
                        )}

                        {!isLoading && data && data.history.length === 0 && (
                             <div className="text-center py-12 text-muted-foreground">
                                 {t("standards.revisionHistory.empty", "No history found for this standard.")}
                             </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
