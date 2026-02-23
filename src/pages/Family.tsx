 import { Phone, Mail, Shield, Clock } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { caregivers, activityLog } from "@/data/mockData";
 import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { InviteEmailSheet } from "@/components/family/InviteEmailSheet";
import { AddMemberSheet } from "@/components/family/AddMemberSheet";
 
 const roleConfig = {
   admin: { label: "Admin", color: "bg-primary text-primary-foreground" },
   caregiver: { label: "Caregiver", color: "bg-success text-success-foreground" },
   "view-only": { label: "View Only", color: "bg-muted text-muted-foreground" },
 };
 
 const Family = () => {
   const getLastActivity = (caregiverId: string) => {
     const activity = activityLog.find((entry) => entry.caregiverId === caregiverId);
     return activity ? formatDistanceToNow(activity.timestamp, { addSuffix: true }) : "No recent activity";
   };
 
   return (
     <AppLayout>
       <div className="space-y-6 pb-24 md:pb-6">
         {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Family Members</h1>
              <p className="text-muted-foreground">
                {caregivers.length} caregivers coordinating care
              </p>
            </div>
            <div className="flex gap-2">
              <AddMemberSheet />
              <InviteEmailSheet />
            </div>
          </div>
 
         {/* Family Members */}
         <div className="space-y-4">
           {caregivers.map((caregiver) => {
             const role = roleConfig[caregiver.role];
             const lastActivity = getLastActivity(caregiver.id);
 
             return (
               <Card key={caregiver.id} className="overflow-hidden">
                 <CardContent className="p-4">
                   <div className="flex items-start gap-4">
                     {/* Avatar */}
                     <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                       <span className="text-xl font-bold text-primary-foreground">
                         {caregiver.name.charAt(0)}
                       </span>
                     </div>
 
                     {/* Info */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-semibold text-lg">{caregiver.name}</h3>
                         <Badge className={cn("text-xs", role.color)}>
                           <Shield className="h-3 w-3 mr-1" />
                           {role.label}
                         </Badge>
                       </div>
 
                       <div className="space-y-1 text-sm text-muted-foreground">
                         <div className="flex items-center gap-2">
                           <Phone className="h-4 w-4" />
                           <span>{caregiver.phone}</span>
                         </div>
                         {caregiver.email && (
                           <div className="flex items-center gap-2">
                             <Mail className="h-4 w-4" />
                             <span>{caregiver.email}</span>
                           </div>
                         )}
                         <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4" />
                           <span>Active {lastActivity}</span>
                         </div>
                       </div>
                     </div>
 
                     {/* Actions */}
                     <div className="flex flex-col gap-2">
                       <Button size="sm" variant="outline">
                         <Phone className="h-4 w-4" />
                       </Button>
                       {caregiver.email && (
                         <Button size="sm" variant="outline">
                           <Mail className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           })}
         </div>
 
         {/* Activity Log */}
         <Card>
           <CardHeader>
             <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               {activityLog.map((entry) => (
                 <div key={entry.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                     <span className="text-sm font-semibold text-primary">
                       {entry.caregiverName.charAt(0)}
                     </span>
                   </div>
                   <div className="flex-1">
                     <p className="text-sm">
                       <span className="font-medium">{entry.caregiverName}</span>{" "}
                       {entry.description}
                     </p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 };
 
 export default Family;