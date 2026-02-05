 import { LucideIcon } from "lucide-react";
 import { Card, CardContent } from "@/components/ui/card";
 import { cn } from "@/lib/utils";
 
 interface QuickActionCardProps {
   icon: LucideIcon;
   label: string;
   description?: string;
   variant?: "default" | "primary" | "emergency";
   onClick?: () => void;
 }
 
 export function QuickActionCard({
   icon: Icon,
   label,
   description,
   variant = "default",
   onClick,
 }: QuickActionCardProps) {
   return (
     <Card
       className={cn(
         "cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5 touch-target",
         variant === "primary" && "border-primary",
         variant === "emergency" && "border-destructive bg-destructive/5"
       )}
       onClick={onClick}
     >
       <CardContent className="p-4 flex flex-col items-center text-center gap-2">
         <div
           className={cn(
             "w-12 h-12 rounded-xl flex items-center justify-center",
             variant === "default" && "bg-secondary",
             variant === "primary" && "gradient-primary",
             variant === "emergency" && "gradient-emergency"
           )}
         >
           <Icon
             className={cn(
               "h-6 w-6",
               variant === "default" && "text-foreground",
               (variant === "primary" || variant === "emergency") && "text-primary-foreground"
             )}
           />
         </div>
         <div>
           <h3 className="font-semibold text-sm">{label}</h3>
           {description && (
             <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
           )}
         </div>
       </CardContent>
     </Card>
   );
 }