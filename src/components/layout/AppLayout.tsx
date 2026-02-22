import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, LayoutDashboard, Heart, AlertCircle, Users, Settings, Menu, X, Pill, Calendar, Stethoscope, Activity, FileText, LogOut, Scale, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsSuperAdmin } from "@/hooks/useAppRole";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

const bottomNavItems = [
  { icon: MessageCircle, label: "Chat", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Heart, label: "Care Hub", path: "/medications" },
  { icon: AlertCircle, label: "ER Card", path: "/emergency" },
];

const sidebarItems = [
  { icon: MessageCircle, label: "Chat", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { section: "Care Hub" },
  { icon: Pill, label: "Medications", path: "/medications" },
  { icon: Calendar, label: "Appointments", path: "/appointments" },
  { icon: Stethoscope, label: "Doctors", path: "/doctors" },
  { icon: Activity, label: "Blood Pressure", path: "/bp" },
  { icon: Scale, label: "Weight", path: "/weight" },
  { icon: FileText, label: "Documents", path: "/documents" },
  { section: "divider" },
  { icon: AlertCircle, label: "ER Card", path: "/emergency", accent: true },
  { icon: Users, label: "Family", path: "/family" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppLayout({ children, hideNav }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();

  // Build sidebar items dynamically to include admin when applicable
  const fullSidebarItems = [
    ...sidebarItems,
    ...(isSuperAdmin ? [
      { section: "divider" as const },
      { icon: Shield, label: "Admin", path: "/admin" },
    ] : []),
  ];

  const displayName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full gradient-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground text-sm leading-tight">CareCircle</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Caring for Mom</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs text-muted-foreground">{displayName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-3.5rem)] bg-card border-r border-border py-4 px-3">
          <nav className="flex flex-col gap-0.5">
            {fullSidebarItems.map((item, i) => {
              if ('section' in item) {
                if (item.section === 'divider') {
                  return <div key={i} className="my-2 border-t border-border" />;
                }
                return (
                  <p key={i} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-1">
                    {item.section}
                  </p>
                );
              }

              const isActive = location.pathname === item.path;
              const Icon = item.icon!;

              return (
                <Link key={item.path} to={item.path!}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      item.accent && !isActive && "text-destructive hover:text-destructive"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full touch-target"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Slide Menu */}
        <aside
          className={cn(
            "fixed top-14 left-0 z-50 w-60 h-[calc(100vh-3.5rem)] bg-card border-r border-border py-4 px-3 transform transition-transform duration-200 ease-out md:hidden",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="flex flex-col gap-0.5">
            {fullSidebarItems.map((item, i) => {
              if ('section' in item) {
                if (item.section === 'divider') {
                  return <div key={i} className="my-2 border-t border-border" />;
                }
                return (
                  <p key={i} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-1">
                    {item.section}
                  </p>
                );
              }

              const isActive = location.pathname === item.path;
              const Icon = item.icon!;

              return (
                <Link key={item.path} to={item.path!} onClick={() => setMobileMenuOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      item.accent && !isActive && "text-destructive hover:text-destructive"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary w-full touch-target"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          <div className="max-w-3xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t border-border md:hidden safe-area-bottom">
          <div className="flex justify-around py-1.5 px-2">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isER = item.path === "/emergency";
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-colors touch-target",
                    isActive ? "text-primary" : "text-muted-foreground",
                    isER && !isActive && "text-destructive"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isER && !isActive && "text-destructive")} />
                  <span className={cn(
                    "text-[10px] font-medium",
                    isER && !isActive && "text-destructive"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
