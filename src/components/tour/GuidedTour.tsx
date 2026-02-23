import { useState, useEffect, useCallback } from "react";
import { MessageCircle, LayoutDashboard, Heart, AlertCircle, Users, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TOUR_KEY = "carethread_tour_completed";

interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  target: string; // nav path for highlighting
}

const tourSteps: TourStep[] = [
  {
    icon: MessageCircle,
    title: "Chat with Circle AI",
    description: "Ask anything about Mom's care — medications, appointments, what happened today.",
    target: "/",
  },
  {
    icon: LayoutDashboard,
    title: "Your Dashboard",
    description: "See Mom's vitals, upcoming appointments, and what the family has been doing at a glance.",
    target: "/dashboard",
  },
  {
    icon: Heart,
    title: "Care Hub",
    description: "Track medications, log blood pressure and weight, manage appointments and doctors.",
    target: "/medications",
  },
  {
    icon: AlertCircle,
    title: "ER Card",
    description: "One-tap access to everything a first responder needs: allergies, meds, doctors, preferred hospital.",
    target: "/emergency",
  },
  {
    icon: Users,
    title: "Family Circle",
    description: "See who's in your care circle and invite more family members.",
    target: "/family",
  },
];

export function GuidedTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) {
      // Small delay so the app renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  }, [currentStep, completeTour]);

  if (!visible) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Tour Card */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 fade-in duration-300">
          {/* Skip button */}
          <div className="flex justify-end -mt-1 -mr-1 mb-2">
            <button
              onClick={completeTour}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"
              aria-label="Skip tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <Icon className="h-7 w-7 text-primary" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={completeTour}>
              Skip
            </Button>
            <Button className="flex-1 gap-2" onClick={nextStep}>
              {isLast ? "Got it!" : "Next"}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            {currentStep + 1} of {tourSteps.length}
          </p>
        </div>
      </div>
    </>
  );
}
