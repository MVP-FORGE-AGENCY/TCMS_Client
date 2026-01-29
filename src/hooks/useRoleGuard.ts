/**
 * useRoleGuard Hook
 * Provides role-based UI visibility controls for EASA RBAC compliance
 */
import { useAuth } from '@/context/AuthContext';

interface RoleGuardResult {
    // Core role checks
    role: string | undefined;
    isAuditor: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isTrainingManager: boolean;
    isInstructor: boolean;
    isReadOnly: boolean;

    // Action permissions
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canManageStandards: boolean;
    canViewAuditTrail: boolean;
    canExportData: boolean;

    // Helper function
    hasRole: (...roles: string[]) => boolean;
}

/**
 * Hook to determine what UI elements should be visible based on user role
 */
export function useRoleGuard(): RoleGuardResult {
    const { user } = useAuth();
    const role = user?.role;

    // Core role checks
    const isSuperAdmin = role === 'super_admin';
    const isAdmin = role === 'admin';
    const isAuditor = role === 'auditor';
    const isTrainingManager = role === 'training_manager';
    const isInstructor = role === 'instructor';
    const isReadOnly = role === 'auditor' || role === 'readonly';

    // Helper function
    const hasRole = (...roles: string[]) => {
        if (!role) return false;
        if (isSuperAdmin) return true; // Super admin has all roles
        return roles.includes(role);
    };

    // Action permissions
    // Auditors and readonly users cannot perform write operations
    const canCreate = !isReadOnly && hasRole('admin', 'training_manager', 'instructor');
    const canEdit = !isReadOnly && hasRole('admin', 'training_manager', 'instructor', 'assessor');
    const canDelete = !isReadOnly && hasRole('admin', 'training_manager');
    
    // User management is admin/training_manager only
    const canManageUsers = !isReadOnly && hasRole('admin', 'training_manager');
    
    // Standards management is admin/training_manager only
    const canManageStandards = !isReadOnly && hasRole('admin', 'training_manager');
    
    // Audit trail is visible to auditors, admins, and super_admins
    const canViewAuditTrail = hasRole('auditor', 'admin', 'super_admin');
    
    // Everyone can export (auditors need this for compliance)
    const canExportData = true;

    return {
        role,
        isAuditor,
        isSuperAdmin,
        isAdmin,
        isTrainingManager,
        isInstructor,
        isReadOnly,
        canCreate,
        canEdit,
        canDelete,
        canManageUsers,
        canManageStandards,
        canViewAuditTrail,
        canExportData,
        hasRole
    };
}

export default useRoleGuard;
