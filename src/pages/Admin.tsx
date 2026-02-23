import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Activity, Shield, Search, Brain, Zap, AlertTriangle as AlertTriangleIcon, TrendingUp, DollarSign, Key, Eye, EyeOff, Loader2, MessageSquare, CheckCircle, XCircle, Clock, Plus, Trash2, Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RoadmapKanban } from "@/components/admin/RoadmapKanban";

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
  reading_id: string | null;
  severity: string;
  title: string;
  message: string;
  created_at: string;
  model_used: string | null;
  complexity: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  response_time_ms: number | null;
  estimated_cost: number | null;
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

const tierColors: Record<string, string> = {
  lite: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  standard: "bg-blue-500/10 text-blue-600 border-blue-500/25",
  pro: "bg-purple-500/10 text-purple-600 border-purple-500/25",
  skipped: "bg-muted text-muted-foreground border-border",
};

const modelShortName = (model: string | null): string => {
  if (!model) return "unknown";
  if (model === "skipped") return "Skipped";
  if (model.includes("flash-lite")) return "Flash Lite";
  if (model.includes("gemini-3-flash")) return "Flash 3";
  if (model.includes("gemini-2.5-flash")) return "Flash 2.5";
  if (model.includes("2.5-pro")) return "Pro 2.5";
  return model.split("/").pop() || model;
};

interface FeedbackItem {
  id: string;
  user_name: string;
  original_message: string;
  ai_analysis: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  care_circle_id: string | null;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [healthReadings, setHealthReadings] = useState<HealthReading[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [newAccessCode, setNewAccessCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      const [profilesRes, circlesRes, membersRes, recipientsRes, alertsRes, readingsRes, settingsRes, feedbackRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("care_circles").select("*"),
        supabase.from("care_circle_members").select("*"),
        supabase.from("care_recipients").select("id, name, care_circle_id, created_at"),
        supabase.from("health_alerts").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("health_readings").select("id, care_circle_id, type, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("app_settings" as any).select("value").eq("key", "access_code").single(),
        supabase.from("feedback" as any).select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      setProfiles(profilesRes.data || []);
      setCircles(circlesRes.data || []);
      setMembers(membersRes.data || []);
      setRecipients(recipientsRes.data || []);
      setHealthAlerts(alertsRes.data || []);
      setHealthReadings(readingsRes.data || []);
      setFeedbackItems((feedbackRes.data as any) || []);
      if (settingsRes.data) setAccessCode((settingsRes.data as any).value || "");
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleUpdateAccessCode = async () => {
    if (!newAccessCode.trim()) return;
    setSavingCode(true);
    const { error } = await supabase
      .from("app_settings" as any)
      .update({ value: newAccessCode.trim() } as any)
      .eq("key", "access_code");
    if (error) {
      toast({ title: "Error", description: "Failed to update access code", variant: "destructive" });
    } else {
      setAccessCode(newAccessCode.trim());
      setNewAccessCode("");
      toast({ title: "Updated", description: "Access code has been changed" });
    }
    setSavingCode(false);
  };

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

  // ── AI usage stats (real data) ──────────────────────────────────
  const totalAnalyses = healthAlerts.length;
  const totalReadings = healthReadings.length;

  // Real cost from DB
  const realTotalCost = healthAlerts.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
  const hasRealCostData = healthAlerts.some((a) => a.estimated_cost != null && a.estimated_cost > 0);

  // Model breakdown
  const modelBreakdown = healthAlerts.reduce((acc, a) => {
    const tier = a.complexity || "standard";
    if (!acc[tier]) acc[tier] = { count: 0, cost: 0, totalTokens: 0, avgResponseMs: 0, responseMsSum: 0 };
    acc[tier].count += 1;
    acc[tier].cost += a.estimated_cost || 0;
    acc[tier].totalTokens += (a.input_tokens || 0) + (a.output_tokens || 0);
    acc[tier].responseMsSum += a.response_time_ms || 0;
    return acc;
  }, {} as Record<string, { count: number; cost: number; totalTokens: number; avgResponseMs: number; responseMsSum: number }>);

  // Calculate averages
  for (const tier of Object.keys(modelBreakdown)) {
    const b = modelBreakdown[tier];
    b.avgResponseMs = b.count > 0 ? Math.round(b.responseMsSum / b.count) : 0;
  }

  // Cost projection
  const alertDates = healthAlerts.map((a) => a.created_at.split("T")[0]);
  const uniqueDays = new Set(alertDates).size;
  const dailyAvgCost = uniqueDays > 0 ? realTotalCost / uniqueDays : 0;
  const monthlyProjection = dailyAvgCost * 30;

  // Per-circle cost
  const costByCircle = healthAlerts.reduce((acc, a) => {
    const cid = a.care_circle_id;
    acc[cid] = (acc[cid] || 0) + (a.estimated_cost || 0);
    return acc;
  }, {} as Record<string, number>);

  const severityCounts = healthAlerts.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const readingsByType = healthReadings.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // AI usage by feature
  const readingTypeMap = new Map<string, string>(healthReadings.map((r) => [r.id, r.type] as [string, string]));
  const aiUsageByFeature = healthAlerts.reduce((acc, alert) => {
    const readingType = alert.reading_id ? readingTypeMap.get(alert.reading_id) || "unknown" : "unknown";
    const featureLabel =
      readingType === "bp" ? "Blood Pressure" :
      readingType === "weight" ? "Weight" :
      readingType === "heart_rate" ? "Heart Rate" :
      readingType === "steps" ? "Activity" :
      readingType === "sleep" ? "Sleep" :
      readingType === "glucose" ? "Glucose" :
      readingType === "unknown" ? "Other" :
      readingType;
    acc[featureLabel] = (acc[featureLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedFeatures = Object.entries(aiUsageByFeature).sort((a, b) => b[1] - a[1]);

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
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${realTotalCost.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground">{hasRealCostData ? "Actual Cost" : "Est. Cost"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ai-usage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
            <TabsTrigger value="models">Model Routing</TabsTrigger>
            <TabsTrigger value="feedback" className="relative">
              Feedback
              {feedbackItems.filter(f => f.status === "new").length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {feedbackItems.filter(f => f.status === "new").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="circles">Care Circles</TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-1"><MapIcon className="h-3 w-3" />Roadmap</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* AI Usage Tab */}
          <TabsContent value="ai-usage" className="space-y-4">
            {/* Cost overview */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                    <p className="font-semibold text-foreground text-lg">${realTotalCost.toFixed(4)}</p>
                    <p className="text-[10px] text-muted-foreground">{hasRealCostData ? "from real token data" : "estimated"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Projection</p>
                    <p className="font-semibold text-foreground text-lg">${monthlyProjection.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">based on {uniqueDays} day{uniqueDays !== 1 ? "s" : ""} of data</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Cost / Circle</p>
                    <p className="font-semibold text-foreground text-lg">
                      ${circles.length > 0 ? (realTotalCost / circles.length).toFixed(4) : "0.00"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{circles.length} circle{circles.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Usage by Feature */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Usage by Feature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedFeatures.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No AI usage yet</p>
                ) : (
                  sortedFeatures.map(([feature, count]) => {
                    const pct = totalAnalyses > 0 ? (count / totalAnalyses) * 100 : 0;
                    return (
                      <div key={feature} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground font-medium">{feature}</span>
                          <Badge variant="outline" className="text-xs">{count} calls</Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
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
          </TabsContent>

          {/* Model Routing Tab */}
          <TabsContent value="models" className="space-y-4">
            {/* Model Breakdown Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Model Tier Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.keys(modelBreakdown).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No routing data yet — log a health reading to see model routing in action</p>
                ) : (
                  <>
                    {/* Visual bar */}
                    <div className="flex h-4 rounded-full overflow-hidden">
                      {["lite", "standard", "pro", "skipped"].map((tier) => {
                        const b = modelBreakdown[tier];
                        if (!b) return null;
                        const pct = totalAnalyses > 0 ? (b.count / totalAnalyses) * 100 : 0;
                        return (
                          <div
                            key={tier}
                            className={cn(
                              "transition-all",
                              tier === "lite" ? "bg-emerald-500" :
                              tier === "standard" ? "bg-blue-500" :
                              tier === "pro" ? "bg-purple-500" :
                              "bg-muted-foreground/30"
                            )}
                            style={{ width: `${pct}%` }}
                            title={`${tier}: ${b.count} calls (${pct.toFixed(0)}%)`}
                          />
                        );
                      })}
                    </div>

                    {/* Tier details */}
                    {["lite", "standard", "pro", "skipped"].map((tier) => {
                      const b = modelBreakdown[tier];
                      if (!b) return null;
                      const pct = totalAnalyses > 0 ? (b.count / totalAnalyses) * 100 : 0;
                      return (
                        <div key={tier} className={cn("rounded-lg border p-3", tierColors[tier])}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold capitalize">{tier}</span>
                              <span className="text-xs opacity-70">{pct.toFixed(0)}%</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{b.count} calls</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            <div>
                              <span className="opacity-70">Cost: </span>
                              <span className="font-medium">${b.cost.toFixed(4)}</span>
                            </div>
                            <div>
                              <span className="opacity-70">Tokens: </span>
                              <span className="font-medium">{b.totalTokens.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="opacity-70">Avg time: </span>
                              <span className="font-medium">{b.avgResponseMs > 0 ? `${(b.avgResponseMs / 1000).toFixed(1)}s` : "—"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Per-Circle Cost */}
            {Object.keys(costByCircle).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cost by Care Circle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(costByCircle)
                    .sort((a, b) => b[1] - a[1])
                    .map(([circleId, cost]) => {
                      const circle = circles.find((c) => c.id === circleId);
                      return (
                        <div key={circleId} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{circle?.name || circleId.slice(0, 8)}</span>
                          <span className="font-semibold text-foreground">${cost.toFixed(4)}</span>
                        </div>
                      );
                    })}
                </CardContent>
              </Card>
            )}

            {/* Recent Routing Decisions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Routing Decisions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {healthAlerts.slice(0, 15).map((alert) => (
                  <div key={alert.id} className={cn("rounded-lg border p-3", severityColors[alert.severity] || "bg-muted/10 border-border")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{alert.message}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {alert.complexity && (
                          <Badge variant="outline" className={cn("text-[10px]", tierColors[alert.complexity])}>
                            {alert.complexity}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] opacity-60">
                      <span>{modelShortName(alert.model_used)}</span>
                      {alert.input_tokens != null && (
                        <span>{(alert.input_tokens + (alert.output_tokens || 0)).toLocaleString()} tokens</span>
                      )}
                      {alert.response_time_ms != null && alert.response_time_ms > 0 && (
                        <span>{(alert.response_time_ms / 1000).toFixed(1)}s</span>
                      )}
                      {alert.estimated_cost != null && (
                        <span>${alert.estimated_cost.toFixed(5)}</span>
                      )}
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
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

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            {feedbackItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No feedback yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Family members can submit feedback by typing <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/feedback</code> in the chat
                  </p>
                </CardContent>
              </Card>
            ) : (
              feedbackItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{item.user_name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.user_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          item.status === "new" ? "bg-primary/10 text-primary border-primary/25" :
                          item.status === "reviewed" ? "bg-warning/10 text-warning border-warning/25" :
                          item.status === "planned" ? "bg-success/10 text-success border-success/25" :
                          "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {item.status === "new" && <Clock className="h-3 w-3 mr-1" />}
                        {item.status === "planned" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {item.status === "declined" && <XCircle className="h-3 w-3 mr-1" />}
                        {item.status}
                      </Badge>
                    </div>

                    {/* Original feedback */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Feedback</p>
                      <p className="text-sm text-foreground">{item.original_message}</p>
                    </div>

                    {/* AI Analysis */}
                    {item.ai_analysis && (
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                        <p className="text-xs font-medium text-primary mb-1">Circle's Stress Test</p>
                        <div className="text-sm text-foreground prose prose-sm max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                          <ReactMarkdown>{item.ai_analysis}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {!item.ai_analysis && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 gap-1"
                          onClick={async () => {
                            const btn = document.activeElement as HTMLButtonElement;
                            if (btn) btn.disabled = true;
                            try {
                              const { data, error } = await supabase.functions.invoke("circle-chat", {
                                body: { stressTest: true, feedbackText: item.original_message, userName: item.user_name },
                              });
                              if (!error && data?.analysis) {
                                await supabase.from("feedback" as any).update({ ai_analysis: data.analysis } as any).eq("id", item.id);
                                setFeedbackItems(prev => prev.map(f => f.id === item.id ? { ...f, ai_analysis: data.analysis } : f));
                              }
                            } finally {
                              if (btn) btn.disabled = false;
                            }
                          }}
                        >
                          <Brain className="h-3 w-3" /> Stress Test
                        </Button>
                      )}
                      {["new", "reviewed", "planned", "declined"].map((s) => (
                        <Button
                          key={s}
                          variant={item.status === s ? "default" : "outline"}
                          size="sm"
                          className="text-xs capitalize h-7"
                          onClick={async () => {
                            const { error } = await supabase
                              .from("feedback" as any)
                              .update({ status: s } as any)
                              .eq("id", item.id);
                            if (!error) {
                              setFeedbackItems(prev => prev.map(f => f.id === item.id ? { ...f, status: s } : f));
                            }
                          }}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Sign-Up Access Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Anyone signing up must enter this code. Share it with family members you want to invite.
                </p>

                {/* Current code */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Current code</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {showCode ? accessCode : "••••••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCode(!showCode)}
                      className="h-9 w-9"
                    >
                      {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Update code */}
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Change access code</p>
                  <div className="flex gap-2">
                    <Input
                      value={newAccessCode}
                      onChange={(e) => setNewAccessCode(e.target.value)}
                      placeholder="Enter new access code"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdateAccessCode}
                      disabled={savingCode || !newAccessCode.trim()}
                      size="sm"
                    >
                      {savingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roadmap Kanban Tab */}
          <TabsContent value="roadmap" className="space-y-4">
            <RoadmapKanban />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
