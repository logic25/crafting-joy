import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MedicationRow {
  id: string;
  care_circle_id: string;
  care_recipient_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  purpose: string | null;
  prescriber: string | null;
  pharmacy: string | null;
  quantity: string | null;
  refills_remaining: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  added_by: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useMedications(careCircleId: string | undefined) {
  return useQuery({
    queryKey: ["medications", careCircleId],
    enabled: !!careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .eq("care_circle_id", careCircleId!)
        .order("is_active", { ascending: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as MedicationRow[];
    },
  });
}

export function useAddMedication() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (med: {
      care_circle_id: string;
      care_recipient_id: string;
      name: string;
      dosage?: string;
      frequency?: string;
      instructions?: string;
      purpose?: string;
      prescriber?: string;
      pharmacy?: string;
      source?: string;
    }) => {
      const { data, error } = await supabase
        .from("medications")
        .insert({ ...med, added_by: user!.id, source: med.source || "manual" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["medications", vars.care_circle_id] });
    },
  });
}

export function useUpdateMedication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, careCircleId, ...updates }: { id: string; careCircleId: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from("medications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["medications", vars.careCircleId] });
    },
  });
}

export function useDeleteMedication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, careCircleId }: { id: string; careCircleId: string }) => {
      const { error } = await supabase.from("medications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["medications", vars.careCircleId] });
    },
  });
}
