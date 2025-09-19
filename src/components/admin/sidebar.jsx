import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Plane,
  Users,
  CreditCard,
  BarChart3,
  User,
  X,
  BookOpen,
  Tag,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  // Lấy user từ localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // State cho menu expandable
  const [openMenus, setOpenMenus] = useState({
    blog:
      location.pathname.includes("/admin/blogs") ||
      location.pathname.includes("/admin/categories"),
    flight:
      location.pathname.startsWith("/admin/flights") ||
      location.pathname.startsWith("/admin/airports") ||
      location.pathname.startsWith("/admin/aircrafts") ||
      location.pathname.startsWith("/admin/travel-classes") ||
      location.pathname.startsWith("/admin/airlines") ||
      location.pathname.startsWith("/admin/countries"),
  });

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper: check path active
  const isActive = (path) => location.pathname.startsWith(path);

  // Danh sách menu gốc
  let baseNavigation = [
    { name: "Trang chính", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Quản lý đặt vé", href: "/admin/bookings", icon: Calendar },
    {
      name: "Quản lý chuyến bay",
      href: "/admin/flights",
      icon: Plane,
      isExpandable: true,
      key: "flight",
      submenu: [
        { name: "Chuyến bay", href: "/admin/flights", icon: Plane },
        { name: "Sân bay", href: "/admin/airports", icon: MapPin },
        { name: "Máy bay", href: "/admin/aircrafts", icon: Plane },
        { name: "Hạng vé", href: "/admin/travel-classes", icon: Tag },
        { name: "Hãng bay", href: "/admin/airlines", icon: User },
        { name: "Quốc gia", href: "/admin/countries", icon: MapPin },
      ],
    },
    { name: "Quản lý người dùng", href: "/admin/users", icon: Users },
    { name: "Quản lý thanh toán", href: "/admin/payments", icon: CreditCard },
    {
      name: "Quản lý bài đăng",
      icon: BookOpen,
      key: "blog",
      submenu: [
        { name: "Bài đăng", href: "/admin/blogs", icon: BookOpen },
        { name: "Thể loại", href: "/admin/categories", icon: FolderOpen },
      ],
    },
    { name: "Quản lý Deal", href: "/admin/deals", icon: Tag },
    { name: "Báo cáo & Phân tích", href: "/admin/reports", icon: BarChart3 },
  ];
  if (user?.role === "BUSINESS") {
    baseNavigation = baseNavigation.filter((item) =>
      [
        "Trang chính",
        "Quản lý chuyến bay",
        "Báo cáo & Phân tích",
        "Quản lý Deal",
        "Quản lý đặt vé",
        "Quản lý bài đăng",
      ].includes(item.name)
    );
    baseNavigation = baseNavigation.map((item) => {
      if (item.submenu) {
        return {
          ...item,
          submenu: item.submenu.filter(
            (sub) =>
              sub.name !== "Sân bay" &&
              sub.name !== "Máy bay" &&
              sub.name !== "Hạng vé" &&
              sub.name !== "Hãng bay" &&
              sub.name !== "Quốc gia"
          ),
        };
      }
      return item;
    });
  }

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
          fixed inset-y-0 left-0 z-50 w-64 h-[100vh] bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="mt-5 px-2 space-y-1">
          {baseNavigation.map((item) => {
            const Icon = item.icon;

            // Expandable menu
            if (item.isExpandable && item.submenu) {
              const open = openMenus[item.key];
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={`
                      group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${
                        isActive(item.href || "")
                          ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200
                        ${
                          isActive(item.href || "")
                            ? "text-blue-600"
                            : "text-gray-400 group-hover:text-gray-500"
                        }
                      `}
                    />
                    {item.name}
                    {open ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>

                  {open && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.name}
                            to={sub.href}
                            className={`
                              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                              ${
                                isActive(sub.href)
                                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              }
                            `}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <SubIcon
                              className={`
                                mr-3 flex-shrink-0 h-4 w-4 transition-colors duration-200
                                ${
                                  isActive(sub.href)
                                    ? "text-blue-500"
                                    : "text-gray-300 group-hover:text-gray-400"
                                }
                              `}
                            />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Normal menu
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${
                    isActive(item.href)
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
                      isActive(item.href)
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
      </div>
    </>
  );
};

export default AdminSidebar;
