import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  products_count: number;
  categories_count: number;
  contents_count: number;
  contacts_count: number;
  conversations_open: number;
  conversations_waiting: number;
  conversations_by_status: { name: string; value: number }[];
  messages_by_day: { day: string; inbound: number; outbound: number }[];
  campaigns_summary: {
    id: string;
    name: string;
    status: string;
    total_sent: number;
    total_delivered: number;
    created_at: string;
  }[];
  templates_approved: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      if (error) {
        throw error;
      }
      return data as DashboardStats;
    },
    refetchInterval: 60_000,
  });
}
