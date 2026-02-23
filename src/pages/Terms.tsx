import { AppLayout } from "@/components/layout/AppLayout";

const Terms = () => {
  return (
    <AppLayout>
      <div className="space-y-6 pb-24 md:pb-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 2026</p>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Acceptance</h2>
            <p className="text-sm text-muted-foreground">
              By using CareThread, you agree to these terms. If you don't agree, please don't use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">What CareCircle Is</h2>
            <p className="text-sm text-muted-foreground">
              CareThread is a family coordination tool for caregiving. It is <strong>not</strong> a medical device, does not provide medical advice, and should not be used as a substitute for professional healthcare. AI-generated insights are for informational purposes only.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Your Responsibilities</h2>
            <p className="text-sm text-muted-foreground">
              You are responsible for the accuracy of information you enter. You must have consent from your care recipient (or legal authority) to enter their health information. You must not share login credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Data Ownership</h2>
            <p className="text-sm text-muted-foreground">
              You own your data. We don't claim any rights to the health information you enter. You can export or delete your data at any time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground">
              CareThread is provided "as is." We are not liable for any health outcomes based on information in the app. Always consult healthcare professionals for medical decisions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p className="text-sm text-muted-foreground">
              Questions about these terms? Contact us at legal@thecarethread.com
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground italic">
          This is a placeholder terms of service. We recommend replacing this with professionally generated terms from a service like Termly or Iubenda.
        </p>
      </div>
    </AppLayout>
  );
};

export default Terms;
