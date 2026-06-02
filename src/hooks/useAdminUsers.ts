import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type AdminPermissionsMap, normalizePermissions } from "@/lib/adminPermissions";

const ADMIN_USERS_FN = "admin-users";

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  must_change_password: boolean;
  permissions: AdminPermissionsMap;
  created_at: string;
  last_login_at: string | null;
}

interface InviteUserPayload {
  email: string;
  full_name: string;
  permissions: AdminPermissionsMap;
}

interface UpdateUserPayload {
  id: string;
  full_name?: string;
  is_active?: boolean;
  permissions?: AdminPermissionsMap;
}

async function invokeAdminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(ADMIN_USERS_FN, { body });
  if (error) {
    throw error;
  }
  if (data && typeof data === "object" && "error" in data) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminUserRow[]> => {
      const result = await invokeAdminUsers<{ users: AdminUserRow[] }>({ action: "list" });
      return (result.users ?? []).map((u) => ({
        ...u,
        permissions: normalizePermissions(u.permissions),
      }));
    },
  });
}

export function useInviteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InviteUserPayload) => {
      return invokeAdminUsers<{ temp_password: string; email_sent: boolean }>({
        action: "invite",
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserPayload) => {
      return invokeAdminUsers<{ ok: boolean }>({
        action: "update",
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return invokeAdminUsers<{ ok: boolean }>({ action: "delete", id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useResendAdminInvite() {
  return useMutation({
    mutationFn: async (id: string) => {
      return invokeAdminUsers<{ temp_password: string; email_sent: boolean }>({
        action: "resend_invite",
        id,
      });
    },
  });
}
