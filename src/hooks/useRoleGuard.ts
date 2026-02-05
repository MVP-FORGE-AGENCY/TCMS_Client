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
    canGrade: boolean;
    canSign: boolean;
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
    const canCreate = !isReadOnly && hasRole('admin', 'training_manager'); // Instructors cannot create
    
    // Edit means 'Edit Session Details/Campaigns'. Instructors cannot do this.
    const canEdit = !isReadOnly && hasRole('admin', 'training_manager'); 
    
    // Instructors specific rights
    const canGrade = !isReadOnly && hasRole('admin', 'training_manager', 'instructor');
    const canSign = !isReadOnly && hasRole('admin', 'training_manager', 'instructor', 'assessor');

    // Delete is Admin only (Training Manager cannot delete users)
    const canDelete = !isReadOnly && hasRole('admin');
    
    // User management is admin/training_manager only (Manager can Create/Edit, but not Delete)
    // We split this: Manager can 'view/edit' users but not dangerous actions? 
    // The spec says: Manager "cannot delete users". 
    const canManageUsers = !isReadOnly && hasRole('admin', 'training_manager');
    
    // Standards management is admin only (Manager cannot change pass marks)
    const canManageStandards = !isReadOnly && hasRole('admin');
    
    // Audit trail is visible to auditors, admins, super_admins AND training_managers (Read Only)
    const canViewAuditTrail = hasRole('auditor', 'admin', 'super_admin', 'training_manager');
    
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
        canGrade,
        canSign,
        canManageUsers,
        canManageStandards,
        canViewAuditTrail,
        canExportData,
        hasRole
    };
}

export default useRoleGuard;
