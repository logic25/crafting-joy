import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AuditAction = "view" | "create" | "update" | "delete" | "export" | "login" | "logout";
type ResourceType = "health_reading" | "care_recipient" | "medication" | "appointment" | "document" | "care_circle" | "member" | "settings";

interface LogOptions {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  careCircleId?: string;
  metadata?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(
    async ({ action, resourceType, resourceId, careCircleId, metadata }: LogOptions) => {
      if (!user) return;

      try {
        await supabase.from("audit_logs" as any).insert({
          user_id: user.id,
          user_email: user.email,
          action,
          resource_type: resourceType,
          resource_id: resourceId || null,
          care_circle_id: careCircleId || null,
          metadata: metadata || {},
        });
      } catch (err) {
        // Silently fail — audit logging should never break the app
        console.error("Audit log error:", err);
      }
    },
    [user]
  );

  return { log };
}
