import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import LoadingPage from "@/pages/loading/loading-page";
import PageTransition from "@/components/common/page-transition";

// Lazy load tất cả page
const HomePage = lazy(() => import("@/pages/public/home-page"));
const AuthPage = lazy(() => import("@/pages/public/auth/auth-page"));
const FlightPage = lazy(() => import("@/pages/public/flight-page"));
const FlightBookingStepper = lazy(() => import("@/pages/public/booking-stepper-page"));
const ConfirmBookingPage = lazy(() => import("@/pages/public/confirm-booking-page"));
const FlightDetail = lazy(() => import("@/pages/public/detail/flight-detail-page"));
const ProfilePage = lazy(() => import("@/pages/public/profile-page"));
const NotFoundPage = lazy(() => import("@/pages/public/not-found/not-found-page"));
const PublicLayout = lazy(() => import("@/layouts/public-layout"));
const AuthLayout = lazy(() => import("@/layouts/auth-layout"));
const PrivateLayout = lazy(() => import("@/layouts/admin-layout"));
const AdminDashboard = lazy(() => import("@/pages/private/dashboard-page"));
const AdminBooking = lazy(() => import("@/pages/private/booking-page"));
const AdminFlights = lazy(() => import("@/pages/private/flight-page"));
const AdminUsers = lazy(() => import("@/pages/private/user-page"));
const AdminPayments = lazy(() => import("@/pages/private/payment-page"));
const AdminReports = lazy(() => import("@/pages/private/report-page"));
const AdminProfile = lazy(() => import("@/pages/private/profile-page"));

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  useScrollToTop();

  if (loading) return <LoadingPage />;

  return (
    <Suspense fallback={<LoadingPage />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PublicLayout />}>
            <Route
              index
              element={
                <PageTransition>
                  <HomePage />
                </PageTransition>
              }
            />
            <Route
              path="/flights"
              element={
                <PageTransition>
                  <FlightPage />
                </PageTransition>
              }
            />
            <Route
              path="/booking-stepper"
              element={
                <PageTransition>
                  <FlightBookingStepper />
                </PageTransition>
              }
            />
            <Route
              path="/confirm-booking"
              element={
                <PageTransition>
                  <ConfirmBookingPage />
                </PageTransition>
              }
            />

            <Route
              path="/detail"
              element={
                <PageTransition>
                  <FlightDetail />
                </PageTransition>
              }
            />
            <Route
              path="/profile"
              element={
                <PageTransition>
                  <ProfilePage />
                </PageTransition>
              }
            />
          </Route>

          <Route path="/auth" element={<AuthLayout />}>
            <Route
              index
              element={
                <PageTransition>
                  <AuthPage />
                </PageTransition>
              }
            />
          </Route>

          <Route path="/admin" element={<PrivateLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/bookings" element={<AdminBooking />} />
            <Route path="/admin/flights" element={<AdminFlights />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
          </Route>

          {/* 404 Route - Must be last */}
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFoundPage />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton duration={3000} />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
