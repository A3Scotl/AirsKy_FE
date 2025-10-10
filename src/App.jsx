import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import { useScrollToTop } from "@/hooks/use-scroll-to-top";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { SearchProvider } from "@/contexts/search-context";
import { TitleSync } from "@/components/common/seo";
import { Toaster } from "sonner";
import LoadingPage from "@/pages/loading/loading-page";
import PageTransition from "@/components/common/page-transition";
import AdminRoute from "@/routes/admin-route";
import ChatbotWidget from "@/components/common/chatbot-widget";

const HomePage = lazy(() => import("@/pages/public/home-page"));
const AuthPage = lazy(() => import("@/pages/public/auth/auth-page"));
const FlightPage = lazy(() => import("@/pages/public/flight-page"));
const FlightBookingStepper = lazy(() =>
  import("@/pages/public/booking-stepper-page")
);
const ConfirmBookingPage = lazy(() =>
  import("@/pages/public/confirm-booking-page")
);
const FlightDetail = lazy(() =>
  import("@/pages/public/detail/flight-detail-page")
);
const ProfilePage = lazy(() => import("@/pages/public/profile-page"));
const DealsPage = lazy(() => import("@/pages/public/deals-page"));
const DealDetailPage = lazy(() =>
  import("@/pages/public/detail/deal-detail-page")
);
const BlogPage = lazy(() => import("@/pages/public/blog-page"));
const BlogDetailPage = lazy(() =>
  import("@/pages/public/detail/blog-detail-page")
);
const CheckinPage = lazy(() => import("@/pages/public/check-in-page"));
const MyFlightsPage = lazy(() => import("@/pages/public/my-flights-page"));
const PaymentSuccessPage = lazy(() => import("@/pages/public/payment-success.jsx"));

const NotFoundPage = lazy(() =>
  import("@/pages/public/not-found/not-found-page")
);
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
const AdminBlog = lazy(() => import("@/pages/private/blog-page"));
const AdminCategory = lazy(() => import("@/pages/private/category-page"));
const AdminDeal = lazy(() => import("@/pages/private/deal-page"));
const AdminAirport = lazy(() => import("@/pages/private/airport-page"));
const AdminAircraft = lazy(() => import("@/pages/private/aircraft-page"));
const AdminAirline = lazy(() => import("@/pages/private/airline-page"));
const AdminCountry = lazy(() => import("@/pages/private/country-page"));
const AdminClasses = lazy(() => import("@/pages/private/classes-page"));
const AdminReviews = lazy(() => import("@/pages/private/review-page"));
const AdminAncillaryService = lazy(() =>
  import("@/pages/private/ancillary-service-page")
);

function AppRoutes() {
  const { loading } = useAuth();
  const location = useLocation();
  useScrollToTop();

  if (loading) return <LoadingPage />;

  return (
    <>
      <TitleSync />
      <Suspense fallback={<LoadingPage />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <ThemeProvider>
                  <PublicLayout />
                </ThemeProvider>
              }
            >
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
                path="/detail/:id"
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
              <Route
                path="/deals"
                element={
                  <PageTransition>
                    <DealsPage />
                  </PageTransition>
                }
              />
              <Route
                path="/deals/:dealId"
                element={
                  <PageTransition>
                    <DealDetailPage />
                  </PageTransition>
                }
              />
              <Route
                path="/blog"
                element={
                  <PageTransition>
                    <BlogPage />
                  </PageTransition>
                }
              />
              <Route
                path="/blog/:slug"
                element={
                  <PageTransition>
                    <BlogDetailPage />
                  </PageTransition>
                }
              />
              <Route
                path="/check-in"
                element={
                  <PageTransition>
                    <CheckinPage />
                  </PageTransition>
                }
              />
              <Route
                path="/my-flights"
                element={
                  <PageTransition>
                    <MyFlightsPage />
                  </PageTransition>
                }
              />
               <Route
                path="/payment-success"
                element={
                  <PageTransition>
                    <PaymentSuccessPage />
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

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <ThemeProvider>
                    <PrivateLayout />
                  </ThemeProvider>
                </AdminRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="bookings" element={<AdminBooking />} />
              <Route path="flights" element={<AdminFlights />} />
              <Route path="airports" element={<AdminAirport />} />
              <Route path="aircrafts" element={<AdminAircraft />} />
              <Route path="airlines" element={<AdminAirline />} />
              <Route path="countries" element={<AdminCountry />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="blogs" element={<AdminBlog />} />
              <Route path="categories" element={<AdminCategory />} />
              <Route path="deals" element={<AdminDeal />} />
              <Route path="travel-classes" element={<AdminClasses />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route
                path="ancillary-services"
                element={<AdminAncillaryService />}
              />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* 404 - fallback */}
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
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <SearchProvider>
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={3000}
              />
              <AppRoutes />
            </SearchProvider>
            <ChatbotWidget />
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
