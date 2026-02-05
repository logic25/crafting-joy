 import { useState } from "react";
 import { Plus, Pill, ChevronDown, ChevronUp, Printer } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { MedicationCard } from "@/components/cards/MedicationCard";
 import { medications } from "@/data/mockData";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 
 const Medications = () => {
   const [showDiscontinued, setShowDiscontinued] = useState(false);
 
   const activeMedications = medications.filter((med) => med.status === "active");
   const discontinuedMedications = medications.filter((med) => med.status === "discontinued");
 
   // Group by purpose
   const medicationsByPurpose = activeMedications.reduce((acc, med) => {
     const purpose = med.purpose;
     if (!acc[purpose]) {
       acc[purpose] = [];
     }
     acc[purpose].push(med);
     return acc;
   }, {} as Record<string, typeof activeMedications>);
 
   return (
     <AppLayout>
       <div className="space-y-6 pb-24 md:pb-6">
         {/* Header */}
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-bold text-foreground">Medications</h1>
             <p className="text-muted-foreground">
               {activeMedications.length} active medications
             </p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" className="gap-2">
               <Printer className="h-4 w-4" />
               <span className="hidden sm:inline">Print List</span>
             </Button>
             <Button className="gradient-primary gap-2">
               <Plus className="h-4 w-4" />
               <span className="hidden sm:inline">Add Medication</span>
             </Button>
           </div>
         </div>
 
         {/* Active Medications */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-lg font-semibold flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-sm">
                 🟢
               </span>
               Active Medications ({activeMedications.length})
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             {Object.entries(medicationsByPurpose).map(([purpose, meds]) => (
               <div key={purpose}>
                 <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                   {purpose}
                 </h3>
                 <div className="space-y-3">
                   {meds.map((med) => (
                     <MedicationCard key={med.id} medication={med} />
                   ))}
                 </div>
               </div>
             ))}
           </CardContent>
         </Card>
 
         {/* Discontinued Medications */}
         {discontinuedMedications.length > 0 && (
           <Collapsible open={showDiscontinued} onOpenChange={setShowDiscontinued}>
             <Card className="border-muted">
               <CollapsibleTrigger asChild>
                 <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                   <CardTitle className="text-lg font-semibold flex items-center justify-between">
                     <span className="flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm">
                         ⚪
                       </span>
                       Discontinued Medications ({discontinuedMedications.length})
                     </span>
                     {showDiscontinued ? (
                       <ChevronUp className="h-5 w-5 text-muted-foreground" />
                     ) : (
                       <ChevronDown className="h-5 w-5 text-muted-foreground" />
                     )}
                   </CardTitle>
                 </CardHeader>
               </CollapsibleTrigger>
               <CollapsibleContent>
                 <CardContent className="pt-0 space-y-3">
                   {discontinuedMedications.map((med) => (
                     <MedicationCard key={med.id} medication={med} />
                   ))}
                 </CardContent>
               </CollapsibleContent>
             </Card>
           </Collapsible>
         )}
 
         {/* Empty State */}
         {activeMedications.length === 0 && (
           <div className="text-center py-12">
             <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
             <h3 className="font-semibold text-lg">No medications tracked</h3>
             <p className="text-muted-foreground">Add medications to start tracking refills</p>
           </div>
         )}
       </div>
     </AppLayout>
   );
 };
 
 export default Medications;