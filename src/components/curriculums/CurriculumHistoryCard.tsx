import { format } from "date-fns"
import { 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    Archive, 
    Info,
    User,
    TrendingUp,
    TrendingDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CurriculumRevision {
    id: string
    revision: string
    status: 'current' | 'archived'
    isActive: boolean
    validFrom: string
    validUntil: string | null
    changeType: 'major' | 'minor' | 'initial'
    changesSummary: string[]
    fullSnapshot: {
        code: string
        name: string
        type: string
        description?: string
        validityMonths?: number
        standardTags?: string[]
        isActive: boolean
        modules?: any[]
    }
    changedFields: Record<string, { old: any; new: any }> | null
    changedBy: {
        id: string
        name: string
        email: string
    } | null
    createdAt: string
}

interface CurriculumHistoryCardProps {
    revision: CurriculumRevision
    isExpanded: boolean
    onToggle: () => void
    isLast: boolean
}

export function CurriculumHistoryCard({ revision, isExpanded, onToggle, isLast }: CurriculumHistoryCardProps) {
    const isCurrent = revision.status === 'current'
    const isMajor = revision.changeType === 'major'
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-"
        return format(new Date(dateString), "MMM d, yyyy 'at' HH:mm")
    }

    const { fullSnapshot: snap, changedFields } = revision

    const FieldValue = ({ field, label, value, render }: { field: string, label: string, value: any, render?: (v: any) => React.ReactNode }) => {
        const isChanged = changedFields && changedFields[field]
        const oldValue = isChanged ? changedFields[field].old : null
        
        return (
            <div className={cn("p-2 rounded-md", isChanged ? "bg-amber-50 dark:bg-amber-950/30" : "")}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                    {isChanged && <span className="text-[10px] text-amber-600 font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50">Changed</span>}
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
                            <span className="text-lg font-bold">v{revision.revision}</span>
                            {isCurrent ? (
                                <Badge variant="default" className="gap-1 pl-1">
                                    <CheckCircle2 className="h-3 w-3" /> Current
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1 pl-1 text-muted-foreground">
                                    <Archive className="h-3 w-3" /> Archived
                                </Badge>
                            )}
                            {isMajor ? (
                                <Badge variant="destructive" className="gap-1 text-xs">
                                    <TrendingUp className="h-3 w-3" /> Major
                                </Badge>
                            ) : revision.changeType === 'minor' ? (
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <TrendingDown className="h-3 w-3" /> Minor
                                </Badge>
                            ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{formatDate(revision.createdAt)}</span>
                            {revision.changedBy && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {revision.changedBy.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Changes Summary (Collapsed View) */}
                {!isExpanded && (
                    <div className="px-4 pb-4">
                        {revision.changesSummary && revision.changesSummary.length > 0 ? (
                            <div className="space-y-1 mt-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Changes</p>
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
                                {revision.changeType === 'initial' ? "Initial curriculum definition" : "No summary available"}
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
                                    <Info className="h-4 w-4" /> General Settings
                                </h4>
                                <div className="grid gap-3">
                                    <FieldValue field="name" label="Name" value={snap.name} />
                                    <FieldValue field="type" label="Type" value={snap.type} />
                                    <FieldValue field="description" label="Description" value={snap.description} />
                                    <FieldValue 
                                        field="validityMonths" 
                                        label="Validity" 
                                        value={snap.validityMonths} 
                                        render={v => v ? `${v} months` : 'No expiry'} 
                                    />
                                    <FieldValue 
                                        field="isActive" 
                                        label="Status" 
                                        value={snap.isActive} 
                                        render={v => v ? 'Active' : 'Inactive'} 
                                    />
                                </div>
                            </div>

                            {/* Modules */}
                            <div className="space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Modules ({snap.modules?.length || 0})
                                </h4>
                                {snap.modules && snap.modules.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {snap.modules.map((mod: any, idx: number) => (
                                            <div key={idx} className="p-2 bg-background rounded border text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{mod.name}</span>
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {mod.type}
                                                    </Badge>
                                                </div>
                                                {mod.durationHours && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {mod.durationHours}h
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No modules defined</p>
                                )}
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
                                <ChevronUp className="h-3 w-3" /> Hide Details
                            </>
                        ) : (
                            <>
                                <ChevronDown className="h-3 w-3" /> View Full Details
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
