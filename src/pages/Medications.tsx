import { useState } from "react";
import { Plus, Pill, ChevronDown, ChevronUp, Printer, AlertCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { medications as initialMedications, careRecipient } from "@/data/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AddMedicationSheet } from "@/components/medications/AddMedicationSheet";
const Medications = () => {
  const [medications] = useState(initialMedications);
  const [showDiscontinued, setShowDiscontinued] = useState(false);

  const activeMedications = medications.filter((med) => med.status === "active");
  const discontinuedMedications = medications.filter((med) => med.status === "discontinued");

  // Group by purpose
  const medicationsByPurpose = activeMedications.reduce((acc, med) => {
    const purpose = med.purpose;
    if (!acc[purpose]) acc[purpose] = [];
    acc[purpose].push(med);
    return acc;
  }, {} as Record<string, typeof activeMedications>);

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Medications</h1>
            <p className="text-sm text-muted-foreground">
              {activeMedications.length} active medications for Mom
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Printer className="h-4 w-4" />
            </Button>
            <AddMedicationSheet />
          </div>
        </div>

        {/* Allergy Banner — always visible */}
        <div className="rounded-xl bg-destructive/10 border border-destructive/25 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Allergies</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
              {careRecipient.allergies.map((a, i) => (
                <span key={i} className="text-sm text-foreground font-medium">
                  {a.name} <span className="font-normal text-muted-foreground">({a.reaction || a.severity})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Active Medications grouped by purpose */}
        {Object.entries(medicationsByPurpose).map(([purpose, meds]) => (
          <div key={purpose}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-1">
              {purpose}
            </p>
            <div className="space-y-2.5">
              {meds.map((med) => {
                const isDue = med.refillStatus === "due-soon" || med.refillStatus === "overdue";
                return (
                  <div
                    key={med.id}
                    className={cn(
                      "rounded-xl border bg-card p-4 shadow-card transition-all",
                      isDue && "border-warning"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                          isDue ? "bg-warning/10" : "bg-primary/10"
                        )}>
                          <Pill className={cn("h-4 w-4", isDue ? "text-warning" : "text-primary")} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {med.name} <span className="font-normal text-muted-foreground">{med.dosage}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">{med.frequency}</p>
                          {med.instructions && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">{med.instructions}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details row */}
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Prescriber</p>
                        <p className="font-medium text-foreground text-sm">{med.provider.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pharmacy</p>
                        <a href={`tel:${med.provider.phone}`} className="font-medium text-primary text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {med.pharmacy}
                        </a>
                      </div>
                    </div>

                    {/* Refill status */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        Refill {isDue ? "due" : "by"}{" "}
                        <span className={cn("font-medium", isDue && "text-warning")}>
                          {format(med.refillDueDate, "MMM d")}
                        </span>
                      </span>
                      {isDue && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                          Request Refill
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Discontinued */}
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
                  <p className="text-sm text-muted-foreground">{med.frequency} · {med.purpose}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Empty State */}
        {activeMedications.length === 0 && (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No medications tracked</h3>
            <p className="text-muted-foreground">Add medications to start tracking refills</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Medications;
