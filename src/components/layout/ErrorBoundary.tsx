import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
                        <AlertTriangle className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground max-w-md mb-8">
                        We apologize for the inconvenience. An unexpected error has occurred.
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            Go Home
                        </Button>
                    </div>
                    {import.meta.env.DEV && this.state.error && (
                        <div className="mt-8 p-4 bg-muted rounded-md text-left w-full max-w-2xl overflow-auto">
                            <p className="font-mono text-xs text-red-500">
                                {this.state.error.toString()}
                            </p>
                        </div>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
