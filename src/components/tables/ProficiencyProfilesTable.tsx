import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2, FileSignature } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import type { ProficiencyProfile } from "@/types"

interface ProficiencyProfilesTableProps {
    data: ProficiencyProfile[]
    onEdit: (profile: ProficiencyProfile) => void
    onDelete: (profile: ProficiencyProfile) => void
}

export function ProficiencyProfilesTable({
    data,
    onEdit,
    onDelete,
}: ProficiencyProfilesTableProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const totalPages = Math.ceil(data.length / itemsPerPage)
    const paginatedItems = data.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Interval (Months)</TableHead>
                        <TableHead>Required Assessors</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedItems.map((profile) => (
                        <TableRow key={profile.id}>
                            <TableCell className="font-medium">{profile.code}</TableCell>
                            <TableCell>{profile.name}</TableCell>
                            <TableCell>{profile.intervalMonths}</TableCell>
                            <TableCell>{profile.requiredAssessors}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover-lift">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="animate-scale-in">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onEdit(profile)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(profile)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            {data.length === 0 && (
                <div className="py-6 border-t border-border">
                    <EmptyState
                        icon={FileSignature}
                        title="No profiles found"
                        description="Add a proficiency profile to get started."
                    />
                </div>
            )}
        </div>

        {totalPages > 1 && (
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} entries
                </p>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="hover-lift"
                    >
                        Previous
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="hover-lift"
                    >
                        Next
                    </Button>
                </div>
            </div>
        )}
    </div>
    )
}
