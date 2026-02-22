import { useNavigate } from "react-router-dom";
import { ChevronRight, TrendingUp, TrendingDown, CheckCircle2, Circle, AlertTriangle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  appointments, medications, activityLog, careRecipient,
  bpReadings, doctorInstructions, actionItems
} from "@/data/mockData";
import { format, formatDistanceToNow } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useHealthAlerts, HealthAlert } from "@/hooks/useHealthAlerts";

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

  const latestBP = bpReadings[0];
  const bpChartData = [...bpReadings].reverse().map((r) => ({
    day: format(r.timestamp, "EEE"),
    systolic: r.systolic,
    diastolic: r.diastolic,
  }));

  const nextAppointment = appointments
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  const activeInstructions = doctorInstructions.filter((i) => i.status !== "done");
  const doneInstructions = doctorInstructions.filter((i) => i.status === "done");

  const refillsDue = medications.filter(
    (m) => m.status === "active" && (m.refillStatus === "due-soon" || m.refillStatus === "overdue")
  );

  const openActions = actionItems.filter((a) => a.status === "open");
  const recentActivity = activityLog.slice(0, 5);

  const bpTrend = bpReadings[0].systolic <= bpReadings[1]?.systolic ? "down" : "up";

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">How's Mom?</h1>
          <p className="text-sm text-muted-foreground">
            Last updated by {activityLog[0]?.caregiverName} · {formatDistanceToNow(activityLog[0]?.timestamp, { addSuffix: true })}
          </p>
        </div>

        {/* Status Hero — left-aligned, not a card */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary">
              {careRecipient.name.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground truncate">{careRecipient.name}</h2>
              <span className="w-2.5 h-2.5 rounded-full bg-success flex-shrink-0" title="Stable" />
            </div>
            <p className="text-sm text-muted-foreground">
              {careRecipient.medicalConditions.slice(0, 3).join(" · ")}
            </p>
          </div>
        </div>

        {/* Health Alert from Circle */}
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
              {latestAlert.correlations && (latestAlert.correlations as string[]).length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(latestAlert.correlations as string[]).slice(0, 2).map((c, i) => (
                    <span key={i} className="text-[10px] bg-foreground/5 rounded-full px-2 py-0.5">{c}</span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          </button>
        )}

        {/* Two-column top grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* BP Trend — takes 3 cols */}
          <div className="md:col-span-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-foreground">Blood Pressure — 7 Day</h3>
              <Button variant="ghost" size="sm" className="text-primary h-7 px-2 text-xs" onClick={() => navigate("/bp")}>
                Details <ChevronRight className="h-3 w-3 ml-0.5" />
              </Button>
            </div>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-3xl font-bold text-foreground leading-none">
                {latestBP.systolic}/{latestBP.diastolic}
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
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(30 15% 88%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <ReferenceLine y={140} stroke="hsl(8 70% 55%)" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 10, fill: "hsl(8 70% 55%)" }} />
                  <Line type="monotone" dataKey="systolic" stroke="hsl(143 13% 55%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(143 13% 55%)" }} />
                  <Line type="monotone" dataKey="diastolic" stroke="hsl(143 13% 55% / 0.4)" strokeWidth={1.5} dot={{ r: 2, fill: "hsl(143 13% 55% / 0.5)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Next Appointment — takes 2 cols */}
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-4 shadow-card flex flex-col">
            <h3 className="text-sm font-semibold text-foreground mb-3">Next Appointment</h3>
            {nextAppointment ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">{nextAppointment.provider.name}</p>
                  <p className="text-xs text-muted-foreground">{nextAppointment.provider.specialty}</p>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-sm text-foreground">
                      📅 {format(nextAppointment.dateTime, "EEEE, MMM d")}
                    </p>
                    <p className="text-sm text-foreground">
                      🕐 {format(nextAppointment.dateTime, "h:mm a")}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      📍 {nextAppointment.location}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  {nextAppointment.assignedCaregiver ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary">
                          {nextAppointment.assignedCaregiver.name[0]}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {nextAppointment.assignedCaregiver.name} is going
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-warning">⚠️ Needs coverage</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No upcoming appointments</p>
            )}
          </div>
        </div>

        {/* Medication Refill Alert */}
        {refillsDue.length > 0 && (
          <button
            onClick={() => navigate("/medications")}
            className="w-full flex items-center gap-3 rounded-xl bg-warning/10 border border-warning/25 px-4 py-3 text-left transition-colors hover:bg-warning/15"
          >
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {refillsDue.length} refill{refillsDue.length > 1 ? "s" : ""} due soon
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {refillsDue.map((m) => m.name).join(", ")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        )}

        {/* Two-column bottom grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Doctor Instructions */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Doctor Instructions</h3>
            <div className="space-y-2.5">
              {activeInstructions.map((inst) => (
                <div key={inst.id} className="flex items-start gap-2.5">
                  <Circle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{inst.text}</p>
                    <p className="text-xs text-muted-foreground">{inst.doctorName}</p>
                  </div>
                </div>
              ))}
              {doneInstructions.map((inst) => (
                <div key={inst.id} className="flex items-start gap-2.5 opacity-50">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground line-through">{inst.text}</p>
                    <p className="text-xs text-muted-foreground">{inst.doctorName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Open Action Items */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Action Items</h3>
            {openActions.length > 0 ? (
              <div className="space-y-2.5">
                {openActions.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded border-2 border-primary/40 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.assignedTo && (
                          <span className="text-xs text-primary font-medium">{item.assignedTo}</span>
                        )}
                        {item.dueDate && (
                          <span className="text-xs text-muted-foreground">
                            Due {format(item.dueDate, "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">All caught up ✨</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
          <div className="space-y-0">
            {recentActivity.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-start gap-3 py-2.5 ${i < recentActivity.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{entry.caregiverName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{entry.caregiverName}</span>{" "}
                    <span className="text-muted-foreground">{entry.description}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
