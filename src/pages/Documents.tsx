import { Upload, FileText, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { UploadDocumentSheet } from "@/components/documents/UploadDocumentSheet";
import { FaxDocumentSheet } from "@/components/documents/FaxDocumentSheet";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const categories = [
  { key: "all", label: "All" },
  { key: "lab-results", label: "Lab Results" },
  { key: "imaging", label: "Imaging" },
  { key: "discharge", label: "Discharge" },
  { key: "insurance", label: "Insurance" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "legal", label: "Legal" },
  { key: "other", label: "Other" },
];

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { data: circle } = useCareCircle();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("id, name, fax")
        .eq("care_circle_id", circle!.careCircleId);
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredDocs = documents.filter((d) => {
    const matchesCategory = activeCategory === "all" || d.category === activeCategory;
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleView = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: "Could not generate link", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from("documents").remove([filePath]);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Document deleted" });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    }
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["documents"] });

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground">Mom's medical records & files</p>
          </div>
          <div className="flex items-center gap-2">
            <FaxDocumentSheet providers={providers} />
            <UploadDocumentSheet onUploaded={invalidate} />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card animate-pulse h-16" />
            ))}
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-2.5">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.uploaded_by_name} · {format(new Date(doc.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary text-xs h-7" onClick={() => handleView(doc.file_path)}>
                  View
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete document?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently remove "{doc.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(doc.id, doc.file_path)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">No documents found</h3>
            <p className="text-muted-foreground">Upload documents to keep Mom's records organized</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Documents;
