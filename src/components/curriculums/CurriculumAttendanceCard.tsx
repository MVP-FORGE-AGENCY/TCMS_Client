import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    ChevronDown, 
    ChevronUp,
    Loader2 
} from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface ModuleAttendance {
    moduleId: string
    moduleName: string
    totalSessions: number
    sessionsPresent: number
    sessionsLate: number
    sessionsAbsent: number
    moduleTotalHours: number
    hoursAttended: number
    attendancePercent: number
    attendanceStatus: 'sufficient' | 'partial' | 'insufficient' | 'no_data'
}

interface CurriculumAttendanceData {
    curriculumId: string
    curriculumCode: string
    curriculumName: string
    userId: string
    userName: string
    totalSessions: number
    sessionsPresent: number
    sessionsLate: number
    sessionsAbsent: number
    totalModules: number
    curriculumTotalHours: number
    hoursAttended: number
    attendancePercent: number
    easaCompliance: 'compliant' | 'non_compliant' | 'no_data'
    modules: ModuleAttendance[]
}

interface CurriculumAttendanceCardProps {
    userId: string
    curriculumId: string
}

export function CurriculumAttendanceCard({ userId, curriculumId }: CurriculumAttendanceCardProps) {
    const [data, setData] = useState<CurriculumAttendanceData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedModules, setExpandedModules] = useState(false)

    useEffect(() => {
        fetchAttendance()
    }, [userId, curriculumId])

    const fetchAttendance = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.get(`/employees/${userId}/curriculum-attendance`, {
                params: { curriculumId }
            })
            setData(response.data)
        } catch (err: any) {
            console.error('Error fetching curriculum attendance:', err)
            if (err.response?.status === 404) {
                setError('No attendance data available yet')
            } else {
                setError(err.response?.data?.error?.message || 'Failed to load attendance data')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sufficient':
            case 'compliant':
                return 'text-green-600 dark:text-green-400'
            case 'partial':
                return 'text-yellow-600 dark:text-yellow-400'
            case 'insufficient':
            case 'non_compliant':
                return 'text-red-600 dark:text-red-400'
            default:
                return 'text-gray-500'
        }
    }

    const getProgressColor = (percent: number) => {
        if (percent >= 80) return 'bg-green-500'
        if (percent >= 50) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading attendance data...</span>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {error}
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const isCompliant = data.easaCompliance === 'compliant'

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Attendance: {data.curriculumName}</CardTitle>
                        <CardDescription>{data.curriculumCode}</CardDescription>
                    </div>
                    <Badge 
                        className={
                            isCompliant 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }
                    >
                        {isCompliant ? (
                            <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                EASA Compliant
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Below 80% Required
                            </>
                        )}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Overall Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Hours</div>
                        <div className="text-2xl font-bold">{data.curriculumTotalHours}h</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Hours Attended</div>
                        <div className="text-2xl font-bold">{data.hoursAttended}h</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Attendance Rate</div>
                        <div className={`text-2xl font-bold ${getStatusColor(data.easaCompliance)}`}>
                            {data.attendancePercent}%
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Overall Attendance Progress</span>
                        <span className={getStatusColor(data.easaCompliance)}>
                            {data.attendancePercent}% / 80% Required
                        </span>
                    </div>
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full ${getProgressColor(data.attendancePercent)} transition-all`}
                            style={{ width: `${Math.min(data.attendancePercent, 100)}%` }}
                        />
                        {/* 80% threshold marker */}
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-800 dark:bg-gray-300"
                            style={{ left: '80%' }}
                        />
                    </div>
                </div>

                {/* Session Stats */}
                <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{data.sessionsPresent} Present</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>{data.sessionsLate} Late</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>{data.sessionsAbsent} Absent</span>
                    </div>
                </div>

                {/* Module Breakdown Toggle */}
                {data.modules && data.modules.length > 0 && (
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedModules(!expandedModules)}
                            className="w-full flex justify-between items-center"
                        >
                            <span className="font-medium">Module Breakdown ({data.modules.length} modules)</span>
                            {expandedModules ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>

                        {expandedModules && (
                            <div className="mt-4 space-y-3">
                                {data.modules.map(module => (
                                    <div 
                                        key={module.moduleId} 
                                        className={`border-l-4 pl-4 py-2 ${
                                            module.attendanceStatus === 'sufficient'
                                                ? 'border-green-500'
                                                : module.attendanceStatus === 'partial'
                                                ? 'border-yellow-500'
                                                : 'border-red-500'
                                        }`}
                                    >
                                        <div className="font-medium">{module.moduleName}</div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>
                                                Sessions: {module.sessionsPresent}/{module.totalSessions} attended
                                                {module.sessionsLate > 0 && (
                                                    <span className="text-yellow-600 ml-1">
                                                        (+{module.sessionsLate} partial)
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                Hours: {module.hoursAttended}/{module.moduleTotalHours}h
                                            </div>
                                        </div>
                                        <div className={`text-sm font-medium mt-1 ${getStatusColor(module.attendanceStatus)}`}>
                                            {module.attendancePercent}% - {module.attendanceStatus.replace('_', ' ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
