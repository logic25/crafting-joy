import { AppLayout } from "@/components/layout/AppLayout";

const Privacy = () => {
  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">What We Collect</h2>
            <p className="text-sm text-muted-foreground">
              CareCircle collects information you voluntarily provide about yourself and your care recipient, including health vitals, medications, appointments, emergency contacts, and uploaded documents. We also collect your email address and name for authentication.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">How We Use It</h2>
            <p className="text-sm text-muted-foreground">
              Your data is used solely to provide the CareCircle service — coordinating care within your family circle. We do not sell, share, or monetize your health information. AI features analyze your data only to provide health insights within your circle.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
            <p className="text-sm text-muted-foreground">
              All data is encrypted in transit (TLS) and at rest. Access is restricted to members of your care circle through row-level security policies. Sessions automatically expire after 30 minutes of inactivity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Data Sharing</h2>
            <p className="text-sm text-muted-foreground">
              Data is only shared with members you invite to your care circle. We do not share data with third parties, advertisers, or data brokers. AI processing happens on secure servers and no health data is used to train models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
            <p className="text-sm text-muted-foreground">
              You can export or delete your data at any time. Contact us to request full account deletion. California residents have additional rights under CCPA.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="text-sm text-muted-foreground">
              For privacy questions, contact us at privacy@carecircle.app
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground italic">
          This is a summary privacy policy. We recommend replacing this with a professionally generated policy from a service like Termly or Iubenda before sharing broadly.
        </p>
      </div>
    </AppLayout>
  );
};

export default Privacy;
