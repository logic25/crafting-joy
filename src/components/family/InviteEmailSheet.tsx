import { useState, useEffect } from "react";
import { Copy, Check, Mail, Plus, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const APP_URL = window.location.origin;

function buildEmailText(accessCode: string) {
  return `Hey!

I set up an app called CareCircle so we can coordinate Mom's care in one place instead of scattered group texts. It tracks her medications, appointments, vitals, and has an AI assistant named Circle you can ask anything about Mom's health.

━━━━━━━━━━━━━━━━━━━━
📲 GETTING STARTED (2 min)
━━━━━━━━━━━━━━━━━━━━

1. Open this link on your phone: ${APP_URL}
2. Click "Get started" → "Sign up"
3. Enter this access code: ${accessCode || "[ACCESS CODE]"}
4. Fill in your name — you're in!

━━━━━━━━━━━━━━━━━━━━
📌 INSTALL IT LIKE AN APP
━━━━━━━━━━━━━━━━━━━━

iPhone (Safari):
  • Tap the Share button (square with arrow)
  • Scroll down → "Add to Home Screen"

Android (Chrome):
  • Tap the ⋮ menu (top right)
  • Tap "Add to Home Screen" or "Install App"

Or visit: ${APP_URL}/install for step-by-step instructions.

━━━━━━━━━━━━━━━━━━━━
💬 USING CIRCLE (AI Assistant)
━━━━━━━━━━━━━━━━━━━━

Go to the Chat tab and ask Circle anything about Mom:
  • "What meds does Mom take?"
  • "When is her next appointment?"
  • "Is her blood pressure trending up?"
  • "What should we ask Dr. Fuzaylov?"

━━━━━━━━━━━━━━━━━━━━

Once you're in, the app will give you a quick tour so you know where everything is. Let me know if you have any questions!`;
}

function buildMailtoLink(emails: string[], accessCode: string) {
  const subject = encodeURIComponent("Join Mom's CareCircle — I need your help coordinating her care");
  const body = encodeURIComponent(buildEmailText(accessCode));
  const to = emails.filter(e => e.trim()).map(e => encodeURIComponent(e.trim())).join(",");
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export function InviteEmailSheet() {
  const [open, setOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [emails, setEmails] = useState<string[]>([""]);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchCode = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "access_code")
        .maybeSingle();
      if (data?.value) setAccessCode(data.value);
    };
    fetchCode();
  }, []);

  const addEmailField = () => {
    if (emails.length < 10) setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const validEmails = emails.filter(e => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()));

  const handleSendEmail = () => {
    if (validEmails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }
    window.open(buildMailtoLink(validEmails, accessCode), "_blank");
    toast.success(`Opening email client for ${validEmails.length} recipient${validEmails.length > 1 ? "s" : ""}!`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildEmailText(accessCode));
      setCopied(true);
      toast.success("Invite message copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const emailText = buildEmailText(accessCode);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Mail className="h-4 w-4" />
          Send Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Invite Family Members</DialogTitle>
          <DialogDescription>
            Add email addresses and we'll open your email app with the invite ready to send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 flex-1 overflow-hidden flex flex-col">
          {/* Email inputs */}
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            {emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(i, e.target.value)}
                  placeholder={i === 0 ? "brother@email.com" : "sibling@email.com"}
                  className="flex-1"
                />
                {emails.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => removeEmailField(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {emails.length < 10 && (
              <Button variant="ghost" size="sm" className="text-primary gap-1" onClick={addEmailField}>
                <Plus className="h-3 w-3" /> Add another
              </Button>
            )}
          </div>

          {/* Access code display */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Access Code</p>
            <p className="font-mono font-semibold text-foreground">{accessCode || "Loading..."}</p>
          </div>

          {/* Message preview toggle */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5 px-0 hover:text-foreground"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Hide message preview" : "Preview invite message"}
            </Button>
            {showPreview && (
              <ScrollArea className="mt-2 h-48 rounded-lg border border-border bg-muted/20 p-4">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {emailText}
                </pre>
              </ScrollArea>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <Button className="w-full gap-2" onClick={handleSendEmail} disabled={validEmails.length === 0}>
              <Mail className="h-4 w-4" />
              Open Email App{validEmails.length > 0 ? ` (${validEmails.length})` : ""}
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Invite Text"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
