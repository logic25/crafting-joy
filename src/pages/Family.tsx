import { Phone, Mail, Shield, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { InviteEmailSheet } from "@/components/family/InviteEmailSheet";
import { AddMemberSheet } from "@/components/family/AddMemberSheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareCircle } from "@/hooks/useCareCircle";

const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-primary text-primary-foreground" },
  caregiver: { label: "Caregiver", color: "bg-success text-success-foreground" },
  "view-only": { label: "View Only", color: "bg-muted text-muted-foreground" },
};

const Family = () => {
  const { data: circle } = useCareCircle();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["family_members", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data: memberships, error } = await supabase
        .from("care_circle_members")
        .select("user_id, role")
        .eq("care_circle_id", circle!.careCircleId);
      if (error) throw error;

      // Fetch profiles for each member
      const userIds = memberships.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", userIds);

      return memberships.map((m) => {
        const profile = profiles?.find((p) => p.id === m.user_id);
        return {
          id: m.user_id,
          name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email : "Unknown",
          email: profile?.email || "",
          role: m.role,
        };
      });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Family Members</h1>
            <p className="text-muted-foreground">
              {members.length > 0 ? `${members.length} member${members.length > 1 ? "s" : ""} in your circle` : "Your care circle"}
            </p>
          </div>
          <div className="flex gap-2">
            <AddMemberSheet />
            <InviteEmailSheet />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg text-foreground">No family members yet</h3>
            <p className="text-muted-foreground mt-1">Invite your siblings to join the care circle</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => {
              const role = roleConfig[member.role] || roleConfig["view-only"];
              return (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-primary-foreground">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <Badge className={cn("text-xs", role.color)}>
                            <Shield className="h-3 w-3 mr-1" />
                            {role.label}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {member.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{member.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Family;
