import { useState } from "react";
import { AlertCircle, Phone, Copy, Share2, Eye, Pill, Heart, Building2, CreditCard, Shield, ClipboardList, Check, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareCircle } from "@/hooks/useCareCircle";

const Emergency = () => {
  const [showOnScreen, setShowOnScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { data: circle } = useCareCircle();

  const { data: careRecipient, isLoading } = useQuery({
    queryKey: ["care_recipient_full", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("care_recipients")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["providers_emergency", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data } = await supabase
        .from("providers")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .order("name");
      return data || [];
    },
  });

  const doctors = providers.filter((p) => p.type === "doctor");
  const allergies = (careRecipient?.allergies as any[]) || [];
  const conditions = careRecipient?.medical_conditions || [];
  const instructions = careRecipient?.standing_instructions || [];
  const age = careRecipient?.date_of_birth
    ? differenceInYears(new Date(), new Date(careRecipient.date_of_birth))
    : null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-5 pb-24 md:pb-6">
          <div className="rounded-2xl bg-muted animate-pulse h-28" />
          <div className="rounded-xl bg-muted animate-pulse h-20" />
          <div className="rounded-xl bg-muted animate-pulse h-40" />
        </div>
      </AppLayout>
    );
  }

  if (!careRecipient) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <FileWarning className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg text-foreground">No care recipient set up</h3>
          <p className="text-muted-foreground mt-1">Complete onboarding to add emergency info</p>
        </div>
      </AppLayout>
    );
  }

  const buildERText = () => {
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `${careRecipient.name}${careRecipient.date_of_birth ? ` | DOB: ${format(new Date(careRecipient.date_of_birth), "MM/dd/yyyy")}` : ""}${age ? ` | Age ${age}` : ""}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
    ];
    if (conditions.length) lines.push(`CONDITIONS: ${conditions.join(", ")}`);
    if (allergies.length) lines.push(`ALLERGIES: ${allergies.map((a: any) => `${a.name} (${a.reaction || a.severity})`).join(", ")}`);
    lines.push(``);
    if (doctors.length) {
      lines.push(`DOCTORS:`);
      doctors.forEach(d => lines.push(`• ${d.name} (${d.specialty}) ${d.phone || ""}`));
      lines.push(``);
    }
    if (careRecipient.insurance_carrier) {
      lines.push(`INSURANCE: ${careRecipient.insurance_carrier} / #${careRecipient.insurance_policy_number || ""}`);
    }
    if (careRecipient.preferred_hospital) lines.push(`PREFERRED HOSPITAL: ${careRecipient.preferred_hospital}`);
    if (instructions.length) {
      lines.push(``, `STANDING INSTRUCTIONS:`);
      instructions.forEach(i => lines.push(`• ${i}`));
    }
    lines.push(``, `Last updated: ${format(new Date(), "MMM d, yyyy")}`);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildERText());
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "ER info ready to paste" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = buildERText();
    if (navigator.share) {
      await navigator.share({ title: `${careRecipient.name} — Emergency Info`, text });
    } else {
      handleCopy();
    }
  };

  if (showOnScreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-foreground text-background overflow-auto p-6" onClick={() => setShowOnScreen(false)}>
        <div className="max-w-lg mx-auto space-y-4">
          <p className="text-sm opacity-60 text-center">Tap anywhere to close</p>
          <h1 className="text-3xl font-bold text-center">{careRecipient.name}</h1>
          {age && careRecipient.date_of_birth && (
            <p className="text-xl text-center opacity-80">Age {age} • DOB {format(new Date(careRecipient.date_of_birth), "MM/dd/yyyy")}</p>
          )}
          {allergies.length > 0 && (
            <>
              <Separator className="bg-background/20" />
              <div>
                <h2 className="text-lg font-bold text-destructive-foreground bg-destructive inline-block px-2 py-0.5 rounded mb-2">ALLERGIES</h2>
                {allergies.map((a: any, i: number) => (
                  <p key={i} className="text-xl font-semibold">⚠️ {a.name} — {a.reaction || a.severity}</p>
                ))}
              </div>
            </>
          )}
          {conditions.length > 0 && (
            <>
              <Separator className="bg-background/20" />
              <div>
                <h2 className="text-lg font-bold opacity-70 mb-2">CONDITIONS</h2>
                <p className="text-xl">{conditions.join(" • ")}</p>
              </div>
            </>
          )}
          {doctors.length > 0 && (
            <>
              <Separator className="bg-background/20" />
              <div>
                <h2 className="text-lg font-bold opacity-70 mb-2">DOCTORS</h2>
                {doctors.map(d => (
                  <p key={d.id} className="text-lg mb-1">• {d.name} ({d.specialty}) — {d.phone || ""}</p>
                ))}
              </div>
            </>
          )}
          {careRecipient.insurance_carrier && (
            <>
              <Separator className="bg-background/20" />
              <div>
                <h2 className="text-lg font-bold opacity-70 mb-2">INSURANCE</h2>
                <p className="text-xl">{careRecipient.insurance_carrier} — #{careRecipient.insurance_policy_number || ""}</p>
              </div>
            </>
          )}
          {instructions.length > 0 && (
            <>
              <Separator className="bg-background/20" />
              <div>
                <h2 className="text-lg font-bold opacity-70 mb-2">INSTRUCTIONS</h2>
                {instructions.map((inst, i) => (
                  <p key={i} className="text-lg mb-1">• {inst}</p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="rounded-2xl gradient-emergency p-6 md:p-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-8 w-8 text-destructive-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-destructive-foreground">{careRecipient.name}</h1>
            <p className="text-destructive-foreground/80 text-sm">
              {age ? `Age ${age} • ` : ""}{careRecipient.date_of_birth ? `DOB: ${format(new Date(careRecipient.date_of_birth), "MM/dd/yyyy")} • ` : ""}{careRecipient.preferred_hospital || ""}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleShare} className="flex-1 gap-2 gradient-primary text-primary-foreground h-11">
            <Share2 className="h-4 w-4" />
            Text This Info
          </Button>
          <Button onClick={handleCopy} variant="outline" className="gap-2 h-11">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={() => setShowOnScreen(true)} variant="outline" className="gap-2 h-11">
            <Eye className="h-4 w-4" />
            Screen
          </Button>
        </div>

        {allergies.length > 0 && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/25 px-5 py-4 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1.5">Allergies</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {allergies.map((a: any, i: number) => (
                  <span key={i} className="text-foreground font-semibold">
                    {a.name} <span className="font-normal text-muted-foreground">({a.reaction || a.severity})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {conditions.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conditions</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c, i) => (
                  <span key={i} className="bg-secondary text-foreground text-xs px-2.5 py-1 rounded-full font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}

          {careRecipient.insurance_carrier && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insurance</p>
              </div>
              <p className="font-semibold text-foreground">{careRecipient.insurance_carrier}</p>
              {careRecipient.insurance_policy_number && (
                <p className="text-sm text-muted-foreground">#{careRecipient.insurance_policy_number}</p>
              )}
            </div>
          )}
        </div>

        {instructions.length > 0 && (
          <div className="bg-warning/8 border border-warning/25 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-warning" />
              <p className="text-xs font-semibold text-warning uppercase tracking-wider">Standing Instructions</p>
            </div>
            <div className="space-y-1.5">
              {instructions.map((inst, i) => (
                <p key={i} className="text-foreground font-medium text-sm">→ {inst}</p>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {doctors.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doctors</p>
              </div>
              <div className="divide-y divide-border">
                {doctors.map((doc) => (
                  <div key={doc.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                    </div>
                    {doc.phone && (
                      <a href={`tel:${doc.phone}`}>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-primary">
                          <Phone className="h-3 w-3" />
                          Call
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          Auto-updated • {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </AppLayout>
  );
};

export default Emergency;
