import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  hasCircle: boolean | null;
  signOut: () => Promise<void>;
  refreshCircleStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  hasCircle: null,
  signOut: async () => {},
  refreshCircleStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCircle, setHasCircle] = useState<boolean | null>(null);

  const checkCircleStatus = async (userId: string) => {
    const { data } = await supabase
      .from("care_circle_members")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    setHasCircle(data && data.length > 0);
  };

  const refreshCircleStatus = async () => {
    if (session?.user) {
      await checkCircleStatus(session.user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await checkCircleStatus(session.user.id);
        } else {
          setHasCircle(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await checkCircleStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setHasCircle(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        hasCircle,
        signOut,
        refreshCircleStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
