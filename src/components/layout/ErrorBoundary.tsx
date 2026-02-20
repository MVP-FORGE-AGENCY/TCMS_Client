import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCcw } from "lucide-react"

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
                    <div className="w-full max-w-md bg-card/60 glass rounded-xl border border-destructive/20 shadow-soft-lg p-8 text-center animate-in zoom-in-95 duration-300">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20 mb-6">
                            <AlertTriangle className="h-8 w-8 text-destructive dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight mb-3">Something went wrong</h1>
                        <p className="text-muted-foreground mb-8">
                            We apologize for the inconvenience. An unexpected error has occurred while loading this page.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={() => window.location.reload()} className="hover-lift">
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                Reload Page
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/'} className="hover-lift">
                                <Home className="mr-2 h-4 w-4" />
                                Go Home
                            </Button>
                        </div>
                    </div>
                    {import.meta.env.DEV && this.state.error && (
                        <div className="mt-8 p-4 bg-background/50 glass border border-destructive/30 rounded-lg text-left w-full max-w-3xl overflow-auto shadow-sm">
                            <p className="font-mono text-sm font-medium text-destructive mb-2">Error Details (Development Only):</p>
                            <p className="font-mono text-xs text-destructive/80 whitespace-pre-wrap break-all">
                                {this.state.error.stack || this.state.error.toString()}
                            </p>
                        </div>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
