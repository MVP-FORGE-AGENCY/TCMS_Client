import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, CalendarPlus, Users, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { checks } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface EligibleTrainee {
    id: string;
    fullName: string;
    email: string;
    role: string;
    jobTitle: string;
    department: string;
    eligibleStandards: Array<{
        id: string;
        code: string;
        name: string;
    }>;
}

interface EligibleTraineesTableProps {
    onScheduleClick: (traineeId: string, traineeIds?: string[], standardId?: string) => void;
    refreshTrigger?: number;
}

const EligibleTraineesTable: React.FC<EligibleTraineesTableProps> = ({ onScheduleClick }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrainees, setSelectedTrainees] = useState<string[]>([]);

    // Fetch eligible trainees using new API
    const { data: eligibleData, isLoading } = useQuery({
        queryKey: ['eligible-trainees'],
        queryFn: async () => {
            const res = await checks.getEligibleTrainees();
            return res.data as EligibleTrainee[];
        }
    });

    const filteredTrainees = eligibleData?.filter(trainee =>
        trainee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainee.department?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const handleSelectTrainee = (traineeId: string) => {
        setSelectedTrainees(prev => 
            prev.includes(traineeId) 
                ? prev.filter(id => id !== traineeId)
                : [...prev, traineeId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTrainees.length === filteredTrainees.length) {
            setSelectedTrainees([]);
        } else {
            setSelectedTrainees(filteredTrainees.map(t => t.id));
        }
    };

    const handleScheduleMultiple = () => {
        if (selectedTrainees.length > 0) {
            onScheduleClick('', selectedTrainees);
            setSelectedTrainees([]);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="space-y-4">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-sm flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search', 'Search trainees...')}
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {selectedTrainees.length > 0 && (
                    <Button onClick={handleScheduleMultiple}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        {t('checks.scheduleSelected', 'Schedule Selected')} ({selectedTrainees.length})
                    </Button>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                     <div className="text-center py-8 text-muted-foreground border rounded-md p-4 bg-muted/20">
                        {t('common.loading', 'Loading...')}
                    </div>
                ) : filteredTrainees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md p-4 bg-muted/20">
                        {t('checks.noEligibleTrainees', 'No trainees require proficiency checks at this time')}
                    </div>
                ) : (
                    filteredTrainees.map((trainee) => (
                        <Card key={trainee.id}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            checked={selectedTrainees.includes(trainee.id)}
                                            onCheckedChange={() => handleSelectTrainee(trainee.id)}
                                        />
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>
                                                {getInitials(trainee.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-base font-medium leading-none">
                                                {trainee.fullName}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {trainee.email}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onScheduleClick(trainee.id)}>
                                                <CalendarPlus className="mr-2 h-4 w-4" />
                                                {t('common.schedule', 'Schedule')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs font-medium uppercase">{t('common.role', 'Role')}</span>
                                        <div><Badge variant="outline">{trainee.jobTitle || t(`roles.${trainee.role?.toLowerCase()}`, trainee.role)}</Badge></div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground text-xs font-medium uppercase">{t('common.department', 'Department')}</span>
                                        <div className="truncate" title={trainee.department}>{trainee.department || '-'}</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground text-xs font-medium uppercase">{t('checks.eligibleStandards', 'Eligible Standards')}</span>
                                    <div className="flex flex-wrap gap-1">
                                        {trainee.eligibleStandards.map(std => (
                                            <Badge 
                                                key={std.id} 
                                                variant="secondary" 
                                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                onClick={() => onScheduleClick(trainee.id, undefined, std.id)}
                                            >
                                                {std.code}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <Button 
                                    className="w-full" 
                                    variant="secondary"
                                    onClick={() => onScheduleClick(trainee.id)}
                                >
                                    <CalendarPlus className="h-4 w-4 mr-2" />
                                    {t('common.schedule', 'Schedule Check')}
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox 
                                    checked={selectedTrainees.length === filteredTrainees.length && filteredTrainees.length > 0}
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>{t('common.name', 'Name')}</TableHead>
                            <TableHead>{t('common.role', 'Role')}</TableHead>
                            <TableHead>{t('common.department', 'Department')}</TableHead>
                            <TableHead>{t('checks.eligibleStandards', 'Eligible Standards')}</TableHead>
                            <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {t('common.loading', 'Loading...')}
                                </TableCell>
                            </TableRow>
                        ) : filteredTrainees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {t('checks.noEligibleTrainees', 'No trainees require proficiency checks at this time')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTrainees.map((trainee) => (
                                <TableRow key={trainee.id}>
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedTrainees.includes(trainee.id)}
                                            onCheckedChange={() => handleSelectTrainee(trainee.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(trainee.fullName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{trainee.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{trainee.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{trainee.jobTitle || t(`roles.${trainee.role?.toLowerCase()}`, trainee.role)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {trainee.department || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {trainee.eligibleStandards.slice(0, 3).map(std => (
                                                <Badge 
                                                    key={std.id} 
                                                    variant="secondary" 
                                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                                    onClick={() => onScheduleClick(trainee.id, undefined, std.id)}
                                                >
                                                    {std.code}
                                                </Badge>
                                            ))}
                                            {trainee.eligibleStandards.length > 3 && (
                                                <Badge variant="outline">
                                                    +{trainee.eligibleStandards.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => onScheduleClick(trainee.id)}
                                        >
                                            <CalendarPlus className="h-4 w-4 mr-1" />
                                            {t('common.schedule', 'Schedule')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary */}
            {eligibleData && eligibleData.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {t('checks.totalEligible', '{{count}} trainees eligible for proficiency checks', { count: eligibleData.length })}
                </div>
            )}
        </div>
    );
};

export default EligibleTraineesTable;
