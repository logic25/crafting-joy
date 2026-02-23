import { useState } from "react";
import { Send, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCareCircle } from "@/hooks/useCareCircle";

interface FaxDocumentSheetProps {
  providers: Array<{ id: string; name: string; fax: string | null }>;
}

export function FaxDocumentSheet({ providers }: FaxDocumentSheetProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [faxNumber, setFaxNumber] = useState("");
  const [selectedDoc, setSelectedDoc] = useState("");
  const { toast } = useToast();
  const { data: circle } = useCareCircle();

  const faxableProviders = providers.filter((p) => p.fax);

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", circle?.careCircleId],
    enabled: !!circle?.careCircleId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, file_path")
        .eq("care_circle_id", circle!.careCircleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const provider = providers.find((p) => p.id === providerId);
    if (provider?.fax) setFaxNumber(provider.fax);
  };

  const handleSend = async () => {
    if (!faxNumber.trim() || !selectedDoc) {
      toast({ title: "Missing fields", description: "Select a document and enter a fax number.", variant: "destructive" });
      return;
    }

    const doc = documents.find((d) => d.id === selectedDoc);
    if (!doc) return;

    const provider = providers.find((p) => p.id === selectedProvider);

    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-fax", {
      body: {
        faxNumber: faxNumber.trim(),
        documentId: selectedDoc,
        filePath: doc.file_path,
        providerName: provider?.name || "Unknown",
        senderName: "CareThread",
      },
    });

    setSending(false);
    if (error) {
      toast({ title: "Error", description: "Failed to send fax.", variant: "destructive" });
    } else if (data?.simulated) {
      toast({ title: "Fax queued (demo)", description: data.message });
      setOpen(false);
    } else {
      toast({ title: "Fax sent!", description: data?.message });
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Send className="h-3.5 w-3.5" /> Fax
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[45vh] rounded-t-2xl overflow-y-auto px-4 pb-6 pt-4">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">Fax to Doctor's Office</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Document to fax *</Label>
            <Select value={selectedDoc} onValueChange={setSelectedDoc}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document..." />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      {doc.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {documents.length === 0 && (
              <p className="text-xs text-muted-foreground">No documents uploaded yet. Upload a document first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Send to provider</Label>
            <Select value={selectedProvider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider..." />
              </SelectTrigger>
              <SelectContent>
                {faxableProviders.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.fax}
                  </SelectItem>
                ))}
                {faxableProviders.length === 0 && (
                  <SelectItem value="__none" disabled>
                    No providers with fax numbers
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fax number *</Label>
            <Input
              value={faxNumber}
              onChange={(e) => setFaxNumber(e.target.value)}
              placeholder="(555) 123-4567"
              type="tel"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              📠 Fax is currently in <strong>demo mode</strong>. Connect a fax provider (Phaxio, SRFax) to send real faxes. The document will be securely transmitted.
            </p>
          </div>

          <Button onClick={handleSend} disabled={sending || !faxNumber.trim() || !selectedDoc} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Fax
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
