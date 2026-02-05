 import { ActivityLogEntry } from "@/types";
 import { formatDistanceToNow } from "date-fns";
 
 interface ActivityCardProps {
   entry: ActivityLogEntry;
 }
 
 export function ActivityCard({ entry }: ActivityCardProps) {
   return (
     <div className="flex items-start gap-3 py-2">
       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
         <span className="text-sm font-semibold text-primary">
           {entry.caregiverName.charAt(0)}
         </span>
       </div>
       <div className="flex-1 min-w-0">
         <p className="text-sm text-foreground">
           <span className="font-medium">{entry.caregiverName}</span>{" "}
           {entry.description}
         </p>
         <p className="text-xs text-muted-foreground">
           {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
         </p>
       </div>
     </div>
   );
 }