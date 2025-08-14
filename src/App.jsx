import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import PublicLayout from "@/layouts/public-layout";
import HomePage from "@/pages/home-page";
import AuthLayout from "@/layouts/auth-layout";
import AuthPage from "@/pages/auth-page";
import FlightPage from "@/pages/flight-page";
import { FlightBookingStepper } from "@/pages/booking-stepper-page";
import FlightDetail from "@/pages/flight-detail-page";
import LoadingPage from "@/pages/loading/loading-page";


// // Lazy load tất cả page
// const HomePage = lazy(() => import("@/pages/home-page"));


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
            <Route index element={<HomePage />} />
            <Route path="/flights" element={<FlightPage />} />
            <Route path="/booking-stepper" element={<FlightBookingStepper />} />
            <Route path="/detail" element={<FlightDetail />} />
          </Route>
          <Route path="/auth" element={<AuthLayout />}>
            <Route index element={<AuthPage />} />
          </Route>
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
