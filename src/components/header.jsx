import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Calendar } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useRef, useState } from "react";

const MENU_ITEMS = [
  { label: "Chuyến bay", path: "flights" },
  { label: "Ưu đãi", path: "deals" },
  { label: "Blog", path: "blog" },
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(window.scrollY);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setShowHeader(
            !(currentScrollY > lastScrollY.current && currentScrollY > 60)
          );
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (item) => {
    const path = `/${item.path}`;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <header
      className={`fixed top-0 w-full z-[1000] bg-white/20 backdrop-blur-sm border-b border-white/20 shadow-sm transition-transform duration-500 ease-in-out dark:bg-gray-900/20 dark:border-gray-800/20 ${
        showHeader ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{ willChange: "transform" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 object-cover"
                src="https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png"
                alt="AirsSky"
              />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent ml-1">
              Airsky
            </h1>
          </Link>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-8">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={`/${item.path}`}
                className={`font-medium transition-colors duration-200 ${
                  isActive(item)
                    ? "text-[#2563eb] font-bold"
                    : "text-gray-700 dark:text-gray-300 hover:text-[#2563eb]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle - Always visible */}
            <ThemeToggle variant="ghost" size="sm" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={user.avatar || user.picture}
                        alt={user.fullName || user.email}
                      />
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {user.fullName || user.email || "Người dùng"}
                      </div>
                      {user.fullName && user.email && (
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-6 w-64">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center w-full">
                      <User className="w-4 h-4 mr-3" />
                      Hồ sơ cá nhân
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to="/my-bookings"
                      className="flex items-center w-full"
                    >
                      <Calendar className="w-4 h-4 mr-3" />
                      Đơn đặt chỗ của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="bg-[#2563eb] hover:bg-[#1e40af] text-white"
                onClick={() => navigate("/auth")}
              >
                Đăng nhập
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Theme Toggle for mobile - Always visible */}
            <ThemeToggle variant="ghost" size="sm" />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-[#2563eb] text-lg font-bold">
                    AirsSky
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-4 p-4">
                  {MENU_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={`/${item.path}`}
                      className={`font-medium transition-colors duration-200 ${
                        isActive(item)
                          ? "text-[#2563eb] font-semibold bg-blue-50 px-3 py-2 rounded-md"
                          : "text-[#374151] hover:text-[#2563eb] px-3 py-2 rounded-md hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t flex flex-col space-y-2">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-gray-50">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={user.avatar || user.picture}
                            alt={user.fullName || user.email}
                          />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {user.fullName || user.email}
                          </div>
                          {user.fullName && user.email && (
                            <div className="text-xs text-gray-500">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start space-x-3 w-full"
                        onClick={() => navigate("/profile")}
                      >
                        <User className="w-5 h-5" />
                        <span>Hồ sơ cá nhân</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start space-x-3 w-full"
                        onClick={() => navigate("/my-bookings")}
                      >
                        <Calendar className="w-5 h-5" />
                        <span>Đơn đặt chỗ của tôi</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start space-x-3 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Đăng xuất</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="bg-[#2563eb] hover:bg-[#1e40af] text-white w-full"
                      onClick={() => navigate("/auth")}
                    >
                      Đăng nhập
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
