import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicLayout from "@/layout/public-layout";
import HomePage from "@/pages/home";
import AuthLayout from "./layout/auth-layout";
import AuthPage from "./pages/auth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          {/* Thêm các route khác ở đây */}
        </Route>
        <Route path="/login" element={<AuthLayout />}>
          <Route index element={<AuthPage />} />
          {/* Thêm các route khác ở đây */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
