import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { auth } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { Loader2, ShieldAlert } from "lucide-react"

export default function ForceChangePasswordPage() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { logout } = useAuth()

    const newPassword = watch("newPassword")

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await auth.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            })
            
            toast.success("Password updated successfully! Redirecting...")
            
            // Wait a moment for backend propagation if needed, then go to dashboard
            setTimeout(() => {
                // We might need to refresh the user context here
                // For now, simple navigation should trigger re-checks or re-fetch in App
                navigate("/") 
                window.location.reload() // Force reload to refresh AuthContext
            }, 1000)
            
        } catch (error: any) {
            console.error("Change password failed", error)
            toast.error(error.response?.data?.error?.message || "Failed to change password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-red-50/50 p-4">
            <Card className="w-full max-w-md border-red-200 shadow-lg">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <ShieldAlert className="h-6 w-6" />
                        <span className="font-semibold">Security Alert</span>
                    </div>
                    <CardTitle className="text-2xl">Password Expired</CardTitle>
                    <CardDescription>
                        Your password has expired (older than 90 days). 
                        You must change it to continue accessing the platform.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                {...register("currentPassword", { required: "Current password is required" })}
                            />
                            {errors.currentPassword && <p className="text-sm text-red-500">{String(errors.currentPassword.message)}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                {...register("newPassword", { 
                                    required: "New password is required",
                                    minLength: { value: 8, message: "Must be at least 8 characters" }
                                })}
                            />
                            {errors.newPassword && <p className="text-sm text-red-500">{String(errors.newPassword.message)}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                {...register("confirmPassword", { 
                                    required: "Please confirm your password",
                                    validate: (val) => val === newPassword || "Passwords do not match"
                                })}
                            />
                            {errors.confirmPassword && <p className="text-sm text-red-500">{String(errors.confirmPassword.message)}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between bg-gray-50/50 px-6 py-4">
                        <Button variant="ghost" type="button" onClick={logout} className="text-muted-foreground hover:text-red-600">
                            Log out
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
