 import { ReactNode, useState } from "react";
 import { Link, useLocation } from "react-router-dom";
 import { Home, Calendar, Pill, Users, AlertCircle, Settings, Menu, X, Bell } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
 
 interface AppLayoutProps {
   children: ReactNode;
 }
 
 const navItems = [
   { icon: Home, label: "Dashboard", path: "/" },
   { icon: Calendar, label: "Appointments", path: "/appointments" },
   { icon: Pill, label: "Medications", path: "/medications" },
   { icon: Users, label: "Family", path: "/family" },
   { icon: AlertCircle, label: "Emergency", path: "/emergency" },
 ];
 
 export function AppLayout({ children }: AppLayoutProps) {
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const location = useLocation();
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="sticky top-0 z-50 bg-card border-b border-border shadow-card">
         <div className="container flex items-center justify-between h-16 px-4">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
               <span className="text-primary-foreground text-lg font-bold">C</span>
             </div>
             <div className="hidden sm:block">
               <h1 className="font-semibold text-foreground">Caregiver Coordinator</h1>
               <p className="text-xs text-muted-foreground">Caring for Maria</p>
             </div>
           </div>
 
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="relative touch-target">
               <Bell className="h-5 w-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
             </Button>
             <Link to="/settings">
               <Button variant="ghost" size="icon" className="touch-target">
                 <Settings className="h-5 w-5" />
               </Button>
             </Link>
             <Button
               variant="ghost"
               size="icon"
               className="md:hidden touch-target"
               onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
             >
               {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
             </Button>
           </div>
         </div>
       </header>
 
       <div className="flex">
         {/* Desktop Sidebar */}
         <aside className="hidden md:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-card border-r border-border p-4">
           <nav className="flex flex-col gap-1">
             {navItems.map((item) => {
               const isActive = location.pathname === item.path;
               return (
                 <Link key={item.path} to={item.path}>
                   <Button
                     variant={isActive ? "default" : "ghost"}
                     className={cn(
                       "w-full justify-start gap-3 touch-target text-base font-medium",
                       isActive && "gradient-primary"
                     )}
                   >
                     <item.icon className="h-5 w-5" />
                     {item.label}
                   </Button>
                 </Link>
               );
             })}
           </nav>
         </aside>
 
         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
           <div
             className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
             onClick={() => setMobileMenuOpen(false)}
           />
         )}
 
         {/* Mobile Menu */}
         <aside
           className={cn(
             "fixed top-16 left-0 z-50 w-64 h-[calc(100vh-4rem)] bg-card border-r border-border p-4 transform transition-transform duration-200 ease-out md:hidden",
             mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
           )}
         >
           <nav className="flex flex-col gap-1">
             {navItems.map((item) => {
               const isActive = location.pathname === item.path;
               return (
                 <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                   <Button
                     variant={isActive ? "default" : "ghost"}
                     className={cn(
                       "w-full justify-start gap-3 touch-target text-base font-medium",
                       isActive && "gradient-primary"
                     )}
                   >
                     <item.icon className="h-5 w-5" />
                     {item.label}
                   </Button>
                 </Link>
               );
             })}
           </nav>
         </aside>
 
         {/* Main Content */}
         <main className="flex-1 p-4 md:p-6 overflow-auto">
           <div className="max-w-4xl mx-auto animate-fade-in">{children}</div>
         </main>
       </div>
 
       {/* Mobile Bottom Nav */}
       <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
         <div className="flex justify-around py-2">
           {navItems.slice(0, 5).map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <Link
                 key={item.path}
                 to={item.path}
                 className={cn(
                   "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors touch-target",
                   isActive ? "text-primary" : "text-muted-foreground"
                 )}
               >
                 <item.icon className="h-5 w-5" />
                 <span className="text-xs font-medium">{item.label}</span>
               </Link>
             );
           })}
         </div>
       </nav>
     </div>
   );
 }