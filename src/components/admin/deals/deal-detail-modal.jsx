import {
  X,
  Calendar,
  Percent,
  DollarSign,
  Users,
  Tag,
  MapPin,
  Plane,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DealDetailModal = ({ open, onClose, deal }) => {
  if (!deal) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusBadge = () => {
    if (!deal.isActive) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Không hoạt động
        </Badge>
      );
    }

    if (deal.isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Hết hạn
        </Badge>
      );
    }

    if (!deal.isAvailable) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Hết lượt sử dụng
        </Badge>
      );
    }

    return (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Đang hoạt động
      </Badge>
    );
  };

  const getUsageProgress = () => {
    if (!deal.totalUsageLimit) return 0;
    return (deal.usedCount / deal.totalUsageLimit) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Tag className="h-5 w-5" />
            Chi tiết Deal
          </DialogTitle>
          <DialogDescription className="dark:text-gray-300">
            Xem thông tin chi tiết và thống kê sử dụng deal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <code className="bg-muted px-3 py-1 rounded-md text-lg font-mono font-bold dark:bg-gray-700 dark:text-white">
                      {deal.dealCode}
                    </code>
                    {getStatusBadge()}
                  </div>
                  <h1 className="text-2xl font-bold dark:text-white">
                    {deal.title}
                  </h1>
                  <p className="text-muted-foreground dark:text-gray-300">
                    {deal.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {/* Deal Image */}
              {deal.dealImage && (
                <div className="mb-6">
                  <img
                    src={deal.dealImage}
                    alt={deal.title}
                    className="w-full h-64 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Discount Information */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2 dark:bg-gray-800 dark:border-gray-700">
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <Percent className="h-5 w-5 text-green-600" />
                      Thông tin giảm giá
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 dark:bg-gray-800">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {deal.discountPercentage}%
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Phần trăm giảm
                      </div>
                    </div>
                    {deal.maxDiscountAmount && (
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">
                          Giảm tối đa
                        </div>
                        <div className="font-semibold dark:text-white">
                          {formatCurrency(deal.maxDiscountAmount)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Đơn hàng tối thiểu
                      </div>
                      <div className="font-semibold dark:text-white">
                        {formatCurrency(deal.minimumOrderAmount)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Statistics */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2 dark:bg-gray-800 dark:border-gray-700">
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Thống kê sử dụng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 dark:bg-gray-800">
                    <div>
                      <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
                        <span>Đã sử dụng</span>
                        <span>
                          {deal.usedCount}/{deal.totalUsageLimit || "∞"}
                        </span>
                      </div>
                      {deal.totalUsageLimit && (
                        <Progress value={getUsageProgress()} className="h-2" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Còn lại
                      </div>
                      <div className="font-semibold text-blue-600">
                        {deal.remainingUsage || "Không giới hạn"}
                      </div>
                    </div>
                    {deal.usagePerUser && (
                      <div>
                        <div className="text-sm text-muted-foreground dark:text-gray-400">
                          Giới hạn/người
                        </div>
                        <div className="font-semibold dark:text-white">
                          {deal.usagePerUser} lần
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Time Information */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2 dark:bg-gray-800 dark:border-gray-700">
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Thời hạn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 dark:bg-gray-800">
                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Bắt đầu
                      </div>
                      <div className="font-semibold dark:text-white">
                        {formatDate(deal.validFrom)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Kết thúc
                      </div>
                      <div className="font-semibold dark:text-white">
                        {formatDate(deal.validTo)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground dark:text-gray-400">
                        Trạng thái
                      </div>
                      <div className="font-semibold">
                        {deal.isExpired ? (
                          <span className="text-red-600">Đã hết hạn</span>
                        ) : (
                          <span className="text-green-600">Còn hiệu lực</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Separator className="dark:bg-gray-700" />

          {/* Route Restrictions */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Plane className="h-5 w-5" />
                Áp dụng cho tuyến bay
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              {deal.departureAirportId || deal.arrivalAirportId ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        <span className="font-medium dark:text-white">
                          Sân bay đi
                        </span>
                      </div>
                      {deal.departureAirportId ? (
                        <Badge
                          variant="outline"
                          className="text-sm dark:border-gray-600 dark:text-gray-300"
                        >
                          {deal.departureAirportCode} -{" "}
                          {deal.departureAirportName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm dark:text-gray-400">
                          Tất cả sân bay
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        <span className="font-medium dark:text-white">
                          Sân bay đến
                        </span>
                      </div>
                      {deal.arrivalAirportId ? (
                        <Badge
                          variant="outline"
                          className="text-sm dark:border-gray-600 dark:text-gray-300"
                        >
                          {deal.arrivalAirportCode} - {deal.arrivalAirportName}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm dark:text-gray-400">
                          Tất cả sân bay
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Deal này áp dụng cho tất cả các tuyến bay</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Activity className="h-5 w-5" />
                Thông tin hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="dark:bg-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground dark:text-gray-400">
                      Ngày tạo:{" "}
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatDate(deal.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground dark:text-gray-400">
                      Cập nhật lần cuối:{" "}
                    </span>
                    <span className="font-medium dark:text-white">
                      {formatDate(deal.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground dark:text-gray-400">
                      ID Deal:{" "}
                    </span>
                    <code className="bg-muted px-2 py-1 rounded text-sm dark:bg-gray-700 dark:text-white">
                      #{deal.dealId}
                    </code>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground dark:text-gray-400">
                      Trạng thái hoạt động:{" "}
                    </span>
                    <Badge
                      variant={deal.isActive ? "success" : "secondary"}
                      className="dark:bg-gray-700 dark:text-white"
                    >
                      {deal.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Award className="h-5 w-5 text-purple-600" />
              Cài đặt Loyalty
            </CardTitle>
          </CardHeader>
          <CardContent className="dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <span className="font-medium dark:text-white">
                    Khách vãng lai
                  </span>
                </div>
                <Badge
                  variant={deal.isGuestOnly ? "success" : "secondary"}
                  className="dark:bg-gray-700 dark:text-white"
                >
                  {deal.isGuestOnly
                    ? "Chỉ dành cho khách vãng lai"
                    : "Cho tất cả khách hàng"}
                </Badge>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {deal.isGuestOnly
                    ? "Deal chỉ áp dụng cho khách hàng chưa đăng ký tài khoản"
                    : "Deal áp dụng cho cả khách hàng đã đăng ký và chưa đăng ký"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <span className="font-medium dark:text-white">
                    Hạng thành viên yêu cầu
                  </span>
                </div>
                {deal.requiredLoyaltyTier ? (
                  <Badge
                    variant="outline"
                    className="text-purple-600 border-purple-600 dark:border-purple-400 dark:text-purple-400"
                  >
                    {deal.requiredLoyaltyTier === "PLATINUM"
                      ? "Platinum"
                      : deal.requiredLoyaltyTier === "GOLD"
                      ? "Gold"
                      : deal.requiredLoyaltyTier === "SILVER"
                      ? "Silver"
                      : deal.requiredLoyaltyTier}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="dark:bg-gray-700 dark:text-white"
                  >
                    Không yêu cầu
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {deal.requiredLoyaltyTier
                    ? `Chỉ thành viên từ hạng ${
                        deal.requiredLoyaltyTier === "PLATINUM"
                          ? "Platinum"
                          : deal.requiredLoyaltyTier === "GOLD"
                          ? "Gold"
                          : deal.requiredLoyaltyTier === "SILVER"
                          ? "Silver"
                          : deal.requiredLoyaltyTier
                      } trở lên`
                    : "Không yêu cầu hạng thành viên cụ thể"}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                  <span className="font-medium dark:text-white">
                    Độc quyền loyalty
                  </span>
                </div>
                <Badge
                  variant={deal.isLoyaltyExclusive ? "success" : "secondary"}
                  className="dark:bg-gray-700 dark:text-white"
                >
                  {deal.isLoyaltyExclusive ? "Độc quyền" : "Công khai"}
                </Badge>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  {deal.isLoyaltyExclusive
                    ? "Deal chỉ dành riêng cho thành viên loyalty"
                    : "Deal công khai cho tất cả khách hàng đủ điều kiện"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealDetailModal;
