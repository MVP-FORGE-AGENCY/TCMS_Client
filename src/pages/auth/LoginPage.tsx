import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Plane } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function LoginPage() {
    const { t } = useTranslation()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || "/dashboard"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Response structure: { accessToken: string, user: Employee, ... }
            const response = await api.post("/auth/login", { email, password })
            const { accessToken, user } = response.data

            login(accessToken, user)
            toast.success(t("auth.welcomeBackToast"))
            navigate(from, { replace: true })
        } catch (error: any) {
            console.error("Login failed:", error)
            toast.error(error.response?.data?.message || t("auth.invalidCredentials"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-primary/10 p-3">
                            <Plane className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{t("auth.welcomeBack")}</CardTitle>
                    <CardDescription>
                        {t("auth.enterCredentials")}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("common.email")}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t("common.password")}</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? t("auth.signingIn") : t("auth.signIn")}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
