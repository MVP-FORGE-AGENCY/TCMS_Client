
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ComplianceDetailsProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    stats: {
        totalCompetences: number
        validCount: number
        expiringCount: number
        expiredCount: number
        complianceRate: number
    }
}

export function ComplianceDetails({ open, onOpenChange, stats }: ComplianceDetailsProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Compliance Rate Details
                    </DialogTitle>
                    <DialogDescription>
                        Understanding how your organization's compliance score is calculated.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                                {stats.complianceRate}%
                            </div>
                            <div className="text-sm font-medium text-slate-500">Overall Compliance Score</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold">How it works</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            The compliance rate represents the percentage of valid competences held by all personnel against the total number of assigned competences.
                        </p>
                        
                        <div className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 font-mono">
                            Compliance = (Valid + Expiring) / Total Assigned * 100
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                Valid & Expiring
                            </span>
                            <span className="font-medium">{stats.validCount}</span>
                        </div>
                        <Progress value={stats.complianceRate} className="h-2 bg-slate-100" />
                        
                        <div className="flex justify-between text-sm  pt-2">
                            <span className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                Expired / Missing
                            </span>
                            <span className="font-medium">{stats.expiredCount}</span>
                        </div>
                        <Progress value={(stats.expiredCount / stats.totalCompetences) * 100} className="h-2 bg-slate-100 [&>div]:bg-red-500" />
                    </div>

                    <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-900">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 dark:text-amber-200">
                            <strong>Note:</strong> Competences that are "Expiring Soon" (within 90 days) are still considered valid for operational purposes and count towards the positive score.
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
