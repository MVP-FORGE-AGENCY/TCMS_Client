
import { useState } from "react"
import type {
    ColumnDef,
    SortingState,
    ColumnFiltersState,
} from "@tanstack/react-table"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import type { Employee } from "@/types"
import { Edit, Eye, Trash2, ChevronDown, Users } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PersonnelTableProps {
    data: Employee[]
    onEdit?: (employee: Employee) => void
    onViewHistory: (employee: Employee) => void
    onDelete?: (id: string) => void
    onStatusChange?: (id: string, isActive: boolean) => void
    showTypeColumn?: boolean
}

export function PersonnelTable({
    data,
    onEdit,
    onViewHistory,
    onDelete,
    onStatusChange,
    showTypeColumn = false,
}: PersonnelTableProps) {
    const { t } = useTranslation()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = useState({})

    const columns: ColumnDef<Employee>[] = [
        {
            accessorKey: "fullName",
            header: t("personnel.name"),
            cell: ({ row }) => {
                const userType = row.original.userType;
                return (
                    <div className="flex items-center gap-2">
                        <div className="font-medium">{row.getValue("fullName")}</div>
                        {userType === 'student' && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                {t("personnel.types.student", "Student")}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "role",
            header: t("personnel.role"),
            cell: ({ row }) => <Badge variant="outline">{t(`personnel.roles.${row.getValue("role")}`)}</Badge>,
        },
        {
            accessorKey: "organisationId",
            header: () => <span className="hidden lg:inline">{t("personnel.organisation")}</span>,
            // In a real app, we'd map ID to name or fetch it
            cell: ({ row }) => {
                const orgId = row.getValue("organisationId") as string;
                const truncated = orgId ? `${orgId.substring(0, 8)}...` : "-";
                return <div className="hidden lg:block text-muted-foreground text-xs">{truncated}</div>;
            },
        },
        {
            accessorKey: "areaOfActivity",
            header: () => <span className="hidden lg:inline">{t("personnel.department")}</span>,
            cell: ({ row }) => <div className="hidden lg:block">{row.getValue("areaOfActivity")}</div>,
        },
        {
            accessorKey: "accountType",
            header: t("personnel.type", "Type"),
            cell: ({ row }) => {
                const type = row.getValue("accountType") as string;
                if (!type) return null;
                return (
                    <Badge variant={type === 'external' ? 'destructive' : 'secondary'}>
                        {type === 'external' ? 'External' : 'Internal'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "employmentStart",
            header: () => <span className="hidden lg:inline">{t("personnel.startDate")}</span>,
            cell: ({ row }) => <div className="hidden lg:block">{row.getValue("employmentStart")}</div>,
        },
        {
            id: "status",
            header: t("personnel.status"),
            cell: ({ row }) => {
                const employee = row.original
                const isActive = employee.isActive !== false // Default to true if undefined

                if (onStatusChange) {
                    return (
                        <div className="flex items-center space-x-2">
                             <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => onStatusChange(employee.id, checked)}
                            />
                            <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? t("common.active") : t("common.inactive")}
                            </Badge>
                        </div>
                    )
                }

                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                )
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const employee = row.original

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="View history"
                            onClick={() => onViewHistory(employee)}
                            title={t('personnel.historyLabel')}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit"
                                onClick={() => onEdit(employee)}
                                title="Edit"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Delete"
                                className="text-destructive hover:text-destructive"
                                onClick={() => onDelete(employee.id)}
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    const tableColumns = columns.filter(col => {
        if (!showTypeColumn && (col as any).accessorKey === "accountType") return false;
        return true;
    });

    const table = useReactTable({
        data,
        columns: tableColumns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-4">
                <Input
                    placeholder={t("personnel.filterPlaceholder")}
                    value={(table.getColumn("fullName")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("fullName")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            {t("personnel.columns")} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id === "fullName" ? t("personnel.name") :
                                         column.id === "role" ? t("personnel.role") :
                                         column.id === "organisationId" ? t("personnel.organization") :
                                         column.id === "areaOfActivity" ? t("personnel.department") :
                                         column.id === "accountType" ? t("personnel.type") :
                                         column.id === "employmentStart" ? t("personnel.startDate") :
                                         column.id === "status" ? t("personnel.status") :
                                         column.id === "actions" ? t("personnel.actions") :
                                         column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                 {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => {
                        const employee = row.original;
                        const isActive = employee.isActive !== false;
                        
                        return (
                            <Card key={row.id}>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {employee.fullName}
                                                {employee.userType === 'student' && (
                                                    <Badge variant="outline" className="text-xs h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                                        Student
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground mt-1">{employee.email}</div>
                                        </div>
                                        <Badge variant={isActive ? "default" : "secondary"}>
                                            {isActive ? t("common.active") : t("common.inactive")}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block text-xs">{t("personnel.role")}</span>
                                            <span className="font-medium">{t(`personnel.roles.${employee.role}`)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs">{t("personnel.department")}</span>
                                            <span>{employee.areaOfActivity || "-"}</span>
                                        </div>
                                        {showTypeColumn && employee.accountType && (
                                            <div>
                                                <span className="text-muted-foreground block text-xs">{t("personnel.type")}</span>
                                                  <Badge variant={employee.accountType === 'external' ? 'destructive' : 'secondary'} className="mt-1">
                                                    {employee.accountType === 'external' ? 'External' : 'Internal'}
                                                </Badge>
                                            </div>
                                        )}
                                          <div>
                                            <span className="text-muted-foreground block text-xs">{t("personnel.startDate")}</span>
                                            <span>{employee.employmentStart || "-"}</span>
                                        </div>
                                    </div>

                                    {onStatusChange && (
                                         <div className="flex items-center justify-between py-2 border-t border-dashed">
                                            <span className="text-sm text-muted-foreground">{t("personnel.status")}</span>
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={(checked) => onStatusChange(employee.id, checked)}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-1 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewHistory(employee)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            {t("personnel.historyLabel", "History")}
                                        </Button>
                                         {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(employee)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                {t("common.edit")}
                                            </Button>
                                        )}
                                         {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => onDelete(employee.id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t("common.delete")}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                ) : (
                    <div className="py-6 border rounded-md bg-muted/10">
                        <EmptyState
                            icon={Users}
                            title={t("common.noData", "No personnel found")}
                            description={t("personnel.noDataDesc", "Adjust your search filters or add new personnel.")}
                        />
                    </div>
                )}
            </div>

            <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table className="min-w-[600px] md:min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-64 text-center p-0"
                                >
                                    <EmptyState
                                        icon={Users}
                                        title={t("common.noData", "No personnel found")}
                                        description={t("personnel.noDataDesc", "Adjust your search filters or add new personnel.")}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {t("personnel.pagination.selectedRows", {
                        selected: table.getFilteredSelectedRowModel().rows.length,
                        total: table.getFilteredRowModel().rows.length
                    })}
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="hover-lift"
                    >
                        {t("common.previous")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="hover-lift"
                    >
                        {t("common.next")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
