import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCareCircle } from "@/hooks/useCareCircle";

interface AddMemberSheetProps {
  onAdded?: () => void;
}

export function AddMemberSheet({ onAdded }: AddMemberSheetProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("caregiver");
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: circle } = useCareCircle();

  const handleSave = async () => {
    if (!email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    if (!circle?.careCircleId || !user) return;

    setSaving(true);

    // Look up user by email
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (profileErr || !profile) {
      toast({
        title: "User not found",
        description: "They need to sign up first, then you can add them. Send them an invite from the Family page!",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("care_circle_members")
      .select("id")
      .eq("care_circle_id", circle.careCircleId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existing) {
      toast({ title: "Already a member", description: "This person is already in your care circle." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("care_circle_members").insert({
      care_circle_id: circle.careCircleId,
      user_id: profile.id,
      role: role as any,
      invited_by: user.id,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Couldn't add member.", variant: "destructive" });
      console.error(error);
    } else {
      toast({ title: "Member added!", description: `${email} has been added as ${role}.` });
      setEmail("");
      setRole("caregiver");
      setOpen(false);
      onAdded?.();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Member</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Family Member</SheetTitle>
          <SheetDescription>Add someone who already has an account. If they haven't signed up yet, send them an invite first.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sister@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="caregiver">Caregiver</SelectItem>
                <SelectItem value="view-only">View Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add to Care Circle
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
