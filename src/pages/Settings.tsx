 import { User, Bell, MessageSquare, HelpCircle, LogOut } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Switch } from "@/components/ui/switch";
 import { Separator } from "@/components/ui/separator";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { careRecipient } from "@/data/mockData";
 
 const Settings = () => {
   return (
     <AppLayout>
       <div className="space-y-6 pb-24 md:pb-6">
         {/* Header */}
         <div>
           <h1 className="text-2xl font-bold text-foreground">Settings</h1>
           <p className="text-muted-foreground">Manage your account and preferences</p>
         </div>
 
         {/* User Profile */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
               <User className="h-5 w-5 text-primary" />
               Your Profile
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                 <span className="text-2xl font-bold text-primary-foreground">M</span>
               </div>
               <div>
                 <h3 className="font-semibold text-lg">Manny</h3>
                 <p className="text-muted-foreground">(917) 555-1111</p>
                 <p className="text-sm text-muted-foreground">manny@email.com</p>
               </div>
             </div>
             <Button variant="outline" className="w-full">Edit Profile</Button>
           </CardContent>
         </Card>
 
         {/* Notification Preferences */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
               <Bell className="h-5 w-5 text-primary" />
               Notifications
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Appointment Reminders</p>
                 <p className="text-sm text-muted-foreground">24 hours before appointments</p>
               </div>
               <Switch defaultChecked />
             </div>
             <Separator />
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Refill Reminders</p>
                 <p className="text-sm text-muted-foreground">10 days before running out</p>
               </div>
               <Switch defaultChecked />
             </div>
             <Separator />
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Coverage Requests</p>
                 <p className="text-sm text-muted-foreground">When someone needs coverage</p>
               </div>
               <Switch defaultChecked />
             </div>
             <Separator />
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Family Updates</p>
                 <p className="text-sm text-muted-foreground">Changes made by other caregivers</p>
               </div>
               <Switch defaultChecked />
             </div>
           </CardContent>
         </Card>
 
         {/* Care Recipient Info */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
               <User className="h-5 w-5 text-primary" />
               Care Recipient
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div>
               <p className="text-sm text-muted-foreground">Name</p>
               <p className="font-medium">{careRecipient.name}</p>
             </div>
             <Separator />
             <div>
               <p className="text-sm text-muted-foreground">Primary Care Doctor</p>
               <p className="font-medium">{careRecipient.primaryCareDoctor}</p>
             </div>
             <Separator />
             <div>
               <p className="text-sm text-muted-foreground">Preferred Hospital</p>
               <p className="font-medium">{careRecipient.preferredHospital}</p>
             </div>
             <Button variant="outline" className="w-full">Edit Care Recipient Info</Button>
           </CardContent>
         </Card>
 
         {/* SMS Commands Help */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg">
               <MessageSquare className="h-5 w-5 text-primary" />
               SMS Commands
             </CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm text-muted-foreground mb-4">
               Text these commands to get quick information:
             </p>
             <div className="space-y-2 font-mono text-sm">
               <div className="flex justify-between p-2 bg-muted rounded">
                 <span className="font-semibold">NEXT</span>
                 <span className="text-muted-foreground">Next appointment</span>
               </div>
               <div className="flex justify-between p-2 bg-muted rounded">
                 <span className="font-semibold">MEDS</span>
                 <span className="text-muted-foreground">Medication list</span>
               </div>
               <div className="flex justify-between p-2 bg-muted rounded">
                 <span className="font-semibold">INFO</span>
                 <span className="text-muted-foreground">Emergency info</span>
               </div>
               <div className="flex justify-between p-2 bg-muted rounded">
                 <span className="font-semibold">UPCOMING</span>
                 <span className="text-muted-foreground">Next 7 days</span>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Help & Support */}
         <Card>
           <CardContent className="p-4">
             <Button variant="ghost" className="w-full justify-start gap-2">
               <HelpCircle className="h-5 w-5" />
               Help & Support
             </Button>
             <Separator className="my-2" />
             <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
               <LogOut className="h-5 w-5" />
               Sign Out
             </Button>
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 };
 
 export default Settings;