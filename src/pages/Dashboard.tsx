import { useNavigate } from "react-router-dom";
import { ChevronRight, TrendingUp, TrendingDown, Activity, CalendarDays, Pill, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useHealthAlerts } from "@/hooks/useHealthAlerts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const severityConfig: Record<string, { bg: string; icon: string }> = {
  normal: { bg: "bg-success/10 border-success/25", icon: "💚" },
  watch: { bg: "bg-warning/10 border-warning/25", icon: "👀" },
  attention: { bg: "bg-warning/15 border-warning/40", icon: "⚠️" },
  urgent: { bg: "bg-destructive/10 border-destructive/25", icon: "🚨" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: circle } = useCareCircle();
  const { data: healthAlerts = [] } = useHealthAlerts(circle?.careCircleId, 1);
  const latestAlert = healthAlerts[0];

  const { data: careRecipient } = useQuery({
    queryKey: ["care_recipient_dash", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("care_recipients")
        .select("name, medical_conditions")
        .eq("care_circle_id", circle!.careCircleId)
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: bpReadings = [] } = useQuery({
    queryKey: ["bp_readings_dash", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("health_readings")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .eq("type", "blood_pressure")
        .order("created_at", { ascending: false })
        .limit(7);
      return data || [];
    },
  });

  const { data: nextAppointment } = useQuery({
    queryKey: ["next_appointment", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .eq("status", "scheduled")
        .gte("date_time", new Date().toISOString())
        .order("date_time", { ascending: true })
        .limit(1)
        .single();
      return data;
    },
  });

  const latestBP = bpReadings[0];
  const bpChartData = [...bpReadings].reverse().map((r) => ({
    day: format(new Date(r.created_at), "EEE"),
    systolic: r.value_primary,
    diastolic: r.value_secondary,
  }));

  const bpTrend = bpReadings.length >= 2 && bpReadings[0].value_primary <= bpReadings[1].value_primary ? "down" : "up";

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {careRecipient ? `How's ${careRecipient.name.split(" ")[0]}?` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">Your care circle overview</p>
        </div>

        {/* Status Hero */}
        {careRecipient && (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {careRecipient.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{careRecipient.name}</h2>
              {careRecipient.medical_conditions && careRecipient.medical_conditions.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {careRecipient.medical_conditions.slice(0, 3).join(" · ")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Health Alert */}
        {latestAlert && (
          <button
            onClick={() => navigate("/bp")}
            className={cn(
              "w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:opacity-90",
              severityConfig[latestAlert.severity]?.bg || "bg-muted/10 border-border"
            )}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">
              {severityConfig[latestAlert.severity]?.icon || "📊"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{latestAlert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{latestAlert.message}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          </button>
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* BP Trend */}
          <div className="md:col-span-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">Blood Pressure — 7 Day</h3>
              <Button variant="ghost" size="sm" className="text-primary h-7 px-2 text-xs" onClick={() => navigate("/bp")}>
                Details <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
            {latestBP ? (
              <>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-3xl font-bold text-foreground leading-none">
                    {latestBP.value_primary}/{latestBP.value_secondary}
                  </span>
                  <div className="flex items-center gap-1 mb-0.5">
                    {bpTrend === "down" ? (
                      <TrendingDown className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-warning" />
                    )}
                    <span className={`text-xs font-medium ${bpTrend === "down" ? "text-success" : "text-warning"}`}>
                      {bpTrend === "down" ? "Trending down" : "Trending up"}
                    </span>
                  </div>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bpChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(30 6% 50%)" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[60, 160]} tick={{ fontSize: 11, fill: "hsl(30 6% 50%)" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(30 15% 88%)", borderRadius: "8px", fontSize: "12px" }} />
                      <ReferenceLine y={140} stroke="hsl(8 70% 55%)" strokeDasharray="4 4" strokeWidth={1} />
                      <Line type="monotone" dataKey="systolic" stroke="hsl(143 13% 55%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(143 13% 55%)" }} />
                      <Line type="monotone" dataKey="diastolic" stroke="hsl(143 13% 55% / 0.4)" strokeWidth={1.5} dot={{ r: 2, fill: "hsl(143 13% 55% / 0.5)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No BP readings yet</p>
                <Button variant="link" size="sm" onClick={() => navigate("/bp")} className="text-primary mt-1">
                  Log a reading →
                </Button>
              </div>
            )}
          </div>

          {/* Next Appointment */}
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-4 shadow-card flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-3">Next Appointment</h3>
            {nextAppointment ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">{nextAppointment.provider_name}</p>
                  {nextAppointment.provider_specialty && (
                    <p className="text-xs text-muted-foreground">{nextAppointment.provider_specialty}</p>
                  )}
                  <div className="mt-3 space-y-1.5">
                    <p className="text-sm text-foreground">📅 {format(new Date(nextAppointment.date_time), "EEEE, MMM d")}</p>
                    <p className="text-sm text-foreground">🕐 {format(new Date(nextAppointment.date_time), "h:mm a")}</p>
                    {nextAppointment.location && (
                      <p className="text-sm text-muted-foreground truncate">📍 {nextAppointment.location}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  {nextAppointment.assigned_caregiver_name ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary">
                          {nextAppointment.assigned_caregiver_name[0]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {nextAppointment.assigned_caregiver_name} is going
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-warning">⚠️ Needs coverage</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <CalendarDays className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                <Button variant="link" size="sm" onClick={() => navigate("/appointments")} className="text-primary mt-1">
                  Schedule one →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Log BP", icon: Heart, path: "/bp", color: "text-success" },
            { label: "Medications", icon: Pill, path: "/medications", color: "text-primary" },
            { label: "Appointments", icon: CalendarDays, path: "/appointments", color: "text-primary" },
            { label: "Emergency", icon: Activity, path: "/emergency", color: "text-destructive" },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="rounded-xl border border-border bg-card p-4 shadow-card text-center hover:bg-muted/50 transition-colors"
            >
              <action.icon className={cn("h-6 w-6 mx-auto mb-2", action.color)} />
              <p className="text-sm font-medium text-foreground">{action.label}</p>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
