import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Building2, X } from "lucide-react"
import { toast } from "sonner"

interface Organization {
    id: string
    name: string
    code: string
}

export function OrgSwitcher() {
    const { user, impersonatedOrgId, impersonateOrg } = useAuth()
    const [orgs, setOrgs] = useState<Organization[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Only fetch if Super Admin
    useEffect(() => {
        if (user?.role === 'super_admin') {
            fetchOrgs()
        }
    }, [user])

    const fetchOrgs = async () => {
        setIsLoading(true)
        try {
            const res = await api.get('/super-admin/organizations')
            // console.log("OrgSwitcher Data:", res.data);
            
            if (res.data && Array.isArray(res.data.organizations)) {
                setOrgs(res.data.organizations)
            } else if (Array.isArray(res.data)) {
                 setOrgs(res.data)
            } else {
                console.error("OrgSwitcher: Invalid data format", res.data)
                setOrgs([])
            }
        } catch (error) {
            console.error("Failed to fetch orgs", error)
            toast.error("Failed to load organizations")
            setOrgs([])
        } finally {
            setIsLoading(false)
        }
    }

    if (user?.role !== 'super_admin') return null

    return (
        <div className="px-4 py-2 border-b bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Context Switcher
                </span>
            </div>
            
            <div className="flex gap-2">
                <Select 
                    value={impersonatedOrgId || ""} 
                    onValueChange={(val) => impersonateOrg(val)}
                    disabled={isLoading}
                >
                    <SelectTrigger className="h-8 text-xs bg-white">
                        <SelectValue placeholder="Select Organization..." />
                    </SelectTrigger>
                    <SelectContent>
                        {orgs.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                                {org.name} ({org.code})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {impersonatedOrgId && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => impersonateOrg(null)}
                        title="Clear Selection (View as Super Admin)"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {impersonatedOrgId && (
                <div className="mt-1 text-[10px] text-amber-600 font-medium">
                    ⚠ Viewing as {orgs.find(o => o.id === impersonatedOrgId)?.name || "Impersonated Org"}
                </div>
            )}
        </div>
    )
}
