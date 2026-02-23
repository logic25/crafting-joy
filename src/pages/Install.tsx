import { useState, useEffect } from "react";
import { Download, Share, ChevronRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Already Installed!</h1>
          <p className="text-muted-foreground">CareThread is on your home screen. You're all set.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Download className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Install CareThread</h1>
          <p className="text-muted-foreground">Add CareThread to your home screen for quick access — works just like a native app.</p>
        </div>

        {deferredPrompt ? (
          <Button onClick={handleInstall} className="gradient-primary w-full gap-2" size="lg">
            <Download className="h-5 w-5" /> Install App
          </Button>
        ) : isIOS ? (
          <div className="rounded-xl border border-border bg-card p-5 text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">On iPhone / iPad:</p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Share className="h-5 w-5 text-primary shrink-0" />
              <span>Tap the <strong>Share</strong> button in Safari</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <ChevronRight className="h-5 w-5 text-primary shrink-0" />
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Open this page in Chrome or Safari to install.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
