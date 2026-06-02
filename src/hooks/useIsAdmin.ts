import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Verifica role admin via RPC am_i_admin (schema private, não expõe is_admin). */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin, isPending: adminPending } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) {
        return false;
      }
      const { data, error } = await supabase.rpc("am_i_admin");
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
