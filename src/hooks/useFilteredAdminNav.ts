import { useMemo } from "react";
import type { AdminNavItem } from "@/lib/adminNavigation";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { getModuleForRoute, hasAdminPermission } from "@/lib/adminPermissions";

export function useFilteredAdminNav(items: AdminNavItem[]): AdminNavItem[] {
  const { data: profile } = useAdminProfile();

  return useMemo(() => {
    if (!profile) {
      return items;
    }
    if (profile.is_super_admin) {
      return items;
    }
    return items.filter((item) => {
      if (item.to === "/admin/equipe") {
        return !!profile.permissions.usuarios?.edit;
      }
      const module = getModuleForRoute(item.to);
      if (!module) {
        return true;
      }
      return hasAdminPermission(profile.permissions, profile.is_super_admin, module, "view");
    });
  }, [items, profile]);
}

export function useCanManageUsers(): boolean {
  const { data: profile } = useAdminProfile();
  if (!profile) {
    return false;
  }
  return profile.is_super_admin || !!profile.permissions.usuarios?.edit;
}
