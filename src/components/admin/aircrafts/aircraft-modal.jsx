import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plane, Save } from "lucide-react";

const AircraftModal = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    aircraftCode: "",
    aircraftName: "",
    totalSeats: "",
    seatLayout: "",
  });
  const [originalFormData, setOriginalFormData] = useState({
    aircraftCode: "",
    aircraftName: "",
    totalSeats: "",
    seatLayout: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!initialData;

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      const newFormData = initialData
        ? {
            aircraftCode: initialData.aircraftCode || "",
            aircraftName: initialData.aircraftName || "",
            totalSeats: initialData.totalSeats?.toString() || "",
            seatLayout: initialData.seatLayout || "",
          }
        : {
            aircraftCode: "",
            aircraftName: "",
            totalSeats: "",
            seatLayout: "",
          };

      setFormData(newFormData);
      setOriginalFormData(newFormData);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.aircraftCode.trim()) {
      newErrors.aircraftCode = "Mã máy bay là bắt buộc";
    } else if (formData.aircraftCode.length < 2) {
      newErrors.aircraftCode = "Mã máy bay phải có ít nhất 2 ký tự";
    } else if (formData.aircraftCode.length > 10) {
      newErrors.aircraftCode = "Mã máy bay không được vượt quá 10 ký tự";
    }

    if (!formData.aircraftName.trim()) {
      newErrors.aircraftName = "Tên máy bay là bắt buộc";
    } else if (formData.aircraftName.length < 3) {
      newErrors.aircraftName = "Tên máy bay phải có ít nhất 3 ký tự";
    } else if (formData.aircraftName.length > 100) {
      newErrors.aircraftName = "Tên máy bay không được vượt quá 100 ký tự";
    }

    if (!formData.totalSeats.trim()) {
      newErrors.totalSeats = "Số ghế là bắt buộc";
    } else {
      const seats = parseInt(formData.totalSeats);
      if (isNaN(seats) || seats <= 0) {
        newErrors.totalSeats = "Số ghế phải là số nguyên dương";
      } else if (seats > 1000) {
        newErrors.totalSeats = "Số ghế không được vượt quá 1000";
      }
    }

    if (!formData.seatLayout.trim()) {
      newErrors.seatLayout = "Bố cục ghế là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.aircraftCode.trim().length >= 2 &&
      formData.aircraftCode.length <= 10 &&
      formData.aircraftName.trim().length >= 3 &&
      formData.aircraftName.length <= 100 &&
      formData.totalSeats.trim() &&
      !isNaN(parseInt(formData.totalSeats)) &&
      parseInt(formData.totalSeats) > 0 &&
      parseInt(formData.totalSeats) <= 1000 &&
      formData.seatLayout.trim() &&
      !isSubmitting
    );
  };

  // Check if data has changed (for edit mode)
  const hasDataChanged = () => {
    if (!isEditMode) return true;

    return (
      formData.aircraftCode !== originalFormData.aircraftCode ||
      formData.aircraftName !== originalFormData.aircraftName ||
      formData.totalSeats !== originalFormData.totalSeats ||
      formData.seatLayout !== originalFormData.seatLayout
    );
  };

  // Check if submit button should be enabled
  const isSubmitEnabled = () => {
    return isFormValid() && hasDataChanged();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSubmitEnabled()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!validateForm()) {
        return;
      }

      // Convert totalSeats to number
      const submitData = {
        aircraftCode: formData.aircraftCode.trim(),
        aircraftName: formData.aircraftName.trim(),
        totalSeats: parseInt(formData.totalSeats),
        seatLayout: formData.seatLayout.trim(),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-lg lg:max-w-xl mx-auto max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {initialData ? "Chỉnh sửa máy bay" : "Thêm máy bay mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aircraftCode" className="dark:text-gray-300">
                Mã máy bay *
              </Label>
              <Input
                id="aircraftCode"
                value={formData.aircraftCode}
                onChange={(e) =>
                  handleInputChange("aircraftCode", e.target.value)
                }
                placeholder="VD: A320"
                required
                disabled={isSubmitting}
                className={`text-black dark:text-black dark:bg-white ${
                  errors.aircraftCode
                    ? "border-red-500 dark:border-red-500"
                    : ""
                }`}
              />
              {errors.aircraftCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.aircraftCode}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSeats" className="dark:text-gray-300">
                Tổng số ghế *
              </Label>
              <Input
                id="totalSeats"
                type="number"
                value={formData.totalSeats}
                onChange={(e) =>
                  handleInputChange("totalSeats", e.target.value)
                }
                placeholder="VD: 180"
                min="1"
                required
                disabled={isSubmitting}
                className={`text-black dark:text-black dark:bg-white ${
                  errors.totalSeats ? "border-red-500 dark:border-red-500" : ""
                }`}
              />
              {errors.totalSeats && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.totalSeats}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraftName" className="dark:text-gray-300">
              Tên máy bay *
            </Label>
            <Input
              id="aircraftName"
              value={formData.aircraftName}
              onChange={(e) =>
                handleInputChange("aircraftName", e.target.value)
              }
              placeholder="VD: Airbus A320"
              required
              disabled={isSubmitting}
              className={`text-black dark:text-black dark:bg-white ${
                errors.aircraftName ? "border-red-500 dark:border-red-500" : ""
              }`}
            />
            {errors.aircraftName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.aircraftName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seatLayout" className="dark:text-gray-300">
              Bố trí ghế
            </Label>
            <Input
              id="seatLayout"
              value={formData.seatLayout}
              onChange={(e) => handleInputChange("seatLayout", e.target.value)}
              placeholder="VD: 3-3"
              disabled={isSubmitting}
              className={`text-black dark:text-black dark:bg-white ${
                errors.seatLayout ? "border-red-500 dark:border-red-500" : ""
              }`}
            />
            {errors.seatLayout && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.seatLayout}
              </p>
            )}
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
              disabled={!isFormValid() || isSubmitting}
              className={`w-full sm:w-auto ${
                !isFormValid() || isSubmitting
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

export default AircraftModal;
