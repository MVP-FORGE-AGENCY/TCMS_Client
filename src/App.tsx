import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { MainLayout as Layout } from "@/components/layout/MainLayout"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { ThemeProvider } from "@/components/theme-provider"
import { NetworkBanner } from "@/components/layout/NetworkBanner"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { BreadcrumbProvider } from "@/context/BreadcrumbContext"

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const PersonnelPage = lazy(() => import("@/pages/personnel/page"))

const DashboardPage = lazy(() => import("@/pages/dashboard/page"))
const ProgrammesPage = lazy(() => import("@/pages/programmes/page"))
const ProgrammeDetailPage = lazy(() => import("@/pages/programmes/ProgrammeDetailPage"))
const SessionsPage = lazy(() => import("@/pages/sessions/page"))
const SessionDetailPage = lazy(() => import("@/pages/sessions/SessionDetailPage"))
const ChecksPage = lazy(() => import("@/pages/checks/page"))
const CheckDetailPage = lazy(() => import("@/pages/checks/CheckDetailPage"))
const ExpiringReport = lazy(() => import("@/pages/reports/ExpiringReport"))
const SettingsPage = lazy(() => import("@/pages/settings/page"))
const StandardsPage = lazy(() => import("@/pages/standards/page"))
const StandardDetailPage = lazy(() => import("@/pages/standards/StandardDetailPage"))
const ProceduresPage = lazy(() => import("@/pages/procedures/page"))
const ProcedureDetailPage = lazy(() => import("@/pages/procedures/ProcedureDetailPage"))
const CompetenceDashboard = lazy(() => import("@/pages/competence/page"))
const EmployeeHistoryPage = lazy(() => import("@/pages/competence/EmployeeHistoryPage"))
const ChangePasswordPage = lazy(() => import("@/pages/auth/ChangePasswordPage"))
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin/DashboardPage"))
const OrganizationsPage = lazy(() => import("@/pages/super-admin/OrganizationsPage"))

function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // const { user } = useAuth() // Moved to top
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />
  }

  // Allow access to /change-password manually
  // if (!user?.mustChangePassword && location.pathname === "/change-password") {
  //    return <Navigate to="/dashboard" replace />
  // }

  return <Outlet />
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tcms-theme">
      <ErrorBoundary>
        <NetworkBanner />
        <AuthProvider>
            <BreadcrumbProvider>
              <Router>
                <Suspense fallback={
                  <div className="flex h-screen w-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                }>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
    
                    <Route element={<ProtectedRoute />}>
                      <Route element={<Layout />}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/personnel" element={<PersonnelPage />} />
                        <Route path="/programmes" element={<ProgrammesPage />} />
                        <Route path="/programmes/:id" element={<ProgrammeDetailPage />} />
                        <Route path="/standards" element={<StandardsPage />} />
                        <Route path="/standards/:id" element={<StandardDetailPage />} />
                        <Route path="/sessions" element={<SessionsPage />} />
                        <Route path="/sessions/:id" element={<SessionDetailPage />} />
                        <Route path="/checks" element={<ChecksPage />} />
                        <Route path="/checks/:id" element={<CheckDetailPage />} />
                        <Route path="/reports" element={<ExpiringReport />} />
                        <Route path="/procedures" element={<ProceduresPage />} />
                        <Route path="/procedures/:slug" element={<ProcedureDetailPage />} />
                        <Route path="/competence" element={<CompetenceDashboard />} />
                        <Route path="/employees/:id/history" element={<EmployeeHistoryPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        {/* Duplicate route removed */}
                        
                        {/* Super Admin Routes */}
                        <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
                        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                        <Route path="/super-admin/organizations" element={<OrganizationsPage />} />
                      </Route>
                    </Route>
                    
                    {/* Independent Protected Route for Change Password to avoid Layout if needed, or keep inside */}
                     <Route element={<ProtectedRoute />}>
                        <Route path="/change-password" element={<ChangePasswordPage />} />
                     </Route>
    
                  </Routes>
                </Suspense>
              </Router>
              <Toaster />
            </BreadcrumbProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
