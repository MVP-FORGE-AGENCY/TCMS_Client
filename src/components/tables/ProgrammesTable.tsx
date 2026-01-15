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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import type { Programme, ProgrammeType } from "@/types"
import { Edit, Trash2, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"

interface ProgrammesTableProps {
    data: Programme[]
    onEdit: (programme: Programme) => void
    onToggleActive: (id: string, isActive: boolean) => void
    onView: (programme: Programme) => void
}

export function ProgrammesTable({
    data,
    onEdit,
    onToggleActive,
    onView,
}: ProgrammesTableProps) {
    const { t } = useTranslation()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const columns: ColumnDef<Programme>[] = [
        {
            accessorKey: "code",
            header: t("programmes.code"),
            cell: ({ row }) => <div className="font-medium">{row.getValue("code")}</div>,
        },
        {
            accessorKey: "name",
            header: t("programmes.name"),
            cell: ({ row }) => (
                <button
                    className="hover:underline font-medium"
                    onClick={() => onView(row.original)}
                >
                    {row.getValue("name")}
                </button>
            ),
        },
        {
            accessorKey: "standard",
            header: t("programmes.standard"),
            cell: ({ row }) => {
                const standard = row.original.standard
                return standard ? (
                    <Badge variant="outline" className="font-mono text-xs">
                        {standard.code}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )
            },
        },
        {
            accessorKey: "type",
            header: t("programmes.type"),
            cell: ({ row }) => {
                const type = row.getValue("type") as ProgrammeType
                let colorClass = "bg-gray-500"

                switch (type) {
                    case "initial":
                        colorClass = "bg-blue-500 hover:bg-blue-600"
                        break
                    case "recurrent":
                        colorClass = "bg-green-500 hover:bg-green-600"
                        break
                    case "refresher":
                        colorClass = "bg-amber-500 hover:bg-amber-600"
                        break
                    case "continuation":
                        colorClass = "bg-purple-500 hover:bg-purple-600"
                        break
                }

                return (
                    <Badge className={`${colorClass} capitalize`}>
                        {type}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "validityMonths",
            header: t("programmes.validityMonths"),
            cell: ({ row }) => {
                const val = row.getValue("validityMonths")
                return <div>{val ? `${val} months` : "N/A"}</div>
            },
        },
        {
            accessorKey: "isActive",
            header: t("programmes.active"),
            cell: ({ row }) => (
                <Switch
                    checked={row.getValue("isActive")}
                    onCheckedChange={(checked: boolean) =>
                        onToggleActive(row.original.id, checked)
                    }
                />
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const programme = row.original
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("programmes.actions")}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(programme)}>
                                <Edit className="mr-2 h-4 w-4" /> {t("programmes.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                className={programme.isActive ? "text-destructive" : "text-green-600"}
                                onClick={() => onToggleActive(programme.id, !programme.isActive)}
                            >
                                {programme.isActive ? (
                                    <><Trash2 className="mr-2 h-4 w-4" /> {t("programmes.deactivate")}</>
                                ) : (
                                    <><Edit className="mr-2 h-4 w-4" /> {t("programmes.activate")}</>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter programmes..."
                    value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("name")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
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
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    )
}
