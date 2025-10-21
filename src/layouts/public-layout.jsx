import { Outlet } from "react-router-dom";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ScrollToTop from "@/components/common/scroll-to-top";
import ChatbotWidget from "@/components/common/chatbot-widget";

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white client-dark:bg-slate-900">
      <Header />
      <main className="flex-1 bg-white client-dark:bg-slate-900">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
       <ChatbotWidget />
    </div>
  );
};

export default PublicLayout;
