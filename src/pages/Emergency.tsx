 import { AlertCircle, Phone, Printer, Share2, MessageSquare, Heart, Pill, User, Building2, CreditCard } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Separator } from "@/components/ui/separator";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { careRecipient, medications } from "@/data/mockData";
 import { format, differenceInYears } from "date-fns";
 
 const Emergency = () => {
   const activeMedications = medications.filter((med) => med.status === "active");
   const age = differenceInYears(new Date(), careRecipient.dateOfBirth);
 
   return (
     <AppLayout>
       <div className="space-y-6 pb-24 md:pb-6">
         {/* Header */}
         <div className="text-center">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-emergency mb-4">
             <AlertCircle className="h-8 w-8 text-primary-foreground" />
           </div>
           <h1 className="text-2xl font-bold text-foreground">Emergency Information</h1>
           <p className="text-muted-foreground">
             Critical information for emergency responders
           </p>
         </div>
 
         {/* Care Recipient Info */}
         <Card className="border-destructive/30 bg-destructive/5">
           <CardContent className="p-6">
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center border-2 border-destructive/30">
                 <User className="h-8 w-8 text-destructive" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold">{careRecipient.name}</h2>
                 <p className="text-lg text-muted-foreground">
                   Age {age} • DOB: {format(careRecipient.dateOfBirth, "MM/dd/yyyy")}
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Current Medications */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-lg">
               <Pill className="h-5 w-5 text-primary" />
               Current Medications
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-2">
               {activeMedications.map((med) => (
                 <li key={med.id} className="flex items-start gap-2">
                   <span className="text-primary">•</span>
                   <span>
                     <strong>{med.name} {med.dosage}</strong>, {med.frequency} ({med.purpose})
                   </span>
                 </li>
               ))}
             </ul>
           </CardContent>
         </Card>
 
         {/* Allergies */}
         <Card className="border-destructive">
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-lg text-destructive">
               <AlertCircle className="h-5 w-5" />
               Allergies
             </CardTitle>
           </CardHeader>
           <CardContent>
            <ul className="space-y-1">
                {careRecipient.allergies.map((allergy, idx) => (
                  <li key={idx} className="text-destructive font-medium">
                    ⚠️ {allergy.name} {allergy.reaction ? `(${allergy.reaction})` : ''} — {allergy.severity}
                  </li>
                ))}
              </ul>
           </CardContent>
         </Card>
 
         {/* Medical Conditions */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-lg">
               <Heart className="h-5 w-5 text-primary" />
               Medical Conditions
             </CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-1">
               {careRecipient.medicalConditions.map((condition, idx) => (
                 <li key={idx}>• {condition}</li>
               ))}
             </ul>
           </CardContent>
         </Card>
 
         {/* Emergency Contacts */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-lg">
               <Phone className="h-5 w-5 text-primary" />
               Emergency Contacts
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {careRecipient.emergencyContacts.map((contact) => (
               <div
                 key={contact.priority}
                 className="flex items-center justify-between p-3 bg-muted rounded-lg"
               >
                 <div>
                   <p className="font-semibold">
                     {contact.priority}. {contact.name} ({contact.relationship})
                   </p>
                   <p className="text-muted-foreground">{contact.phone}</p>
                 </div>
                 <Button size="sm" variant="outline" className="gap-2">
                   <Phone className="h-4 w-4" />
                   Call
                 </Button>
               </div>
             ))}
           </CardContent>
         </Card>
 
         {/* Healthcare Info */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-lg">
               <Building2 className="h-5 w-5 text-primary" />
               Healthcare Information
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
               <p className="text-sm text-muted-foreground">Primary Care Doctor</p>
               <p className="font-medium">{careRecipient.primaryCareDoctor}</p>
             </div>
             <Separator />
             <div>
               <p className="text-sm text-muted-foreground">Preferred Hospital</p>
               <p className="font-medium">{careRecipient.preferredHospital}</p>
             </div>
           </CardContent>
         </Card>
 
         {/* Insurance */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="flex items-center gap-2 text-lg">
               <CreditCard className="h-5 w-5 text-primary" />
               Insurance Information
             </CardTitle>
           </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="font-medium">{careRecipient.insurance.carrier} — {careRecipient.insurance.policyNumber}</p>
              </div>
              {careRecipient.insurance.medicare && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Medicare</p>
                    <p className="font-medium font-mono">{careRecipient.insurance.medicare}</p>
                  </div>
                </>
              )}
              {careRecipient.insurance.supplemental && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Supplemental ({careRecipient.insurance.supplemental.provider})
                    </p>
                    <p className="font-medium font-mono">
                      {careRecipient.insurance.supplemental.memberId}
                    </p>
                  </div>
                </>
              )}
           </CardContent>
         </Card>
 
         {/* Action Buttons */}
         <div className="grid grid-cols-3 gap-3">
           <Button variant="outline" className="flex-col h-auto py-4 gap-2">
             <MessageSquare className="h-5 w-5" />
             <span className="text-xs">Text Me</span>
           </Button>
           <Button variant="outline" className="flex-col h-auto py-4 gap-2">
             <Printer className="h-5 w-5" />
             <span className="text-xs">Print PDF</span>
           </Button>
           <Button variant="outline" className="flex-col h-auto py-4 gap-2">
             <Share2 className="h-5 w-5" />
             <span className="text-xs">Share Link</span>
           </Button>
         </div>
 
         {/* Last Updated */}
         <p className="text-center text-sm text-muted-foreground">
           Last updated: {format(new Date(), "MMM d, yyyy")} by Manny
         </p>
       </div>
     </AppLayout>
   );
 };
 
 export default Emergency;