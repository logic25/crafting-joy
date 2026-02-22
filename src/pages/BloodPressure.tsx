import { useState } from "react";
import { Plus, TrendingDown, TrendingUp, Loader2, Smartphone, Watch, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useHealthReadings, useLogHealthReading, useAnalyzeReading, HealthReading } from "@/hooks/useHealthReadings";
import { useHealthAlerts, HealthAlert } from "@/hooks/useHealthAlerts";

const severityColors: Record<string, string> = {
  normal: "bg-success/10 border-success/25 text-success",
  watch: "bg-warning/10 border-warning/25 text-warning",
  attention: "bg-warning/15 border-warning/40 text-warning",
  urgent: "bg-destructive/10 border-destructive/25 text-destructive",
};

const sourceIcon = (source: string) => {
  switch (source) {
    case "apple_health": return <Smartphone className="h-3 w-3" />;
    case "device": return <Watch className="h-3 w-3" />;
    default: return <Hand className="h-3 w-3" />;
  }
};

const BloodPressure = () => {
  const { toast } = useToast();
  const { data: circle } = useCareCircle();
  const { data: readings = [], isLoading } = useHealthReadings(circle?.careCircleId, "bp");
  const { data: alerts = [] } = useHealthAlerts(circle?.careCircleId, 3);
  const logReading = useLogHealthReading();
  const analyzeReading = useAnalyzeReading();

  const [newSystolic, setNewSystolic] = useState("");
  const [newDiastolic, setNewDiastolic] = useState("");
  const [newPulse, setNewPulse] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const bpAlerts = alerts.filter(a => {
    // Show alerts related to BP readings
    const relatedReading = readings.find(r => r.id === a.reading_id);
    return relatedReading || !a.reading_id;
  });

  const chartData = [...readings].reverse().slice(-7).map((r) => ({
    day: format(new Date(r.created_at), "EEE"),
    systolic: Number(r.value_primary),
    diastolic: Number(r.value_secondary),
  }));

  const latestBP = readings[0];
  const avg7Sys = readings.length > 0
    ? Math.round(readings.slice(0, 7).reduce((s, r) => s + Number(r.value_primary), 0) / Math.min(readings.length, 7))
    : 0;
  const avg7Dia = readings.length > 0
    ? Math.round(readings.slice(0, 7).reduce((s, r) => s + Number(r.value_secondary || 0), 0) / Math.min(readings.length, 7))
    : 0;
  const trend = readings.length >= 2
    ? Number(readings[0].value_primary) <= Number(readings[1].value_primary) ? "down" : "up"
    : "down";

  const handleLog = async () => {
    const sys = parseInt(newSystolic);
    const dia = parseInt(newDiastolic);
    const pulse = newPulse ? parseInt(newPulse) : undefined;
    if (!sys || !dia || sys < 60 || sys > 250 || dia < 30 || dia > 150) {
      toast({ title: "Invalid values", description: "Please enter valid BP numbers.", variant: "destructive" });
      return;
    }
    if (!circle) {
      toast({ title: "No care circle", description: "Please set up your care circle first.", variant: "destructive" });
      return;
    }

    try {
      const newReading = await logReading.mutateAsync({
        care_circle_id: circle.careCircleId,
        care_recipient_id: circle.careRecipientId,
        type: "bp",
        value_primary: sys,
        value_secondary: dia,
        value_tertiary: pulse ?? null,
        unit: "mmHg",
        metadata: { position: "sitting" },
      });

      setDialogOpen(false);
      setNewSystolic("");
      setNewDiastolic("");
      setNewPulse("");
      toast({ title: "BP logged", description: `${sys}/${dia} recorded. Analyzing...` });

      // Trigger AI analysis
      setAnalyzing(true);
      try {
        const result = await analyzeReading.mutateAsync({
          reading_id: newReading.id,
          care_circle_id: circle.careCircleId,
          care_recipient_id: circle.careRecipientId,
        });
        if (result?.alert) {
          toast({
            title: `Circle: ${result.alert.title || result.alert.severity}`,
            description: result.alert.message || result.alert.summary,
          });
        }
      } catch (err) {
        console.error("Analysis error:", err);
      } finally {
        setAnalyzing(false);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to log reading.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blood Pressure</h1>
            <p className="text-sm text-muted-foreground">{circle?.careRecipientName || "Mom"}'s BP tracker</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 h-9">
                <Plus className="h-4 w-4" /> Log BP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Blood Pressure</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Systolic (top)</Label>
                  <Input type="number" placeholder="e.g. 130" value={newSystolic} onChange={(e) => setNewSystolic(e.target.value)} />
                </div>
                <div>
                  <Label>Diastolic (bottom)</Label>
                  <Input type="number" placeholder="e.g. 85" value={newDiastolic} onChange={(e) => setNewDiastolic(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Pulse (optional)</Label>
                  <Input type="number" placeholder="e.g. 72" value={newPulse} onChange={(e) => setNewPulse(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button className="gradient-primary" onClick={handleLog} disabled={logReading.isPending}>
                  {logReading.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Circle Alert */}
        {analyzing && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-foreground">Circle is analyzing this reading...</p>
          </div>
        )}

        {bpAlerts.length > 0 && !analyzing && (
          <div className={cn("rounded-xl border p-4", severityColors[bpAlerts[0].severity])}>
            <p className="text-sm font-semibold mb-1">{bpAlerts[0].title}</p>
            <p className="text-sm opacity-90">{bpAlerts[0].message}</p>
            {bpAlerts[0].action_needed && (
              <p className="text-xs mt-2 font-medium opacity-80">💡 {bpAlerts[0].action_needed}</p>
            )}
            {bpAlerts[0].correlations && (bpAlerts[0].correlations as string[]).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(bpAlerts[0].correlations as string[]).map((c, i) => (
                  <span key={i} className="text-[10px] bg-foreground/5 rounded-full px-2 py-0.5">{c}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Latest + Trend */}
        {latestBP && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground mb-1">Latest Reading</p>
              <p className="text-3xl font-bold text-foreground">{Number(latestBP.value_primary)}/{Number(latestBP.value_secondary)}</p>
              <div className="flex items-center gap-1.5 mt-1">
                {sourceIcon(latestBP.source)}
                <p className="text-xs text-muted-foreground">
                  {latestBP.logged_by_name} · {formatDistanceToNow(new Date(latestBP.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground mb-1">7-Day Average</p>
              <p className="text-3xl font-bold text-foreground">{avg7Sys}/{avg7Dia}</p>
              <div className="flex items-center gap-1 mt-1">
                {trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-success" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-warning" />
                )}
                <span className={cn("text-xs font-medium", trend === "down" ? "text-success" : "text-warning")}>
                  {trend === "down" ? "Trending down" : "Trending up"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">7-Day Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(30 6% 50%)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 160]} tick={{ fontSize: 11, fill: "hsl(30 6% 50%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(30 15% 88%)", borderRadius: "8px", fontSize: "12px" }} />
                  <ReferenceLine y={140} stroke="hsl(8 70% 55%)" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Target", position: "right", fontSize: 10, fill: "hsl(8 70% 55%)" }} />
                  <Line type="monotone" dataKey="systolic" stroke="hsl(143 13% 55%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(143 13% 55%)" }} />
                  <Line type="monotone" dataKey="diastolic" stroke="hsl(143 13% 55% / 0.4)" strokeWidth={1.5} dot={{ r: 2, fill: "hsl(143 13% 55% / 0.5)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Empty state */}
        {readings.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
            <p className="text-muted-foreground">No readings yet. Tap "Log BP" to add the first one.</p>
          </div>
        )}

        {/* History */}
        {readings.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">History</h3>
            </div>
            <div className="divide-y divide-border">
              {readings.map((r) => {
                const high = Number(r.value_primary) >= 140 || Number(r.value_secondary) >= 90;
                return (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className={cn("font-semibold text-foreground", high && "text-warning")}>
                        {Number(r.value_primary)}/{Number(r.value_secondary)}
                      </span>
                      {r.value_tertiary && <span className="text-sm text-muted-foreground ml-2">♡ {Number(r.value_tertiary)}</span>}
                      <div className="flex items-center gap-1 mt-0.5">
                        {sourceIcon(r.source)}
                        <p className="text-xs text-muted-foreground">{r.source === "manual" ? "Manual" : r.source}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">{r.logged_by_name}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BloodPressure;
