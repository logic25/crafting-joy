import { User, Bell, HelpCircle, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCareCircle } from "@/hooks/useCareCircle";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const prefKeys = ["appointment_reminders", "refill_reminders", "coverage_requests", "family_updates"] as const;
type PrefKey = typeof prefKeys[number];

const prefLabels: Record<PrefKey, { title: string; desc: string }> = {
  appointment_reminders: { title: "Appointment Reminders", desc: "24 hours before appointments" },
  refill_reminders: { title: "Refill Reminders", desc: "10 days before running out" },
  coverage_requests: { title: "Coverage Requests", desc: "When someone needs coverage" },
  family_updates: { title: "Family Updates", desc: "Changes made by other caregivers" },
};

const Settings = () => {
  const { user } = useAuth();
  const { data: circle } = useCareCircle();
  const queryClient = useQueryClient();

  const { data: careRecipient } = useQuery({
    queryKey: ["care_recipient", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("care_recipients")
        .select("name, preferred_hospital, primary_care_doctor")
        .eq("care_circle_id", circle!.careCircleId)
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: prefs } = useQuery({
    queryKey: ["notification_preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data as any) || null;
    },
  });

  const handleToggle = async (key: PrefKey, checked: boolean) => {
    if (!user?.id) return;
    await supabase.from("notification_preferences" as any).upsert(
      { user_id: user.id, [key]: checked } as any,
      { onConflict: "user_id" }
    );
    queryClient.invalidateQueries({ queryKey: ["notification_preferences"] });
  };

  const firstName = user?.user_metadata?.first_name || "";
  const lastName = user?.user_metadata?.last_name || "";
  const displayName = `${firstName} ${lastName}`.trim() || "You";
  const email = user?.email || "";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prefKeys.map((key, i) => (
              <div key={key}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{prefLabels[key].title}</p>
                    <p className="text-sm text-muted-foreground">{prefLabels[key].desc}</p>
                  </div>
                  <Switch
                    checked={prefs ? (prefs as any)[key] ?? true : true}
                    onCheckedChange={(checked) => handleToggle(key, checked)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Care Recipient Info */}
        {careRecipient && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Care Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{careRecipient.name}</p>
              </div>
              {careRecipient.primary_care_doctor && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Care Doctor</p>
                    <p className="font-medium">{careRecipient.primary_care_doctor}</p>
                  </div>
                </>
              )}
              {careRecipient.preferred_hospital && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Hospital</p>
                    <p className="font-medium">{careRecipient.preferred_hospital}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help & Support */}
        <Card>
          <CardContent className="p-4">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </Button>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
