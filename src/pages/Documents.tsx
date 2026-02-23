import { Upload, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { UploadDocumentSheet } from "@/components/documents/UploadDocumentSheet";
import { useState } from "react";

const categories = [
  { key: "all", label: "All" },
  { key: "lab-results", label: "Lab Results" },
  { key: "imaging", label: "Imaging" },
  { key: "discharge", label: "Discharge" },
  { key: "insurance", label: "Insurance" },
  { key: "prescriptions", label: "Prescriptions" },
  { key: "legal", label: "Legal" },
];

// Placeholder docs since we don't have documents in mock data yet
const sampleDocs = [
  { id: "1", name: "Blood Work Results - Jan 2026", category: "lab-results", uploadedBy: "Maria", date: "Jan 20, 2026" },
  { id: "2", name: "Dr. Fuzaylov Visit Summary", category: "discharge", uploadedBy: "Manny", date: "Feb 1, 2026" },
  { id: "3", name: "Insurance Card - Healthfirst", category: "insurance", uploadedBy: "Manny", date: "Jan 5, 2026" },
];

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filteredDocs = sampleDocs.filter((d) => {
    const matchesCategory = activeCategory === "all" || d.category === activeCategory;
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground">Mom's medical records & files</p>
          </div>
          <UploadDocumentSheet />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filters */}
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

        {/* Documents list */}
        {filteredDocs.length > 0 ? (
          <div className="space-y-2.5">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border bg-card p-4 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.uploadedBy} · {doc.date}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-primary text-xs h-7">
                  View
                </Button>
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
