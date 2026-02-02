import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { superAdmin } from "@/lib/api"
import { Building2, Users, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function SuperAdminDashboard() {
    const { t } = useTranslation()
    const [stats, setStats] = useState({
        totalOrgs: 0,
        activeOrgs: 0,
        trialOrgs: 0,
        suspendedOrgs: 0,
        totalUsers: 0,
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // For MVP, we fetch list and calculate stats client side or assume backend will provide aggregate later
                // The listOrganizations endpoint returns paginated data, so we might need a stats endpoint.
                // For now, we'll just fetch page 1 and use total count from pagination metadata if available, 
                // or just show placeholders if we can't get full stats easily.
                
                // Let's assume we fetch a reasonable number to get a glimpse
                const data = await superAdmin.listOrganizations({ limit: 100 })
                // console.log("Dashboard - Orgs Data:", data)

                const orgs = Array.isArray(data.organizations) ? data.organizations : []
                
                // Calculate total users across all fetched organizations
                // The backend provides 'userCount' for each organization
                const totalUsers = orgs.reduce((sum: number, org: any) => sum + (org.userCount || 0), 0)

                setStats({
                    totalOrgs: data.pagination?.total || orgs.length,
                    activeOrgs: orgs.filter((o: any) => o.status === 'active').length,
                    trialOrgs: orgs.filter((o: any) => o.status === 'trial').length,
                    suspendedOrgs: orgs.filter((o: any) => o.status === 'suspended').length,
                    totalUsers,
                })
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (isLoading) {
        return <div className="p-8">{t("nav.superAdmin.dashboard.loading")}</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("nav.superAdmin.dashboard.title")}</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("nav.superAdmin.dashboard.totalOrgs")}</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrgs}</div>
                        <p className="text-xs text-muted-foreground">
                            {t("nav.superAdmin.dashboard.activeTrial", { active: stats.activeOrgs, trial: stats.trialOrgs })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("nav.superAdmin.dashboard.trialOrgs")}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.trialOrgs}</div>
                        <p className="text-xs text-muted-foreground">
                            {t("nav.superAdmin.dashboard.potentialConversions")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("nav.superAdmin.dashboard.totalUsers")}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {t("nav.superAdmin.dashboard.acrossTenants")}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
