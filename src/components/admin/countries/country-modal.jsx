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
    // Log giá trị ảnh trước khi submit
    console.log("[CountryModal] Submitting form data:");
    console.log("- thumbnail:", form.thumbnail);
    console.log("- thumbnailFile:", form.thumbnailFile);
    console.log(
      "- thumbnailFile instanceof File:",
      form.thumbnailFile instanceof File
    );
    console.log("- initialData thumbnail:", initialData?.thumbnail);

    const formData = {
      countryCode: form.country_code,
      countryName: form.country_name,
      active: form.is_active,
    };

    // Xử lý thumbnail cho update vs create
    if (initialData) {
      // Update mode
      if (form.thumbnailFile instanceof File) {
        console.log(
          "[CountryModal] Update - Sending new file:",
          form.thumbnailFile.name
        );
        formData.thumbnailFile = form.thumbnailFile;
      } else if (form.thumbnail && form.thumbnail !== initialData.thumbnail) {
        console.log("[CountryModal] Update - Sending new URL:", form.thumbnail);
        formData.thumbnail = form.thumbnail;
      } else if (initialData.thumbnail) {
        console.log(
          "[CountryModal] Update - Keeping existing thumbnail:",
          initialData.thumbnail
        );
        formData.existingThumbnail = initialData.thumbnail;
      }
    } else {
      // Create mode
      if (form.thumbnailFile instanceof File) {
        console.log(
          "[CountryModal] Create - Sending file:",
          form.thumbnailFile.name
        );
        formData.thumbnailFile = form.thumbnailFile;
      } else if (form.thumbnail) {
        console.log("[CountryModal] Create - Sending URL:", form.thumbnail);
        formData.thumbnail = form.thumbnail;
      } else {
        console.log("[CountryModal] Create - No thumbnail");
      }
    }

    console.log("[CountryModal] Final formData:", formData);
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Cập nhật quốc gia" : "Thêm quốc gia"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mã quốc gia"
            name="country_code"
            value={form.country_code}
            onChange={handleChange}
            maxLength={3}
            required
            placeholder="VD: VN"
          />
          <Input
            label="Tên quốc gia"
            name="country_name"
            value={form.country_name}
            onChange={handleChange}
            maxLength={100}
            required
            placeholder="VD: Việt Nam"
          />
          <div className="">
            <label className="block text-sm font-medium mb-2">
              Ảnh thumbnail
            </label>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              {initialData ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CountryModal;
