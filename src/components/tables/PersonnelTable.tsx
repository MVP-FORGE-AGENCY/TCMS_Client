
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
import { Edit, Eye, Trash2, ChevronDown } from "lucide-react"

import { Switch } from "@/components/ui/switch"

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
            cell: ({ row }) => <div className="font-medium">{row.getValue("fullName")}</div>,
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
                            onClick={() => onViewHistory(employee)}
                            title="View History"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
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
            <div className="rounded-md border overflow-x-auto">
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
                                    className="h-24 text-center"
                                >
                                    {t("common.noData")}
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
                    >
                        {t("common.previous")}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        {t("common.next")}
                    </Button>
                </div>
            </div>
        </div>
    )
}
