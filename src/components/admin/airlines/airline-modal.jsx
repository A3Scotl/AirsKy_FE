import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ui/image-upload";

/**
 * Modal thêm/cập nhật hãng bay
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onSubmit
 * @param {object} [props.initialData] - Nếu có là update, không có là create
 */
const AirlineModal = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    airline_code: "",
    airline_name: "",
    contact: "",
    is_active: true,
    thumbnail: "",
    thumbnailFile: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    if (initialData) {
      setForm({
        airline_code: initialData.airlineCode || initialData.airline_code || "",
        airline_name: initialData.airlineName || initialData.airline_name || "",
        contact: initialData.contact || "",
        is_active: initialData.active ?? initialData.is_active ?? true,
        thumbnail: initialData.thumbnail || "",
        thumbnailFile: null,
      });
    } else {
      setForm({
        airline_code: "",
        airline_name: "",
        contact: "",
        is_active: true,
        thumbnail: "",
        thumbnailFile: null,
      });
    }
  }, [initialData, open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Form validation functions
  const validateForm = () => {
    const newErrors = {};

    if (!form.airline_code.trim()) {
      newErrors.airline_code = "Mã hãng bay là bắt buộc";
    } else if (form.airline_code.trim().length < 2) {
      newErrors.airline_code = "Mã hãng bay phải có ít nhất 2 ký tự";
    } else if (form.airline_code.trim().length > 5) {
      newErrors.airline_code = "Mã hãng bay không được quá 5 ký tự";
    } else if (!/^[A-Z0-9]+$/.test(form.airline_code.trim())) {
      newErrors.airline_code = "Mã hãng bay chỉ được chứa chữ hoa và số";
    }

    if (!form.airline_name.trim()) {
      newErrors.airline_name = "Tên hãng bay là bắt buộc";
    } else if (form.airline_name.trim().length < 2) {
      newErrors.airline_name = "Tên hãng bay phải có ít nhất 2 ký tự";
    } else if (form.airline_name.trim().length > 100) {
      newErrors.airline_name = "Tên hãng bay không được quá 100 ký tự";
    }

    if (form.contact.trim() && form.contact.trim().length > 100) {
      newErrors.contact = "Thông tin liên hệ không được quá 100 ký tự";
    }

    return newErrors;
  };

  // Check if form is valid
  const isFormValid = () => {
    const errors = validateForm();
    return (
      Object.keys(errors).length === 0 &&
      form.airline_code.trim() &&
      form.airline_name.trim() &&
      !isSubmitting
    );
  };

  // Check if data has changed (for edit mode)
  const hasDataChanged = () => {
    if (!initialData) return true; // For new entries, always allow submission

    return (
      form.airline_code !==
        (initialData.airlineCode || initialData.airline_code || "") ||
      form.airline_name !==
        (initialData.airlineName || initialData.airline_name || "") ||
      form.contact !== (initialData.contact || "") ||
      form.is_active !==
        (initialData.active ?? initialData.is_active ?? true) ||
      form.thumbnailFile !== null ||
      form.thumbnail !== (initialData.thumbnail || "")
    );
  };

  const handleThumbnailChange = (url, file) => {
    setForm((prev) => ({
      ...prev,
      thumbnail: url,
      thumbnailFile: file,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = {
        airlineCode: form.airline_code.trim(),
        airlineName: form.airline_name.trim(),
        contact: form.contact.trim(),
        active: form.is_active,
      };

      // Xử lý thumbnail: chỉ gửi 1 loại
      if (form.thumbnailFile instanceof File) {
        formData.thumbnailFile = form.thumbnailFile;
      } else if (form.thumbnail) {
        formData.thumbnail = form.thumbnail;
      } else {

      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting airline form:", error);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-2xl lg:max-w-3xl mx-auto max-h-[90vh] overflow-auto dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {initialData ? "Cập nhật hãng bay" : "Thêm hãng bay"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Cập nhật thông tin chi tiết cho hãng bay đã chọn."
              : "Thêm một hãng bay mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="airline_code"
                className="text-sm font-medium dark:text-gray-200"
              >
                Mã hãng bay *
              </Label>
              <Input
              id="airline_code"
              name="airline_code"
              value={form.airline_code}
              onChange={handleChange}
              maxLength={5}
              required
              disabled={isSubmitting}
              placeholder="VD: VNA"
              className={`text-black dark:text-black dark:bg-white ${
                errors.airline_code ? "border-red-500 dark:border-red-500" : ""
              }`}
            />
              {errors.airline_code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.airline_code}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="airline_name"
                className="text-sm font-medium dark:text-gray-200"
              >
                Tên hãng bay *
              </Label>
                <Input
                  id="airline_name"
                  name="airline_name"
                  value={form.airline_name}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                  placeholder="VD: Vietnam Airlines"
                  className={`text-black dark:text-black dark:bg-white ${
                    errors.airline_name ? "border-red-500 dark:border-red-500" : ""
                  }`}
                />
                {errors.airline_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.airline_name}
                  </p>
                )}
              </div>
            </div>          <div className="space-y-2">
            <Label
              htmlFor="contact"
              className="text-sm font-medium dark:text-gray-200"
            >
              Liên hệ
            </Label>
            <Input
              id="contact"
              name="contact"
              value={form.contact}
              onChange={handleChange}
              maxLength={100}
              disabled={isSubmitting}
              placeholder="Số điện thoại, email hoặc website"
              className={`text-black dark:text-black dark:bg-white ${
                errors.contact ? "border-red-500 dark:border-red-500" : ""
              }`}
            />
            {errors.contact && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.contact}
              </p>
            )}
          </div>
          <div className="max-w-full">
            <Label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Ảnh thumbnail
            </Label>
            <ImageUpload
              value={form.thumbnail}
              onChange={handleThumbnailChange}
              placeholder="Chọn ảnh hãng bay"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              disabled={isSubmitting}
              id="is_active"
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
            />
            <Label
              htmlFor="is_active"
              className="dark:text-gray-200 cursor-pointer"
            >
              Đang hoạt động
            </Label>
          </div>
          <DialogFooter className="dark:bg-gray-900 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                !isFormValid() ||
                (initialData && !hasDataChanged()) ||
                isSubmitting
              }
              className={`w-full sm:w-auto ${
                !isFormValid() ||
                (initialData && !hasDataChanged()) ||
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSubmitting
                ? initialData
                  ? "Đang cập nhật..."
                  : "Đang thêm..."
                : initialData
                ? "Cập nhật"
                : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AirlineModal;
