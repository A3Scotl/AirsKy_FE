import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/ui/image-upload";

/**
 * Modal thêm/cập nhật quốc gia
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onSubmit
 * @param {object} [props.initialData] - Nếu có là update, không có là create
 */
const CountryModal = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    country_code: "",
    country_name: "",
    is_active: true,
    thumbnail: "",
    thumbnailFile: null,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        country_code: initialData.countryCode || initialData.country_code || "",
        country_name: initialData.countryName || initialData.country_name || "",
        is_active: initialData.active ?? initialData.is_active ?? true,
        thumbnail: initialData.thumbnail || "",
        thumbnailFile: null,
      });
    } else {
      setForm({
        country_code: "",
        country_name: "",
        is_active: true,
        thumbnail: "",
        thumbnailFile: null,
      });
    }
  }, [initialData, open]);

  const handleThumbnailChange = (url, file) => {
    setForm((prev) => ({
      ...prev,
      thumbnail: url,
      thumbnailFile: file,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      countryCode: form.country_code,
      countryName: form.country_name,
      active: form.is_active,
    };

    // Xử lý thumbnail cho update vs create
    if (initialData) {
      // Update mode
      if (form.thumbnailFile instanceof File) {
        formData.thumbnailFile = form.thumbnailFile;
      } else if (form.thumbnail && form.thumbnail !== initialData.thumbnail) {
        formData.thumbnail = form.thumbnail;
      } else if (initialData.thumbnail) {
        formData.existingThumbnail = initialData.thumbnail;
      }
    } else {
      // Create mode
      if (form.thumbnailFile instanceof File) {
        formData.thumbnailFile = form.thumbnailFile;
      } else if (form.thumbnail) {
        formData.thumbnail = form.thumbnail;
      } else {

      }
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-2xl lg:max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Cập nhật quốc gia" : "Thêm quốc gia"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium ">Mã quốc gia</label>
              <Input
                label="Mã quốc gia"
                name="country_code"
                value={form.country_code}
                onChange={handleChange}
                maxLength={3}
                required
                placeholder="VD: VN"
                className="dark:text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Tên quốc gia</label>
              <Input
                label="Tên quốc gia"
                name="country_name"
                value={form.country_name}
                onChange={handleChange}
                maxLength={100}
                required
                placeholder="VD: Việt Nam"
                className="dark:text-black"
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Thumbnail</label>
            <ImageUpload
              value={form.thumbnail}
              onChange={handleThumbnailChange}
              placeholder="Chọn ảnh quốc gia"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active">Đang hoạt động</label>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {initialData ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CountryModal;
