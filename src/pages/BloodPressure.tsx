import { useState } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { bpReadings } from "@/data/mockData";
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

const BloodPressure = () => {
  const [readings, setReadings] = useState(bpReadings);
  const { toast } = useToast();

  const [newSystolic, setNewSystolic] = useState("");
  const [newDiastolic, setNewDiastolic] = useState("");
  const [newPulse, setNewPulse] = useState("");

  const latestBP = readings[0];
  const chartData = [...readings].reverse().map((r) => ({
    day: format(r.timestamp, "EEE"),
    systolic: r.systolic,
    diastolic: r.diastolic,
  }));

  const avg7Sys = Math.round(readings.reduce((s, r) => s + r.systolic, 0) / readings.length);
  const avg7Dia = Math.round(readings.reduce((s, r) => s + r.diastolic, 0) / readings.length);
  const trend = readings[0].systolic <= readings[1]?.systolic ? "down" : "up";

  const handleLog = () => {
    const sys = parseInt(newSystolic);
    const dia = parseInt(newDiastolic);
    const pulse = newPulse ? parseInt(newPulse) : undefined;
    if (!sys || !dia || sys < 60 || sys > 250 || dia < 30 || dia > 150) {
      toast({ title: "Invalid values", description: "Please enter valid BP numbers.", variant: "destructive" });
      return;
    }
    const newReading = {
      id: Date.now().toString(),
      careRecipientId: "1",
      systolic: sys,
      diastolic: dia,
      pulse,
      position: "sitting" as const,
      loggedBy: "Manny",
      timestamp: new Date(),
    };
    setReadings([newReading, ...readings]);
    setNewSystolic("");
    setNewDiastolic("");
    setNewPulse("");
    toast({ title: "BP logged", description: `${sys}/${dia} recorded.` });
  };

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Blood Pressure</h1>
            <p className="text-sm text-muted-foreground">Mom's BP tracker</p>
          </div>
          <Dialog>
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
                <DialogClose asChild>
                  <Button className="gradient-primary" onClick={handleLog}>Save</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Latest + Trend */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground mb-1">Latest Reading</p>
            <p className="text-3xl font-bold text-foreground">{latestBP.systolic}/{latestBP.diastolic}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {latestBP.loggedBy} · {formatDistanceToNow(latestBP.timestamp, { addSuffix: true })}
            </p>
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

        {/* Chart */}
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

        {/* History */}
        <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">History</h3>
          </div>
          <div className="divide-y divide-border">
            {readings.map((r) => {
              const high = r.systolic >= 140 || r.diastolic >= 90;
              return (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className={cn("font-semibold text-foreground", high && "text-warning")}>
                      {r.systolic}/{r.diastolic}
                    </span>
                    {r.pulse && <span className="text-sm text-muted-foreground ml-2">♡ {r.pulse}</span>}
                    <p className="text-xs text-muted-foreground">{r.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{r.loggedBy}</p>
                    <p className="text-xs text-muted-foreground">{format(r.timestamp, "MMM d, h:mm a")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BloodPressure;
