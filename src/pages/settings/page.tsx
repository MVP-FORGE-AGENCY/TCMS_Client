import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Globe } from "lucide-react"

export default function SettingsPage() {
    const { t, i18n } = useTranslation()

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

            <div className="grid gap-4">
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
