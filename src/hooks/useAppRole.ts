import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase.rpc("has_app_role", {
        _user_id: user.id,
        _role: "super_admin",
      });
      setIsSuperAdmin(!!data && !error);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isSuperAdmin, loading };
}
