import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  type AdminPermissionsMap,
  normalizePermissions,
} from "@/lib/adminPermissions";

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_super_admin: boolean;
  must_change_password: boolean;
  permissions: AdminPermissionsMap;
  last_login_at: string | null;
  created_at: string;
}

const PROFILE_KEY = ["admin-profile"] as const;

export function useAdminProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...PROFILE_KEY, user?.id],
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data, error } = await supabase.rpc("get_my_admin_profile");
      if (error) {
        throw error;
      }
      if (!data) {
        return null;
      }
      const row = data as Record<string, unknown>;
      return {
        id: String(row.id),
        full_name: String(row.full_name ?? user?.user_metadata?.full_name ?? ""),
        email: String(row.email ?? user?.email ?? ""),
        role: String(row.role ?? "user"),
        is_active: !!row.is_active,
        is_super_admin: !!row.is_super_admin,
        must_change_password: !!row.must_change_password,
        permissions: normalizePermissions(row.permissions),
        last_login_at: (row.last_login_at as string | null) ?? null,
        created_at: String(row.created_at ?? ""),
      };
    },
    enabled: !!user,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fullName: string) => {
      const trimmed = fullName.trim();
      const { error } = await supabase.rpc("update_my_admin_profile", {
        p_full_name: trimmed,
      });
      if (error) {
        throw error;
      }
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });
      if (authError) {
        throw authError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useClearMustChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("clear_must_change_password");
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}

export function useHasAdminPermission(
  module: keyof AdminPermissionsMap,
  action: "view" | "edit" | "delete",
) {
  const { data: profile } = useAdminProfile();
  if (!profile) {
    return false;
  }
  if (profile.is_super_admin) {
    return true;
  }
  return !!profile.permissions[module]?.[action];
}
