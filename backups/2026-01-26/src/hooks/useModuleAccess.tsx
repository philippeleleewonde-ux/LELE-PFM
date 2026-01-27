import { useUserRole } from './useUserRole';
import { useAuth } from './useAuth';
import { MODULE_PERMISSIONS, ModuleNumber, ModuleAccess } from '@/types/modules';

export function useModuleAccess(moduleNumber: ModuleNumber): ModuleAccess & { loading: boolean; role: string | null } {
  const { user } = useAuth();
  const { role, loading } = useUserRole(user?.id);

  if (loading || !role) {
    return {
      canRead: false,
      canWrite: false,
      canAdmin: false,
      loading,
      role
    };
  }

  const permissions = MODULE_PERMISSIONS[role]?.[moduleNumber] || {
    canRead: false,
    canWrite: false,
    canAdmin: false
  };

  return {
    ...permissions,
    loading,
    role
  };
}

export function useAccessibleModules() {
  const { user } = useAuth();
  const { role, loading } = useUserRole(user?.id);

  if (loading || !role) {
    return { modules: [], loading };
  }

  const accessibleModules = (Object.keys(MODULE_PERMISSIONS[role]) as unknown as ModuleNumber[])
    .filter(moduleNum => {
      const access = MODULE_PERMISSIONS[role][moduleNum];
      return access.canRead || access.canWrite || access.canAdmin;
    })
    .map(num => Number(num) as ModuleNumber);

  return { modules: accessibleModules, loading };
}
