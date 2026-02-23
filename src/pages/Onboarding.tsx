import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart, Users, UserPlus, ArrowRight, ArrowLeft,
  Loader2, Check, Sparkles,
} from "lucide-react";

const STEPS = [
  { icon: Heart, title: "Name your circle", subtitle: "Who are you caring for?" },
  { icon: Users, title: "About your loved one", subtitle: "Basic information to get started" },
  { icon: UserPlus, title: "Invite family", subtitle: "Add caregivers to your circle" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, hasCircle, refreshCircleStatus } = useAuth();
  const { toast } = useToast();

  // Circle info
  const [circleName, setCircleName] = useState("");
  // Care recipient info
  const [recipientName, setRecipientName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [primaryDoctor, setPrimaryDoctor] = useState("");
  const [preferredHospital, setPreferredHospital] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  // Invites
  const [inviteEmails, setInviteEmails] = useState<string[]>([""]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (hasCircle) return <Navigate to="/" replace />;

  const canProceed = () => {
    if (step === 0) return circleName.trim().length > 0;
    if (step === 1) return recipientName.trim().length > 0;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Create care circle
      const { data: circle, error: circleError } = await supabase
        .from("care_circles")
        .insert({ name: circleName.trim(), created_by: user.id })
        .select()
        .single();
      if (circleError) throw circleError;

      // 2. Add self as admin member
      const { error: memberError } = await supabase
        .from("care_circle_members")
        .insert({
          care_circle_id: circle.id,
          user_id: user.id,
          role: "admin" as const,
        });
      if (memberError) throw memberError;

      // 3. Create care recipient
      const conditions = medicalConditions
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const { error: recipientError } = await supabase
        .from("care_recipients")
        .insert({
          care_circle_id: circle.id,
          name: recipientName.trim(),
          date_of_birth: dateOfBirth || null,
          primary_care_doctor: primaryDoctor.trim() || null,
          preferred_hospital: preferredHospital.trim() || null,
          medical_conditions: conditions,
        });
      if (recipientError) throw recipientError;

      // 4. Refresh circle status and navigate
      await refreshCircleStatus();
      toast({ title: "Welcome to CareThread! 🎉", description: `${circleName} is ready.` });
      navigate("/");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const addInviteField = () => setInviteEmails([...inviteEmails, ""]);
  const updateInvite = (idx: number, val: string) => {
    const updated = [...inviteEmails];
    updated[idx] = val;
    setInviteEmails(updated);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-2 max-w-md mx-auto">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                i <= step ? "gradient-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Step header */}
          <div className="text-center space-y-3 animate-fade-in" key={step}>
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-elevated">
              {(() => {
                const Icon = STEPS[step].icon;
                return <Icon className="h-7 w-7 text-primary-foreground" />;
              })()}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{STEPS[step].title}</h1>
            <p className="text-muted-foreground text-sm">{STEPS[step].subtitle}</p>
          </div>

          {/* Step content */}
          <div className="space-y-4 animate-fade-in" key={`content-${step}`}>
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="circleName" className="text-xs">Circle name</Label>
                  <Input
                    id="circleName"
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    placeholder="e.g. Mom's Care Thread"
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>
                <div className="rounded-xl bg-accent/50 p-4 text-sm text-accent-foreground">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p>
                      A Care Thread is your private space for coordinating care.
                      Only people you invite can see it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recipientName" className="text-xs">Name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Mom"
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="text-xs">Date of birth (optional)</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doctor" className="text-xs">Primary care doctor (optional)</Label>
                  <Input
                    id="doctor"
                    value={primaryDoctor}
                    onChange={(e) => setPrimaryDoctor(e.target.value)}
                    placeholder="e.g. Dr. Smith"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hospital" className="text-xs">Preferred hospital (optional)</Label>
                  <Input
                    id="hospital"
                    value={preferredHospital}
                    onChange={(e) => setPreferredHospital(e.target.value)}
                    placeholder="e.g. Mount Sinai"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conditions" className="text-xs">
                    Medical conditions (comma separated, optional)
                  </Label>
                  <Textarea
                    id="conditions"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="e.g. Diabetes, Hypertension"
                    className="min-h-[80px] text-base resize-none"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {inviteEmails.map((email, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <Label className="text-xs">
                      {idx === 0 ? "Family member email" : `Member ${idx + 1}`}
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => updateInvite(idx, e.target.value)}
                      placeholder="sibling@email.com"
                      className="h-12 text-base"
                    />
                  </div>
                ))}
                {inviteEmails.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInviteField}
                    className="text-xs gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Add another
                  </Button>
                )}
                <div className="rounded-xl bg-accent/50 p-4 text-sm text-accent-foreground">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <p>
                      You can always invite more people later from the Family page.
                      Skip this if you want to start solo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={back}
                className="h-12 px-6"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button
              onClick={next}
              disabled={!canProceed() || loading}
              className="flex-1 h-12 gradient-primary text-primary-foreground font-semibold gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === STEPS.length - 1 ? (
                <>
                  <Check className="h-4 w-4" /> Get started
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
