 import { useNavigate } from "react-router-dom";
 import { CalendarPlus, Pill, AlertCircle, ChevronRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { AppointmentCard } from "@/components/cards/AppointmentCard";
 import { MedicationCard } from "@/components/cards/MedicationCard";
 import { QuickActionCard } from "@/components/cards/QuickActionCard";
 import { ActivityCard } from "@/components/cards/ActivityCard";
 import { appointments, medications, activityLog, careRecipient } from "@/data/mockData";
 
 const Dashboard = () => {
   const navigate = useNavigate();
   
   // Get upcoming appointments (next 3)
   const upcomingAppointments = appointments
     .filter((apt) => apt.status === "scheduled")
     .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
     .slice(0, 3);
 
   // Get medications needing refill
   const refillsDue = medications.filter(
     (med) => med.status === "active" && (med.refillStatus === "due-soon" || med.refillStatus === "overdue")
   );
 
   // Get recent activity
   const recentActivity = activityLog.slice(0, 3);
 
   return (
     <AppLayout>
       <div className="space-y-6 pb-24 md:pb-6">
         {/* Welcome Section */}
         <div>
           <h1 className="text-2xl font-bold text-foreground">
             Good morning 👋
           </h1>
           <p className="text-muted-foreground">
             Here's what's happening with {careRecipient.name}'s care
           </p>
         </div>
 
         {/* Quick Actions */}
         <div className="grid grid-cols-3 gap-3">
           <QuickActionCard
             icon={CalendarPlus}
             label="Add Appointment"
             variant="primary"
             onClick={() => navigate("/appointments")}
           />
           <QuickActionCard
             icon={Pill}
             label="Add Medication"
             onClick={() => navigate("/medications")}
           />
           <QuickActionCard
             icon={AlertCircle}
             label="Emergency Info"
             variant="emergency"
             onClick={() => navigate("/emergency")}
           />
         </div>
 
         {/* Upcoming Appointments */}
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-lg font-semibold flex items-center gap-2">
               📋 Upcoming Appointments
             </CardTitle>
             <Button
               variant="ghost"
               size="sm"
               className="text-primary"
               onClick={() => navigate("/appointments")}
             >
               View All <ChevronRight className="h-4 w-4 ml-1" />
             </Button>
           </CardHeader>
           <CardContent className="space-y-3">
             {upcomingAppointments.length > 0 ? (
               upcomingAppointments.map((apt) => (
                 <AppointmentCard key={apt.id} appointment={apt} compact />
               ))
             ) : (
               <p className="text-muted-foreground text-center py-6">
                 No upcoming appointments
               </p>
             )}
           </CardContent>
         </Card>
 
         {/* Refills Due Soon */}
         {refillsDue.length > 0 && (
           <Card className="border-warning">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-lg font-semibold flex items-center gap-2">
                 💊 Refills Due Soon
               </CardTitle>
               <Button
                 variant="ghost"
                 size="sm"
                 className="text-primary"
                 onClick={() => navigate("/medications")}
               >
                 View All <ChevronRight className="h-4 w-4 ml-1" />
               </Button>
             </CardHeader>
             <CardContent className="space-y-3">
               {refillsDue.map((med) => (
                 <MedicationCard key={med.id} medication={med} compact />
               ))}
             </CardContent>
           </Card>
         )}
 
         {/* Recent Updates */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-lg font-semibold flex items-center gap-2">
               🔔 Recent Updates
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="divide-y divide-border">
               {recentActivity.map((entry) => (
                 <ActivityCard key={entry.id} entry={entry} />
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 };
 
 export default Dashboard;
