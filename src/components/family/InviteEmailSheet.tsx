import { useState, useEffect } from "react";
import { Copy, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
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

I set up an app called CareCircle so we can coordinate Mom's care in one place instead of scattered group texts. It tracks medications, appointments, vitals, and has an AI assistant named Circle you can ask questions about Mom's health.

━━━━━━━━━━━━━━━━━━━━
📲 GETTING STARTED (2 min)
━━━━━━━━━━━━━━━━━━━━

1. Open this link on your phone: ${APP_URL}
2. Tap "Get started" → "Sign up"
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
✅ FIRST THINGS TO DO
━━━━━━━━━━━━━━━━━━━━

Once you're in, start adding Mom's info:
  • Add her medications (tap Medications → + button)
  • Add her doctors (tap Doctors → + button)
  • Add upcoming appointments
  • Log a blood pressure or weight reading

━━━━━━━━━━━━━━━━━━━━
💬 USING CIRCLE (AI Assistant)
━━━━━━━━━━━━━━━━━━━━

After adding some info, go to the Chat tab and ask Circle:
  • "What meds does Mom take?"
  • "When is her next appointment?"
  • "What should we ask Dr. Smith at the next visit?"

━━━━━━━━━━━━━━━━━━━━

The app will give you a quick tour so you know where everything is. Let me know if you have any questions!`;
}

export function InviteEmailSheet() {
  const [open, setOpen] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildEmailText(accessCode));
      setCopied(true);
      toast.success("Invite message copied! Paste it into any messaging app.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

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
            Copy this message and paste it into iMessage, WhatsApp, email — whatever you use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2 flex-1 overflow-hidden flex flex-col">
          {/* Access code */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Access Code</p>
            <p className="font-mono text-lg font-bold text-foreground tracking-wider">
              {accessCode || "Loading..."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Share this verbally or include it in the message below
            </p>
          </div>

          {/* Message preview — always visible */}
          <ScrollArea className="flex-1 min-h-0 max-h-[40vh] rounded-lg border border-border bg-muted/20 p-4">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {buildEmailText(accessCode)}
            </pre>
          </ScrollArea>

          {/* Copy button */}
          <Button className="w-full gap-2 h-12 text-base" onClick={handleCopy}>
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            {copied ? "Copied! Now paste it anywhere" : "Copy Invite Text"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
