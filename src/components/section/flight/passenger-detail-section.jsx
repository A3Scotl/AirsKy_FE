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
import { formatDateVN } from "@/utils/currency-utils";

const PassengerDetails = ({
  formData,
  updateFormData,
  updatePassenger,
  flightType = "DOMESTIC",
  validationErrors = {},
}) => {
  // Determine if passport is required based on flight type
  const isInternationalFlight = flightType === "INTERNATIONAL";
  const isDomesticFlight = flightType === "DOMESTIC";
  const addPassenger = () => {
    if (formData.passengers.length >= 10) {
      alert("Số lượng hành khách tối đa là 10.");
      return;
    }
    updateFormData("passengers", [
      ...formData.passengers,
      {
        type: "ADULT",
        firstName: "",
        lastName: "",
        fullName: "", // Keep for backward compatibility
        dob: null,
        gender: "", // New field for all passengers
        phone: "", // New field for adults only
        email: "", // New field for adults only
        // Passport fields - only required for international flights
        passport: isInternationalFlight
          ? {
              number: "",
            }
          : "",
        passportNumber: "", // New field for API compatibility
        frequentFlyer: "",
      },
    ]);
  };

  const removePassenger = (index) => {
    if (formData.passengers.length > 1) {
      updateFormData(
        "passengers",
        formData.passengers.filter((_, i) => i !== index)
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Thông tin hành khách</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Vui lòng cung cấp thông tin cần thiết cho tất cả hành khách
        </p>
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Yêu cầu giấy tờ tùy thân:</strong>{" "}
            {isInternationalFlight
              ? "Chuyến bay quốc tế - Bắt buộc có hộ chiếu còn hạn"
              : "Chuyến bay nội địa - Bắt buộc có căn cước công dân"}
          </p>
        </div>
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
                <Label htmlFor={`p${index}-firstname`} className="text-sm">
                  Họ *
                </Label>
                <Input
                  id={`p${index}-firstname`}
                  placeholder="Họ (viết hoa, không dấu)"
                  className={`text-sm dark:bg-[#171717] ${
                    validationErrors[`passenger_${index}`]?.firstName
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                  value={passenger.firstName || ""}
                  onChange={(e) =>
                    updatePassenger(index, "firstName", e.target.value)
                  }
                  required
                  aria-required="true"
                />
                {validationErrors[`passenger_${index}`]?.firstName && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors[`passenger_${index}`].firstName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`p${index}-lastname`} className="text-sm">
                  Tên *
                </Label>
                <Input
                  id={`p${index}-lastname`}
                  placeholder="Tên (viết hoa, không dấu)"
                  className={`text-sm dark:bg-[#171717] ${
                    validationErrors[`passenger_${index}`]?.lastName
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                  value={passenger.lastName || ""}
                  onChange={(e) =>
                    updatePassenger(index, "lastName", e.target.value)
                  }
                  required
                  aria-required="true"
                />
                {validationErrors[`passenger_${index}`]?.lastName && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors[`passenger_${index}`].lastName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`p${index}-type`} className="text-sm">
                  Loại hành khách *
                </Label>
                <Select
                  value={passenger.type}
                  onValueChange={(value) =>
                    updatePassenger(index, "type", value)
                  }
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
              <div>
                <Label htmlFor={`p${index}-gender`} className="text-sm">
                  Giới tính *
                </Label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value) =>
                    updatePassenger(index, "gender", value)
                  }
                >
                  <SelectTrigger className="text-sm dark:bg-[#171717]">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Nam</SelectItem>
                    <SelectItem value="FEMALE">Nữ</SelectItem>
                    <SelectItem value="OTHER">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`p${index}-dob`} className="text-sm">
                  Ngày sinh *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-sm dark:bg-[#171717]",
                        !passenger.dob && "text-muted-foreground",
                        validationErrors[`passenger_${index}`]?.dateOfBirth &&
                          "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {passenger.dob ? (
                        formatDateVN(passenger.dob, "short")
                      ) : (
                        <span>dd/mm/yyyy</span>
                      )}
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
                {validationErrors[`passenger_${index}`]?.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors[`passenger_${index}`].dateOfBirth}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <Label htmlFor={`p${index}-id`} className="text-sm">
                  {isInternationalFlight
                    ? "Số hộ chiếu *"
                    : "Căn cước công dân *"}
                </Label>
                <Input
                  id={`p${index}-id`}
                  placeholder={
                    isInternationalFlight
                      ? "Nhập số hộ chiếu"
                      : "Nhập số căn cước công dân"
                  }
                  className="text-sm dark:bg-[#171717]"
                  value={
                    isInternationalFlight
                      ? passenger.passport?.number || ""
                      : passenger.passport || ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isInternationalFlight) {
                      updatePassenger(index, "passport", {
                        ...passenger.passport,
                        number: value,
                      });
                    } else {
                      updatePassenger(index, "passport", value);
                    }
                  }}
                  required
                  aria-required="true"
                  maxLength={isInternationalFlight ? 20 : 12}
                  pattern={isInternationalFlight ? undefined : "[0-9]{12}"}
                />
                {!isInternationalFlight && (
                  <p className="text-xs text-gray-500 mt-1">
                    Căn cước công dân gồm 12 chữ số
                  </p>
                )}
              </div>
            </div>

            {/* Additional fields for adults */}
            {passenger.type === "ADULT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor={`p${index}-phone`} className="text-sm">
                    Số điện thoại *
                  </Label>
                  <Input
                    id={`p${index}-phone`}
                    placeholder="Ví dụ: 0912345678"
                    className="text-sm dark:bg-[#171717]"
                    value={passenger.phone || ""}
                    onChange={(e) =>
                      updatePassenger(index, "phone", e.target.value)
                    }
                    required
                    type="tel"
                    pattern="[0-9]{10,11}"
                  />
                </div>
                <div>
                  <Label htmlFor={`p${index}-email`} className="text-sm">
                    Email *
                  </Label>
                  <Input
                    id={`p${index}-email`}
                    placeholder="Ví dụ: example@email.com"
                    className="text-sm dark:bg-[#171717]"
                    value={passenger.email || ""}
                    onChange={(e) =>
                      updatePassenger(index, "email", e.target.value)
                    }
                    required
                    type="email"
                  />
                </div>
              </div>
            )}

            {/* Baggage Information */}
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Hành Lý Miễn Phí
              </h5>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>✅ 1 túi xách tay (10kg)</li>
                <li>✅ Hành lý ký gửi 23kg (tùy hạng vé)</li>
              </ul>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Tùy chọn hành lý bổ sung có thể chọn ở bước tiếp theo.
              </p>
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
    contactInfo: PropTypes.shape({
      email: PropTypes.string,
      phone: PropTypes.string,
    }),
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        fullName: PropTypes.string,
        dob: PropTypes.instanceOf(Date),
        gender: PropTypes.oneOf(["MALE", "FEMALE", "OTHER"]),
        phone: PropTypes.string,
        email: PropTypes.string,
        passport: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            number: PropTypes.string,
          }),
        ]),
        frequentFlyer: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
  updateFormData: PropTypes.func.isRequired,
  updatePassenger: PropTypes.func.isRequired,
  flightType: PropTypes.oneOf(["DOMESTIC", "INTERNATIONAL"]),
  validationErrors: PropTypes.object,
};

export default PassengerDetails;
