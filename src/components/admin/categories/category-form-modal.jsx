import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { categoryApi } from "@/apis/category-api";
import { X } from "lucide-react";
import { toast } from "sonner";

const CategoryFormModal = ({ isOpen, onClose, category, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode
        setFormData({
          name: category.name || "",
          description: category.description || "",
        });
      } else {
        // Create mode
        setFormData({
          name: "",
          description: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên category là bắt buộc";
    } else if (formData.name.length < 2) {
      newErrors.name = "Tên category phải có ít nhất 2 ký tự";
    } else if (formData.name.length > 100) {
      newErrors.name = "Tên category không được quá 100 ký tự";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Mô tả không được quá 500 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      let result;
      if (category) {
        // Update category
       

        // Fallback to different possible ID field names
        const categoryId = category.categoryId;
     

        if (!categoryId) {
          throw new Error("Không thể xác định ID của category");
        }

        result = await categoryApi.updateCategory(categoryId, categoryData);
      } else {
        // Create category
        result = await categoryApi.createCategory(categoryData);
      }

      if (result.success) {
        onSuccess();
        toast.success(
          category
            ? "Cập nhật category thành công!"
            : "Tạo category thành công!"
        );
      } else {
        // Handle API errors
        if (result.message) {
          if (result.message.includes("name")) {
            setErrors((prev) => ({
              ...prev,
              name: result.message,
            }));
          } else {
            toast.error(result.message);
          }
        }
      }
    } catch (error) {
    
      toast.error("Có lỗi xảy ra khi lưu category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {category ? "Chỉnh sửa Category" : "Thêm Category mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Tên Category <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập tên category..."
              className={errors.name ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Nhập mô tả category..."
              rows={4}
              className={errors.description ? "border-red-500" : ""}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              {formData.description.length}/500 ký tự
            </p>
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </div>
              ) : category ? (
                "Cập nhật"
              ) : (
                "Tạo mới"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryFormModal;
