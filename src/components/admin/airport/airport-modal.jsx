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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

/**
 * Modal thêm/cập nhật sân bay
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onSubmit
 * @param {object} [props.initialData] - Nếu có là update, không có là create
 * @param {Array} props.countries - Danh sách quốc gia [{ country_id, country_name }]
 */
const AirportModal = ({ open, onClose, onSubmit, initialData, countries }) => {
  const [form, setForm] = useState({
    airport_code: "",
    airport_name: "",
    country_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        airport_code: initialData.airport_code || "",
        airport_name: initialData.airport_name || "",
        country_id: initialData.country_id
          ? String(initialData.country_id)
          : "",
        is_active: initialData.is_active ?? true,
      });
    } else {
      setForm({
        airport_code: "",
        airport_name: "",
        country_id: "",
        is_active: true,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
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
          <Select
            value={form.country_id}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, country_id: v }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn quốc gia" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.country_id} value={String(c.country_id)}>
                  {c.country_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
