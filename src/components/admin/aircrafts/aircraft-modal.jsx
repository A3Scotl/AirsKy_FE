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

const AircraftModal = ({ open, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    aircraftCode: "",
    aircraftName: "",
    totalSeats: "",
    seatLayout: "",
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          aircraftCode: initialData.aircraftCode || "",
          aircraftName: initialData.aircraftName || "",
          totalSeats: initialData.totalSeats?.toString() || "",
          seatLayout: initialData.seatLayout || "",
        });
      } else {
        setFormData({
          aircraftCode: "",
          aircraftName: "",
          totalSeats: "",
          seatLayout: "",
        });
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.aircraftCode.trim() || !formData.aircraftName.trim()) {
      alert("Vui lòng nhập mã và tên máy bay");
      return;
    }

    if (!formData.totalSeats || isNaN(formData.totalSeats)) {
      alert("Vui lòng nhập số ghế hợp lệ");
      return;
    }

    // Convert totalSeats to number
    const submitData = {
      ...formData,
      totalSeats: parseInt(formData.totalSeats),
    };

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Chỉnh sửa máy bay" : "Thêm máy bay mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aircraftCode">Mã máy bay *</Label>
              <Input
                id="aircraftCode"
                value={formData.aircraftCode}
                onChange={(e) => handleChange("aircraftCode", e.target.value)}
                placeholder="VD: A320"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSeats">Tổng số ghế *</Label>
              <Input
                id="totalSeats"
                type="number"
                value={formData.totalSeats}
                onChange={(e) => handleChange("totalSeats", e.target.value)}
                placeholder="VD: 180"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraftName">Tên máy bay *</Label>
            <Input
              id="aircraftName"
              value={formData.aircraftName}
              onChange={(e) => handleChange("aircraftName", e.target.value)}
              placeholder="VD: Airbus A320"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seatLayout">Bố trí ghế</Label>
            <Input
              id="seatLayout"
              value={formData.seatLayout}
              onChange={(e) => handleChange("seatLayout", e.target.value)}
              placeholder="VD: 3-3"
            />
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

export default AircraftModal;
