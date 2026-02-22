import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HealthReading {
  id: string;
  care_circle_id: string;
  care_recipient_id: string;
  type: string;
  value_primary: number;
  value_secondary: number | null;
  value_tertiary: number | null;
  unit: string;
  source: string;
  logged_by: string;
  logged_by_name: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useHealthReadings(careCircleId: string | undefined, type?: string) {
  return useQuery({
    queryKey: ["health_readings", careCircleId, type],
    enabled: !!careCircleId,
    queryFn: async () => {
      let query = supabase
        .from("health_readings")
        .select("*")
        .eq("care_circle_id", careCircleId!)
        .order("created_at", { ascending: false })
        .limit(100);

      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      if (error) throw error;
      return data as HealthReading[];
    },
  });
}

export function useLogHealthReading() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reading: {
      care_circle_id: string;
      care_recipient_id: string;
      type: string;
      value_primary: number;
      value_secondary?: number | null;
      value_tertiary?: number | null;
      unit: string;
      source?: string;
      notes?: string | null;
      metadata?: Record<string, unknown> | null;
    }) => {
      const displayName =
        user?.user_metadata?.first_name ||
        user?.email?.split("@")[0] ||
        "Unknown";

      const insertData = {
        care_circle_id: reading.care_circle_id,
        care_recipient_id: reading.care_recipient_id,
        type: reading.type,
        value_primary: reading.value_primary,
        value_secondary: reading.value_secondary ?? undefined,
        value_tertiary: reading.value_tertiary ?? undefined,
        unit: reading.unit,
        source: reading.source || "manual",
        logged_by: user!.id,
        logged_by_name: displayName,
        notes: reading.notes ?? undefined,
        metadata: (reading.metadata as any) ?? undefined,
      };

      const { data, error } = await supabase
        .from("health_readings")
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data as HealthReading;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["health_readings", data.care_circle_id] });
    },
  });
}

export function useAnalyzeReading() {
  return useMutation({
    mutationFn: async (params: {
      reading_id: string;
      care_circle_id: string;
      care_recipient_id: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("analyze-health-reading", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
  });
}
