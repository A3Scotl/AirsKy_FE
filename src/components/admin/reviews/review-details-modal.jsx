import { useState } from "react";
import {
  X,
  Star,
  User,
  Plane,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatDateVN } from "@/utils/currency-utils";

const ReviewDetailsModal = ({
  open,
  onClose,
  reviewData,
  onApprove,
  onReject,
  onDelete,
}) => {
  const [actionLoading, setActionLoading] = useState(false);

  if (!open || !reviewData) return null;

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await onApprove(reviewData.reviewId);
      onClose();
    } catch (error) {
      console.error("Error approving review:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await onReject(reviewData.reviewId);
      onClose();
    } catch (error) {
      console.error("Error rejecting review:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      return;
    }

    setActionLoading(true);
    try {
      await onDelete(reviewData.reviewId);
      onClose();
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold">{rating}/5</span>
      </div>
    );
  };

  const getStatusBadge = (isApproved) => {
    if (isApproved === null) {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="h-4 w-4 mr-1" />
          Chờ duyệt
        </Badge>
      );
    }
    return isApproved ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        Đã duyệt
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="h-4 w-4 mr-1" />
        Từ chối
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Chi Tiết Đánh Giá
              </h2>
              <p className="text-sm text-gray-500">
                Review ID: {reviewData.reviewId}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(reviewData.isApproved)}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="mb-4">{renderStars(reviewData.rating)}</div>
                <p className="text-gray-600 text-sm">
                  Đánh giá vào {formatDateVN(reviewData.reviewDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Thông Tin Người Dùng</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={reviewData.userAvatar}
                    alt={reviewData.userName}
                  />
                  <AvatarFallback>
                    {reviewData.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {reviewData.userName}
                  </h3>
                  <p className="text-gray-600">User ID: {reviewData.userId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flight Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-4 w-4" />
                <span>Thông Tin Chuyến Bay</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Mã chuyến bay:</span>
                <span className="font-medium">{reviewData.flightCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mã đặt chỗ:</span>
                <span className="font-medium">#{reviewData.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Flight ID:</span>
                <span className="font-medium">{reviewData.flightId}</span>
              </div>
            </CardContent>
          </Card>

          {/* Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Nội Dung Đánh Giá</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {reviewData.comment}
              </p>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Thời Gian</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày đánh giá:</span>
                <span className="font-medium">
                  {formatDateVN(reviewData.reviewDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="font-medium">
                  {formatDateVN(reviewData.createdAt)}
                </span>
              </div>
              {reviewData.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cập nhật cuối:</span>
                  <span className="font-medium">
                    {formatDateVN(reviewData.updatedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={actionLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa đánh giá
            </Button>

            {reviewData.isApproved === null && (
              <>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Từ chối
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Chấp nhận
                </Button>
              </>
            )}

            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailsModal;
