import { useState } from "react";
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
  const [blogMenuOpen, setBlogMenuOpen] = useState(
    location.pathname.includes("/admin/blogs") ||
      location.pathname.includes("/admin/categories")
  );
  const [flightMenuOpen, setFlightMenuOpen] = useState(
    location.pathname.startsWith("/admin/flights") ||
      location.pathname.startsWith("/admin/seats") ||
      location.pathname.startsWith("/admin/airports") ||
      location.pathname.startsWith("/admin/travel-classes") ||
      location.pathname.startsWith("/admin/airlines") ||
      location.pathname.startsWith("/admin/gates") ||
      location.pathname.startsWith("/admin/baggage") ||
      location.pathname.startsWith("/admin/countries")
  );

  const navigation = [
    {
      name: "Trang chính",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/admin/dashboard",
    },
    {
      name: "Quản lý đặt vé",
      href: "/admin/bookings",
      icon: Calendar,
      current: location.pathname === "/admin/bookings",
    },
    {
      name: "Quản lý chuyến bay",
      href: "/admin/flights",
      icon: Plane,
      current:
        location.pathname.startsWith("/admin/flights") ||
        location.pathname.startsWith("/admin/seats") ||
        location.pathname.startsWith("/admin/airports") ||
        location.pathname.startsWith("/admin/travel-classes") ||
        location.pathname.startsWith("/admin/airlines") ||
        location.pathname.startsWith("/admin/gates") ||
        location.pathname.startsWith("/admin/baggage") ||
        location.pathname.startsWith("/admin/countries"),

      isExpandable: true,
      submenu: [
        {
          name: "Chuyến bay",
          href: "/admin/flights",
          icon: Plane,
          current: location.pathname === "/admin/flights",
        },
        {
          name: "Ghế",
          href: "/admin/seats",
          icon: Users,
          current: location.pathname === "/admin/seats",
        },
        {
          name: "Sân bay",
          href: "/admin/airports",
          icon: MapPin,
          current: location.pathname === "/admin/airports",
        },
        {
          name: "Hạng vé",
          href: "/admin/travel-classes",
          icon: Tag,
          current: location.pathname === "/admin/travel-classes",
        },
        {
          name: "Hãng bay",
          href: "/admin/airlines",
          icon: User,
          current: location.pathname === "/admin/airlines",
        },
        {
          name: "Sân đỗ",
          href: "/admin/gates",
          icon: FolderOpen,
          current: location.pathname === "/admin/gates",
        },
        {
          name: "Hành lý",
          href: "/admin/baggage",
          icon: Tag,
          current: location.pathname === "/admin/baggage",
        },
        {
          name: "Quốc gia",
          href: "/admin/countries",
          icon: MapPin,
          current: location.pathname === "/admin/countries",
        }
      ],
    },
    {
      name: "Quản lý người dùng",
      href: "/admin/users",
      icon: Users,
      current: location.pathname === "/admin/users",
    },
    {
      name: "Quản lý thanh toán",
      href: "/admin/payments",
      icon: CreditCard,
      current: location.pathname === "/admin/payments",
    },
    {
      name: "Quản lý bài đăng",
      icon: BookOpen,
      current:
        location.pathname.includes("/admin/blogs") ||
        location.pathname.includes("/admin/categories"),
      isExpandable: true,
      submenu: [
        {
          name: "Bài đăng",
          href: "/admin/blogs",
          icon: BookOpen,
          current: location.pathname === "/admin/blogs",
        },
        {
          name: "Thể loại",
          href: "/admin/categories",
          icon: FolderOpen,
          current: location.pathname === "/admin/categories",
        },
      ],
    },
    {
      name: "Quản lý Deal",
      href: "/admin/deals",
      icon: Tag,
      current: location.pathname === "/admin/deals",
    },
    {
      name: "Báo cáo & Phân tích",
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

            // Render expandable menu item
            if (item.isExpandable && item.submenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (item.name === "Quản lý bài đăng") {
                        setBlogMenuOpen(!blogMenuOpen);
                      } else if (item.name === "Quản lý chuyến bay") {
                        setFlightMenuOpen(!flightMenuOpen);
                      }
                    }}
                    className={`
                      group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                      ${
                        item.current
                          ? "bg-blue-100 text-blue-900 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
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
                    {item.name === "Quản lý bài đăng" && blogMenuOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : item.name === "Quản lý bài đăng" ? (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    ) : item.name === "Quản lý chuyến bay" && flightMenuOpen ? (
                      <ChevronDown className="ml-auto h-4 w-4" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </button>

                  {(item.name === "Quản lý bài đăng" && blogMenuOpen && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={`
                              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                              ${
                                subItem.current
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
                                  subItem.current
                                    ? "text-blue-500"
                                    : "text-gray-300 group-hover:text-gray-400"
                                }
                              `}
                            />
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )) ||
                    (item.name === "Quản lý chuyến bay" && flightMenuOpen && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={`
                                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                                  ${
                                    subItem.current
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
                                      subItem.current
                                        ? "text-blue-500"
                                        : "text-gray-300 group-hover:text-gray-400"
                                    }
                                  `}
                              />
                              {subItem.name}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                </div>
              );
            }

            // Render normal menu item
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
      </div>
    </>
  );
};

export default AdminSidebar;
