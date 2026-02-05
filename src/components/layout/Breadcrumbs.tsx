import { useLocation, Link, useSearchParams } from "react-router-dom"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useBreadcrumb } from "@/context/BreadcrumbContext"

export function Breadcrumbs() {
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const { t } = useTranslation()
    const { labels } = useBreadcrumb()
    const pathnames = location.pathname.split("/").filter((x) => x)

    // Check for campaign context in URL params
    const campaignId = searchParams.get('campaignId')
    const campaignName = searchParams.get('campaignName')
    const isFromCampaign = !!(campaignId && campaignName)

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
        campaigns: "nav.campaigns",
        curriculums: "nav.curriculums",
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

    // Build breadcrumb items - override when coming from campaign
    const breadcrumbItems = useMemo(() => {
        if (isFromCampaign && pathnames[0] === 'sessions') {
            // Override: Show Campaigns > Campaign Name > Session
            const sessionId = pathnames[1]
            const sessionLabel = labels[sessionId] || 'Session'
            return [
                { to: '/campaigns', title: t('nav.campaigns', 'Campaigns'), isLast: false },
                { to: `/campaigns/${campaignId}`, title: decodeURIComponent(campaignName!), isLast: false },
                { to: location.pathname + location.search, title: sessionLabel, isLast: true }
            ]
        }

        // Default path-based breadcrumbs
        return pathnames.map((value, index) => ({
            to: `/${pathnames.slice(0, index + 1).join("/")}`,
            title: getTitle(value),
            isLast: index === pathnames.length - 1
        }))
    }, [pathnames, isFromCampaign, campaignId, campaignName, labels, location])

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to="/">{t("common.home")}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems.map((item) => (
                    <Fragment key={item.to}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {item.isLast ? (
                                <BreadcrumbPage>{item.title}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link to={item.to}>{item.title}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
