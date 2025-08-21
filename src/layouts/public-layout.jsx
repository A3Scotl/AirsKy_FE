import { Outlet } from "react-router-dom";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ScrollToTop from "@/components/common/scroll-to-top";

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 bg-white">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default PublicLayout;
