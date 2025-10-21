"use client";

import { useEffect, useMemo, useCallback, useRef, memo } from "react";
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
import { useAuth } from "@/contexts/auth-context";
// Custom Date Input Component with toggle between calendar and text input
const DateInput = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className = "",
  error = false,
  id,
}) => {
  const handleCalendarSelect = (date) => {
    onChange(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal text-sm dark:bg-[#171717]",
            !value && "text-muted-foreground",
            error && "border-red-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateVN(value, "short") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleCalendarSelect}
          initialFocus
          disabled={{ after: new Date() }}
          captionLayout="dropdown"
          fromYear={1920}
          toYear={new Date().getFullYear()}
        />
      </PopoverContent>
    </Popover>
  );
};

DateInput.propTypes = {
  value: PropTypes.instanceOf(Date),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.bool,
  id: PropTypes.string,
};

const PASSENGER_TYPES = {
  ADULT: "Người lớn",
  CHILD: "Trẻ em",
  INFANT: "Em bé",
};

const removeDiacritics = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const getAge = (dob, referenceDate = new Date()) => {
  if (!dob) return null;
  const refDate = new Date(referenceDate);
  let age = refDate.getFullYear() - dob.getFullYear();
  const m = refDate.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && refDate.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const getPassengerType = (dob, referenceDate) => {
  const age = getAge(dob, referenceDate);
  if (age === null) return "ADULT";
  if (age < 2) return "INFANT";
  if (age < 12) return "CHILD";
  return "ADULT";
};

const PassengerForm = memo(({
  passenger,
  index,
  updatePassenger,
  removePassenger,
  isInternationalFlight,
  canBeRemoved,
  validationErrors,
  departureDate,
  isNew,
}) => {
  const age = getAge(passenger.dob, departureDate);
  const showIdFieldForDomestic = age >= 14;
  const firstInputRef = useRef(null);
  
  return (
    <div className="border-2 border-gray-200 dark:border-none bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-sm">👤</span>
          </div>
          <h3 className="font-semibold text-base">Hành khách {index + 1}</h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {PASSENGER_TYPES[passenger.type]}
          </span>
        </div>
        {canBeRemoved && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removePassenger(index)}
            className="text-sm bg-white border border-red-600 text-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
          >
            Xóa
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`p${index}-lastname`} className="text-sm">
            Họ *
          </Label>
          <Input
            ref={firstInputRef}
            id={`p${index}-lastname`}
            placeholder="Họ (viết hoa, không dấu)"
            className={`text-sm dark:bg-[#171717] ${
              validationErrors?.lastName ? "border-red-500" : ""
            }`}
            value={passenger.lastName || ""}
            onChange={(e) => {
              const formattedValue = removeDiacritics(e.target.value).toUpperCase();
              updatePassenger(index, "lastName", formattedValue);
            }}
            required
          />
          {validationErrors?.lastName && (
            <p className="mt-1 text-xs text-red-500">
              {validationErrors.lastName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`p${index}-firstname`} className="text-sm">
            Tên đệm và Tên *
          </Label>
          <Input
            id={`p${index}-firstname`}
            placeholder="Tên đệm và Tên (viết hoa, không dấu)"
            className={`text-sm dark:bg-[#171717] ${
              validationErrors?.firstName ? "border-red-500" : ""
            }`}
            value={passenger.firstName || ""}
            onChange={(e) => {
              const formattedValue = removeDiacritics(e.target.value).toUpperCase();
              updatePassenger(index, "firstName", formattedValue);
            }}
            required
          />
          {validationErrors?.firstName && (
            <p className="mt-1 text-xs text-red-500">
              {validationErrors.firstName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`p${index}-dob`} className="text-sm">
            Ngày sinh *
          </Label>
          <DateInput
            id={`p${index}-dob`}
            value={passenger.dob}
            onChange={(date) => updatePassenger(index, "dob", date)}
            placeholder="dd/mm/yyyy"
            error={!!validationErrors?.dateOfBirth}
          />
          {validationErrors?.dateOfBirth && (
            <p className="mt-1 text-xs text-red-500">
              {validationErrors.dateOfBirth}
            </p>
          )}
          {!isInternationalFlight && age < 14 && age !== null && (
            <p className="mt-1 text-xs text-blue-600">
              Hành khách dưới 14 tuổi cần mang theo giấy khai sinh (bản gốc
              hoặc bản sao trích lục).
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`p${index}-gender`} className="text-sm">
            Giới tính *
          </Label>
          <Select
            value={passenger.gender}
            onValueChange={(value) => updatePassenger(index, "gender", value)}
          >
            <SelectTrigger
              className={cn(
                "text-sm dark:bg-[#171717]",
                validationErrors?.gender && "border-red-500"
              )}
            >
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">Nữ</SelectItem>
            </SelectContent>
          </Select>
          {validationErrors?.gender && (
            <p className="mt-1 text-xs text-red-500">{validationErrors.gender}</p>
          )}
        </div>

        {(isInternationalFlight || showIdFieldForDomestic) && (
          <div className="sm:col-span-2">
            <Label htmlFor={`p${index}-id`} className="text-sm">
              {isInternationalFlight ? "Số hộ chiếu *" : "Căn cước công dân *"}
            </Label>
            <Input
              id={`p${index}-id`}
              placeholder={
                isInternationalFlight
                  ? "Nhập số hộ chiếu"
                  : "Nhập số căn cước công dân"
              }
              className={cn(
                "text-sm dark:bg-[#171717]",
                validationErrors?.passportNumber && "border-red-500"
              )}
              value={passenger.passportNumber || ""}
              onChange={(e) =>
                updatePassenger(index, "passportNumber", e.target.value)
              }
              required={!isInternationalFlight}
              maxLength={isInternationalFlight ? 20 : 12}
              pattern={isInternationalFlight ? undefined : "[0-9]{12}"}
            />
            {validationErrors?.passportNumber && (
              <p className="mt-1 text-xs text-red-500">
                {validationErrors.passportNumber}
              </p>
            )}
            {!isInternationalFlight && (
              <p className="text-xs text-gray-500 mt-1">
                Căn cước công dân gồm 12 chữ số.
              </p>
            )}
          </div>
        )}
      </div>

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
  );
});

PassengerForm.propTypes = {
  passenger: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  updatePassenger: PropTypes.func.isRequired,
  removePassenger: PropTypes.func.isRequired,
  isInternationalFlight: PropTypes.bool.isRequired,
  canBeRemoved: PropTypes.bool.isRequired,
  validationErrors: PropTypes.object,
  departureDate: PropTypes.instanceOf(Date),
  isNew: PropTypes.bool,
};

PassengerForm.displayName = "PassengerForm";

const ContactInformation = ({ formData, updateFormData, validationErrors }) => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.email && !formData.contactEmail) {
      updateFormData("contactEmail", user.email, null);
    }
    if (user && user.firstName && user.lastName && !formData.contactName) {
      updateFormData("contactName", `${user.lastName} ${user.firstName}`, null);
    }
  }, [user, formData.contactEmail, formData.contactName, updateFormData]);

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl font-bold">Thông tin liên hệ</h2>
      <h6 className=" text-sm text-gray-600 dark:text-gray-300">Thông tin đặt vé sẽ được gửi đến địa chỉ email này.</h6>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div>
          <Label htmlFor="contact-name" className="text-sm">
            Họ và tên người liên hệ *
          </Label>
          <Input
            id="contact-name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={formData.contactName || ""}
            onChange={(e) => updateFormData("contactName", e.target.value)}
            readOnly={!!user}
            className={`text-sm dark:bg-[#171717] ${
              user ? "cursor-not-allowed bg-gray-100" : ""
            } ${validationErrors?.contactName ? "border-red-500" : ""}`}
            required
          />
          {validationErrors?.contactName && (
            <p className="mt-1 text-xs text-red-500">
              {validationErrors.contactName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-email" className="text-sm">
            Email liên hệ *
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="example@email.com"
            value={formData.contactEmail || ""} // Đã sửa ở commit trước
            onChange={(e) => updateFormData("contactEmail", e.target.value)}
            readOnly={!!user}
            className={`text-sm dark:bg-[#171717] ${
              user ? "cursor-not-allowed bg-gray-100" : ""
            } ${validationErrors?.contactEmail ? "border-red-500" : ""}`}
            required
          />
          {validationErrors?.contactEmail && (
            <p className="mt-1 text-xs text-red-500">
              {validationErrors.contactEmail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

ContactInformation.propTypes = {
  formData: PropTypes.object.isRequired,
  updateFormData: PropTypes.func.isRequired,
  validationErrors: PropTypes.object,
};

const PassengerDetails = ({
  formData,
  updateFormData,
  updatePassenger,
  flightType = "DOMESTIC",
  departureDate,
  validationErrors = {},
}) => {
  const flightId = formData.flightId || "defaultFlight"; // Lấy ID chuyến bay để lưu trữ
  const localStorageKey = `passengerFormData_${flightId}`;
  const isInternationalFlight = flightType === "INTERNATIONAL";
  const newPassengerIndex = useRef(null);

  // Lưu form data vào localStorage mỗi khi nó thay đổi
  useEffect(() => {
    try {
      // Chuyển đổi Date objects thành ISO strings trước khi lưu
      const serializableFormData = {
        ...formData,
        passengers: formData.passengers.map(p => ({
          ...p,
          dob: p.dob ? p.dob.toISOString() : null
        }))
      };
      localStorage.setItem(localStorageKey, JSON.stringify(serializableFormData));
    } catch (error) {
      console.error("Failed to save form data to localStorage:", error);
    }
  }, [formData, localStorageKey]);

  useEffect(() => {
    // Update passenger type whenever DOB changes
    const newPassengers = formData.passengers.map((p) => ({
      ...p,
      type: getPassengerType(p.dob, departureDate),
    }));
    if (
      JSON.stringify(newPassengers) !== JSON.stringify(formData.passengers)
    ) {
      updateFormData("passengers", newPassengers);
    }
  }, [formData.passengers, departureDate, updateFormData]);

  const hasAtLeastOneAdult = useMemo(
    () => formData.passengers.some((p) => p.type === "ADULT"),
    [formData.passengers]
  );

  const addPassenger = useCallback(() => {
    if (formData.passengers.length >= 10) {
      alert("Số lượng hành khách tối đa là 10.");
      return;
    }
    const newPassenger = {
      type: "ADULT",
      lastName: "",
      firstName: "",
      dob: null,
      gender: "",
      passportNumber: "",
    };
    const newPassengers = [...formData.passengers, newPassenger];
    newPassengerIndex.current = newPassengers.length - 1;
    updateFormData("passengers", newPassengers);
  }, [formData.passengers, updateFormData]);

  const removePassenger = useCallback(
    (index) => {
    if (formData.passengers.length > 1) {
      updateFormData(
        "passengers",
        formData.passengers.filter((_, i) => i !== index)
      );
    }
    },
    [formData.passengers, updateFormData]
  );

  useEffect(() => {
    if (newPassengerIndex.current !== null) {
      const newPassengerForm = document.getElementById(`p${newPassengerIndex.current}-lastname`);
      if (newPassengerForm) {
        newPassengerForm.focus();
      }
      newPassengerIndex.current = null;
    }
  }, [formData.passengers.length]);

  return (
    <div className="w-full space-y-6">
      <ContactInformation
        formData={formData}
        updateFormData={updateFormData}
        validationErrors={validationErrors}
      />

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

      {!hasAtLeastOneAdult && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Cảnh báo:</strong> Cần có ít nhất một hành khách là người lớn
            (từ 12 tuổi trở lên) trong danh sách.
          </p>
        </div>
      )}

      {Array.isArray(formData.passengers) ? (
        formData.passengers.map((passenger, index) => (
          <PassengerForm
            key={`passenger-${index}`}
            passenger={passenger}
            index={index}
            updatePassenger={updatePassenger}
            removePassenger={removePassenger}
            isInternationalFlight={isInternationalFlight}
            canBeRemoved={formData.passengers.length > 1}
            validationErrors={validationErrors[`passenger_${index}`]}
            departureDate={departureDate}
            isNew={index === formData.passengers.length - 1 && newPassengerIndex.current === index}
          />
        ))
      ) : (
        <p className="text-red-600">Lỗi: Dữ liệu hành khách không hợp lệ.</p>
      )}

      {/* Add Passenger Button */}
      <Button
        onClick={addPassenger}
        className="bg-white cursor-pointer text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white text-sm px-4 py-2 rounded-md w-full"
      >
        + Thêm hành khách
      </Button>
    </div>
  );
};

PassengerDetails.propTypes = {
  formData: PropTypes.shape({
    contactInfo: PropTypes.object.isRequired,
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
        lastName: PropTypes.string,
        firstName: PropTypes.string,
        dob: PropTypes.instanceOf(Date),
        gender: PropTypes.oneOf(["MALE", "FEMALE", "OTHER"]),
        passportNumber: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
  updateFormData: PropTypes.func.isRequired,
  updatePassenger: PropTypes.func.isRequired,
  flightType: PropTypes.oneOf(["DOMESTIC", "INTERNATIONAL"]),
  departureDate: PropTypes.instanceOf(Date),
  validationErrors: PropTypes.object,
};

export default PassengerDetails;
