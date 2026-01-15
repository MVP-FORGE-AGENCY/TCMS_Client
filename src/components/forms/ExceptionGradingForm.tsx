/**
 * Exception-Based Grading Form
 * All elements default to "Standard" (Grade 3).
 * User clicks to deviate from standard grades.
 * Comments required only for non-standard grades.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, AlertCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { GradeValue, ElementGrade, GradeDeviation } from '@/types'

interface GradingElement {
    id: string
    name: string
    description?: string
    isMandatory: boolean
}

interface ExceptionGradingFormProps {
    elements: GradingElement[]
    onGradesChange: (grades: ElementGrade[]) => void
    defaultGrade?: GradeValue
}

const GRADE_CONFIG = {
    1: { 
        label: '1', 
        name: 'Unsatisfactory', 
        deviation: 'below_standard' as GradeDeviation,
        color: 'bg-red-500 text-white border-red-600',
        hoverColor: 'hover:bg-red-100 hover:border-red-500',
        description: 'Requires immediate remedial action'
    },
    2: { 
        label: '2', 
        name: 'Below Standard', 
        deviation: 'below_standard' as GradeDeviation,
        color: 'bg-amber-500 text-white border-amber-600',
        hoverColor: 'hover:bg-amber-100 hover:border-amber-500',
        description: 'Requires improvement'
    },
    3: { 
        label: '3', 
        name: 'Standard', 
        deviation: 'standard' as GradeDeviation,
        color: 'bg-green-500 text-white border-green-600',
        hoverColor: 'hover:bg-green-100 hover:border-green-500',
        description: 'Meets all requirements'
    },
    4: { 
        label: '4', 
        name: 'Above Standard', 
        deviation: 'above_standard' as GradeDeviation,
        color: 'bg-blue-500 text-white border-blue-600',
        hoverColor: 'hover:bg-blue-100 hover:border-blue-500',
        description: 'Exceeds requirements'
    },
    5: { 
        label: '5', 
        name: 'Excellent', 
        deviation: 'above_standard' as GradeDeviation,
        color: 'bg-violet-500 text-white border-violet-600',
        hoverColor: 'hover:bg-violet-100 hover:border-violet-500',
        description: 'Exceptional performance'
    },
}

interface ElementState {
    grade: GradeValue
    comments: string
    isExpanded: boolean
}

export function ExceptionGradingForm({ 
    elements, 
    onGradesChange, 
    defaultGrade = 3 
}: ExceptionGradingFormProps) {
    const { t } = useTranslation()
    
    // Initialize all elements with default grade (3 = Standard)
    const [elementStates, setElementStates] = useState<Record<string, ElementState>>(() => {
        const initial: Record<string, ElementState> = {}
        elements.forEach(el => {
            initial[el.id] = {
                grade: defaultGrade,
                comments: '',
                isExpanded: false
            }
        })
        return initial
    })

    // Notify parent of grade changes
    useEffect(() => {
        const grades: ElementGrade[] = elements.map(el => ({
            elementId: el.id,
            grade: elementStates[el.id]?.grade || defaultGrade,
            deviation: GRADE_CONFIG[elementStates[el.id]?.grade || defaultGrade].deviation,
            comments: elementStates[el.id]?.comments || undefined
        }))
        onGradesChange(grades)
    }, [elementStates, elements, onGradesChange, defaultGrade])

    const handleGradeChange = (elementId: string, grade: GradeValue) => {
        setElementStates(prev => ({
            ...prev,
            [elementId]: {
                ...prev[elementId],
                grade,
                // Auto-expand for non-standard grades to show comment field
                isExpanded: grade !== 3 || prev[elementId].isExpanded
            }
        }))
    }

    const handleCommentChange = (elementId: string, comments: string) => {
        setElementStates(prev => ({
            ...prev,
            [elementId]: {
                ...prev[elementId],
                comments
            }
        }))
    }

    const toggleExpanded = (elementId: string) => {
        setElementStates(prev => ({
            ...prev,
            [elementId]: {
                ...prev[elementId],
                isExpanded: !prev[elementId].isExpanded
            }
        }))
    }

    const requiresComment = (grade: GradeValue) => grade === 1 || grade === 2 || grade === 5

    const deviationCount = Object.values(elementStates).filter(s => s.grade !== 3).length
    const belowStandardCount = Object.values(elementStates).filter(s => s.grade < 3).length

    return (
        <div className="space-y-4">
            {/* Summary */}
            <Card className={cn(
                "border-2",
                belowStandardCount > 0 ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20" : "border-green-500 bg-green-50 dark:bg-green-950/20"
            )}>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {belowStandardCount > 0 ? (
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                            ) : (
                                <Check className="h-5 w-5 text-green-500" />
                            )}
                            <span className="font-medium">
                                {belowStandardCount > 0 
                                    ? t('grading.deviationsFound', '{count} deviation(s) below standard', { count: belowStandardCount })
                                    : t('grading.allStandard', 'All elements at or above standard')}
                            </span>
                        </div>
                        <Badge variant="outline">
                            {deviationCount} {t('grading.deviations', 'deviation(s)')}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Grading Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(GRADE_CONFIG).map(([grade, config]) => (
                    <div key={grade} className="flex items-center gap-1">
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs font-bold", config.color)}>
                            {grade}
                        </div>
                        <span className="text-muted-foreground">{config.name}</span>
                    </div>
                ))}
            </div>

            {/* Elements */}
            <div className="space-y-2">
                {elements.map((element) => {
                    const state = elementStates[element.id]
                    const gradeConfig = GRADE_CONFIG[state?.grade || 3]
                    const needsComment = requiresComment(state?.grade)
                    const hasValidComment = !needsComment || (state?.comments && state.comments.trim().length > 0)

                    return (
                        <Collapsible
                            key={element.id}
                            open={state?.isExpanded}
                            onOpenChange={() => toggleExpanded(element.id)}
                        >
                            <div className={cn(
                                "rounded-lg border p-3 transition-colors",
                                state?.grade !== 3 && "border-l-4",
                                state?.grade === 1 && "border-l-red-500",
                                state?.grade === 2 && "border-l-amber-500",
                                state?.grade === 4 && "border-l-blue-500",
                                state?.grade === 5 && "border-l-violet-500",
                                !hasValidComment && needsComment && "border-red-300 bg-red-50 dark:bg-red-950/20"
                            )}>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{element.name}</span>
                                            {element.isMandatory && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {t('grading.mandatory', 'Required')}
                                                </Badge>
                                            )}
                                        </div>
                                        {element.description && (
                                            <p className="text-sm text-muted-foreground truncate">{element.description}</p>
                                        )}
                                    </div>

                                    {/* Grade buttons */}
                                    <div className="flex items-center gap-1">
                                        {([1, 2, 3, 4, 5] as GradeValue[]).map((grade) => {
                                            const config = GRADE_CONFIG[grade]
                                            const isSelected = state?.grade === grade

                                            return (
                                                <button
                                                    key={grade}
                                                    type="button"
                                                    onClick={() => handleGradeChange(element.id, grade)}
                                                    className={cn(
                                                        "w-8 h-8 rounded border-2 font-bold text-sm transition-all",
                                                        isSelected ? config.color : "bg-white dark:bg-slate-800 text-muted-foreground border-slate-200 dark:border-slate-700",
                                                        !isSelected && config.hoverColor
                                                    )}
                                                    title={`${config.label} - ${config.name}`}
                                                >
                                                    {grade}
                                                </button>
                                            )
                                        })}

                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                                {state?.isExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>

                                <CollapsibleContent className="mt-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                            <Label>
                                                {t('grading.comments', 'Comments')}
                                                {needsComment && (
                                                    <span className="text-destructive ml-1">*</span>
                                                )}
                                            </Label>
                                        </div>
                                        <Textarea
                                            value={state?.comments || ''}
                                            onChange={(e) => handleCommentChange(element.id, e.target.value)}
                                            placeholder={
                                                needsComment 
                                                    ? t('grading.commentRequired', 'Comment required for this grade...')
                                                    : t('grading.commentOptional', 'Optional comment...')
                                            }
                                            rows={2}
                                            className={cn(
                                                needsComment && !state?.comments?.trim() && "border-red-500"
                                            )}
                                        />
                                        {needsComment && !state?.comments?.trim() && (
                                            <p className="text-xs text-destructive">
                                                {t('grading.commentRequiredError', 'A comment is required for grades 1, 2, or 5')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {gradeConfig.description}
                                        </p>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    )
                })}
            </div>
        </div>
    )
}

/**
 * Hook to validate exception grading form
 */
export function useExceptionGradingValidation(grades: ElementGrade[]): {
    isValid: boolean
    errors: string[]
    overallResult: 'pass' | 'fail'
    requiresRetake: boolean
} {
    const errors: string[] = []
    
    // Check for required comments
    grades.forEach(g => {
        if ((g.grade === 1 || g.grade === 2 || g.grade === 5) && (!g.comments || !g.comments.trim())) {
            errors.push(`Element requires comment for grade ${g.grade}`)
        }
    })

    // Determine overall result
    const hasFailingGrade = grades.some(g => g.grade === 1 || g.grade === 2)
    const overallResult = hasFailingGrade ? 'fail' : 'pass'
    const requiresRetake = grades.some(g => g.grade === 1)

    return {
        isValid: errors.length === 0,
        errors,
        overallResult,
        requiresRetake
    }
}
