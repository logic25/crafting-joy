import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Activity, Shield, Search, Brain, Zap, AlertTriangle as AlertTriangleIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

interface HealthAlert {
  id: string;
  care_circle_id: string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
}

interface HealthReading {
  id: string;
  care_circle_id: string;
  type: string;
  created_at: string;
}

const severityColors: Record<string, string> = {
  normal: "bg-success/10 text-success border-success/25",
  watch: "bg-warning/10 text-warning border-warning/25",
  attention: "bg-warning/15 text-warning border-warning/40",
  urgent: "bg-destructive/10 text-destructive border-destructive/25",
};

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [healthReadings, setHealthReadings] = useState<HealthReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, circlesRes, membersRes, recipientsRes, alertsRes, readingsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("care_circles").select("*"),
        supabase.from("care_circle_members").select("*"),
        supabase.from("care_recipients").select("id, name, care_circle_id, created_at"),
        supabase.from("health_alerts").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("health_readings").select("id, care_circle_id, type, created_at").order("created_at", { ascending: false }).limit(200),
      ]);
      setProfiles(profilesRes.data || []);
      setCircles(circlesRes.data || []);
      setMembers(membersRes.data || []);
      setRecipients(recipientsRes.data || []);
      setHealthAlerts(alertsRes.data || []);
      setHealthReadings(readingsRes.data || []);
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

  // AI usage stats
  const totalAnalyses = healthAlerts.length;
  const totalReadings = healthReadings.length;
  const severityCounts = healthAlerts.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const readingsByType = healthReadings.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Alerts by day (last 7 days)
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const alertsByDay = last7Days.map((day) => ({
    day,
    count: healthAlerts.filter((a) => a.created_at.startsWith(day)).length,
  }));

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
            <p className="text-sm text-muted-foreground">Monitor users, circles, and AI usage</p>
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
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAnalyses}</p>
                <p className="text-xs text-muted-foreground">AI Analyses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReadings}</p>
                <p className="text-xs text-muted-foreground">Health Readings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai-usage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="circles">Care Circles</TabsTrigger>
          </TabsList>

          {/* AI Usage Tab */}
          <TabsContent value="ai-usage" className="space-y-4">
            {/* Model info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Current Model</p>
                    <p className="text-xs text-muted-foreground mt-0.5">google/gemini-3-flash-preview</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Balanced (speed + quality)
                  </Badge>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Analyses per reading</p>
                    <p className="font-semibold text-foreground">1 API call</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg response time</p>
                    <p className="font-semibold text-foreground">~1-2 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Severity breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Alert Severity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(severityCounts).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No alerts yet</p>
                ) : (
                  Object.entries(severityCounts).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", 
                          severity === "normal" ? "bg-success" :
                          severity === "watch" ? "bg-warning" :
                          severity === "attention" ? "bg-warning" :
                          "bg-destructive"
                        )} />
                        <span className="text-sm capitalize text-foreground">{severity}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Readings by type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Readings by Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(readingsByType).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No readings yet</p>
                ) : (
                  Object.entries(readingsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-foreground capitalize">{type.replace("_", " ")}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Daily activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Analyses — Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-24">
                  {alertsByDay.map((d) => {
                    const maxCount = Math.max(...alertsByDay.map((x) => x.count), 1);
                    const height = d.count > 0 ? Math.max((d.count / maxCount) * 100, 8) : 4;
                    return (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{d.count || ""}</span>
                        <div
                          className={cn("w-full rounded-t-sm", d.count > 0 ? "bg-primary" : "bg-muted")}
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(d.day).toLocaleDateString("en", { weekday: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent alerts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent AI Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {healthAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className={cn("rounded-lg border p-3", severityColors[alert.severity] || "bg-muted/10 border-border")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{alert.message}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0 capitalize">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] opacity-60 mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {healthAlerts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No alerts yet — log a health reading to trigger Circle's analysis</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
