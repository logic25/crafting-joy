import { useState } from "react";
import { Pill, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddMedicationSheet } from "@/components/medications/AddMedicationSheet";

const Medications = () => {
  // Medications are not yet wired to the database — show empty state
  const activeMedications: any[] = [];
  const discontinuedMedications: any[] = [];
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medications</h1>
            <p className="text-sm text-muted-foreground">
              {activeMedications.length > 0 
                ? `${activeMedications.length} active medications for Mom`
                : "Track Mom's medications"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Printer className="h-4 w-4" />
            </Button>
            <AddMedicationSheet />
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg text-foreground">No medications tracked yet</h3>
          <p className="text-muted-foreground mt-1">
            Tap the + button to add Mom's medications — you can scan the label with your camera
          </p>
        </div>

        {discontinuedMedications.length > 0 && (
          <Collapsible open={showDiscontinued} onOpenChange={setShowDiscontinued}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                <span>Discontinued ({discontinuedMedications.length})</span>
                {showDiscontinued ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2.5 space-y-2.5">
              {discontinuedMedications.map((med: any) => (
                <div key={med.id} className="rounded-xl border border-border bg-card p-4 shadow-card opacity-60">
                  <h3 className="font-semibold text-foreground">{med.name} {med.dosage}</h3>
                  <p className="text-sm text-muted-foreground">{med.frequency} · {med.purpose}</p>
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
