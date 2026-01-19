import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";

interface ModuleResult {
    id: string;
    result: 'pass' | 'fail' | 'incomplete' | 'completed' | 'not_completed';
    theoryScore?: number;
    practicalScore?: number;
    attemptNumber: number;
    gradedAt: string;
    gradedBy?: {
        fullName: string;
    };
    comments?: string;
    strengths?: string;
    areasForImprovement?: string;
}

interface ModuleGradingCardProps {
    moduleName: string;
    moduleType: string;
    result?: ModuleResult | null;
    passCriteria?: {
        theoryPassScore?: number;
        practicalPassScore?: number;
        requiresTheory?: boolean;
        requiresPractical?: boolean;
    };
    onClick?: () => void;
}

const ModuleGradingCard: React.FC<ModuleGradingCardProps> = ({ 
    moduleName, 
    moduleType, 
    result, 
    passCriteria,
    onClick 
}) => {
    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'pass': return 'success';
            case 'completed': return 'success';
            case 'fail': return 'destructive';
            case 'incomplete': return 'warning';
            default: return 'secondary';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'pass': 
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'fail': 
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'incomplete': 
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default: 
                return <Clock className="h-5 w-5 text-gray-400" />;
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return format(new Date(dateString), 'dd MMM yyyy');
    };

    return (
        <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                result?.result === 'pass' || result?.result === 'completed' ? 'border-l-green-500' :
                result?.result === 'fail' ? 'border-l-red-500' :
                'border-l-gray-300'
            }`}
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            {moduleType} Module
                        </div>
                        <CardTitle className="text-lg font-medium">{moduleName}</CardTitle>
                    </div>
                     <div className="flex items-center gap-2">
                        {result && (
                            <Badge variant={getStatusColor(result.result) as any}>
                                {result.result}
                            </Badge>
                        )}
                        {getStatusIcon(result?.result)}
                    </div>
                </div>

            </CardHeader>
            <CardContent className="pb-2">
                {result ? (
                    <div className="space-y-3">
                        <div className="flex gap-4 text-sm">
                            {passCriteria?.requiresTheory && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Theory</span>
                                    <span className={`font-semibold ${
                                        (result.theoryScore || 0) >= (passCriteria.theoryPassScore || 70) 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                        {result.theoryScore ?? '-'}%
                                        <span className="text-xs text-gray-400 ml-1">
                                            / {passCriteria.theoryPassScore}%
                                        </span>
                                    </span>
                                </div>
                            )}
                            
                            {passCriteria?.requiresPractical && (
                                <div className="flex flex-col">
                                    <span className="text-muted-foreground">Practical</span>
                                    <span className={`font-semibold ${
                                        (result.practicalScore || 0) >= (passCriteria.practicalPassScore || 80) 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                        {result.practicalScore ?? '-'}%
                                        <span className="text-xs text-gray-400 ml-1">
                                            / {passCriteria.practicalPassScore}%
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {result.comments && (
                            <div className="bg-muted p-2 rounded text-xs text-muted-foreground line-clamp-2">
                                {result.comments}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground italic py-2">
                        Not yet graded
                    </div>
                )}
            </CardContent>
            {result && (
                <CardFooter className="pt-2 text-xs text-muted-foreground border-t flex justify-between">
                    <span>Attempt #{result.attemptNumber}</span>
                    <span>
                        Graded by {result.gradedBy?.fullName || 'System'} on {formatDate(result.gradedAt)}
                    </span>
                </CardFooter>
            )}
        </Card>
    );
};

export default ModuleGradingCard;
