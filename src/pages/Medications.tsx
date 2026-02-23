import { useState } from "react";
import { Pill, ChevronDown, ChevronUp, Printer, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddMedicationSheet } from "@/components/medications/AddMedicationSheet";
import { useMedications, useUpdateMedication, MedicationRow } from "@/hooks/useMedications";
import { useCareCircle } from "@/hooks/useCareCircle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const Medications = () => {
  const { data: careCircleData } = useCareCircle();
  const careCircleId = careCircleData?.careCircleId;
  const { data: medications = [], isLoading } = useMedications(careCircleId);
  const updateMed = useUpdateMedication();
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const activeMedications = medications.filter((m) => m.is_active);
  const discontinuedMedications = medications.filter((m) => !m.is_active);

  const handleDiscontinue = (med: MedicationRow) => {
    updateMed.mutate(
      { id: med.id, careCircleId: med.care_circle_id, is_active: false, end_date: new Date().toISOString().split("T")[0] },
      { onSuccess: () => toast.success(`${med.name} discontinued`) }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medications</h1>
            <p className="text-sm text-muted-foreground">
              {activeMedications.length > 0
                ? `${activeMedications.length} active medications`
                : "Track medications"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Printer className="h-4 w-4" />
            </Button>
            <AddMedicationSheet />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading…</div>
        ) : activeMedications.length === 0 && discontinuedMedications.length === 0 ? (
          <div className="text-center py-16">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg text-foreground">No medications tracked yet</h3>
            <p className="text-muted-foreground mt-1">
              Tap the + button to add medications — you can scan the label with your camera
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeMedications.map((med) => (
              <div key={med.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{med.name} {med.dosage}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[med.frequency, med.purpose].filter(Boolean).join(" · ")}
                    </p>
                    {med.prescriber && (
                      <p className="text-xs text-muted-foreground mt-1">Prescribed by {med.prescriber}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDiscontinue(med)}>Discontinue</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {discontinuedMedications.length > 0 && (
          <Collapsible open={showDiscontinued} onOpenChange={setShowDiscontinued}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                <span>Discontinued ({discontinuedMedications.length})</span>
                {showDiscontinued ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2.5 space-y-2.5">
              {discontinuedMedications.map((med) => (
                <div key={med.id} className="rounded-xl border border-border bg-card p-4 shadow-card opacity-60">
                  <h3 className="font-semibold text-foreground">{med.name} {med.dosage}</h3>
                  <p className="text-sm text-muted-foreground">
                    {[med.frequency, med.purpose].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </AppLayout>
  );
};

export default Medications;
