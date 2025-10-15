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
import { toast } from "sonner";

const CheckInSearchForm = ({ onSearch, onShowTerms, isLoading, error }) => {
  const [formData, setFormData] = useState({
    bookingCode: "",
    passengerName: "",
    email: "",
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
          Check-in Online
        </CardTitle>
        <CardDescription className="text-base">
          Thực hiện check-in nhanh chóng và thuận tiện từ nhà
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Terms Notice */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Trước khi check-in, vui lòng đọc kỹ{" "}
            <button
              onClick={onShowTerms}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              điều khoản và quy tắc check-in
            </button>
          </AlertDescription>
        </Alert>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookingCode" className="text-sm font-medium">
              Mã đặt chỗ / Vé điện tử <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bookingCode"
              type="text"
              placeholder="Ví dụ: VN123456, ABC123..."
              value={formData.bookingCode}
              onChange={(e) => handleChange("bookingCode", e.target.value)}
              required
              className="text-sm"
            />
            <p className="text-xs text-gray-500">
              Mã đặt chỗ gồm 8 ký tự hoặc mã vé điện tử
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

          {/* <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email (tùy chọn)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email để nhận thông tin check-in"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="text-sm"
            />
          </div> */}

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
            <li>• Mã đặt chỗ thường được gửi qua email hoặc SMS</li>
            <li>• Có thể tìm thấy trên vé điện tử hoặc xác nhận đặt chỗ</li>
            <li>• Nếu không tìm thấy, liên hệ hotline: 1900 XXX XXX</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckInSearchForm;
