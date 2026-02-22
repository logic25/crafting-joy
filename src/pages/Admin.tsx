import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Activity, Shield, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

interface Circle {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
  description: string | null;
}

interface CircleMember {
  id: string;
  user_id: string;
  care_circle_id: string;
  role: string;
  created_at: string;
}

interface CareRecipient {
  id: string;
  name: string;
  care_circle_id: string;
  created_at: string;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, circlesRes, membersRes, recipientsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("care_circles").select("*"),
        supabase.from("care_circle_members").select("*"),
        supabase.from("care_recipients").select("id, name, care_circle_id, created_at"),
      ]);
      setProfiles(profilesRes.data || []);
      setCircles(circlesRes.data || []);
      setMembers(membersRes.data || []);
      setRecipients(recipientsRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.last_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCirclesForUser = (userId: string) =>
    members.filter((m) => m.user_id === userId).map((m) => ({
      ...m,
      circleName: circles.find((c) => c.id === m.care_circle_id)?.name || "Unknown",
    }));

  const getMembersForCircle = (circleId: string) =>
    members.filter((m) => m.care_circle_id === circleId).map((m) => ({
      ...m,
      profile: profiles.find((p) => p.id === m.user_id),
    }));

  const getRecipientsForCircle = (circleId: string) =>
    recipients.filter((r) => r.care_circle_id === circleId);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor users, circles, and platform activity</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{circles.length}</p>
                <p className="text-xs text-muted-foreground">Care Circles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recipients.length}</p>
                <p className="text-xs text-muted-foreground">Care Recipients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Memberships</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="circles">Care Circles</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {filteredProfiles.map((profile) => {
                const userCircles = getCirclesForUser(profile.id);
                return (
                  <Card key={profile.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {profile.first_name || profile.last_name
                              ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                              : "No name set"}
                          </h3>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {userCircles.length === 0 && (
                            <Badge variant="outline" className="text-xs">No circle</Badge>
                          )}
                          {userCircles.map((uc) => (
                            <Badge key={uc.id} variant="secondary" className="text-xs">
                              {uc.circleName} ({uc.role})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredProfiles.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </div>
          </TabsContent>

          {/* Circles Tab */}
          <TabsContent value="circles" className="space-y-4">
            {circles.map((circle) => {
              const circleMembers = getMembersForCircle(circle.id);
              const circleRecipients = getRecipientsForCircle(circle.id);
              return (
                <Card key={circle.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{circle.name}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {circleMembers.length} members
                      </Badge>
                    </CardTitle>
                    {circle.description && (
                      <p className="text-sm text-muted-foreground">{circle.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Care Recipients</p>
                      {circleRecipients.length === 0 ? (
                        <p className="text-sm text-muted-foreground">None added</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {circleRecipients.map((r) => (
                            <Badge key={r.id} variant="secondary">{r.name}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Members</p>
                      <div className="space-y-1">
                        {circleMembers.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-sm">
                            <span>{m.profile?.first_name || m.profile?.email || m.user_id}</span>
                            <Badge variant="outline" className="text-xs">{m.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(circle.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
            {circles.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No circles yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
