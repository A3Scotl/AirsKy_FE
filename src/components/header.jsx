import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 w-full z-[1000] bg-white shadow-sm border-b border-[#e5e7eb]">
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

            <span className="text-xl font-bold text-[#2563eb] ml-2">AirsSky</span>
          </Link>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-8">
            {["Flights", "Hotels", "Cars", "Deals", "Blogs"].map((item) => (
              <a
                key={item}
                href={`${item}`}
                className="text-[#374151] hover:text-[#2563eb] font-medium"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              className="bg-[#2563eb] hover:bg-[#1e40af] text-white w-full"
              onClick={() => {
                navigate("/auth");
              }}
            >
              Sign In
            </Button>
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
                  {["Flights", "Hotels", "Cars", "Deals", "Blogs"].map(
                    (item) => (
                      <a
                        key={item}
                        href="#"
                        className="text-[#374151] hover:text-[#2563eb] font-medium"
                      >
                        {item}
                      </a>
                    )
                  )}
                </nav>
                <div className="p-4 border-t flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    className="bg-[#2563eb] hover:bg-[#1e40af] text-white w-full"
                    onClick={() => {
                      navigate("/auth");
                    }}
                  >
                    Sign In
                  </Button>
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
