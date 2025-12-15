import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Printer } from "lucide-react"
import { addDays, format, differenceInDays } from "date-fns"

// Mock data for expiring items
const MOCK_EXPIRING_ITEMS = [
    { id: 1, employee: "John Doe", competence: "OPC-A320", expiryDate: addDays(new Date(), 5), status: "valid" },
    { id: 2, employee: "Jane Smith", competence: "LPC-A320", expiryDate: addDays(new Date(), 15), status: "valid" },
    { id: 3, employee: "Bob Johnson", competence: "FIRE-SAF", expiryDate: addDays(new Date(), 45), status: "valid" },
    { id: 4, employee: "Alice Brown", competence: "CRM-REF", expiryDate: addDays(new Date(), 80), status: "valid" },
    { id: 5, employee: "Charlie Davis", competence: "FIRST-AID", expiryDate: addDays(new Date(), 2), status: "valid" },
]

export default function ExpiringReport() {
    const [daysThreshold, setDaysThreshold] = useState([90])

    const filteredItems = MOCK_EXPIRING_ITEMS.filter(item => {
        const daysRemaining = differenceInDays(item.expiryDate, new Date())
        return daysRemaining >= 0 && daysRemaining <= daysThreshold[0]
    }).sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())

    const handlePrint = () => {
        window.print()
    }

    const getRowColor = (daysRemaining: number) => {
        if (daysRemaining < 7) return "bg-red-50 hover:bg-red-100"
        if (daysRemaining < 30) return "bg-amber-50 hover:bg-amber-100"
        return ""
    }

    return (
        <div className="space-y-6 print:space-y-2">
            <div className="flex items-center justify-between print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Expiring Competences Report</h1>
                    <p className="text-muted-foreground">
                        Items expiring within the next {daysThreshold[0]} days.
                    </p>
                </div>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">Expiring Competences Report</h1>
                <p className="text-sm text-gray-500">Generated on {format(new Date(), "PPP")}</p>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card print:hidden">
                <span className="text-sm font-medium w-32">Within {daysThreshold[0]} Days</span>
                <Slider
                    value={daysThreshold}
                    onValueChange={setDaysThreshold}
                    max={180}
                    step={1}
                    className="w-[300px]"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Competence</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Days Remaining</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No expiring items found within this range.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => {
                                const daysRemaining = differenceInDays(item.expiryDate, new Date())
                                return (
                                    <TableRow key={item.id} className={getRowColor(daysRemaining)}>
                                        <TableCell className="font-medium">{item.employee}</TableCell>
                                        <TableCell>{item.competence}</TableCell>
                                        <TableCell>{format(item.expiryDate, "PPP")}</TableCell>
                                        <TableCell>
                                            <span className={daysRemaining < 7 ? "text-red-600 font-bold" : daysRemaining < 30 ? "text-amber-600 font-medium" : ""}>
                                                {daysRemaining} days
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="uppercase text-xs">
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <style>{`
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>
        </div>
    )
}
