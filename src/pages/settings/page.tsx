import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Globe, User, Mail, Shield, Building2, Briefcase } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Administrator",
    training_manager: "Training Manager",
    instructor: "Instructor",
    assessor: "Assessor",
    employee: "Employee",
    readonly: "Read Only",
}

const roleBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    super_admin: "destructive",
    admin: "default",
    training_manager: "default",
    instructor: "secondary",
    assessor: "secondary",
    employee: "outline",
    readonly: "outline",
}

export default function SettingsPage() {
    const { t, i18n } = useTranslation()
    const { user } = useAuth()

    const handleLanguageChange = (value: string) => {
        i18n.changeLanguage(value)
        localStorage.setItem("i18nextLng", value)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
                <p className="text-muted-foreground text-sm">{t("settings.subtitle")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Profile Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            My Profile
                        </CardTitle>
                        <CardDescription>
                            Your account information and role details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-primary">
                                        {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <Badge variant={roleBadgeVariants[user?.role || 'employee']}>
                                    {roleLabels[user?.role || 'employee']}
                                </Badge>
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                                    <p className="font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {user?.fullName || 'N/A'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
                                    <p className="font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {user?.email || 'N/A'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Role</Label>
                                    <p className="font-medium flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        {roleLabels[user?.role || 'employee']}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Organization</Label>
                                    <p className="font-medium flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        {user?.organisation?.name || (user?.role === 'super_admin' ? 'Platform Admin' : 'N/A')}
                                    </p>
                                </div>

                                {user?.departmentTag && (
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Department</Label>
                                        <p className="font-medium flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            {user.departmentTag}
                                        </p>
                                    </div>
                                )}

                                {user?.areaOfActivity && (
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Area of Activity</Label>
                                        <p className="font-medium flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            {user.areaOfActivity}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Language Settings Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            {t("settings.systemPreferences")}
                        </CardTitle>
                        <CardDescription>
                            Configure global application settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label>{t("settings.language")}</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred language.</p>
                            </div>
                            <div className="w-[180px]">
                                <Select value={i18n.language.split('-')[0]} onValueChange={handleLanguageChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="bg">Български</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
