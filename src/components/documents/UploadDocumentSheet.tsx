import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCareCircle } from "@/hooks/useCareCircle";

const categories = [
  { value: "lab-results", label: "Lab Results" },
  { value: "imaging", label: "Imaging" },
  { value: "discharge", label: "Discharge Summary" },
  { value: "insurance", label: "Insurance" },
  { value: "prescriptions", label: "Prescriptions" },
  { value: "referral", label: "Referral" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
];

interface UploadDocumentSheetProps {
  onUploaded?: () => void;
}

export function UploadDocumentSheet({ onUploaded }: UploadDocumentSheetProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("other");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: circle } = useCareCircle();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!name) setName(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file || !name) {
      toast({ title: "Missing info", description: "Select a file and enter a name.", variant: "destructive" });
      return;
    }
    if (!circle?.careCircleId || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${circle.careCircleId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const userName = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") || user.email || "Unknown";

    const { error: dbError } = await supabase.from("documents" as any).insert({
      care_circle_id: circle.careCircleId,
      care_recipient_id: circle.careRecipientId || null,
      name,
      category,
      uploaded_by: user.id,
      uploaded_by_name: userName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    } as any);

    setUploading(false);
    if (dbError) {
      toast({ title: "Error", description: "File uploaded but record failed to save.", variant: "destructive" });
      console.error(dbError);
    } else {
      toast({ title: "Document uploaded" });
      setFile(null);
      setName("");
      setCategory("other");
      setOpen(false);
      onUploaded?.();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gradient-primary gap-2 h-9">
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Upload Document</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>File *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>}
          </div>
          <div className="space-y-2">
            <Label>Document Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Blood work results - Feb 2026" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpload} disabled={uploading || !file} className="w-full gradient-primary">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Upload
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
