import { useState } from "react";
import { AlertCircle, Phone, Copy, Share2, Eye, Pill, Heart, User, Building2, CreditCard, Shield, ClipboardList, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { careRecipient, medications, providers } from "@/data/mockData";
import { format, differenceInYears } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
        {/* Hero banner */}
        <div className="rounded-2xl gradient-emergency p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-background/20 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-7 w-7 text-destructive-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-destructive-foreground">Mom's ER Card</h1>
          <p className="text-destructive-foreground/80 text-sm mt-1">
            Show this to any medical professional
          </p>
        </div>

        {/* Share actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={handleShare} variant="outline" className="flex-col h-auto py-3 gap-1.5 text-xs font-medium">
            <Share2 className="h-4 w-4" />
            Text This
          </Button>
          <Button onClick={handleCopy} variant="outline" className="flex-col h-auto py-3 gap-1.5 text-xs font-medium">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy All"}
          </Button>
          <Button onClick={() => setShowOnScreen(true)} variant="outline" className="flex-col h-auto py-3 gap-1.5 text-xs font-medium">
            <Eye className="h-4 w-4" />
            Show on Screen
          </Button>
        </div>

        {/* Person card */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{careRecipient.name}</h2>
              <p className="text-muted-foreground">
                Age {age} • DOB: {format(careRecipient.dateOfBirth, "MM/dd/yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Allergies — most prominent */}
        <div className="bg-destructive/8 border-2 border-destructive/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-bold text-destructive">Allergies</h3>
          </div>
          <div className="space-y-2">
            {careRecipient.allergies.map((allergy, idx) => (
              <div key={idx} className="flex items-baseline gap-2">
                <span className="text-destructive text-lg">⚠️</span>
                <div>
                  <span className="font-semibold text-foreground">{allergy.name}</span>
                  <span className="text-muted-foreground"> — {allergy.reaction || allergy.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <Section icon={Heart} title="Conditions">
          <div className="flex flex-wrap gap-2">
            {careRecipient.medicalConditions.map((condition, idx) => (
              <span key={idx} className="bg-secondary text-foreground text-sm px-3 py-1.5 rounded-full font-medium">
                {condition}
              </span>
            ))}
          </div>
        </Section>

        {/* Current Medications */}
        <Section icon={Pill} title="Current Medications">
          <div className="space-y-2.5">
            {activeMedications.map((med) => (
              <div key={med.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{med.name} {med.dosage}</p>
                  <p className="text-sm text-muted-foreground">{med.frequency} — {med.purpose}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Standing instructions */}
        {careRecipient.standingInstructions?.length ? (
          <Section icon={ClipboardList} title="Standing Instructions">
            <div className="space-y-2">
              {careRecipient.standingInstructions.map((inst, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0" />
                  <p className="text-foreground font-medium">{inst}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {/* Doctors */}
        <Section icon={Building2} title="Doctors">
          <div className="space-y-3">
            {doctors.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{doc.name}</p>
                  <p className="text-sm text-muted-foreground">{doc.specialty}</p>
                </div>
                <a href={`tel:${doc.phone}`}>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-primary">
                    <Phone className="h-3.5 w-3.5" />
                    {doc.phone}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Section>

        {/* Emergency Contacts */}
        <Section icon={Phone} title="Emergency Contacts">
          <div className="space-y-3">
            {careRecipient.emergencyContacts.map((contact) => (
              <div key={contact.priority} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                </div>
                <a href={`tel:${contact.phone}`}>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-primary">
                    <Phone className="h-3.5 w-3.5" />
                    {contact.phone}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Section>

        {/* Insurance */}
        <Section icon={CreditCard} title="Insurance">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{careRecipient.insurance.carrier}</p>
            <p className="text-sm text-muted-foreground">Policy: {careRecipient.insurance.policyNumber}</p>
            {careRecipient.insurance.medicare && (
              <p className="text-sm text-muted-foreground">Medicare: {careRecipient.insurance.medicare}</p>
            )}
          </div>
        </Section>

        {/* Hospital */}
        <Section icon={Building2} title="Preferred Hospital">
          <p className="font-semibold text-foreground">{careRecipient.preferredHospital}</p>
        </Section>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Auto-updated • {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </AppLayout>
  );
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default Emergency;
