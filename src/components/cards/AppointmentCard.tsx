 import { Calendar, Clock, MapPin, User, AlertTriangle } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Appointment } from "@/types";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 interface AppointmentCardProps {
   appointment: Appointment;
   compact?: boolean;
 }
 
 export function AppointmentCard({ appointment, compact = false }: AppointmentCardProps) {
   const needsCoverage = appointment.coverageStatus === "needs-coverage";
   const dateFormatted = format(appointment.dateTime, "EEE, MMM d");
   const timeFormatted = format(appointment.dateTime, "h:mm a");
 
   return (
     <Card
       className={cn(
         "overflow-hidden transition-all duration-200 hover:shadow-elevated",
         needsCoverage && "border-warning border-2"
       )}
     >
       <CardContent className={cn("p-4", compact && "p-3")}>
         <div className="flex flex-col gap-3">
           {/* Date & Time */}
           <div className="flex items-start justify-between">
             <div className="flex items-center gap-2 text-primary font-semibold">
               <Calendar className="h-4 w-4" />
               <span>{dateFormatted}</span>
               <span className="text-muted-foreground">@</span>
               <Clock className="h-4 w-4 text-muted-foreground" />
               <span>{timeFormatted}</span>
             </div>
             <Badge
               variant="secondary"
               className={cn(
                 "capitalize text-xs",
                 appointment.type === "specialist" && "bg-accent text-accent-foreground"
               )}
             >
               {appointment.type.replace("-", " ")}
             </Badge>
           </div>
 
           {/* Doctor & Specialty */}
           <div>
             <h3 className="font-semibold text-lg text-foreground">
               {appointment.provider.name}
             </h3>
             <p className="text-muted-foreground">{appointment.provider.specialty}</p>
           </div>
 
           {/* Location */}
           {!compact && (
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <MapPin className="h-4 w-4" />
               <span>{appointment.location}</span>
             </div>
           )}
 
           {/* Caregiver Assignment */}
           <div className="flex items-center justify-between pt-2 border-t border-border">
             {appointment.assignedCaregiver ? (
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <User className="h-4 w-4 text-primary" />
                 </div>
                 <span className="text-sm font-medium">
                   {appointment.assignedCaregiver.name} attending
                 </span>
               </div>
             ) : (
               <div className="flex items-center gap-2 text-warning">
                 <AlertTriangle className="h-4 w-4" />
                 <span className="text-sm font-medium">Need someone to attend</span>
               </div>
             )}
 
             {needsCoverage && (
               <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
                 Request Coverage
               </Button>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }