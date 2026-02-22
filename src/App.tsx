import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Appointments from "./pages/Appointments";
import Medications from "./pages/Medications";
import Family from "./pages/Family";
import Emergency from "./pages/Emergency";
import Settings from "./pages/Settings";
import Doctors from "./pages/Doctors";
import BloodPressure from "./pages/BloodPressure";
import Weight from "./pages/Weight";
import Documents from "./pages/Documents";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Admin from "./pages/Admin";
import Install from "./pages/Install";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { useIsSuperAdmin } from "@/hooks/useAppRole";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, hasCircle } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/landing" replace />;
  if (hasCircle === false) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: adminLoading } = useIsSuperAdmin();
  if (loading || adminLoading) return null;
  if (!user) return <Navigate to="/landing" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const InactivityGuard = ({ children }: { children: React.ReactNode }) => {
  useInactivityLogout();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <InactivityGuard>
            <Routes>
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
              <Route path="/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
              <Route path="/family" element={<ProtectedRoute><Family /></ProtectedRoute>} />
              <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
              <Route path="/bp" element={<ProtectedRoute><BloodPressure /></ProtectedRoute>} />
              <Route path="/weight" element={<ProtectedRoute><Weight /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/install" element={<Install />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </InactivityGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
