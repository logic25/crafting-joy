import { useState, useEffect } from "react";
import { Copy, Share2, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const APP_URL = window.location.origin;

function buildEmailText(accessCode: string) {
  return `Subject: Join Mom's CareCircle — I need your help coordinating her care

Hey!

I set up an app called CareCircle so we can coordinate Mom's care in one place instead of scattered group texts. It tracks her medications, appointments, vitals, and has an AI assistant you can ask anything about her health.

Here's how to get started (takes 2 minutes):

1. Go to ${APP_URL}
2. Click "Get started" and then "Sign up"
3. Enter this access code when asked: ${accessCode || "[ACCESS CODE]"}
4. Fill in your name and you're in!

Once you're in, the app will give you a quick tour so you know where everything is.

Let me know if you have any questions!`;
}

export function InviteEmailSheet() {
  const [accessCode, setAccessCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Try to fetch access code from app_settings
    const fetchCode = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "access_code")
        .maybeSingle();
      if (data?.value) {
        setAccessCode(data.value);
      }
    };
    fetchCode();
  }, []);

  const emailText = buildEmailText(accessCode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailText);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Mom's CareCircle",
          text: emailText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Mail className="h-4 w-4" />
          Send Invite
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invite Family Members</SheetTitle>
          <SheetDescription>
            Copy this message and paste it into an email, text, or any messaging app.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Access code input */}
          <div className="space-y-2">
            <Label htmlFor="access-code">Access Code</Label>
            <Input
              id="access-code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter your circle's access code"
            />
            <p className="text-xs text-muted-foreground">
              This code lets your family join your care circle.
            </p>
          </div>

          {/* Email preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {emailText}
            </pre>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
