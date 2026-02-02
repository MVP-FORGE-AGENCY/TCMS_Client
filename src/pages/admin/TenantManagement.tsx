/**
 * Tenant Management Page
 * Super Admin dashboard for managing organisations (tenants)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Building2, Users, LogIn, Search, Shield, AlertTriangle } from 'lucide-react';

interface Tenant {
    id: string;
    name: string;
    code: string;
    is_active: boolean;
    status: string;
    userCount: number;
    adminCount?: number;
    created_at: string;
}

const TenantManagement = () => {
    const navigate = useNavigate();
    const { user, impersonateOrg } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [impersonateDialog, setImpersonateDialog] = useState<Tenant | null>(null);

    useEffect(() => {
        // Redirect if not super_admin
        if (user && user.role !== 'super_admin') {
            navigate('/');
            toast.error('Access denied. Super Admin only.');
            return;
        }
        fetchTenants();
    }, [user]);

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/organizations', {
                params: { search }
            });
            setTenants(response.data.organizations || response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
            toast.error('Failed to load tenants');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (tenant: Tenant) => {
        try {
            await api.patch(`/admin/organizations/${tenant.id}/status`, {
                is_active: !tenant.is_active
            });
            toast.success(`Tenant ${tenant.is_active ? 'deactivated' : 'activated'}`);
            fetchTenants();
        } catch (error) {
            toast.error('Failed to update tenant status');
        }
    };

    const handleImpersonate = async (tenant: Tenant) => {
        try {
            // Log the impersonation
            await api.post(`/admin/organizations/${tenant.id}/impersonate`);
            
            // Set impersonation context
            impersonateOrg(tenant.id);
            
            toast.success(`Now viewing as ${tenant.name}`);
            // Page will reload due to impersonateOrg
        } catch (error) {
            toast.error('Failed to impersonate tenant');
        }
    };

    const filteredTenants = tenants.filter(t => 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase())
    );

    if (user?.role !== 'super_admin') {
        return (
            <div className="container mx-auto py-12 text-center">
                <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">This area is restricted to Super Administrators.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-6 w-6" />
                                Tenant Management
                            </CardTitle>
                            <CardDescription>
                                Manage organisations across the platform
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                            <Shield className="h-3 w-3 mr-1" />
                            Super Admin
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tenants by name or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button onClick={() => navigate('/admin/tenants/new')}>
                            + Create Tenant
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organisation</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Active</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">{tenant.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{tenant.code}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                {tenant.userCount}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                                className={tenant.status === 'trial' ? 'bg-amber-500' : ''}
                                            >
                                                {tenant.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Switch 
                                                checked={tenant.is_active !== false} 
                                                onCheckedChange={() => handleToggleStatus(tenant)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                                            >
                                                Details
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="default"
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={() => setImpersonateDialog(tenant)}
                                            >
                                                <LogIn className="h-4 w-4 mr-1" />
                                                Login As
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredTenants.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No tenants found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Impersonation Confirmation Dialog */}
            <Dialog open={!!impersonateDialog} onOpenChange={() => setImpersonateDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Confirm Impersonation
                        </DialogTitle>
                        <DialogDescription>
                            You are about to view the system as an administrator of <strong>{impersonateDialog?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2 text-sm">
                        <p>• All your actions will be logged with your Super Admin ID</p>
                        <p>• You will see data scoped to this organisation</p>
                        <p>• To exit impersonation, use the header banner or logout</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImpersonateDialog(null)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => impersonateDialog && handleImpersonate(impersonateDialog)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            Start Impersonation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TenantManagement;
