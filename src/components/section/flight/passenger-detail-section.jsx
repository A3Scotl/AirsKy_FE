"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";

// Custom date formatting function
const formatDate = (date, formatString = "dd/MM/yyyy") => {
  if (!date) return "dd/mm/yyyy";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "dd/mm/yyyy";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return formatString === "dd/MM/yyyy" ? `${day}/${month}/${year}` : d.toLocaleDateString("vi-VN");
};

const PassengerDetails = ({ formData, updateFormData, updatePassenger }) => {
  const addPassenger = () => {
    if (formData.passengers.length >= 10) {
      alert("Số lượng hành khách tối đa là 10.");
      return;
    }
    updateFormData("passengers", [
      ...formData.passengers,
      {
        type: "ADULT",
        fullName: "",
        dob: null,
        passport: "",
        frequentFlyer: "",
      },
    ]);
  };

  const removePassenger = (index) => {
    if (formData.passengers.length > 1) {
      updateFormData("passengers", formData.passengers.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Thông tin hành khách</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Vui lòng cung cấp thông tin cần thiết cho tất cả hành khách
        </p>
      </div>


      {/* Passengers */}
      {Array.isArray(formData.passengers) ? (
        formData.passengers.map((passenger, index) => (
          <div
            key={`passenger-${index}`}
            className="border-2 border-gray-200 dark:border-none bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-sm">👤</span>
                </div>
                <h3 className="font-semibold text-base">
                  Hành khách {index + 1}
                </h3>
              </div>
              {formData.passengers.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removePassenger(index)}
                  className="text-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Xóa
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`p${index}-fullname`} className="text-sm">
                  Họ và tên *
                </Label>
                <Input
                  id={`p${index}-fullname`}
                  placeholder="Nhập họ và tên (viết hoa, không dấu)"
                  className="text-sm dark:bg-[#171717]"
                  value={passenger.fullName}
                  onChange={(e) => updatePassenger(index, "fullName", e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <Label htmlFor={`p${index}-type`} className="text-sm">
                  Loại hành khách *
                </Label>
                <Select
                  value={passenger.type}
                  onValueChange={(value) => updatePassenger(index, "type", value)}
                >
                  <SelectTrigger className="text-sm dark:bg-[#171717]">
                    <SelectValue placeholder="Chọn loại hành khách" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADULT">Người lớn</SelectItem>
                    <SelectItem value="CHILD">Trẻ em</SelectItem>
                    <SelectItem value="INFANT">Em bé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor={`p${index}-dob`} className="text-sm">
                  Ngày sinh *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm dark:bg-[#171717]",
                        !passenger.dob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {passenger.dob ? formatDate(passenger.dob) : <span>dd/mm/yyyy</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={passenger.dob}
                      onSelect={(date) => updatePassenger(index, "dob", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <Label htmlFor={`p${index}-passport`} className="text-sm">
                  Số hộ chiếu (tùy chọn)
                </Label>
                <Input
                  id={`p${index}-passport`}
                  placeholder="Nhập số hộ chiếu"
                  className="text-sm dark:bg-[#171717]"
                  value={passenger.passport}
                  onChange={(e) => updatePassenger(index, "passport", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-red-600">Lỗi: Dữ liệu hành khách không hợp lệ.</p>
      )}

      {/* Add Passenger Button */}
      <Button
        onClick={addPassenger}
        className="bg-blue-600 text-white hover:bg-blue-700 text-sm px-4 py-2 rounded-md"
      >
        + Thêm hành khách
      </Button>
    </div>
  );
};

PassengerDetails.propTypes = {
  formData: PropTypes.shape({
    contact: PropTypes.shape({
      fullName: PropTypes.string,
      phone: PropTypes.string,
      email: PropTypes.string,
      confirmEmail: PropTypes.string,
      isPassenger: PropTypes.bool,
    }).isRequired,
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
        fullName: PropTypes.string,
        dob: PropTypes.instanceOf(Date),
        passport: PropTypes.string,
        frequentFlyer: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
  updateFormData: PropTypes.func.isRequired,
  updatePassenger: PropTypes.func.isRequired,
};

export default PassengerDetails;