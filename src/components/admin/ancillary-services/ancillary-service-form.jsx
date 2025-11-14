import { useState, useEffect, useRef } from "react";
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
import {
  ancillaryServiceApi,
  getServiceTypeInfo,
} from "@/apis/ancillary-service-api";

const AncillaryServiceForm = ({
  open,
  onOpenChange,
  service,
  onSubmit,
  loading = false,
  serviceTypes: propServiceTypes = {},
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    serviceType: "",
    price: 0,
    isActive: true,
    imageUrl: "",
    maxQuantity: 1,
    isPerPassenger: true,
  });

  const [errors, setErrors] = useState({});
  const [serviceTypes, setServiceTypes] = useState(propServiceTypes);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Update serviceTypes when prop changes
  useEffect(() => {
    setServiceTypes(propServiceTypes);
  }, [propServiceTypes]);

  // Fetch service types on component mount (fallback if not provided via props)
  useEffect(() => {
    if (Object.keys(propServiceTypes).length === 0) {
      const fetchServiceTypes = async () => {
        try {
          setLoadingServiceTypes(true);
          const response = await ancillaryServiceApi.getServiceTypes();
          if (response.success && response.data && isMountedRef.current) {
            // Convert array of strings to object for easier access
            const typesObject = {};
            response.data.forEach((typeKey) => {
              // Use getServiceTypeInfo to get display info for each type
              typesObject[typeKey] = getServiceTypeInfo(typeKey);
            });
            setServiceTypes(typesObject);
          } else if (isMountedRef.current) {
            toast.error("Không thể tải danh sách loại dịch vụ");
          }
        } catch (error) {
          if (isMountedRef.current) {
            toast.error("Lỗi khi tải danh sách loại dịch vụ");
          }
        } finally {
          if (isMountedRef.current) {
            setLoadingServiceTypes(false);
          }
        }
      };

      fetchServiceTypes();
    }

    // Cleanup function to set mounted ref to false
    return () => {
      isMountedRef.current = false;
    };
  }, [propServiceTypes]);

  const [originalData, setOriginalData] = useState({});

  // Initialize form data when service prop changes
  useEffect(() => {
    if (service) {
      const initialData = {
        name: service.serviceName || service.name || "",
        description: service.description || "",
        serviceType: service.serviceType || "",
        price: service.price || 0,
        isActive: service.isActive !== undefined ? service.isActive : true,
        imageUrl: service.thumbnail || service.imageUrl || "",
        maxQuantity: service.maxQuantity || 1,
        isPerPassenger:
          service.isPerPassenger !== undefined ? service.isPerPassenger : true,
      };
      setFormData(initialData);
      setOriginalData(initialData);
    } else {
      // Reset form for new service
      const initialData = {
        name: "",
        description: "",
        serviceType: "",
        price: 0,
        isActive: true,
        imageUrl: "",
        maxQuantity: 1,
        isPerPassenger: true,
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
    setErrors({});
  }, [service, open]);

  // Check if form data has changed from original
  const hasChanges = () => {
    if (!service) return true; // Always allow submit for new services
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.serviceType &&
      formData.price >= 0 &&
      Object.keys(errors).length === 0
    );
  };

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

    if (formData.price <= 0) {
      newErrors.price = "Giá phải lớn hơn 0";
    }

    if (formData.maxQuantity < 1) {
      newErrors.maxQuantity = "Số lượng tối đa phải lớn hơn 0";
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
      toast.error(
        service ? "Lỗi khi cập nhật dịch vụ" : "Lỗi khi thêm dịch vụ"
      );
    }
  };

  const selectedServiceType = serviceTypes[formData.serviceType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
        <DialogHeader className="dark:bg-gray-900">
          <DialogTitle className="dark:text-white">
            {service ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {service
              ? "Cập nhật thông tin dịch vụ đi kèm"
              : "Tạo dịch vụ đi kèm mới cho hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name" className="dark:text-gray-300">
                Tên dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nhập tên dịch vụ"
                disabled={loading}
                className={`text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Service Type */}
            <div>
              <Label htmlFor="serviceType" className="dark:text-gray-300">
                Loại dịch vụ <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) =>
                  handleInputChange("serviceType", value)
                }
                disabled={loading || Object.keys(serviceTypes).length === 0}
              >
                <SelectTrigger
                  className={`text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.serviceType ? "border-red-500" : ""
                  }`}
                >
                  <SelectValue
                    placeholder={
                      Object.keys(serviceTypes).length === 0
                        ? "Đang tải..."
                        : "Chọn loại dịch vụ"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                  {Object.entries(serviceTypes).map(([key, type]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="dark:focus:bg-gray-700 dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        {/* <span>{type.icon}</span> */}
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
              <Label htmlFor="price" className="dark:text-gray-300">
                Giá (VND)
              </Label>
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
                disabled={loading}
                className={`text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.price ? "border-red-500" : ""
                }`}
              />
              {errors.price && (
                <p className="text-sm text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            {/* Max Quantity */}
            <div>
              <Label htmlFor="maxQuantity" className="dark:text-gray-300">
                Số lượng tối đa
              </Label>
              <Input
                id="maxQuantity"
                type="number"
                min="1"
                value={formData.maxQuantity}
                onChange={(e) =>
                  handleInputChange("maxQuantity", Number(e.target.value))
                }
                placeholder="1"
                disabled={loading}
                className={`text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.maxQuantity ? "border-red-500" : ""
                }`}
              />
              {errors.maxQuantity && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.maxQuantity}
                </p>
              )}
            </div>

            {/* Is Per Passenger */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isPerPassenger"
                checked={formData.isPerPassenger}
                onCheckedChange={(checked) =>
                  handleInputChange("isPerPassenger", checked)
                }
                disabled={loading}
              />
              <Label htmlFor="isPerPassenger" className="dark:text-gray-300">
                Theo hành khách
              </Label>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
                disabled={loading}
              />
              <Label htmlFor="isActive" className="dark:text-gray-300">
                Hoạt động
              </Label>
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <Label htmlFor="imageUrl" className="dark:text-gray-300">
                URL hình ảnh
              </Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={loading}
                className="text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description" className="dark:text-gray-300">
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Mô tả chi tiết về dịch vụ..."
                rows={3}
                disabled={loading}
                className="text-black dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <DialogFooter className="dark:bg-gray-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid() || !hasChanges()}
            >
              {loading ? "Đang xử lý..." : service ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AncillaryServiceForm;
