import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Verifica role admin via RPC is_admin (mesma lógica do AdminEditorContext). */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin, isPending: adminPending } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) {
        return false;
      }
      const { data, error } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (error) {
        throw error;
      }
      return !!data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return {
    isAdmin: !!isAdmin,
    loading: authLoading || (!!user && adminPending),
  };
}
