import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Bell, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/contexts/auth-context";

const AdminHeader = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side - Mobile menu button and search */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right side - Theme toggle, Notifications and user menu */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

        

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
              >
                {user && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8 border-2 border-gray-200 dark:border-gray-700">
                      <AvatarImage
                        src={user.avatar}
                        alt={user.fullName || user.email}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {user.fullName || user.firstName + " " + user.lastName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </span>
                    </div>
                  </div>
                )}

                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 p-2 shadow-xl border-gray-200/50 dark:border-gray-700/50"
            >
              <DropdownMenuLabel className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
                <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-700 shadow-md">
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.fullName || user?.email}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {user?.fullName || user?.firstName + " " + user?.lastName}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md mx-1"
              >
                <Link
                  to="/admin/profile"
                  className="flex items-center w-full px-2 py-2"
                >
                  <User className="mr-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span>Quản lý tài khoản</span>
                </Link>
              </DropdownMenuItem>

              {/* <DropdownMenuItem
                asChild
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md mx-1"
              >
                <Link
                  to="/admin/settings"
                  className="flex items-center w-full px-2 py-2"
                >
                  <Settings className="mr-3 h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span>Cài đặt hệ thống</span>
                </Link>
              </DropdownMenuItem> */}

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 hover:bg-red-50 dark:hover:bg-red-950 rounded-md mx-1 px-2 py-2"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
