import { useTranslation } from "react-i18next"

export default function ReportsPage() {
    const { t } = useTranslation()
    return (
        <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t("reports.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("reports.subtitle")}</p>
        </div>
    )
}
