import { useState } from "react";
import { Calendar, List, MapPin, Clock, User, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, CalendarDays, Hand, XCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { AddAppointmentSheet } from "@/components/appointments/AddAppointmentSheet";
import { VisitSummarySheet } from "@/components/appointments/VisitSummarySheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCareCircle } from "@/hooks/useCareCircle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type ViewMode = "list" | "calendar";

const Appointments = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: circle } = useCareCircle();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", circle?.careCircleId],
    enabled: !!circle?.careCircleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("care_circle_id", circle!.careCircleId)
        .order("date_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const now = new Date();
  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "scheduled" && new Date(apt.date_time) >= now)
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());

  const pastAppointments = appointments
    .filter((apt) => apt.status === "completed" || (apt.status === "scheduled" && new Date(apt.date_time) < now))
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  const handleVolunteer = async (aptId: string) => {
    if (!user) return;
    const name = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") || user.email || "You";
    const { error } = await supabase
      .from("appointments")
      .update({ assigned_caregiver_id: user.id, assigned_caregiver_name: name, coverage_status: "assigned" })
      .eq("id", aptId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  };

  const handleUnclaim = async (aptId: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ assigned_caregiver_id: null, assigned_caregiver_name: null, coverage_status: "needs-coverage" })
      .eq("id", aptId);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.date_time), day));

  const renderAppointmentCard = (apt: typeof appointments[0], isPast: boolean) => {
    const needsCoverage = apt.coverage_status === "needs-coverage";
    const isMyAssignment = apt.assigned_caregiver_id === user?.id;

    return (
      <div
        key={apt.id}
        className={cn(
          "rounded-xl border bg-card shadow-card overflow-hidden transition-all",
          needsCoverage && !isPast && "border-warning"
        )}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(apt.date_time), "EEE, MMM d")}</span>
              <span className="text-muted-foreground font-normal">@</span>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{format(new Date(apt.date_time), "h:mm a")}</span>
            </div>
            <Badge variant="secondary" className="capitalize text-xs">
              {apt.type.replace("-", " ")}
            </Badge>
          </div>

          <h3 className="font-semibold text-lg text-foreground">{apt.provider_name}</h3>
          {apt.provider_specialty && (
            <p className="text-sm text-muted-foreground">{apt.provider_specialty}</p>
          )}
          <p className="text-sm text-foreground mt-2">{apt.purpose}</p>

          {apt.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{apt.location}</span>
            </div>
          )}

          {!isPast && (apt as any).telehealth_url && (
            <a
              href={(apt as any).telehealth_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Video className="h-4 w-4" />
              Join Video Call
            </a>
          )}

          {!isPast && apt.questions_to_ask && apt.questions_to_ask.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions to Ask</p>
              </div>
              <ul className="space-y-1">
                {apt.questions_to_ask.map((q, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Visit summary for past */}
          {isPast && apt.visit_summary && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Visit Summary</p>
              <p className="text-sm text-foreground">{(apt.visit_summary as any)?.assessment?.slice(0, 120)}{(apt.visit_summary as any)?.assessment?.length > 120 ? "..." : ""}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            {apt.assigned_caregiver_name ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">{apt.assigned_caregiver_name}</span>
                  <span className="text-sm text-muted-foreground ml-1">{isPast ? "attended" : "is going"}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Needs someone to attend</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {!isPast && !apt.assigned_caregiver_name && (
                <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => handleVolunteer(apt.id)}>
                  <Hand className="h-3.5 w-3.5" /> I'll go
                </Button>
              )}
              {!isPast && isMyAssignment && (
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => handleUnclaim(apt.id)}>
                  <XCircle className="h-3.5 w-3.5" /> Can't make it
                </Button>
              )}
              {isPast && (
                <VisitSummarySheet
                  appointmentId={apt.id}
                  providerName={apt.provider_name}
                  existingSummary={apt.visit_summary}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="text-sm text-muted-foreground">Manage Mom's upcoming visits</p>
          </div>
          <AddAppointmentSheet />
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" /> List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" /> Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "list" && (
          <div className="space-y-6">
            {/* Upcoming */}
            <div className="space-y-3">
              {isLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card animate-pulse h-40" />
                ))
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => renderAppointmentCard(apt, false))
              ) : (
                <div className="text-center py-16">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg text-foreground">No upcoming appointments</h3>
                  <p className="text-muted-foreground mt-1">Add an appointment to get started</p>
                </div>
              )}
            </div>

            {/* Past */}
            {pastAppointments.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Past Appointments</h2>
                {pastAppointments.map((apt) => renderAppointmentCard(apt, true))}
              </div>
            )}
          </div>
        )}

        {viewMode === "calendar" && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, idx) => {
                if (!day) return <div key={`pad-${idx}`} className="aspect-square" />;

                const dayAppointments = getAppointmentsForDay(day);
                const isToday = isSameDay(day, new Date());
                const hasAppointment = dayAppointments.length > 0;
                const needsCoverage = dayAppointments.some((a) => a.coverage_status === "needs-coverage");

                return (
                  <button
                    key={day.toISOString()}
                    className={cn(
                      "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative",
                      isToday && "bg-primary text-primary-foreground font-semibold",
                      !isToday && isSameMonth(day, currentMonth) && "hover:bg-muted",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground/50"
                    )}
                  >
                    <span>{format(day, "d")}</span>
                    {hasAppointment && (
                      <span className={cn(
                        "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                        needsCoverage ? "bg-warning" : "bg-success"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Appointments;
