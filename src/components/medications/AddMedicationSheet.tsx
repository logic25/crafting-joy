import { useState, useRef, useCallback } from "react";
import { Plus, Camera, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAddMedication } from "@/hooks/useMedications";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useAuth } from "@/contexts/AuthContext";

interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  purpose: string;
  prescriber: string;
  pharmacy: string;
}

const EMPTY_FORM: MedicationFormData = {
  name: "", dosage: "", frequency: "", instructions: "", purpose: "", prescriber: "", pharmacy: "",
};

const PURPOSE_OPTIONS = [
  "Blood Pressure", "Diabetes", "Cholesterol", "GERD", "Pain", "Heart", "Thyroid", "Mental Health", "Other",
];

export function AddMedicationSheet() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MedicationFormData>(EMPTY_FORM);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMed = useAddMedication();
  const { data: careCircleData } = useCareCircle();
  const { user } = useAuth();

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setScanning(false);
    setScanSuccess(false);
    setPreviewUrl(null);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setScanning(true);
    setScanSuccess(false);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-medication", {
        body: { image: base64 },
      });
      if (error) throw error;

      if (data?.medication) {
        const med = data.medication;
        setForm((prev) => ({
          ...prev,
          name: med.name || prev.name,
          dosage: med.dosage || prev.dosage,
          frequency: med.frequency || prev.frequency,
          instructions: med.instructions || prev.instructions,
          purpose: med.purpose || prev.purpose,
          prescriber: med.prescriber || prev.prescriber,
          pharmacy: med.pharmacy || prev.pharmacy,
        }));
        setScanSuccess(true);
        toast.success("Medication details extracted! Review and edit below.");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error("OCR error:", err);
      toast.error("Couldn't read the label. Try a clearer photo or enter details manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Medication name is required");
      return;
    }
    if (!careCircleData?.careCircleId || !careCircleData?.careRecipientId) {
      toast.error("Care circle not set up yet");
      return;
    }

    addMed.mutate(
      {
        care_circle_id: careCircleData.careCircleId,
        care_recipient_id: careCircleData.careRecipientId,
        name: form.name.trim(),
        dosage: form.dosage || undefined,
        frequency: form.frequency || undefined,
        instructions: form.instructions || undefined,
        purpose: form.purpose || undefined,
        prescriber: form.prescriber || undefined,
        pharmacy: form.pharmacy || undefined,
        source: scanSuccess ? "label_scan" : "manual",
      },
      {
        onSuccess: () => {
          toast.success(`${form.name} added to medications`);
          setOpen(false);
          resetForm();
        },
        onError: (err) => {
          toast.error("Failed to save medication");
          console.error(err);
        },
      }
    );
  };

  const updateField = (field: keyof MedicationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="gradient-primary gap-2 h-9">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[55vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="mb-3">
          <SheetTitle className="text-base">Add Medication</SheetTitle>
        </SheetHeader>

        {/* Camera OCR Section */}
        <div className="mb-5">
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />
          {!previewUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 flex items-center justify-center gap-3 transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              <Camera className="h-5 w-5 text-primary" />
              <div className="text-left">
                <span className="text-sm font-medium text-foreground">Snap a photo of the label</span>
                <span className="text-xs text-muted-foreground block">AI fills in details automatically</span>
              </div>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img src={previewUrl} alt="Medication label" className="w-full h-28 object-cover" />
              {scanning && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-foreground">Reading label...</span>
                </div>
              )}
              {scanSuccess && (
                <div className="absolute top-2 right-2">
                  <div className="bg-success text-success-foreground rounded-full p-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
              )}
              <button
                onClick={() => { setPreviewUrl(null); setScanSuccess(false); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute top-2 left-2 bg-background/80 rounded-full p-1"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {previewUrl ? "Review & edit" : "Or enter manually"}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="med-name" className="text-xs">Medication Name *</Label>
            <Input id="med-name" placeholder="e.g., Lisinopril" value={form.name} onChange={(e) => updateField("name", e.target.value)} className={cn(scanSuccess && form.name && "border-success/50 bg-success/5")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="med-dosage" className="text-xs">Dosage</Label>
              <Input id="med-dosage" placeholder="e.g., 10mg" value={form.dosage} onChange={(e) => updateField("dosage", e.target.value)} className={cn(scanSuccess && form.dosage && "border-success/50 bg-success/5")} />
            </div>
            <div>
              <Label htmlFor="med-frequency" className="text-xs">Frequency</Label>
              <Input id="med-frequency" placeholder="e.g., 1x daily" value={form.frequency} onChange={(e) => updateField("frequency", e.target.value)} className={cn(scanSuccess && form.frequency && "border-success/50 bg-success/5")} />
            </div>
          </div>
          <div>
            <Label htmlFor="med-purpose" className="text-xs">Purpose</Label>
            <Select value={form.purpose} onValueChange={(v) => updateField("purpose", v)}>
              <SelectTrigger className={cn(scanSuccess && form.purpose && "border-success/50 bg-success/5")}>
                <SelectValue placeholder="What is this for?" />
              </SelectTrigger>
              <SelectContent>
                {PURPOSE_OPTIONS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="med-instructions" className="text-xs">Instructions</Label>
            <Input id="med-instructions" placeholder="e.g., Take with food" value={form.instructions} onChange={(e) => updateField("instructions", e.target.value)} className={cn(scanSuccess && form.instructions && "border-success/50 bg-success/5")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="med-prescriber" className="text-xs">Prescriber</Label>
              <Input id="med-prescriber" placeholder="e.g., Dr. Patel" value={form.prescriber} onChange={(e) => updateField("prescriber", e.target.value)} className={cn(scanSuccess && form.prescriber && "border-success/50 bg-success/5")} />
            </div>
            <div>
              <Label htmlFor="med-pharmacy" className="text-xs">Pharmacy</Label>
              <Input id="med-pharmacy" placeholder="e.g., CVS" value={form.pharmacy} onChange={(e) => updateField("pharmacy", e.target.value)} className={cn(scanSuccess && form.pharmacy && "border-success/50 bg-success/5")} />
            </div>
          </div>
        </div>

        <div className="mt-4 pb-4">
          <Button onClick={handleSubmit} disabled={addMed.isPending} className="w-full gradient-primary">
            {addMed.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Medication
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
