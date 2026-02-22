import { Heart, MessageCircle, Shield, Users, Activity, Clock, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const features = [
  {
    icon: MessageCircle,
    title: "Ask Circle AI anything",
    description: "\"When is Mom's next appointment?\" \"What medications is she on?\" Get instant, context-aware answers about your loved one.",
  },
  {
    icon: Users,
    title: "Coordinate with siblings",
    description: "One shared space for updates, task assignments, and care notes. No more scattered group texts.",
  },
  {
    icon: Activity,
    title: "Track health trends",
    description: "Log blood pressure, weight, and vitals. AI spots patterns and flags concerns before they become emergencies.",
  },
  {
    icon: Shield,
    title: "Emergency info, one tap away",
    description: "Allergies, medications, doctors, preferred hospital — everything first responders need, instantly accessible.",
  },
  {
    icon: Clock,
    title: "Never miss a medication",
    description: "Track prescriptions, refill dates, and schedules. Snap a photo of a pill bottle and AI extracts the details.",
  },
  {
    icon: Heart,
    title: "Built for families, not hospitals",
    description: "Warm, simple, and designed for real people — not nurses with clipboards. Your family's private care journal.",
  },
];

const steps = [
  { number: "1", title: "Get your access code", description: "A family member shares the code with you" },
  { number: "2", title: "Create your account", description: "Sign up in 30 seconds with your email" },
  { number: "3", title: "Join the care circle", description: "Set up your family's shared care profile" },
  { number: "4", title: "Start coordinating", description: "Ask Circle AI questions, log vitals, share updates" },
];

const faqs = [
  {
    q: "Is this a medical app?",
    a: "No — CareCircle is a family coordination tool. It helps you track and share information about a loved one's care, but it's not a substitute for medical advice.",
  },
  {
    q: "Who can see my family's data?",
    a: "Only people in your care circle. Every piece of data is protected by role-based access and database-level security policies. Nobody outside your circle can see anything.",
  },
  {
    q: "How does the AI work?",
    a: "Circle AI reads your family's care data (medications, appointments, vitals) and answers questions in plain English. It also analyzes health readings and flags trends worth discussing with a doctor.",
  },
  {
    q: "Do I need to install anything?",
    a: "Nope — CareCircle works in any mobile or desktop browser. You can also install it as an app on your phone's home screen for a native-like experience.",
  },
  {
    q: "How do I get an access code?",
    a: "The person who created your family's care circle shares the code with you directly — via text, call, or in person. This keeps sign-ups limited to your family.",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, hasCircle } = useAuth();

  if (loading) return null;
  if (user && hasCircle) return <Navigate to="/" replace />;
  if (user && hasCircle === false) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">CareCircle</span>
          </div>
          <Button
            onClick={() => navigate("/auth")}
            size="sm"
            className="gradient-primary text-primary-foreground font-semibold"
          >
            Sign in
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
            <Heart className="h-3 w-3" />
            For families caring for aging parents
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Finally know the answer to{" "}
            <span className="text-primary">"How's Mom?"</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            CareCircle is the shared family journal for coordinating care. 
            Track medications, log vitals, manage appointments, and ask AI anything about Mom's health — all in one warm, simple app.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="gradient-primary text-primary-foreground font-semibold gap-2 h-12 px-8 text-base"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="h-12 px-8 text-base font-medium"
            >
              See how it works
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 md:py-20 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Everything your family needs</h2>
            <p className="text-muted-foreground mt-2">Built for real families, not healthcare professionals</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl border border-border/60 p-6 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Up and running in minutes</h2>
            <p className="text-muted-foreground mt-2">No downloads, no complicated setup</p>
          </div>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
                  {step.number}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 md:py-20 bg-card/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Common questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-card rounded-xl border border-border/60 p-5">
                <h3 className="font-semibold text-foreground">{faq.q}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Your family deserves better than group texts
          </h2>
          <p className="text-muted-foreground text-lg">
            Start coordinating Mom's care in one shared, AI-powered space.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            className="gradient-primary text-primary-foreground font-semibold gap-2 h-12 px-8 text-base"
          >
            Create your care circle
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <span>CareCircle</span>
          </div>
          <div className="flex gap-6">
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
