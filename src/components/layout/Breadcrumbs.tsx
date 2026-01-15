import { useLocation, Link } from "react-router-dom"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { useBreadcrumb } from "@/context/BreadcrumbContext"

export function Breadcrumbs() {
    const location = useLocation()
    const { t } = useTranslation()
    const { labels } = useBreadcrumb()
    const pathnames = location.pathname.split("/").filter((x) => x)

    // Map of path segments to translation keys
    const pathTranslations: Record<string, string> = {
        dashboard: "nav.dashboard",
        personnel: "nav.personnel",
        programmes: "nav.programmes",
        sessions: "nav.sessions",
        checks: "nav.checks",
        reports: "nav.reports",
        settings: "nav.settings",
        standards: "nav.standards",
        procedures: "nav.procedures",
    }

    const getTitle = (segment: string): string => {
        // 1. Try static translation
        const key = pathTranslations[segment.toLowerCase()]
        if (key) {
            return t(key)
        }
        
        // 2. Try dynamic label from context
        if (labels[segment]) {
            return labels[segment];
        }

        // 3. Fallback
        return segment.charAt(0).toUpperCase() + segment.slice(1)
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to="/">{t("common.home")}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join("/")}`
                    const isLast = index === pathnames.length - 1
                    const title = getTitle(value)

                    return (
                        <Fragment key={to}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{title}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={to}>{title}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
