import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { AppProvider } from "@/contexts/AppContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { PerformanceDataProvider } from "@/contexts/PerformanceDataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HelmetProvider } from "react-helmet-async";
// ParticleBackground is now loaded directly from index.html for better performance
// import ParticleBackground from "@/components/ui/ParticleBackground";

// ✅ IMPORTS STATIQUES : Pages critiques (auth flow)
import Landing from "./pages/Landing";
import Awards from "./pages/Awards";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// ✅ LAZY LOADING : Toutes les pages protégées pour réduire le bundle initial
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const Register = lazy(() => import("./pages/Register"));
const RegisterNew = lazy(() => import("./pages/RegisterNew"));
const DashboardRouter = lazy(() => import("./pages/dashboards").then(m => ({ default: m.DashboardRouter })));
const Profile = lazy(() => import("./pages/Profile"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Reports = lazy(() => import("./pages/Reports"));
const CompanyProfile = lazy(() => import("./pages/CompanyProfile"));
const PerformancePlanReport = lazy(() => import("./pages/company-profile/PerformancePlanReport"));
const DataMapping = lazy(() => import("./pages/company-profile/DataMapping"));

// ✅ LAZY LOADING : Modules (très lourds)
const Module1Dashboard = lazy(() => import("./pages/modules/Module1Dashboard"));
const Module2Dashboard = lazy(() => import("./pages/modules/Module2Dashboard"));
const CostSavingsDashboard = lazy(() => import("./pages/modules/CostSavingsDashboard")); // Module 3
const Module4Dashboard = lazy(() => import("./pages/modules/Module4Dashboard"));
const DataScannerDashboard = lazy(() => import("./pages/modules/DataScannerDashboard"));

// ✅ LAZY LOADING : Pages Banker
const BankerDashboard = lazy(() => import("./pages/BankerDashboard"));
const CompanyReports = lazy(() => import("./pages/banker/CompanyReports"));

// ✅ LAZY LOADING : Pages Settings
const BankerAccessManagement = lazy(() => import("./pages/settings/BankerAccessManagement"));
const UserManagement = lazy(() => import("./pages/settings/UserManagement"));

// ✅ Loading Spinner pour Suspense
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// ✅ Configuration React Query optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // ✅ 5 minutes par défaut
      gcTime: 10 * 60 * 1000, // ✅ 10 minutes en mémoire (renamed from cacheTime in v5)
      refetchOnWindowFocus: false, // ✅ Pas de refetch automatique au focus
      retry: 1, // ✅ 1 seul retry
    },
  },
});

function App() {
  return (
    <>
      {/* ✅ Background animé avec particules - chargé depuis index.html */}
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* ✅ ThemeProvider pour light/dark mode global */}
              <ThemeProvider>
              {/* ✅ SidebarProvider pour sidebar state global */}
              <SidebarProvider>
                <AuthProvider>
                  {/* ✅ AppProvider wraps tout pour avoir accès au context partout */}
                  <AppProvider>
                    <CompanyProvider>
                      {/* ✅ PerformanceDataProvider pour données TOTAL GÉNÉRAL → Reporting */}
                      <PerformanceDataProvider>
                        {/* ✅ Suspense boundary pour lazy loading */}
                        <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<Landing />} />
                          <Route path="/awards" element={<Awards />} />
                          <Route path="/auth/login" element={<Auth />} />
                          <Route path="/auth/role-selection" element={<RoleSelection />} />
                          <Route path="/auth/register" element={<Register />} />
                          <Route path="/auth/register-new" element={<RegisterNew />} />
                          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                          <Route path="/company-profile" element={<ProtectedRoute><CompanyProfile /></ProtectedRoute>} />
                          <Route path="/company-profile/performance-plan" element={<ProtectedRoute><PerformancePlanReport /></ProtectedRoute>} />
                          <Route path="/company-profile/data-mapping" element={<ProtectedRoute><DataMapping /></ProtectedRoute>} />
                          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

                          {/* Banker Routes */}
                          <Route path="/banker/dashboard" element={<ProtectedRoute><BankerDashboard /></ProtectedRoute>} />
                          <Route path="/banker/company/:companyId" element={<ProtectedRoute><CompanyReports /></ProtectedRoute>} />

                          {/* Settings Routes */}
                          <Route path="/settings/banker-access" element={<ProtectedRoute><BankerAccessManagement /></ProtectedRoute>} />
                          <Route path="/settings/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />

                          {/* Module Routes */}
                          <Route path="/modules/module1/*" element={<ProtectedRoute><Module1Dashboard /></ProtectedRoute>} />
                          <Route path="/modules/module2/*" element={<ProtectedRoute><Module2Dashboard /></ProtectedRoute>} />
                          <Route path="/modules/module3/*" element={<ProtectedRoute><CostSavingsDashboard /></ProtectedRoute>} />
                          <Route path="/modules/module4/*" element={<ProtectedRoute><Module4Dashboard /></ProtectedRoute>} />
                          <Route path="/modules/datascanner" element={<ProtectedRoute><DataScannerDashboard /></ProtectedRoute>} />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                        </Suspense>
                      </PerformanceDataProvider>
                    </CompanyProvider>
                  </AppProvider>
                </AuthProvider>
              </SidebarProvider>
            </ThemeProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </>
  );
}

export default App;
