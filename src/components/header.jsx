import { Button } from "@/components/ui/button";
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
import { Menu, User, LogOut } from "lucide-react";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

import { useEffect, useRef, useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // State for header visibility
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
            setShowHeader(false); // scroll down
          } else {
            setShowHeader(true); // scroll up
          }
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
    navigate("/auth");
  };

  // Function to check if current path matches menu item
  const isActive = (item) => {
    const path = `/${item.toLowerCase()}`;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <header
      className={`fixed top-0 w-full z-[1000] bg-white/20 backdrop-blur-sm border-b border-white/20 shadow-sm transition-transform duration-500 ease-in-out ${
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
                alt="Workflow"
              />
            </div>

            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent ml-2">
              AirsSky
            </span>
          </Link>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-8">
            {["Flights", "Deals", "Blogs"].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                className={`font-medium transition-colors duration-200 ${
                  isActive(item)
                    ? "text-[#2563eb] font-bold"
                    : "text-gray-700 hover:text-[#2563eb]"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <User className="w-5 h-5" />
                    <span>{user.email || "User"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-6" >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="bg-[#2563eb] hover:bg-[#1e40af] text-white w-full"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
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
                  {["Flights", "Deals", "Blogs"].map((item) => (
                    <Link
                      key={item}
                      to={`/${item.toLowerCase()}`}
                      className={`font-medium transition-colors duration-200 ${
                        isActive(item)
                          ? "text-[#2563eb] font-semibold bg-blue-50 px-3 py-2 rounded-md"
                          : "text-[#374151] hover:text-[#2563eb] px-3 py-2 rounded-md hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
                <div className="p-4 border-t flex flex-col space-y-2">
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start space-x-2"
                        onClick={() => navigate("/profile")}
                      >
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex items-center justify-start space-x-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="bg-[#2563eb] hover:bg-[#1e40af] text-white w-full"
                      onClick={() => navigate("/auth")}
                    >
                      Sign In
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
