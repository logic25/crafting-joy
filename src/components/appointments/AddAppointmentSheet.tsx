import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCareCircle } from "@/hooks/useCareCircle";

const appointmentTypes = [
  { value: "primary-care", label: "Primary Care" },
  { value: "specialist", label: "Specialist" },
  { value: "lab", label: "Lab Work" },
  { value: "imaging", label: "Imaging" },
  { value: "procedure", label: "Procedure" },
  { value: "follow-up", label: "Follow-up" },
];

interface AddAppointmentSheetProps {
  onAdded?: () => void;
}

export function AddAppointmentSheet({ onAdded }: AddAppointmentSheetProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: circle } = useCareCircle();

  const [form, setForm] = useState({
    providerName: "",
    providerSpecialty: "",
    dateTime: "",
    type: "primary-care",
    location: "",
    purpose: "",
    notes: "",
    telehealthUrl: "",
  });

  const handleSave = async () => {
    if (!form.providerName || !form.dateTime || !form.purpose) {
      toast({ title: "Missing fields", description: "Provider, date, and purpose are required.", variant: "destructive" });
      return;
    }
    if (!circle?.careCircleId || !user) return;

    setSaving(true);
    const { error } = await supabase.from("appointments" as any).insert({
      care_circle_id: circle.careCircleId,
      care_recipient_id: circle.careRecipientId,
      provider_name: form.providerName,
      provider_specialty: form.providerSpecialty || null,
      date_time: new Date(form.dateTime).toISOString(),
      type: form.type,
      location: form.location || null,
      purpose: form.purpose,
      pre_appointment_notes: form.notes || null,
      created_by: user.id,
      telehealth_url: form.telehealthUrl || null,
    } as any);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't save appointment.", variant: "destructive" });
      console.error(error);
    } else {
      toast({ title: "Appointment added" });
      setForm({ providerName: "", providerSpecialty: "", dateTime: "", type: "primary-care", location: "", purpose: "", notes: "", telehealthUrl: "" });
      setOpen(false);
      onAdded?.();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gradient-primary gap-2 h-9">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Appointment</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Doctor / Provider *</Label>
            <Input value={form.providerName} onChange={(e) => setForm(f => ({ ...f, providerName: e.target.value }))} placeholder="Dr. Fuzaylov" />
          </div>
          <div className="space-y-2">
            <Label>Specialty</Label>
            <Input value={form.providerSpecialty} onChange={(e) => setForm(f => ({ ...f, providerSpecialty: e.target.value }))} placeholder="Cardiology" />
          </div>
          <div className="space-y-2">
            <Label>Date & Time *</Label>
            <Input type="datetime-local" value={form.dateTime} onChange={(e) => setForm(f => ({ ...f, dateTime: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {appointmentTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="123 Main St, Queens" />
          </div>
          <div className="space-y-2">
            <Label>Purpose *</Label>
            <Input value={form.purpose} onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Follow-up on blood pressure" />
          </div>
          <div className="space-y-2">
            <Label>Telehealth Link</Label>
            <Input value={form.telehealthUrl} onChange={(e) => setForm(f => ({ ...f, telehealthUrl: e.target.value }))} placeholder="https://zoom.us/j/..." />
            <p className="text-xs text-muted-foreground">Paste a Zoom, Teams, or Doxy.me link for virtual visits</p>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Bring medication list, fasting required..." rows={3} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Appointment
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
