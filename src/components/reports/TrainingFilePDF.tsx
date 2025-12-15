import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TrainingFilePDFProps {
    employeeId: string
    employeeName: string
}

export function TrainingFilePDF({ employeeId: _employeeId, employeeName }: TrainingFilePDFProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleGenerate = async () => {
        setIsLoading(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))

        setIsLoading(false)

        toast.success(`Training file generated for ${employeeName}`, {
            description: "Click to view the PDF",
            action: {
                label: "View PDF",
                onClick: () => window.open("#", "_blank"),
            },
        })
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <FileText className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Generating..." : "Training File"}
        </Button>
    )
}
