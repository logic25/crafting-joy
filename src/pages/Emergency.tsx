import { useState } from "react";
import { AlertCircle, Phone, Copy, Share2, Eye, Pill, Heart, User, Building2, CreditCard, Shield, ClipboardList, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { careRecipient, medications, providers } from "@/data/mockData";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Emergency = () => {
  const [showOnScreen, setShowOnScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const activeMedications = medications.filter((med) => med.status === "active");
  const age = differenceInYears(new Date(), careRecipient.dateOfBirth);
  const doctors = providers.filter((p) => p.type === "doctor");

  const buildERText = () => {
    const lines = [
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `${careRecipient.name} | DOB: ${format(careRecipient.dateOfBirth, "MM/dd/yyyy")} | Age ${age}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `CONDITIONS: ${careRecipient.medicalConditions.join(", ")}`,
      `ALLERGIES: ${careRecipient.allergies.map(a => `${a.name} (${a.reaction || a.severity})`).join(", ")}`,
      ``,
      `MEDICATIONS:`,
      ...activeMedications.map(m => `• ${m.name} ${m.dosage} — ${m.frequency} — ${m.purpose}`),
      ``,
      `DOCTORS:`,
      ...doctors.map(d => `• ${d.name} (${d.specialty}) ${d.phone}`),
      ``,
      `INSURANCE: ${careRecipient.insurance.carrier} / #${careRecipient.insurance.policyNumber}`,
      `PREFERRED HOSPITAL: ${careRecipient.preferredHospital}`,
    ];
    if (careRecipient.standingInstructions?.length) {
      lines.push(``, `STANDING INSTRUCTIONS:`);
      careRecipient.standingInstructions.forEach(i => lines.push(`• ${i}`));
    }
    lines.push(``, `EMERGENCY CONTACTS:`);
    careRecipient.emergencyContacts.forEach(c => lines.push(`• ${c.name} (${c.relationship}) ${c.phone}`));
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

  // ── Large-text ER mode ──────────────────────────────
  if (showOnScreen) {
    return (
      <div
        className="fixed inset-0 z-[100] bg-foreground text-background overflow-auto p-6"
        onClick={() => setShowOnScreen(false)}
      >
        <div className="max-w-lg mx-auto space-y-4">
          <p className="text-sm opacity-60 text-center">Tap anywhere to close</p>
          <h1 className="text-3xl font-bold text-center">{careRecipient.name}</h1>
          <p className="text-xl text-center opacity-80">Age {age} • DOB {format(careRecipient.dateOfBirth, "MM/dd/yyyy")}</p>
          <Separator className="bg-background/20" />
          <div>
            <h2 className="text-lg font-bold text-destructive-foreground bg-destructive inline-block px-2 py-0.5 rounded mb-2">ALLERGIES</h2>
            {careRecipient.allergies.map((a, i) => (
              <p key={i} className="text-xl font-semibold">⚠️ {a.name} — {a.reaction || a.severity}</p>
            ))}
          </div>
          <Separator className="bg-background/20" />
          <div>
            <h2 className="text-lg font-bold opacity-70 mb-2">CONDITIONS</h2>
            <p className="text-xl">{careRecipient.medicalConditions.join(" • ")}</p>
          </div>
          <Separator className="bg-background/20" />
          <div>
            <h2 className="text-lg font-bold opacity-70 mb-2">MEDICATIONS</h2>
            {activeMedications.map(m => (
              <p key={m.id} className="text-lg mb-1">• {m.name} {m.dosage} — {m.frequency}</p>
            ))}
          </div>
          <Separator className="bg-background/20" />
          <div>
            <h2 className="text-lg font-bold opacity-70 mb-2">DOCTORS</h2>
            {doctors.map(d => (
              <p key={d.id} className="text-lg mb-1">• {d.name} ({d.specialty}) — {d.phone}</p>
            ))}
          </div>
          <Separator className="bg-background/20" />
          <div>
            <h2 className="text-lg font-bold opacity-70 mb-2">INSURANCE</h2>
            <p className="text-xl">{careRecipient.insurance.carrier} — #{careRecipient.insurance.policyNumber}</p>
          </div>
          {careRecipient.standingInstructions?.length ? (
            <>
              <Separator className="bg-background/20" />
              <div>
                <h2 className="text-lg font-bold opacity-70 mb-2">INSTRUCTIONS</h2>
                {careRecipient.standingInstructions.map((inst, i) => (
                  <p key={i} className="text-lg mb-1">• {inst}</p>
                ))}
              </div>
            </>
          ) : null}
          <Separator className="bg-background/20" />
          <div>
            <h2 className="text-lg font-bold opacity-70 mb-2">EMERGENCY CONTACTS</h2>
            {careRecipient.emergencyContacts.map(c => (
              <p key={c.priority} className="text-lg mb-1">{c.priority}. {c.name} ({c.relationship}) — {c.phone}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal view ─────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        {/* Hero — full width, left-aligned identity */}
        <div className="rounded-2xl gradient-emergency p-6 md:p-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-8 w-8 text-destructive-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-destructive-foreground">{careRecipient.name}</h1>
            <p className="text-destructive-foreground/80 text-sm">
              Age {age} • DOB: {format(careRecipient.dateOfBirth, "MM/dd/yyyy")} • {careRecipient.preferredHospital}
            </p>
          </div>
        </div>

        {/* Share bar — sticky feel */}
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

        {/* Allergies — full-width alert strip, not a card */}
        <div className="rounded-xl bg-destructive/10 border border-destructive/25 px-5 py-4 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1.5">Allergies</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {careRecipient.allergies.map((a, i) => (
                <span key={i} className="text-foreground font-semibold">
                  {a.name} <span className="font-normal text-muted-foreground">({a.reaction || a.severity})</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column: Conditions + Insurance side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Conditions */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conditions</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {careRecipient.medicalConditions.map((c, i) => (
                <span key={i} className="bg-secondary text-foreground text-xs px-2.5 py-1 rounded-full font-medium">{c}</span>
              ))}
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insurance</p>
            </div>
            <p className="font-semibold text-foreground">{careRecipient.insurance.carrier}</p>
            <p className="text-sm text-muted-foreground">#{careRecipient.insurance.policyNumber}</p>
            {careRecipient.insurance.medicare && (
              <p className="text-sm text-muted-foreground mt-1">Medicare: {careRecipient.insurance.medicare}</p>
            )}
          </div>
        </div>

        {/* Medications — compact table-like layout */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
            <Pill className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Medications</p>
            <span className="ml-auto text-xs text-muted-foreground">{activeMedications.length} active</span>
          </div>
          <div className="divide-y divide-border">
            {activeMedications.map((med) => (
              <div key={med.id} className="px-5 py-3 flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-semibold text-foreground">{med.name} {med.dosage}</span>
                  <span className="text-muted-foreground text-sm ml-2">— {med.frequency}</span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{med.purpose}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Standing Instructions — if any, horizontal banner style */}
        {careRecipient.standingInstructions?.length ? (
          <div className="bg-warning/8 border border-warning/25 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-warning" />
              <p className="text-xs font-semibold text-warning uppercase tracking-wider">Standing Instructions</p>
            </div>
            <div className="space-y-1.5">
              {careRecipient.standingInstructions.map((inst, i) => (
                <p key={i} className="text-foreground font-medium text-sm">→ {inst}</p>
              ))}
            </div>
          </div>
        ) : null}

        {/* Two-column: Doctors + Emergency Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Doctors */}
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
                  <a href={`tel:${doc.phone}`}>
                    <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-primary">
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <Phone className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contacts</p>
            </div>
            <div className="divide-y divide-border">
              {careRecipient.emergencyContacts.map((contact) => (
                <div key={contact.priority} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                  </div>
                  <a href={`tel:${contact.phone}`}>
                    <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-primary">
                      <Phone className="h-3 w-3" />
                      Call
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer timestamp */}
        <p className="text-center text-[11px] text-muted-foreground pt-1">
          Auto-updated • {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </AppLayout>
  );
};

export default Emergency;
