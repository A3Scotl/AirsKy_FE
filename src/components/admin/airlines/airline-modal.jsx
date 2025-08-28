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
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        airline_code: initialData.airline_code || "",
        airline_name: initialData.airline_name || "",
        contact: initialData.contact || "",
        is_active: initialData.is_active ?? true,
      });
    } else {
      setForm({
        airline_code: "",
        airline_name: "",
        contact: "",
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
            {initialData ? "Cập nhật hãng bay" : "Thêm hãng bay"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mã hãng bay"
            name="airline_code"
            value={form.airline_code}
            onChange={handleChange}
            maxLength={5}
            required
            placeholder="VD: VNA"
          />
          <Input
            label="Tên hãng bay"
            name="airline_name"
            value={form.airline_name}
            onChange={handleChange}
            maxLength={100}
            required
            placeholder="VD: Vietnam Airlines"
          />
          <Input
            label="Liên hệ"
            name="contact"
            value={form.contact}
            onChange={handleChange}
            maxLength={100}
            placeholder="Số điện thoại, email hoặc website"
          />
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

export default AirlineModal;
