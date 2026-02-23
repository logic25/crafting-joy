import { useState } from "react";
import { Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface VisitSummarySheetProps {
  appointmentId: string;
  providerName: string;
  existingSummary?: any;
}

export function VisitSummarySheet({ appointmentId, providerName, existingSummary }: VisitSummarySheetProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assessment, setAssessment] = useState(existingSummary?.assessment || "");
  const [nextSteps, setNextSteps] = useState(existingSummary?.next_steps || "");
  const [medicationChanges, setMedicationChanges] = useState(existingSummary?.medication_changes || "");
  const [concerning, setConcerning] = useState(existingSummary?.concerning || false);

  const handleSave = async () => {
    setSaving(true);
    const summary = { assessment, next_steps: nextSteps, medication_changes: medicationChanges, concerning };
    const { error } = await supabase
      .from("appointments")
      .update({ visit_summary: summary as any, status: "completed" })
      .eq("id", appointmentId);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't save summary.", variant: "destructive" });
    } else {
      toast({ title: "Visit summary saved" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
          <ClipboardCheck className="h-3.5 w-3.5" />
          {existingSummary ? "View Summary" : "Add Summary"}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Visit Summary — {providerName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Doctor's Assessment</Label>
            <Textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="What did the doctor say?" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Next Steps</Label>
            <Textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="Follow-ups, tests ordered, referrals..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Medication Changes</Label>
            <Textarea value={medicationChanges} onChange={(e) => setMedicationChanges(e.target.value)} placeholder="New meds, dosage changes, discontinuations..." rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="concerning" checked={concerning} onCheckedChange={(v) => setConcerning(!!v)} />
            <Label htmlFor="concerning" className="text-sm">Flag as concerning</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Summary
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
