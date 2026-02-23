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
import { useCareCircle } from "@/hooks/useCareCircle";

interface AddProviderSheetProps {
  onAdded?: () => void;
}

export function AddProviderSheet({ onAdded }: AddProviderSheetProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { data: circle } = useCareCircle();

  const [form, setForm] = useState({
    name: "",
    specialty: "",
    type: "doctor",
    phone: "",
    email: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    officeHours: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!circle?.careCircleId) return;

    setSaving(true);
    const { error } = await supabase.from("providers" as any).insert({
      care_circle_id: circle.careCircleId,
      name: form.name,
      specialty: form.specialty || "",
      type: form.type,
      phone: form.phone || null,
      email: form.email || null,
      address_street: form.addressStreet || null,
      address_city: form.addressCity || null,
      address_state: form.addressState || null,
      address_zip: form.addressZip || null,
      office_hours: form.officeHours || null,
      notes: form.notes || null,
    } as any);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't save provider.", variant: "destructive" });
      console.error(error);
    } else {
      toast({ title: "Provider added" });
      setForm({ name: "", specialty: "", type: "doctor", phone: "", email: "", addressStreet: "", addressCity: "", addressState: "", addressZip: "", officeHours: "", notes: "" });
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
          <SheetTitle>Add Doctor / Provider</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Patel" />
          </div>
          <div className="space-y-2">
            <Label>Specialty</Label>
            <Input value={form.specialty} onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Primary Care" />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="clinic">Clinic</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(718) 555-0123" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="dr@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.addressStreet} onChange={(e) => setForm(f => ({ ...f, addressStreet: e.target.value }))} placeholder="123 Main St" className="mb-2" />
            <div className="grid grid-cols-3 gap-2">
              <Input value={form.addressCity} onChange={(e) => setForm(f => ({ ...f, addressCity: e.target.value }))} placeholder="City" />
              <Input value={form.addressState} onChange={(e) => setForm(f => ({ ...f, addressState: e.target.value }))} placeholder="State" />
              <Input value={form.addressZip} onChange={(e) => setForm(f => ({ ...f, addressZip: e.target.value }))} placeholder="ZIP" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Office Hours</Label>
            <Input value={form.officeHours} onChange={(e) => setForm(f => ({ ...f, officeHours: e.target.value }))} placeholder="Mon-Fri 9am-5pm" />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Speaks Spanish, accepts walk-ins..." rows={2} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Provider
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
