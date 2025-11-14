import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuth } from "@/contexts/auth-context";
import { NOTIFICATION_TYPE_LABELS } from "@/apis/notification-api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import NotificationModal from "@/components/common/notification-modal";

const NotificationDropdown = ({ showText = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications(user?.id, localStorage.getItem("token"));

  /**
   * Handle notification click - navigate to relevant page
   */
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await markAsRead(notification.notificationId);
      }

      // Navigate based on notification type and related ID
      const { type, relatedId } = notification;

      switch (type) {
        case "BOOKING_CONFIRMED":
        case "PAYMENT_SUCCESS":
          if (relatedId) {
            navigate(`/my-flights?bookingCode=${relatedId}`);
          } else {
            navigate("/my-flights");
          }
          break;

        case "PAYMENT_FAILED":
          if (relatedId) {
            navigate(`/my-flights?bookingCode=${relatedId}&showPayment=true`);
          } else {
            navigate("/my-flights");
          }
          break;

        case "CHECKIN_SUCCESSFUL":
          if (relatedId) {
            navigate(`/check-in?bookingCode=${relatedId}`);
          } else {
            navigate("/check-in");
          }
          break;

        case "FLIGHT_DELAYED":
        case "BOOKING_CANCELLED":
          if (relatedId) {
            navigate(`/my-flights?bookingCode=${relatedId}`);
          } else {
            navigate("/my-flights");
          }
          break;

        case "SYSTEM_ANNOUNCEMENT":
        default:
          // For system announcements, just mark as read
          break;
      }

      // Close dropdown after navigation
      setIsOpen(false);
    } catch (error) {
      console.error("❌ Error handling notification click:", error);
      toast.error("Có lỗi khi xử lý thông báo");
    }
  };

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation(); // Prevent notification click

    try {
      await markAsRead(notificationId);
      toast.success("Đã đánh dấu là đã đọc");
    } catch (error) {
      toast.error("Có lỗi khi đánh dấu đã đọc");
    }
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllAsRead();
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (error) {
      toast.error("Có lỗi khi đánh dấu tất cả đã đọc");
    }
  };

  /**
   * Handle delete notification
   */
  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation(); // Prevent notification click

    try {
      await deleteNotification(notificationId);
      toast.success("Đã xóa thông báo");
    } catch (error) {
      toast.error("Có lỗi khi xóa thông báo");
    }
  };

  /**
   * Format notification time
   */
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;

    return notificationTime.toLocaleDateString("vi-VN");
  };

  /**
   * Get notification icon style based on type
   */
  const getNotificationStyle = (type) => {
    const styles = {
      BOOKING_CONFIRMED: "text-green-600 bg-green-100",
      PAYMENT_SUCCESS: "text-green-600 bg-green-100",
      PAYMENT_FAILED: "text-red-600 bg-red-100",
      CHECKIN_SUCCESSFUL: "text-blue-600 bg-blue-100",
      FLIGHT_DELAYED: "text-yellow-600 bg-yellow-100",
      BOOKING_CANCELLED: "text-red-600 bg-red-100",
      SYSTEM_ANNOUNCEMENT: "text-purple-600 bg-purple-100",
    };

    return styles[type] || "text-gray-600 bg-gray-100";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Detect screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Handle button click - open modal on mobile, dropdown on desktop
  const handleButtonClick = () => {
    if (isMobile) {
      setModalOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (!user) return null;

  return (
    <div className="relative " ref={dropdownRef}>
      {/* Render dropdown only on desktop */}
      {!isMobile && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                showText ? "flex items-center space-x-2 px-3" : ""
              }`}
            >
              <div className="relative">
                <Bell
                  className={`h-5 w-5 ${
                    unreadCount > 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                />

                {/* Unread count badge - positioned above the bell icon */}
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-3 w-3 sm:h-4 sm:w-4 text-[10px] sm:text-xs p-0 flex items-center justify-center animate-pulse"
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
              </div>

              {/* Show text for mobile */}
              {showText && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Thông Báo
                </span>
              )}

              {/* Connection status indicator - Temporarily disabled */}
              {/* <div className="absolute -bottom-1 -right-1">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : connectionStatus === "disabled" ? (
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
              </div> */}
            </Button>
          </DropdownMenuTrigger>{" "}
          <DropdownMenuContent
            align="end"
            className="w-80 sm:w-96 p-0 shadow-lg border-0 bg-white dark:bg-gray-800 z-[100001] max-h-[80vh] overflow-hidden"
            sideOffset={8}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b bg-gray-50 dark:bg-gray-700 gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  Thông báo
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="text-xs">
                    ({unreadCount}/
                    {Array.isArray(notifications) ? notifications.length : 0})
                  </span>
                  {unreadCount > 0 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 h-auto p-1 self-start sm:self-auto"
                >
                  <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Đọc tất cả</span>
                  <span className="sm:hidden">Đọc</span>
                </Button>
              )}
            </div>

            {/* Notifications list */}
            <ScrollArea className="h-64 sm:h-96">
              {loading && (
                <div className="flex items-center justify-center p-6 sm:p-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {error && (
                <div className="p-3 sm:p-4 text-center">
                  <p className="text-red-600 text-xs sm:text-sm mb-2">
                    {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNotifications()}
                    className="text-xs sm:text-sm"
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {!loading &&
                !error &&
                Array.isArray(notifications) &&
                notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                    <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Chưa có thông báo nào
                    </p>
                  </div>
                )}

              {!loading &&
                !error &&
                Array.isArray(notifications) &&
                notifications.length > 0 && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((notification, index) => (
                      <div
                        key={notification.notificationId}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors relative group ${
                          !notification.read
                            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                            : "opacity-75"
                        }`}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
                          {/* Unread indicator dot */}
                          {!notification.read && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}

                          {/* Notification type indicator */}
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationStyle(
                              notification.type
                            )}`}
                          >
                            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <h4
                                  className={`text-xs sm:text-sm truncate ${
                                    !notification.read
                                      ? "font-semibold text-gray-900 dark:text-white"
                                      : "font-medium text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {NOTIFICATION_TYPE_LABELS[
                                    notification.type
                                  ] || notification.title}
                                </h4>
                                <p
                                  className={`text-xs sm:text-sm mt-1 line-clamp-2 ${
                                    !notification.read
                                      ? "text-gray-800 dark:text-gray-200"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 sm:mt-2">
                                  {formatNotificationTime(
                                    notification.createdAt
                                  )}
                                </p>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) =>
                                      handleMarkAsRead(
                                        e,
                                        notification.notificationId
                                      )
                                    }
                                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                    title="Đánh dấu đã đọc"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}

                                {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) =>
                                handleDeleteNotification(
                                  e,
                                  notification.notificationId
                                )
                              }
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              title="Xóa thông báo"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button> */}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <Separator />
                <div className="p-3 bg-gray-50 dark:bg-gray-700 space-y-2">
                  {/* <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {

                    // Import webSocketService dynamically to avoid circular imports
                    import("@/services/websocket-service").then(
                      ({ default: webSocketService }) => {
                        const success =
                          webSocketService.sendTestNotificationToSelf();
                        if (success) {

                          toast.success("Test notification sent!");
                        } else {
                          console.error(
                            "❌ Failed to send test notification from dropdown"
                          );
                          toast.error("Failed to send test notification");
                        }
                      }
                    );
                  }}
                  title="Send test notification to yourself"
                >
                  🧪 Test WebSocket
                </Button> */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      setIsOpen(false);
                      setModalOpen(true);
                    }}
                  >
                    Xem tất cả thông báo
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Mobile button - opens modal */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleButtonClick}
          className={`relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            showText ? "flex items-center space-x-2 px-3" : ""
          }`}
        >
          <div className="relative">
            <Bell
              className={`h-5 w-5 ${
                unreadCount > 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            />

            {/* Unread count badge - positioned above the bell icon */}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1.5 -right-1.5 h-3 w-3 text-[10px] p-0 flex items-center justify-center animate-pulse"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>

          {/* Show text for mobile */}
          {showText && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Thông Báo
            </span>
          )}
        </Button>
      )}

      {/* Notification Modal for mobile */}
      <NotificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default NotificationDropdown;
