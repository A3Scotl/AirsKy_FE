import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PublicLayout from "@/layout/public-layout";
import HomePage from "@/pages/home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          {/* Thêm các route khác ở đây */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
