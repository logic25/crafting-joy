import { useState } from "react";
import { Calendar, List, Plus, ChevronLeft, ChevronRight, MapPin, Clock, User, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import { appointments } from "@/data/mockData";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { AddAppointmentSheet } from "@/components/appointments/AddAppointmentSheet";

type ViewMode = "list" | "calendar";

const Appointments = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "scheduled")
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);

  const getAppointmentsForDay = (day: Date) =>
    appointments.filter((apt) => isSameDay(new Date(apt.dateTime), day));

  return (
    <AppLayout>
      <div className="space-y-5 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="text-sm text-muted-foreground">Manage Mom's upcoming visits</p>
          </div>
          <AddAppointmentSheet />
        </div>

        {/* View Toggle */}
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

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-3">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((apt) => {
                const needsCoverage = apt.coverageStatus === "needs-coverage";
                return (
                  <div
                    key={apt.id}
                    className={cn(
                      "rounded-xl border bg-card shadow-card overflow-hidden transition-all",
                      needsCoverage && "border-warning"
                    )}
                  >
                    <div className="p-4">
                      {/* Date/Time + Type Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{format(apt.dateTime, "EEE, MMM d")}</span>
                          <span className="text-muted-foreground font-normal">@</span>
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{format(apt.dateTime, "h:mm a")}</span>
                        </div>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {apt.type.replace("-", " ")}
                        </Badge>
                      </div>

                      {/* Provider */}
                      <h3 className="font-semibold text-lg text-foreground">{apt.provider.name}</h3>
                      <p className="text-sm text-muted-foreground">{apt.provider.specialty}</p>

                      {/* Purpose */}
                      <p className="text-sm text-foreground mt-2">{apt.purpose}</p>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{apt.location}</span>
                      </div>

                      {/* Questions to Ask */}
                      {apt.questionsToAsk && apt.questionsToAsk.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <HelpCircle className="h-3.5 w-3.5 text-primary" />
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions to Ask</p>
                          </div>
                          <ul className="space-y-1">
                            {apt.questionsToAsk.map((q, i) => (
                              <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                <span className="text-muted-foreground mt-0.5">•</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Coverage */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        {apt.assignedCaregiver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-foreground">{apt.assignedCaregiver.name}</span>
                              <span className="text-sm text-muted-foreground ml-1">is going</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-warning">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Needs someone to attend</span>
                          </div>
                        )}

                        <div className="flex gap-1.5">
                          {apt.assignedCaregiver && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground">
                              I can't go
                            </Button>
                          )}
                          {needsCoverage && (
                            <Button size="sm" variant="outline" className="h-7 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              I'll go
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No upcoming appointments</h3>
                <p className="text-muted-foreground">Add an appointment to get started</p>
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
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
                const needsCoverage = dayAppointments.some((a) => a.coverageStatus === "needs-coverage");

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
