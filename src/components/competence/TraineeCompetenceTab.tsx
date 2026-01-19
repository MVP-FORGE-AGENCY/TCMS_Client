import { useEffect, useState } from "react";
import { competence } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Competence {
    id: string;
    standardCode: string;
    standardName: string;
    status: 'valid' | 'expiring_soon' | 'expired' | 'not_acquired' | 'suspended';
    acquiredDate: string;
    validUntil: string;
    source: string;
    daysRemaining: number;
}

interface TraineeCompetenceTabProps {
    userId: string;
}

export function TraineeCompetenceTab({ userId }: TraineeCompetenceTabProps) {
    const [competences, setCompetences] = useState<Competence[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const fetchCompetences = async () => {
        try {
            setLoading(true);
            const params: any = { userId, limit: 100 };
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            const res = await competence.getDashboard(params);
            setCompetences(res.data);
        } catch (error) {
            console.error("Failed to fetch competences", error);
            toast.error("Failed to load competences");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchCompetences();
        }
    }, [userId, statusFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valid':
                return <Badge className="bg-green-500 hover:bg-green-600">Valid</Badge>;
            case 'expiring_soon':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Expiring Soon</Badge>;
            case 'expired':
                return <Badge variant="destructive">Expired</Badge>;
            case 'suspended':
                return <Badge variant="destructive" className="bg-red-700">Suspended</Badge>;
            default:
                return <Badge variant="secondary">Not Acquired</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'expiring_soon':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'expired':
            case 'suspended':
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Competence Overview</h3>
                <div className="w-[200px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="valid">Valid</SelectItem>
                            <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : competences.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Competences Found</CardTitle>
                        <CardDescription>This user has no recorded competences yet.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {competences.map((comp) => (
                        <Card key={comp.id} className={comp.status === 'suspended' ? 'border-red-500/50 bg-red-500/5' : ''}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base">{comp.standardCode}</CardTitle>
                                        <CardDescription className="line-clamp-1" title={comp.standardName}>
                                            {comp.standardName}
                                        </CardDescription>
                                    </div>
                                    {getStatusIcon(comp.status)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Status:</span>
                                        {getStatusBadge(comp.status)}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Valid Until:</span>
                                        <span className="font-medium">
                                            {comp.validUntil ? format(new Date(comp.validUntil), "dd MMM yyyy") : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Acquired:</span>
                                        <span>
                                            {comp.acquiredDate ? format(new Date(comp.acquiredDate), "dd MMM yyyy") : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Source:</span>
                                        <span className="capitalize">{comp.source?.replace('_', ' ') || 'N/A'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
