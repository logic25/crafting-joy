import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface EditProviderSheetProps {
  provider: {
    id: string;
    name: string;
    specialty: string;
    type: string;
    phone: string | null;
    email: string | null;
    address_street: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zip: string | null;
    office_hours: string | null;
    notes: string | null;
  };
}

export function EditProviderSheet({ provider }: EditProviderSheetProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: provider.name,
    specialty: provider.specialty,
    type: provider.type,
    phone: provider.phone || "",
    email: provider.email || "",
    addressStreet: provider.address_street || "",
    addressCity: provider.address_city || "",
    addressState: provider.address_state || "",
    addressZip: provider.address_zip || "",
    officeHours: provider.office_hours || "",
    notes: provider.notes || "",
  });

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("providers")
      .update({
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
      })
      .eq("id", provider.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't update provider.", variant: "destructive" });
    } else {
      toast({ title: "Provider updated" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Provider</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Specialty</Label>
            <Input value={form.specialty} onChange={(e) => setForm(f => ({ ...f, specialty: e.target.value }))} />
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
            <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
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
            <Input value={form.officeHours} onChange={(e) => setForm(f => ({ ...f, officeHours: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Update Provider
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
