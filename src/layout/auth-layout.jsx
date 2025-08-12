import { Outlet } from "react-router-dom";


const AuthLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 bg-white">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;
