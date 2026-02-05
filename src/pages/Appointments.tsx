 import { useState } from "react";
 import { Calendar, List, Plus } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { AppointmentCard } from "@/components/cards/AppointmentCard";
 import { appointments } from "@/data/mockData";
 import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
 import { cn } from "@/lib/utils";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 
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
 
   // Pad start of month to align with weekday
   const startPadding = monthStart.getDay();
   const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);
 
   const getAppointmentsForDay = (day: Date) => {
     return appointments.filter((apt) => isSameDay(new Date(apt.dateTime), day));
   };
 
   return (
     <AppLayout>
       <div className="space-y-6 pb-24 md:pb-6">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
             <p className="text-muted-foreground">Manage upcoming and past visits</p>
           </div>
           <Button className="gradient-primary gap-2">
             <Plus className="h-4 w-4" />
             <span className="hidden sm:inline">Add Appointment</span>
           </Button>
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
           <div className="space-y-4">
             {upcomingAppointments.length > 0 ? (
               upcomingAppointments.map((apt) => (
                 <AppointmentCard key={apt.id} appointment={apt} />
               ))
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
           <div className="bg-card rounded-xl border border-border p-4">
             {/* Month Navigation */}
             <div className="flex items-center justify-between mb-4">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
               >
                 <ChevronLeft className="h-5 w-5" />
               </Button>
               <h2 className="font-semibold text-lg">
                 {format(currentMonth, "MMMM yyyy")}
               </h2>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
               >
                 <ChevronRight className="h-5 w-5" />
               </Button>
             </div>
 
             {/* Weekday Headers */}
             <div className="grid grid-cols-7 gap-1 mb-2">
               {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                 <div
                   key={day}
                   className="text-center text-xs font-medium text-muted-foreground py-2"
                 >
                   {day}
                 </div>
               ))}
             </div>
 
             {/* Calendar Grid */}
             <div className="grid grid-cols-7 gap-1">
               {paddedDays.map((day, idx) => {
                 if (!day) {
                   return <div key={`pad-${idx}`} className="aspect-square" />;
                 }
 
                 const dayAppointments = getAppointmentsForDay(day);
                 const isToday = isSameDay(day, new Date());
                 const hasAppointment = dayAppointments.length > 0;
                 const needsCoverage = dayAppointments.some(
                   (apt) => apt.coverageStatus === "needs-coverage"
                 );
 
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
                       <span
                         className={cn(
                           "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                           needsCoverage ? "bg-warning" : "bg-success"
                         )}
                       />
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