import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ancillaryServiceApi } from "@/apis/ancillary-service-api";

const AncillaryServiceForm = ({
  open,
  onOpenChange,
  service,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    serviceType: "",
    price: 0,
    isActive: true,
    imageUrl: "",
  });

  const [errors, setErrors] = useState({});
  const [serviceTypes, setServiceTypes] = useState({});
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);

  // Fetch service types on component mount
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        setLoadingServiceTypes(true);
        const response = await ancillaryServiceApi.getServiceTypes();
        if (response.success) {
          // Convert array to object for easier access
          const typesObject = {};
          response.data.forEach((type) => {
            typesObject[type.key] = type;
          });
          setServiceTypes(typesObject);
        } else {
          console.error("Failed to fetch service types:", response.message);
          toast.error("Không thể tải danh sách loại dịch vụ");
        }
      } catch (error) {
        console.error("Error fetching service types:", error);
        toast.error("Lỗi khi tải danh sách loại dịch vụ");
      } finally {
        setLoadingServiceTypes(false);
      }
    };

    fetchServiceTypes();
  }, []);

  // Initialize form data when service prop changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        serviceType: service.serviceType || "",
        price: service.price || 0,
        isActive: service.isActive !== undefined ? service.isActive : true,
        imageUrl: service.imageUrl || "",
      });
    } else {
      // Reset form for new service
      setFormData({
        name: "",
        description: "",
        serviceType: "",
        price: 0,
        isActive: true,
        imageUrl: "",
      });
    }
    setErrors({});
  }, [service, open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên dịch vụ là bắt buộc";
    }

    if (!formData.serviceType) {
      newErrors.serviceType = "Loại dịch vụ là bắt buộc";
    }

    if (formData.price < 0) {
      newErrors.price = "Giá phải lớn hơn hoặc bằng 0";
    }

    if (formData.priority < 1 || formData.priority > 5) {
      newErrors.priority = "Độ ưu tiên phải từ 1 đến 5";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      toast.success(
        service ? "Cập nhật dịch vụ thành công!" : "Thêm dịch vụ thành công!"
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting service:", error);
      toast.error(
        service ? "Lỗi khi cập nhật dịch vụ" : "Lỗi khi thêm dịch vụ"
      );
    }
  };

  const selectedServiceType = serviceTypes[formData.serviceType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Cập nhật thông tin dịch vụ đi kèm"
              : "Tạo dịch vụ đi kèm mới cho hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name">
                Tên dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nhập tên dịch vụ"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Service Type */}
            <div>
              <Label htmlFor="serviceType">
                Loại dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) =>
                  handleInputChange("serviceType", value)
                }
              >
                <SelectTrigger
                  className={errors.serviceType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn loại dịch vụ" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.vietnameseName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceType && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.serviceType}
                </p>
              )}
              {selectedServiceType && (
                <Badge variant="outline" className="mt-2">
                  <span className="mr-1">{selectedServiceType.icon}</span>
                  {selectedServiceType.englishName}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Giá (VND)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange("price", Number(e.target.value))
                }
                placeholder="0"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive">Hoạt động</Label>
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <Label htmlFor="imageUrl">URL hình ảnh</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Mô tả chi tiết về dịch vụ..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : service ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AncillaryServiceForm;
