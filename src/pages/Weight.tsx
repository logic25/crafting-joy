import { useState } from "react";
import { Plus, TrendingDown, TrendingUp, Loader2, Hand, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useHealthReadings, useLogHealthReading, useAnalyzeReading } from "@/hooks/useHealthReadings";
import { useHealthAlerts } from "@/hooks/useHealthAlerts";

const severityColors: Record<string, string> = {
  normal: "bg-success/10 border-success/25 text-success",
  watch: "bg-warning/10 border-warning/25 text-warning",
  attention: "bg-warning/15 border-warning/40 text-warning",
  urgent: "bg-destructive/10 border-destructive/25 text-destructive",
};

const Weight = () => {
  const { toast } = useToast();
  const { data: circle } = useCareCircle();
  const { data: readings = [], isLoading } = useHealthReadings(circle?.careCircleId, "weight");
  const { data: alerts = [] } = useHealthAlerts(circle?.careCircleId, 3);
  const logReading = useLogHealthReading();
  const analyzeReading = useAnalyzeReading();

  const [newWeight, setNewWeight] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const weightAlerts = alerts.filter(a => {
    const relatedReading = readings.find(r => r.id === a.reading_id);
    return relatedReading;
  });

  const chartData = [...readings].reverse().slice(-14).map((r) => ({
    day: format(new Date(r.created_at), "MMM d"),
    weight: Number(r.value_primary),
  }));

  const latest = readings[0];
  const prev = readings.length >= 2 ? readings[1] : null;
  const weightDiff = prev ? Number(latest.value_primary) - Number(prev.value_primary) : 0;
  const weightPct = prev ? (weightDiff / Number(prev.value_primary)) * 100 : 0;
  const trend = weightDiff <= 0 ? "down" : "up";

  const handleLog = async () => {
    const weight = parseFloat(newWeight);
    if (!weight || weight < 50 || weight > 500) {
      toast({ title: "Invalid weight", description: "Please enter a valid weight in lbs.", variant: "destructive" });
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
        type: "weight",
        value_primary: weight,
        unit: "lbs",
      });

      setDialogOpen(false);
      setNewWeight("");
      toast({ title: "Weight logged", description: `${weight} lbs recorded. Analyzing...` });

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
      toast({ title: "Error", description: "Failed to log weight.", variant: "destructive" });
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
            <h1 className="text-2xl font-bold text-foreground">Weight</h1>
            <p className="text-sm text-muted-foreground">{circle?.careRecipientName || "Mom"}'s weight tracker</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary gap-2 h-9">
                <Plus className="h-4 w-4" /> Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Weight</DialogTitle>
              </DialogHeader>
              <div>
                <Label>Weight (lbs)</Label>
                <Input type="number" placeholder="e.g. 145" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
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

        {weightAlerts.length > 0 && !analyzing && (
          <div className={cn("rounded-xl border p-4", severityColors[weightAlerts[0].severity])}>
            <p className="text-sm font-semibold mb-1">{weightAlerts[0].title}</p>
            <p className="text-sm opacity-90">{weightAlerts[0].message}</p>
            {weightAlerts[0].action_needed && (
              <p className="text-xs mt-2 font-medium opacity-80">💡 {weightAlerts[0].action_needed}</p>
            )}
            {weightAlerts[0].correlations && (weightAlerts[0].correlations as string[]).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(weightAlerts[0].correlations as string[]).map((c, i) => (
                  <span key={i} className="text-[10px] bg-foreground/5 rounded-full px-2 py-0.5">{c}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Latest */}
        {latest && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground mb-1">Latest Weight</p>
              <p className="text-3xl font-bold text-foreground">{Number(latest.value_primary)} <span className="text-lg font-normal text-muted-foreground">lbs</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                {latest.logged_by_name} · {formatDistanceToNow(new Date(latest.created_at), { addSuffix: true })}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground mb-1">Change</p>
              {prev ? (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    {trend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-warning" />
                    )}
                    <span className={cn("text-xl font-bold", trend === "down" ? "text-success" : "text-warning")}>
                      {weightDiff > 0 ? "+" : ""}{weightDiff.toFixed(1)} lbs
                    </span>
                  </div>
                  <p className={cn("text-sm font-medium mt-0.5", trend === "down" ? "text-success" : "text-warning")}>
                    ({weightPct > 0 ? "+" : ""}{weightPct.toFixed(1)}%)
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">Need 2+ readings</p>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Weight Trend</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 88%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(30 6% 50%)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "hsl(30 6% 50%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(30 15% 88%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="weight" stroke="hsl(143 13% 55%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(143 13% 55%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Empty state */}
        {readings.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
            <p className="text-muted-foreground">No readings yet. Tap "Log Weight" to add the first one.</p>
          </div>
        )}

        {/* History */}
        {readings.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">History</h3>
            </div>
            <div className="divide-y divide-border">
              {readings.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">{Number(r.value_primary)} lbs</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {r.source === "manual" ? <Hand className="h-3 w-3 text-muted-foreground" /> : <Smartphone className="h-3 w-3 text-muted-foreground" />}
                      <p className="text-xs text-muted-foreground">{r.source === "manual" ? "Manual" : r.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{r.logged_by_name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Weight;
