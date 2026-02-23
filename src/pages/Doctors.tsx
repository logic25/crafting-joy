import { Phone, MapPin, Clock, Stethoscope, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AddProviderSheet } from "@/components/doctors/AddProviderSheet";
import { EditProviderSheet } from "@/components/doctors/EditProviderSheet";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Doctors = () => {
  const { data: circle } = useCareCircle();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("providers").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Couldn't delete provider.", variant: "destructive" });
    } else {
      toast({ title: "Provider deleted" });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    }
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["providers"] });

  const doctors = providers.filter((p) => p.type === "doctor");
  const pharmacies = providers.filter((p) => p.type !== "doctor");

  const ProviderActions = ({ provider }: { provider: typeof providers[0] }) => (
    <div className="flex items-center gap-1">
      <EditProviderSheet provider={provider} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete provider?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove {provider.name}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(provider.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Doctors & Providers</h1>
            <p className="text-sm text-muted-foreground">Mom's care team contacts</p>
          </div>
          <AddProviderSheet onAdded={invalidate} />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card animate-pulse h-28" />
            ))}
          </div>
        ) : doctors.length === 0 && pharmacies.length === 0 ? (
          <div className="text-center py-16">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg text-foreground">No providers yet</h3>
            <p className="text-muted-foreground mt-1">Add Mom's doctors and pharmacy to get started</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {doctors.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{doc.name}</h3>
                      <p className="text-sm text-primary font-medium">{doc.specialty}</p>
                    </div>
                    <ProviderActions provider={doc} />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {doc.phone && (
                      <a href={`tel:${doc.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {doc.phone}
                      </a>
                    )}
                    {doc.address_street && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {doc.address_street}, {doc.address_city}
                      </p>
                    )}
                    {doc.office_hours && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {doc.office_hours}
                      </p>
                    )}
                  </div>
                  {doc.notes && (
                    <p className="mt-2 text-xs text-muted-foreground italic">💡 {doc.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {pharmacies.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-foreground pt-2">Pharmacy</h2>
                {pharmacies.map((p) => (
                  <div key={p.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                      <ProviderActions provider={p} />
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {p.phone && (
                        <a href={`tel:${p.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.phone}
                        </a>
                      )}
                      {p.address_street && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {p.address_street}, {p.address_city}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Doctors;
