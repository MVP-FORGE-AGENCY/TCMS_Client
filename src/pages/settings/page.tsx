import { useTranslation } from "react-i18next"

export default function SettingsPage() {
    const { t } = useTranslation()
    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
            <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
    )
}
