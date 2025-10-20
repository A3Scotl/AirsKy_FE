import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  X,
  Filter,
  Bell,
  BellOff,
  Search,
  Calendar,
  MessageCircle,
  Settings,
  TrendingUp,
  Archive,
  Clock,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import webSocketService from "@/services/websocket-service";

const NotificationModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const token = localStorage.getItem("token");

  const {
    notifications,
    loading,
    hasMore,
    unreadCount,
    loadMore,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useNotifications(user?.id, token);

  // Consolidated state
  const [state, setState] = useState({
    activeTab: "all",
    filter: "all",
    sortBy: "newest",
    search: "",
    loadingMore: false,
    selectedType: "all",
  });

  const scrollAreaRef = useRef(null);

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    const { search, filter, selectedType, sortBy } = state;

    return notifications
      .filter((n) => {
        const matchesSearch =
          !search ||
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.message.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
          filter === "all" ||
          (filter === "unread" && !n.read) ||
          (filter === "read" && n.read);

        const matchesType = selectedType === "all" || n.type === selectedType;

        return matchesSearch && matchesFilter && matchesType;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "oldest":
            return new Date(a.createdAt) - new Date(b.createdAt);
          case "type":
            return a.type.localeCompare(b.type);
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  }, [
    notifications,
    state.search,
    state.filter,
    state.selectedType,
    state.sortBy,
  ]);

  // Memoized notification types
  const notificationTypes = useMemo(
    () => [...new Set(notifications.map((n) => n.type))],
    [notifications]
  );

  // Optimized scroll handler
  const handleScroll = useCallback(
    async (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        hasMore &&
        !loading &&
        !state.loadingMore
      ) {
        setState((prev) => ({ ...prev, loadingMore: true }));
        try {
          await loadMore();
        } finally {
          setState((prev) => ({ ...prev, loadingMore: false }));
        }
      }
    },
    [hasMore, loading, state.loadingMore, loadMore]
  );

  // Consolidated handlers
  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNotificationClick = useCallback(
    async (notification) => {
      if (!notification.read) {
        try {
          await markAsRead([notification.notificationId]);
        } catch (error) {
          console.error("Failed to mark as read:", error);
        }
      }
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, [markAllAsRead]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setState({
        activeTab: "all",
        filter: "all",
        sortBy: "newest",
        search: "",
        loadingMore: false,
        selectedType: "all",
      });
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original body overflow
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Calculate scrollbar width
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Prevent body scroll
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Restore on cleanup
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  // Notification utilities
  const getNotificationIcon = useCallback((type) => {
    const icons = {
      booking: <Calendar className="w-4 h-4" />,
      payment: <MessageCircle className="w-4 h-4" />,
      flight: <Bell className="w-4 h-4" />,
    };
    return icons[type?.toLowerCase()] || <Bell className="w-4 h-4" />;
  }, []);

  const formatNotificationTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  // Show unread notifications for unread tab
  const displayNotifications =
    state.activeTab === "all"
      ? filteredNotifications
      : filteredNotifications.filter((n) => !n.read);

  const isEmpty = displayNotifications.length === 0;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] w-[100vw] h-[100vh]"
        onClick={onClose}
      />

      <div
        className="fixed top-0 right-0 w-full sm:w-[480px] max-w-[480px] bg-white z-[9999] flex flex-col shadow-2xl h-screen overflow-hidden"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          transform: "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Thông báo</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("🧪 Testing WebSocket notification...");
                const success = webSocketService.sendTestNotificationToSelf();
                if (success) {
                  console.log("✅ Test notification sent successfully");
                } else {
                  console.error("❌ Failed to send test notification");
                }
              }}
              className="text-xs"
              title="Send test notification to yourself"
            >
              Test WS
            </Button> */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={state.activeTab}
          onValueChange={(value) => updateState({ activeTab: value })}
          className="flex-1 flex flex-col"
        >
          {/* Tab List */}
          <div className="px-4 pt-4 border-b bg-white border-gray-200 shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Tất cả ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">Chưa đọc ({unreadCount})</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          {/* All Tab */}
          <TabsContent
            value="all"
            className="flex-1 bg-white overflow-auto flex flex-col mt-0"
          >
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 shrink-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm thông báo..."
                  value={state.search}
                  onChange={(e) => updateState({ search: e.target.value })}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={state.filter}
                  onValueChange={(v) => updateState({ filter: v })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="unread">Chưa đọc</SelectItem>
                    <SelectItem value="read">Đã đọc</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={state.selectedType}
                  onValueChange={(v) => updateState({ selectedType: v })}
                >
                  <SelectTrigger className="flex-1 min-w-[140px]">
                    <SelectValue placeholder="Loại" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="all">Tất cả loại</SelectItem>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={state.sortBy}
                  onValueChange={(v) => updateState({ sortBy: v })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="type">Theo loại</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="w-full flex items-center gap-2"
                  disabled={loading}
                >
                  <BellOff className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea
              className="flex-1 bg-white overflow-y-scroll max-h-[70vh]"
              onScrollCapture={handleScroll}
              ref={scrollAreaRef}
            >
              <div className="p-4 space-y-3 pb-20">
                {loading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : isEmpty ? (
                  <div className="text-center py-12 text-gray-500">
                    {state.activeTab === "unread"
                      ? "Không có thông báo chưa đọc"
                      : state.search
                      ? "Không tìm thấy thông báo nào"
                      : "Chưa có thông báo"}
                  </div>
                ) : (
                  displayNotifications.map((notification, index) => (
                    <NotificationItem
                      key={`${notification.notificationId}-${notification.createdAt}-${index}`}
                      notification={notification}
                      onClick={handleNotificationClick}
                      getIcon={getNotificationIcon}
                      formatTime={formatNotificationTime}
                    />
                  ))
                )}

                {state.loadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                )}

                {!hasMore && displayNotifications.length > 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Đã hiển thị tất cả thông báo
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Unread Tab */}
          <TabsContent
            value="unread"
            className="flex-1 bg-white overflow-y-scroll max-h-[90vh] flex flex-col mt-0"
          >
            <div className="p-4 border-b border-gray-200 shrink-0">
              <div className="text-center text-sm text-gray-600">
                Hiển thị {unreadCount} thông báo chưa đọc
              </div>
            </div>
            <ScrollArea className="flex-1" onScrollCapture={handleScroll}>
              <div className="p-4 space-y-3 pb-20">
                {displayNotifications.map((notification, index) => (
                  <NotificationItem
                    key={`${notification.notificationId}-${notification.createdAt}-${index}`}
                    notification={notification}
                    onClick={handleNotificationClick}
                    getIcon={getNotificationIcon}
                    formatTime={formatNotificationTime}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="flex-1 flex flex-col bg-white mt-0 p-4 space-y-4"
          >
            <div className="space-y-4">
              {[
                { label: "Thông báo push", status: "Bật" },
                // { label: "Âm thanh", status: "Bật" },
                { label: "Email thông báo", status: "Tắt" },
              ].map(({ label, status }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-600">{label}</span>
                  <Button variant="outline" size="sm">
                    {status}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// ✅ Extracted NotificationItem Component for better performance
const NotificationItem = ({ notification, onClick, getIcon, formatTime }) => (
  <div
    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md group ${
      notification.read
        ? "bg-gray-50 border-gray-200"
        : "bg-blue-50 border-blue-200 shadow-sm"
    }`}
    onClick={() => onClick(notification)}
  >
    <div className="flex items-start gap-3">
      <div
        className={`p-2 rounded-full flex-shrink-0 ${
          notification.read
            ? "bg-gray-200 text-gray-500"
            : "bg-blue-100 text-blue-600"
        }`}
      >
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4
              className={`font-medium text-sm leading-tight ${
                notification.read ? "text-gray-700" : "text-gray-900"
              }`}
            >
              {notification.title}
            </h4>
            <p
              className={`text-sm mt-1 ${
                notification.read ? "text-gray-500" : "text-gray-600"
              }`}
            >
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-gray-400">
                {formatTime(notification.createdAt)}
              </p>
              <Badge variant="outline" className="text-xs">
                {notification.type.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
            )}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Mark as read
                  }}
                  className="h-6 w-6 p-0 text-blue-600"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-6 p-0 text-gray-600"
                title="Lưu trữ"
              >
                <Archive className="h-3 w-3" />
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NotificationModal;
