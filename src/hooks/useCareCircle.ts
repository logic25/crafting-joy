import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCareCircle() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["care_circle", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get the user's care circle membership
      const { data: membership, error: memberError } = await supabase
        .from("care_circle_members")
        .select("care_circle_id")
        .eq("user_id", user!.id)
        .limit(1)
        .single();

      if (memberError || !membership) return null;

      // Get care recipient for this circle
      const { data: recipient } = await supabase
        .from("care_recipients")
        .select("id, name")
        .eq("care_circle_id", membership.care_circle_id)
        .limit(1)
        .single();

      return {
        careCircleId: membership.care_circle_id,
        careRecipientId: recipient?.id || "",
        careRecipientName: recipient?.name || "",
      };
    },
  });
}
