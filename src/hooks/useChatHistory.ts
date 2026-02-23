import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessageRow {
  id: string;
  care_circle_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  role: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useChatHistory(careCircleId: string | undefined) {
  return useQuery({
    queryKey: ["chat_messages", careCircleId],
    enabled: !!careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("care_circle_id", careCircleId!)
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data as ChatMessageRow[];
    },
  });
}

export function useSaveChatMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (msg: {
      care_circle_id: string;
      sender_id: string;
      sender_name: string;
      content: string;
      role: string;
    }) => {
      const { error } = await supabase.from("chat_messages").insert([{
        care_circle_id: msg.care_circle_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender_name,
        content: msg.content,
        role: msg.role,
      }]);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat_messages", vars.care_circle_id] });
    },
  });
}
