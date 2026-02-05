 import { Pill } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Medication } from "@/types";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 interface MedicationCardProps {
   medication: Medication;
   compact?: boolean;
 }
 
 const statusConfig = {
   current: { color: "bg-success", label: "Current", icon: "🟢" },
   "due-soon": { color: "bg-warning", label: "Due Soon", icon: "🟡" },
   overdue: { color: "bg-destructive", label: "Overdue", icon: "🔴" },
   requested: { color: "bg-primary", label: "Requested", icon: "📋" },
   ready: { color: "bg-success", label: "Ready for Pickup", icon: "✅" },
   "picked-up": { color: "bg-muted", label: "Picked Up", icon: "✓" },
 };
 
 export function MedicationCard({ medication, compact = false }: MedicationCardProps) {
   const status = statusConfig[medication.refillStatus];
   const isDueSoon = medication.refillStatus === "due-soon" || medication.refillStatus === "overdue";
 
   return (
     <Card
       className={cn(
         "overflow-hidden transition-all duration-200 hover:shadow-elevated",
         isDueSoon && "border-warning border"
       )}
     >
       <CardContent className={cn("p-4", compact && "p-3")}>
         <div className="flex items-start justify-between">
           <div className="flex items-start gap-3">
             <div
               className={cn(
                 "w-10 h-10 rounded-xl flex items-center justify-center",
                 isDueSoon ? "bg-warning/10" : "bg-primary/10"
               )}
             >
               <Pill className={cn("h-5 w-5", isDueSoon ? "text-warning" : "text-primary")} />
             </div>
             <div>
               <h3 className="font-semibold text-lg text-foreground">
                 {medication.name} {medication.dosage}
               </h3>
               <p className="text-muted-foreground text-sm">
                 {medication.frequency} • {medication.purpose}
               </p>
               {medication.instructions && !compact && (
                 <p className="text-sm text-muted-foreground mt-1 italic">
                   {medication.instructions}
                 </p>
               )}
             </div>
           </div>
         </div>
 
         <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
           <div className="flex items-center gap-2">
             <span className="text-lg">{status.icon}</span>
             <span className="text-sm">
               Refill {isDueSoon ? "due" : "by"}{" "}
               <span className={cn("font-medium", isDueSoon && "text-warning")}>
                 {format(medication.refillDueDate, "MMM d")}
               </span>
             </span>
           </div>
 
           {isDueSoon && (
             <Button size="sm" variant="outline" className="border-warning text-warning hover:bg-warning hover:text-warning-foreground">
               Mark as Requested
             </Button>
           )}
         </div>
       </CardContent>
     </Card>
   );
 }