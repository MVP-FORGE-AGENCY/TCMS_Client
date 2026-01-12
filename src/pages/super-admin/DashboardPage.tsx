import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { superAdmin } from "@/lib/api"
import { Building2, Users, AlertTriangle } from "lucide-react"

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState({
        totalOrgs: 0,
        activeOrgs: 0,
        trialOrgs: 0,
        suspendedOrgs: 0,
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
                const orgs = data.organizations || []
                
                setStats({
                    totalOrgs: data.pagination?.total || orgs.length,
                    activeOrgs: orgs.filter((o: any) => o.status === 'active').length,
                    trialOrgs: orgs.filter((o: any) => o.status === 'trial').length,
                    suspendedOrgs: orgs.filter((o: any) => o.status === 'suspended').length,
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
        return <div className="p-8">Loading dashboard...</div>
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrgs}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeOrgs} active, {stats.trialOrgs} trials
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trial Organizations</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.trialOrgs}</div>
                        <p className="text-xs text-muted-foreground">
                            Potential conversions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">
                            Across all tenants
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
