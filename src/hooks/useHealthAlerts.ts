import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HealthAlert {
  id: string;
  care_circle_id: string;
  reading_id: string | null;
  severity: "normal" | "watch" | "attention" | "urgent";
  title: string;
  message: string;
  correlations: string[] | null;
  action_needed: string | null;
  acknowledged_by: string[] | null;
  created_at: string;
}

export function useHealthAlerts(careCircleId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["health_alerts", careCircleId, limit],
    enabled: !!careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_alerts")
        .select("*")
        .eq("care_circle_id", careCircleId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as HealthAlert[];
    },
  });
}
