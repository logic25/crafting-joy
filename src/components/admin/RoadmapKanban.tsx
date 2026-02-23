import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  priority: number;
  created_at: string;
}

const columns = [
  { key: "backlog", label: "Backlog", color: "bg-muted" },
  { key: "planned", label: "Planned", color: "bg-primary/10" },
  { key: "in_progress", label: "In Progress", color: "bg-warning/10" },
  { key: "shipped", label: "Shipped", color: "bg-success/10" },
];

const categoryColors: Record<string, string> = {
  Notifications: "bg-blue-500/10 text-blue-600 border-blue-500/25",
  Integrations: "bg-purple-500/10 text-purple-600 border-purple-500/25",
  Family: "bg-pink-500/10 text-pink-600 border-pink-500/25",
  Documents: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  Medications: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
  AI: "bg-violet-500/10 text-violet-600 border-violet-500/25",
  Appointments: "bg-cyan-500/10 text-cyan-600 border-cyan-500/25",
  Chat: "bg-rose-500/10 text-rose-600 border-rose-500/25",
  Health: "bg-teal-500/10 text-teal-600 border-teal-500/25",
  Accessibility: "bg-indigo-500/10 text-indigo-600 border-indigo-500/25",
};

export function RoadmapKanban() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStatus, setNewStatus] = useState("backlog");
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("roadmap_items" as any)
      .select("*")
      .order("priority", { ascending: true });
    if (!error) setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const { error } = await supabase.from("roadmap_items" as any).insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      category: newCategory.trim() || null,
      status: newStatus,
      priority: items.length,
    } as any);
    if (error) {
      toast({ title: "Error", description: "Couldn't add item", variant: "destructive" });
    } else {
      toast({ title: "Roadmap item added" });
      setNewTitle("");
      setNewDesc("");
      setNewCategory("");
      setNewStatus("backlog");
      setAddOpen(false);
      fetchItems();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("roadmap_items" as any)
      .update({ status: newStatus } as any)
      .eq("id", id);
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("roadmap_items" as any).delete().eq("id", id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Item deleted" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} items across {columns.length} stages</p>
        <Sheet open={addOpen} onOpenChange={setAddOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add Roadmap Item</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Feature name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What does this feature do?" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Integrations, AI, Health" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {columns.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={!newTitle.trim()} className="w-full">Add to Roadmap</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Kanban columns - stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colItems = items.filter(i => i.status === col.key);
          return (
            <div key={col.key} className="space-y-2">
              <div className={cn("rounded-lg px-3 py-2 flex items-center justify-between", col.color)}>
                <span className="text-sm font-semibold text-foreground">{col.label}</span>
                <Badge variant="outline" className="text-xs">{colItems.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {colItems.map((item) => (
                  <Card key={item.id} className="shadow-sm">
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {item.category && (
                          <Badge variant="outline" className={cn("text-[10px]", categoryColors[item.category] || "")}>
                            {item.category}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <Select value={item.status} onValueChange={(v) => handleStatusChange(item.id, v)}>
                            <SelectTrigger className="h-6 text-[10px] w-auto border-none shadow-none px-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(c => <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete roadmap item?</AlertDialogTitle>
                                <AlertDialogDescription>Remove "{item.title}" from the roadmap.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {colItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No items</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
