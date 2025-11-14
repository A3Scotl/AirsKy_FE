import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

const TravelClassModal = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    className: "",
    benefits: "",
    refundable: false,
    changeable: false,
    cancellationFee: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          className: initialData.className || "",
          benefits: initialData.benefits || "",
          refundable: initialData.refundable || false,
          changeable: initialData.changeable || false,
          cancellationFee: initialData.cancellationFee || 0,
        });
      } else {
        setFormData({
          className: "",
          benefits: "",
          refundable: false,
          changeable: false,
          cancellationFee: 0,
        });
      }
      setErrors({});
    }
  }, [open, initialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.className.trim()) {
      newErrors.className = "Tên hạng vé là bắt buộc";
    } else if (formData.className.length > 50) {
      newErrors.className = "Tên hạng vé không được vượt quá 50 ký tự";
    }

    if (formData.cancellationFee < 0) {
      newErrors.cancellationFee = "Phí hủy không được âm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plane className="w-5 h-5 text-blue-600" />
            {isEdit ? "Cập nhật hạng vé" : "Thêm hạng vé mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin hạng vé. Các thay đổi sẽ được lưu vào hệ thống."
              : "Tạo hạng vé mới với các thông tin chi tiết."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className" className="text-sm font-medium">
                    Tên hạng vé <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="className"
                    value={formData.className}
                    onChange={(e) =>
                      handleInputChange("className", e.target.value)
                    }
                    placeholder="Ví dụ: Economy, Business, First Class"
                    maxLength={50}
                    className={
                      errors.className
                        ? "border-red-500 dark:text-black"
                        : "dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
                    }
                  />
                  {errors.className && (
                    <p className="text-sm text-red-500">{errors.className}</p>
                  )}
                  <p className="text-xs text-gray-500">Tối đa 50 ký tự</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits" className="text-sm font-medium">
                    Quyền lợi
                  </Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) =>
                      handleInputChange("benefits", e.target.value)
                    }
                    placeholder="Mô tả các quyền lợi của hạng vé này..."
                    rows={3}
                    className="dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Thông tin phí
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="cancellationFee"
                    className="text-sm font-medium"
                  >
                    Phí hủy (VND)
                  </Label>
                  <Input
                    id="cancellationFee"
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.cancellationFee}
                    onChange={(e) =>
                      handleInputChange(
                        "cancellationFee",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    className={
                      errors.cancellationFee
                        ? "border-red-500"
                        : "dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50"
                    }
                  />
                  {errors.cancellationFee && (
                    <p className="text-sm text-red-500">
                      {errors.cancellationFee}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Phí hủy bằng VND (Ví dụ: 50000, 100000)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Settings */}
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chính sách</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="refundable"
                    checked={formData.refundable}
                    onCheckedChange={(checked) =>
                      handleInputChange("refundable", checked)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="refundable"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Cho phép hoàn trả
                    </Label>
                    {formData.refundable ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="changeable"
                    checked={formData.changeable}
                    onCheckedChange={(checked) =>
                      handleInputChange("changeable", checked)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="changeable"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Cho phép đổi vé
                    </Label>
                    {formData.changeable ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Xem trước</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Hạng vé:</span>
                  <Badge variant="outline" className="font-medium">
                    {formData.className || "Chưa nhập"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Chính sách:</span>
                  <div className="flex gap-2">
                    <Badge
                      variant={formData.refundable ? "default" : "secondary"}
                    >
                      {formData.refundable ? "Hoàn trả" : "Không hoàn trả"}
                    </Badge>
                    <Badge
                      variant={formData.changeable ? "default" : "secondary"}
                    >
                      {formData.changeable ? "Đổi vé" : "Không đổi"}
                    </Badge>
                  </div>
                </div>

                {formData.cancellationFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Phí hủy:</span>
                    <span className="text-red-600 font-medium">
                      {formData.cancellationFee.toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Cập nhật..." : "Tạo mới..."}
                </>
              ) : (
                <>{isEdit ? "Cập nhật" : "Tạo mới"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TravelClassModal;
