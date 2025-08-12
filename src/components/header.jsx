import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-[#e5e7eb]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {/* logo */}
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
              <span className="text-xl font-bold text-[#2563eb]">AirsKy</span>
            </div>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a
              href="#"
              className="text-[#374151] hover:text-[#2563eb] font-medium"
            >
              Flights
            </a>
            <a
              href="#"
              className="text-[#374151] hover:text-[#2563eb] font-medium"
            >
              Hotels
            </a>
            <a
              href="#"
              className="text-[#374151] hover:text-[#2563eb] font-medium"
            >
              Cars
            </a>
            <a
              href="#"
              className="text-[#374151] hover:text-[#2563eb] font-medium"
            >
              Deals
            </a>
            <a
              href="#"
              className="text-[#374151] hover:text-[#2563eb] font-medium"
            >
              Blogs
            </a>
          </nav>

          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
}

export default Header;
