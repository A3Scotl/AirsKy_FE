import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Eye, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import {
  notificationApi,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
} from "@/apis/notification-api";
import { userApi } from "@/apis/user-api";
import Pagination from "@/components/ui/pagination";

const AdminNotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [broadcastNotification, setBroadcastNotification] = useState({
    type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
    title: "",
    message: "",
    relatedId: "",
  });

  const [cleanupDays, setCleanupDays] = useState(30);

  const loadNotifications = async (page = 1, size = pageSize) => {
    try {
      setLoading(true);
      const response = await notificationApi.getAllNotifications({
        page: page - 1,
        size,
      });

      if (response.success) {
        const pageData = response.data;
        const notificationList = pageData.content || pageData;
        setNotifications(notificationList);

        // Update pagination state
        setTotalPages(pageData.totalPages || 1);
        setTotalElements(pageData.totalElements || notificationList.length);
        setCurrentPage(page);
      } else {
        toast.error("Không thể tải danh sách thông báo");
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Lỗi khi tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page) => {
    loadNotifications(page, pageSize);
  };

  /**
   * Handle page size change
   */
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
    loadNotifications(1, newSize);
  };

  /**
   * Load users for notification creation
   */
  const loadUsers = async () => {
    try {
      const response = await userApi.getAllUsers();
      if (response.success) {
        const userList = response.data.content || response.data;
        setUsers(userList);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  /**
   * Broadcast notification to all users
   */
  const handleBroadcastNotification = async () => {
    try {
      if (!broadcastNotification.message) {
        toast.error("Vui lòng nhập nội dung thông báo");
        return;
      }

      const response = await notificationApi.createNotification({
        type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        title:
          broadcastNotification.title ||
          NOTIFICATION_TYPE_LABELS[NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT],
        message: broadcastNotification.message,
        relatedId: broadcastNotification.relatedId || null,
      });

      if (response.success) {
        toast.success("Gửi thông báo đến tất cả người dùng thành công");
        setIsBroadcastDialogOpen(false);
        setBroadcastNotification({
          type: NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
          title: "",
          message: "",
          relatedId: "",
        });
        loadNotifications(currentPage, pageSize); // Reload to show the broadcast notification
      } else {
        toast.error(response.message || "Không thể gửi thông báo");
      }
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      toast.error("Lỗi khi gửi thông báo");
    }
  };

  /**
   * Delete notification
   */
  const handleDeleteNotification = async (notificationId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;

    try {
      const response = await notificationApi.deleteNotification(notificationId);

      if (response.success) {
        toast.success("Xóa thông báo thành công");
        loadNotifications(currentPage, pageSize);
      } else {
        toast.error(response.message || "Không thể xóa thông báo");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Lỗi khi xóa thông báo");
    }
  };

  /**
   * Cleanup old read notifications
   */
  const handleCleanupNotifications = async () => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc cũ hơn ${cleanupDays} ngày?`
      )
    )
      return;

    try {
      setLoading(true);
      const response = await notificationApi.cleanupOldNotifications(
        cleanupDays
      );

      if (response.success) {
        toast.success(
          response.message || `Đã xóa ${response.data} thông báo cũ`
        );
        setIsCleanupDialogOpen(false);
        setCleanupDays(30); // Reset to default
        loadNotifications(currentPage, pageSize); // Reload list
      } else {
        toast.error(response.message || "Không thể xóa thông báo cũ");
      }
    } catch (error) {
      console.error("Error cleaning up notifications:", error);
      toast.error("Lỗi khi xóa thông báo cũ");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  /**
   * Get notification status badge
   */
  const getStatusBadge = (notification) => {
    if (notification.read) {
      return <Badge variant="secondary">Đã đọc</Badge>;
    }
    return <Badge variant="default">Chưa đọc</Badge>;
  };

  /**
   * Get user name by ID
   */
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
      : "N/A";
  };

  useEffect(() => {
    loadNotifications(currentPage, pageSize);
    loadUsers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between space-y-6 flex-col">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Thông Báo</h1>
          <p className="text-muted-foreground">
            Quản lý và gửi thông báo cho người dùng
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isCleanupDialogOpen}
            onOpenChange={setIsCleanupDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="w-4 h-4 mr-2" />
                Dọn Dẹp Cũ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Dọn Dẹp Thông Báo Cũ</DialogTitle>
                <DialogDescription>
                  Xóa tất cả thông báo đã đọc cũ hơn số ngày chỉ định
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cleanup-days">Số ngày cũ</Label>
                  <Input
                    id="cleanup-days"
                    type="number"
                    min="1"
                    max="365"
                    value={cleanupDays}
                    onChange={(e) =>
                      setCleanupDays(parseInt(e.target.value) || 30)
                    }
                    placeholder="30"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Thông báo đã đọc cũ hơn {cleanupDays} ngày sẽ bị xóa vĩnh
                    viễn
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCleanupDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCleanupNotifications}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Xóa Thông Báo Cũ"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isBroadcastDialogOpen}
            onOpenChange={setIsBroadcastDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Gửi Tất Cả
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Gửi Thông Báo Tất Cả Người Dùng</DialogTitle>
                <DialogDescription>
                  Gửi thông báo real-time đến tất cả người dùng hệ thống
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="broadcast-type">Loại thông báo</Label>
                  <Input
                    id="broadcast-type"
                    value="Thông báo hệ thống"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="broadcast-title">Tiêu đề (tùy chọn)</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="Để trống sẽ dùng tiêu đề mặc định"
                    className="dark:text-black"
                    value={broadcastNotification.title}
                    onChange={(e) =>
                      setBroadcastNotification((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="broadcast-message">
                    Nội dung thông báo *
                  </Label>
                  <Textarea
                    id="broadcast-message"
                    placeholder="Nhập nội dung thông báo"
                    className="dark:text-black"
                    value={broadcastNotification.message}
                    onChange={(e) =>
                      setBroadcastNotification((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="broadcast-related-id">
                    ID liên quan (tùy chọn)
                  </Label>
                  <Input
                    id="broadcast-related-id"
                    placeholder="ID của booking, flight, etc."
                    value={broadcastNotification.relatedId}
                    className="dark:text-black"
                    onChange={(e) =>
                      setBroadcastNotification((prev) => ({
                        ...prev,
                        relatedId: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsBroadcastDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={handleBroadcastNotification}>
                  <Send className="w-4 h-4 mr-2" />
                  Gửi Tất Cả
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Thông Báo</CardTitle>
            <CardDescription>
              Tất cả thông báo đã gửi trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Chưa có thông báo nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      notifications.map((notification) => (
                        <TableRow key={notification.notificationId}>
                          <TableCell>
                            {getUserName(notification.userId)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {NOTIFICATION_TYPE_LABELS[notification.type] ||
                                notification.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {notification.title}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {notification.message}
                          </TableCell>
                          <TableCell>{getStatusBadge(notification)}</TableCell>
                          <TableCell>
                            {formatDate(notification.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSelectedNotification(notification)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteNotification(
                                    notification.notificationId
                                  )
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={pageSize}
                  totalItems={totalElements}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  showPageSizeSelector={true}
                  showFirstLast={true}
                  showInfo={true}
                  maxVisiblePages={5}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Notification Detail Dialog */}
        {selectedNotification && (
          <Dialog
            open={!!selectedNotification}
            onOpenChange={() => setSelectedNotification(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chi Tiết Thông Báo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Người dùng</Label>
                  <p className="text-sm">
                    {getUserName(selectedNotification.userId)}
                  </p>
                </div>
                <div>
                  <Label>Loại</Label>
                  <p className="text-sm">
                    {NOTIFICATION_TYPE_LABELS[selectedNotification.type]}
                  </p>
                </div>
                <div>
                  <Label>Tiêu đề</Label>
                  <p className="text-sm">{selectedNotification.title}</p>
                </div>
                <div>
                  <Label>Nội dung</Label>
                  <p className="text-sm">{selectedNotification.message}</p>
                </div>
                <div>
                  <Label>Trạng thái</Label>
                  <p className="text-sm">
                    {selectedNotification.read ? "Đã đọc" : "Chưa đọc"}
                  </p>
                </div>
                <div>
                  <Label>Thời gian tạo</Label>
                  <p className="text-sm">
                    {formatDate(selectedNotification.createdAt)}
                  </p>
                </div>
                {selectedNotification.relatedId && (
                  <div>
                    <Label>ID liên quan</Label>
                    <p className="text-sm">{selectedNotification.relatedId}</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationPage;
