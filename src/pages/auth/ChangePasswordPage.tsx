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
import { Loader2 } from "lucide-react"

export default function ChangePasswordPage() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm()
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const { logout } = useAuth() // In case they want to cancel/logout

    const newPassword = watch("newPassword")

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            await auth.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            })
            
            toast.success("Password changed successfully! You can now use the system.")
            
            // Redirect to dashboard (or wherever appropriate)
            // Logic: The backend clears the mustChangePassword flag.
            // Ideally we should refresh the user context or just navigate.
            // Simpler: Force logout and ask to login again? Or just navigate.
            // Let's navigate to dashboard, assuming AuthContext will eventually sync or next request works.
            navigate("/dashboard")
            
        } catch (error: any) {
            console.error("Change password failed", error)
            toast.error(error.response?.data?.error?.message || "Failed to change password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password securely.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current (Temporary) Password</Label>
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
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" type="button" onClick={logout}>Logout</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Change Password
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
