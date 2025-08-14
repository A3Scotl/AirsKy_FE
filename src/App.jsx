import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicLayout from "@/layout/public-layout";
import HomePage from "@/pages/home-page";
import AuthLayout from "./layout/auth-layout";
import AuthPage from "./pages/auth-page";
import FlightPage from "./pages/flight-page";
import { FlightBookingStepper } from "./pages/booking-stepper-page";
import FlightDetail from "./pages/flight-detail-page";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/flights" element={<FlightPage />} />
          <Route path="/booking-stepper" element={<FlightBookingStepper />} />

          {/* detail/:id */}
          <Route path="/detail" element={<FlightDetail />} />
        </Route>
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<AuthPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
