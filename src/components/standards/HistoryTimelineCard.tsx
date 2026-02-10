import { format } from "date-fns"
import { 
    ChevronDown, 
    ChevronUp, 
    Users, 
    CheckCircle2, 
    Archive, 
    Info 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"


// We need to define the extended Revision type locally if it's not fully updated in shared types yet,
// or just cast/intersect it. For now assuming Standard type has been updated or we use separate type.
// Based on the prompt, the backend returns a specific structure.

interface RevisionHistoryItemProps {
    revision: any // Using any primarily to be flexible with the new backend shape, or strictly typed if Standard is updated
    isExpanded: boolean
    onToggle: () => void
    isLast: boolean
}

import { useTranslation } from "react-i18next"

export function HistoryTimelineCard({ revision, isExpanded, onToggle, isLast }: RevisionHistoryItemProps) {
    const { t } = useTranslation()
    const isCurrent = revision.status === 'current'
    
    // Formatting helpers
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return format(new Date(dateString), "MMM d, yyyy")
    }

    const { fullSnapshot: snap, changedFields } = revision

    // Helper to render field value possibly with highlight
    const FieldValue = ({ field, label, value, render }: { field: string, label: string, value: any, render?: (v: any) => React.ReactNode }) => {
        const isChanged = changedFields && changedFields[field]
        const oldValue = isChanged ? changedFields[field].old : null
        
        return (
            <div className={cn("p-2 rounded-md", isChanged ? "bg-amber-50 dark:bg-amber-950/30" : "")}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                    {isChanged && <span className="text-[10px] text-amber-600 font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50">{t("common.changed", "Changed")}</span>}
                </div>
                <div className="mt-1 text-sm">
                    {render ? render(value) : (value?.toString() || "-")}
                </div>
                {isChanged && (
                    <div className="mt-1 text-xs text-muted-foreground">
                        was: {render ? render(oldValue) : (oldValue?.toString() || "-")}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative pl-8 pb-8">
            {/* Timeline connection line */}
            {!isLast && (
                <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-border border-l-2 border-dashed border-muted-foreground/20" />
            )}
            
            {/* Timeline Dot */}
            <div className={cn(
                "absolute left-0 top-1.5 h-6 w-6 rounded-full border-4 flex items-center justify-center bg-background z-10",
                isCurrent ? "border-primary" : "border-muted-foreground/40"
            )}>
                {isCurrent && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>

            <Card className={cn(
                "transition-all duration-200",
                isCurrent ? "border-primary/50 shadow-md scale-[1.01]" : "border-border/60 opacity-90 hover:opacity-100",
                isExpanded ? "ring-1 ring-ring" : ""
            )}>
                {/* Header Section */}
                <div 
                    className="p-4 flex items-start justify-between cursor-pointer hover:bg-muted/5 sm:flex-row flex-col gap-4 sm:gap-0"
                    onClick={onToggle}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold">{t("standards.revisionHistory.revision", "Revision")} {revision.revision}</span>
                            {isCurrent ? (
                                <Badge variant="default" className="gap-1 pl-1">
                                    <CheckCircle2 className="h-3 w-3" /> {t("standards.revisionHistory.current", "Current")}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1 pl-1 text-muted-foreground">
                                    <Archive className="h-3 w-3" /> {t("standards.revisionHistory.archived", "Archived")}
                                </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">
                                {revision.revision === 1 ? t("standards.revisionHistory.initialVersion", "Initial Version") : `${t("standards.revisionHistory.created", "Created")} ${formatDate(revision.validFrom || revision.createdAt)}`}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {revision.isActive ? (
                                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                    {t("standards.revisionHistory.activeSince", "Active since")} {formatDate(revision.validFrom)}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    {t("standards.revisionHistory.activeRange", "Active: {{from}} - {{to}}", { from: formatDate(revision.validFrom), to: formatDate(revision.validUntil) })}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {revision.sessionsCount !== undefined && (
                            <div className="flex items-center gap-1" title={t("standards.revisionHistory.sessionsUsed", "{{count}} sessions used this revision", { count: revision.sessionsCount })}>
                                <Users className="h-4 w-4" />
                                <span>{revision.sessionsCount} {t("standards.revisionHistory.sessions", "sessions")}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Changes Summary */}
                {!isExpanded && (
                    <div className="px-4 pb-4">
                        {revision.changesSummary && revision.changesSummary.length > 0 ? (
                            <div className="space-y-1 mt-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">{t("standards.revisionHistory.changes", "Changes")}</p>
                                <ul className="space-y-1">
                                    {revision.changesSummary.map((change: string, idx: number) => (
                                        <li key={idx} className="text-sm flex items-start gap-2">
                                            <span className="mt-1.5 h-1 w-1 rounded-full bg-primary flex-shrink-0" />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic mt-2">
                                {revision.revision === 1 ? t("standards.revisionHistory.initialDef", "Initial standard definition") : t("standards.revisionHistory.noSummary", "No summary available")}
                            </p>
                        )}
                    </div>
                )}

                {/* Expanded Full Details */}
                {isExpanded && snap && (
                    <div className="border-t bg-muted/50 p-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* General Info */}
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Info className="h-4 w-4" /> {t("standards.revisionHistory.generalSettings", "General Settings")}
                                </h4>
                                <div className="grid gap-3">
                                    <FieldValue field="name" label={t("standards.history.standardName", "Standard Name")} value={snap.name} />
                                    <FieldValue field="description" label={t("common.description", "Description")} value={snap.description} />
                                    <FieldValue field="objectives" label={t("standards.objectives", "Objectives")} value={snap.objectives} 
                                        render={(val: string) => (
                                           <div className="whitespace-pre-wrap text-xs font-mono bg-background p-2 rounded border border-input/50 max-h-32 overflow-y-auto">
                                               {val}
                                           </div>
                                        )} 
                                    />
                                    <FieldValue field="departmentTag" label={t("common.department", "Department")} value={snap.departmentTag} />
                                    <FieldValue field="validityMonths" label={t("standards.validity", "Validity")} value={snap.validityMonths} render={v => `${v} ${t("common.months", "months")}`} />
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> {t("standards.revisionHistory.requirements", "Requirements")}
                                </h4>
                                
                                <div className="space-y-4">
                                    {/* Theory */}
                                    <div className={cn("p-3 rounded-md border", snap.hasTheory ? "bg-background" : "bg-muted/50 opacity-70")}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{t("standards.revisionHistory.theoryComponent", "Theory Component")}</span>
                                            <Badge variant={snap.hasTheory ? "outline" : "secondary"}>
                                                {snap.hasTheory ? t("standards.revisionHistory.enabled", "Enabled") : t("standards.revisionHistory.disabled", "Disabled")}
                                            </Badge>
                                        </div>
                                        {snap.hasTheory && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FieldValue field="theoryPassScore" label={t("standards.passScore", "Pass Score")} value={snap.theoryPassScore} render={v => `${v}%`} />
                                                <FieldValue field="allowedMethods" label={t("standards.allowedMethods", "Methods")} value={snap.allowedMethods} 
                                                    render={(methods: string[]) => (
                                                        <div className="flex flex-wrap gap-1">
                                                            {methods?.map(m => (
                                                                <Badge key={m} variant="secondary" className="text-[10px] capitalize">
                                                                    {t(`standards.methods.${m}`, m)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Practical */}
                                    <div className={cn("p-3 rounded-md border", snap.hasPractical ? "bg-background" : "bg-muted/50 opacity-70")}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium">{t("standards.revisionHistory.practicalComponent", "Practical Component")}</span>
                                            <Badge variant={snap.hasPractical ? "outline" : "secondary"}>
                                                {snap.hasPractical ? t("standards.revisionHistory.enabled", "Enabled") : t("standards.revisionHistory.disabled", "Disabled")}
                                            </Badge>
                                        </div>
                                        {snap.hasPractical && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <FieldValue field="practicalPassScore" label={t("standards.passScore", "Pass Score")} value={snap.practicalPassScore} render={v => `${v}%`} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Toggle */}
                <div 
                    className="border-t p-2 flex justify-center bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggle()
                    }}
                >
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs text-muted-foreground">
                        {isExpanded ? (
                            <>
                                <ChevronUp className="h-3 w-3" /> {t("standards.revisionHistory.hideDetails", "Hide Details")}
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3 w-3" /> {t("standards.revisionHistory.viewDetails", "View Full Details")}
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
