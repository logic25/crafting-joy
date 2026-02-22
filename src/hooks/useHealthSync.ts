import { useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { useToast } from "@/hooks/use-toast";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useLogHealthReading } from "@/hooks/useHealthReadings";

// Dynamically import to avoid errors on web
const getHealthPlugin = async () => {
  if (!Capacitor.isNativePlatform()) return null;
  const { Health } = await import("@capgo/capacitor-health");
  return Health;
};

export function useHealthSync() {
  const { toast } = useToast();
  const { data: circle } = useCareCircle();
  const logReading = useLogHealthReading();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const isAvailable = Capacitor.isNativePlatform();

  const requestPermissions = useCallback(async () => {
    const Health = await getHealthPlugin();
    if (!Health) return false;

    try {
      const { available } = await Health.isAvailable();
      if (!available) {
        toast({ title: "Health not available", description: "HealthKit is not available on this device.", variant: "destructive" });
        return false;
      }

      await Health.requestAuthorization({
        read: ["weight", "heartRate"],
        write: [],
      });
      return true;
    } catch (err) {
      console.error("Health permission error:", err);
      toast({ title: "Permission denied", description: "Please allow health access in Settings.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const syncWeight = useCallback(async () => {
    if (!circle || syncing) return;
    const Health = await getHealthPlugin();
    if (!Health) return;

    setSyncing(true);
    try {
      const now = new Date();
      const since = lastSync || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const result = await Health.readSamples({
        dataType: "weight",
        startDate: since.toISOString(),
        endDate: now.toISOString(),
        limit: 50,
      });

      let count = 0;
      for (const sample of result.samples) {
        // Plugin returns weight in kg by default
        const weightLbs = Math.round(sample.value * 2.20462 * 10) / 10;

        await logReading.mutateAsync({
          care_circle_id: circle.careCircleId,
          care_recipient_id: circle.careRecipientId,
          type: "weight",
          value_primary: weightLbs,
          unit: "lbs",
          source: "apple_health",
        });
        count++;
      }

      toast({ title: "Weight synced", description: `${count} readings imported from Health.` });
      setLastSync(now);
    } catch (err) {
      console.error("Health sync error:", err);
      toast({ title: "Sync failed", description: "Could not read health data.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }, [circle, syncing, lastSync, logReading, toast]);

  return {
    isAvailable,
    syncing,
    lastSync,
    requestPermissions,
    syncWeight,
  };
}
