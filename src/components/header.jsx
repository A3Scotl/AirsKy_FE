import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 w-full z-[1000] bg-white shadow-sm border-b border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <span className="text-xl font-bold text-[#2563eb]">AirsSky</span>
            </div>
          </div>

          {/* Menu desktop */}
          <nav className="hidden md:flex space-x-8">
            {["Flights", "Hotels", "Cars", "Deals", "Blogs"].map((item) => (
              <a
                key={item}
                href="#"
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
              className="text-[#374151] hover:text-[#2563eb]"
            >
              Sign In
            </Button>
            <Button className="bg-[#2563eb] hover:bg-[#1e40af] text-white">
              Sign Up
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
                    className="text-[#374151] hover:text-[#2563eb] w-full"
                  >
                    Sign In
                  </Button>
                  <Button className="bg-[#2563eb] hover:bg-[#1e40af] text-white w-full">
                    Sign Up
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
