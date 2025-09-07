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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/ui/image-upload";

/**
 * Modal thêm/cập nhật sân bay
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onSubmit
 * @param {object} [props.initialData] - Nếu có là update, không có là create
 * @param {Array} props.countries - Danh sách quốc gia [{ countryId, countryName }]
 */
const AirportModal = ({ open, onClose, onSubmit, initialData, countries }) => {
  const [form, setForm] = useState({
    airport_code: "",
    airport_name: "",
    countryId: "",
    city_name: "",
    is_active: true,
    thumbnail: "",
    thumbnailFile: null,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        airport_code: initialData.airportCode || initialData.airport_code || "",
        airport_name: initialData.airportName || initialData.airport_name || "",
        countryId: initialData.countryId ? String(initialData.countryId) : "",
        city_name: (() => {
          const cityData =
            initialData.cityNames || initialData.cityName || initialData.city;
          if (Array.isArray(cityData)) {
            return cityData.join(", ");
          }
          return cityData || "";
        })(),
        is_active: initialData.active ?? initialData.is_active ?? true,
        thumbnail: initialData.thumbnail || "",
        thumbnailFile: null,
      });
    } else {
      setForm({
        airport_code: "",
        airport_name: "",
        countryId: "",
        city_name: "",
        is_active: true,
        thumbnail: "",
        thumbnailFile: null,
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleThumbnailChange = (url, file) => {
    setForm((prev) => ({
      ...prev,
      thumbnail: url,
      thumbnailFile: file,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      airportCode: form.airport_code,
      airportName: form.airport_name,
      countryId: form.countryId,
      cityNames: form.city_name,
      active: form.is_active,
    };

    // Xử lý thumbnail: chỉ gửi 1 loại
    if (form.thumbnailFile instanceof File) {
      console.log("[AirportModal] Sending file:", form.thumbnailFile.name);
      formData.thumbnailFile = form.thumbnailFile;
    } else if (form.thumbnail) {
      console.log("[AirportModal] Sending URL:", form.thumbnail);
      formData.thumbnail = form.thumbnail;
    } else {
      console.log("[AirportModal] No thumbnail to send");
    }

    console.log("[AirportModal] Final formData:", formData);
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Cập nhật sân bay" : "Thêm sân bay"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mã sân bay"
            name="airport_code"
            value={form.airport_code}
            onChange={handleChange}
            maxLength={5}
            required
            placeholder="VD: SGN"
          />
          <Input
            label="Tên sân bay"
            name="airport_name"
            value={form.airport_name}
            onChange={handleChange}
            maxLength={100}
            required
            placeholder="VD: Sân bay Tân Sơn Nhất"
          />
          <Input
            label="Tên thành phố"
            name="city_name"
            value={form.city_name}
            onChange={handleChange}
            maxLength={200}
            placeholder="VD: Hồ Chí Minh, Hà Nội, Đà Nẵng (cách nhau bằng dấu phẩy)"
          />
          <p className="text-xs text-muted-foreground">
            Nhập nhiều thành phố cách nhau bằng dấu phẩy. Ví dụ: "Hồ Chí Minh,
            Hà Nội"
          </p>
          {initialData && form.city_name && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Thành phố hiện tại:
              </p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  if (typeof form.city_name === "string") {
                    return form.city_name.split(",").map((city, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {city.trim()}
                      </Badge>
                    ));
                  } else if (Array.isArray(form.city_name)) {
                    return form.city_name.map((city, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {typeof city === "string" ? city.trim() : city}
                      </Badge>
                    ));
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
          <Select
            value={form.countryId}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, countryId: v }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn quốc gia" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem
                  key={c.countryId || c.id}
                  value={String(c.countryId || c.id)}
                >
                  {c.countryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <label className="block text-sm font-medium mb-2">
              Ảnh thumbnail
            </label>
            <ImageUpload
              value={form.thumbnail}
              onChange={handleThumbnailChange}
              placeholder="Chọn ảnh sân bay"
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

export default AirportModal;
