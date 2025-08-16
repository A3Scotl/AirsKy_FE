import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Plane,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/admin/dashboard",
    },
    {
      name: "Bookings",
      href: "/admin/bookings",
      icon: Calendar,
      current: location.pathname === "/admin/bookings",
    },
    {
      name: "Flights",
      href: "/admin/flights",
      icon: Plane,
      current: location.pathname === "/admin/flights",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: location.pathname === "/admin/users",
    },
    {
      name: "Payments",
      href: "/admin/payments",
      icon: CreditCard,
      current: location.pathname === "/admin/payments",
    },
    {
      name: "Reports & Analytics",
      href: "/admin/reports",
      icon: BarChart3,
      current: location.pathname === "/admin/reports",
    },

    // {
    //   name: "Settings",
    //   href: "/admin/settings",
    //   icon: Settings,
    //   current: location.pathname === "/admin/settings",
    // },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 flex z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <img
              className="h-8 w-8"
              src="https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png"
              alt="AirsSky"
            />
            <span className="ml-2 text-xl font-bold text-blue-600">
              AirsSky
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-white hover:bg-blue-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${
                    item.current
                      ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon
                  className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200
                    ${
                      item.current
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }
                  `}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Admin info at bottom */}
        <div className="absolute bottom-0 w-full border-t border-gray-200">
          <Link
            to="/admin/profile"
            className="flex items-center p-4 hover:bg-gray-50 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">JA</span>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">
                John Administrator
              </p>
              <p className="text-xs text-gray-500">admin@airsky.com</p>
            </div>
            <User className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
