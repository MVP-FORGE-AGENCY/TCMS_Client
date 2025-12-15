import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { MainLayout as Layout } from "@/components/layout/MainLayout"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { ThemeProvider } from "@/components/theme-provider"
import { NetworkBanner } from "@/components/layout/NetworkBanner"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider, useAuth } from "@/context/AuthContext"

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const PersonnelPage = lazy(() => import("@/pages/personnel/page"))

const DashboardPage = lazy(() => import("@/pages/dashboard/page"))
const ProgrammesPage = lazy(() => import("@/pages/programmes/page"))
const ProgrammeDetailPage = lazy(() => import("@/pages/programmes/ProgrammeDetailPage"))
const SessionsPage = lazy(() => import("@/pages/sessions/page"))
const ChecksPage = lazy(() => import("@/pages/checks/page"))
const ExpiringReport = lazy(() => import("@/pages/reports/ExpiringReport"))
const SettingsPage = lazy(() => import("@/pages/settings/page"))

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
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

  return <Outlet />
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="tcms-theme">
      <ErrorBoundary>
        <NetworkBanner />
        <AuthProvider>
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
                    <Route path="/sessions" element={<SessionsPage />} />
                    <Route path="/checks" element={<ChecksPage />} />
                    <Route path="/reports" element={<ExpiringReport />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
