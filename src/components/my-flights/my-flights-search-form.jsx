import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plane, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MyFlightsSearchForm = ({ onSearch, isLoading, error }) => {
  const [formData, setFormData] = useState({
    bookingCode: "",
    passengerName: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bookingCode.trim() || !formData.passengerName.trim()) {
      return;
    }
    onSearch(formData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-blue-700 flex items-center justify-center gap-2">
          <Plane className="w-6 h-6 text-blue-500" />
          Chuyến Bay Của Tôi
        </CardTitle>
        <CardDescription className="text-base">
          Tìm kiếm và quản lý đặt chỗ của bạn
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Nhập mã đặt chỗ và họ tên để tìm kiếm thông tin chuyến bay và thực
            hiện thanh toán.
          </AlertDescription>
        </Alert>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookingCode" className="text-sm font-medium">
              Mã đặt chỗ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bookingCode"
              type="text"
              placeholder="Ví dụ: XHSCEGXQ, VN123456..."
              value={formData.bookingCode}
              onChange={(e) => handleChange("bookingCode", e.target.value)}
              required
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              Mã đặt chỗ gồm 8 ký tự được gửi qua email hoặc SMS
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengerName" className="text-sm font-medium">
              Họ và tên hành khách <span className="text-red-500">*</span>
            </Label>
            <Input
              id="passengerName"
              type="text"
              placeholder="Nhập đầy đủ họ tên như trên vé"
              value={formData.passengerName}
              onChange={(e) => handleChange("passengerName", e.target.value)}
              required
              className="text-sm"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !formData.bookingCode.trim() ||
              !formData.passengerName.trim()
            }
          >
            {isLoading ? (
              "Đang tìm kiếm..."
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm đặt chỗ
              </>
            )}
          </Button>
        </form>

        {/* Help Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">Cần hỗ trợ?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Mã đặt chỗ thường được gửi qua email xác nhận</li>
            <li>• Có thể tìm thấy trên vé điện tử hoặc SMS</li>
            <li>• Nếu không tìm thấy, liên hệ hotline: 1900 XXX XXX</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyFlightsSearchForm;
