"use client";

import { useEffect, useMemo, useCallback, useRef, memo, useState } from "react";
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
import { CalendarIcon, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "@/styles/phone-input.css";
import { bookingApi } from "@/apis/booking-api";
import { toast } from "sonner";
import CountrySelect, {
  getVietnamCountry,
  getCountryByName,
} from "@/components/ui/country-select";

// Helper function to convert country name to ISO code for phone input
const getCountryISOCode = (countryName) => {
  if (!countryName) {
 
    return "VN";
  }

  // Use the getCountryByName function from CountrySelect component
  // This dynamically gets the ISO code from the country data
  const country = getCountryByName(countryName);
  const countryCode = country ? country.code : "VN"; // Default to Vietnam if not found

  return countryCode;
};
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
            error && "border-red-500",
            className
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

// Separate PhoneInput component to prevent unnecessary re-renders
const CustomPhoneInput = ({
  country,
  value,
  onChange,
  placeholder = "Nhập số điện thoại",
  className = "phone-input",
  forceKey,
}) => {
  // Force re-mount when country changes by using a unique key
  const uniqueKey = `phone-input-${country}-${forceKey}`;

  return (
    <div className="phone-input-debug">
      <PhoneInput
        key={uniqueKey} // Unique key forces complete re-mount
        international
        countryCallingCodeEditable={false}
        country={country}
        value={value || ""}
        onChange={(newValue) => {
          onChange(newValue);
        }}
        className={className}
        placeholder={placeholder}
        defaultCountry={country}
      />
    </div>
  );
};
const removeDiacritics = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

// Membership validation component
const MembershipInput = ({
  value,
  onChange,
  passengerName,
  validationErrors,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // null, 'valid', 'invalid'
  const [validationMessage, setValidationMessage] = useState("");

  const validateMembershipCode = async (code) => {
    if (!code || code.length < 12) {
      setValidationStatus(null);
      setValidationMessage("");
      return;
    }

    setIsValidating(true);
    try {
      const response = await bookingApi.validateMembershipCode(code);
      if (response.success && response.data.valid) {
        // Check if the membership name matches passenger name
        const memberName = response.data.userName;
        const normalizedMemberName = removeDiacritics(
          memberName.toLowerCase().replace(/\s+/g, "")
        );
        const normalizedPassengerName = removeDiacritics(
          passengerName.toLowerCase().replace(/\s+/g, "")
        );

        if (normalizedMemberName === normalizedPassengerName) {
          setValidationStatus("valid");
          // setValidationMessage(
          //   `Mã hợp lệ - ${response.data.tier} (${response.data.currentPoints} điểm)`
          // );
          // Store membership data for payment section
          onChange(code, response.data);
        } else {
          setValidationStatus("invalid");
          // setValidationMessage(
          //   `Tên không khớp: ${memberName} ≠ ${passengerName}`
          // );
          onChange(code, null);
        }
      } else {
        setValidationStatus("invalid");
        setValidationMessage("Mã hội viên không hợp lệ");
        onChange(code, null);
      }
    } catch (error) {
      setValidationStatus("invalid");
      setValidationMessage("Lỗi kiểm tra mã hội viên");
      onChange(code, null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInputChange = (inputValue) => {
    // Format input to AK + 10 digits
    let formatted = inputValue.toUpperCase();
    if (!formatted.startsWith("AK")) {
      formatted = "AK" + formatted.replace(/[^0-9]/g, "").slice(0, 10);
    } else {
      formatted =
        "AK" +
        formatted
          .slice(2)
          .replace(/[^0-9]/g, "")
          .slice(0, 10);
    }

    onChange(formatted, null);

    // Validate if complete
    if (formatted.length === 12) {
      validateMembershipCode(formatted);
    } else {
      setValidationStatus(null);
      setValidationMessage("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder="AK1234567890 (AK + 10 số)"
          value={value || ""}
          onChange={(e) => handleInputChange(e.target.value)}
          className={cn(
            "text-sm dark:bg-[#171717] pr-10",
            validationErrors && "border-red-500",
            validationStatus === "valid" && "border-green-500",
            validationStatus === "invalid" && "border-red-500",
            !validationErrors &&
              !validationStatus &&
              value &&
              value.length === 12 &&
              "border-yellow-500"
          )}
          maxLength={12}
        />
        {isValidating && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
        )}
        {!isValidating && validationStatus === "valid" && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
        {!isValidating && validationStatus === "invalid" && (
          <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
        )}
      </div>
      {validationMessage && (
        <p
          className={cn(
            "text-xs",
            validationStatus === "valid" ? "text-green-600" : "text-red-600"
          )}
        >
          {validationMessage}
        </p>
      )}
      {validationErrors && (
        <p className="text-xs text-red-500">{validationErrors}</p>
      )}
    </div>
  );
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

const PassengerForm = memo(
  ({
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
    const [phoneKey, setPhoneKey] = useState(0); // Force re-render key for PhoneInput

    // Handle country changes and update phone input
    const [phoneCountry, setPhoneCountry] = useState(
      getCountryISOCode(passenger.country || "Vietnam")
    );

    useEffect(() => {
      const newCountryCode = getCountryISOCode(passenger.country || "Vietnam");

      if (newCountryCode !== phoneCountry) {

        setPhoneCountry(newCountryCode);

        // Clear phone value when country changes to avoid confusion
        if (passenger.phone) {

          updatePassenger(index, "phone", "");
        }
      }
    }, [
      passenger.country,
      index,
      phoneCountry,
      updatePassenger,
      passenger.phone,
    ]);

    // Helper function to get field validation status
    const getFieldValidationClass = (
      fieldName,
      value,
      customValidation = null
    ) => {
      // Debug: Log validation info

      // Check if there's a validation error for this field
      const hasError = validationErrors && validationErrors[fieldName];

      // If there's an error, show red border
      if (hasError) {
        return "border-red-500 focus:border-red-500 focus:ring-red-500";
      }

      // If field has value and no error, show success border
      let isValid = false;

      switch (fieldName) {
        case "firstName":
        case "lastName":
          isValid = value?.trim().length > 0;
          break;
        case "gender":
          isValid = value && ["MALE", "FEMALE"].includes(value);
          break;
        case "dob":
          isValid = value instanceof Date && !isNaN(value);
          break;
        case "passportNumber":
          if (isInternationalFlight) {
            isValid = value?.trim().length > 0;
          } else if (age >= 14) {
            isValid = /^\d{12}$/.test(value?.trim());
          } else {
            isValid = true; // Not required for under 14
          }
          break;
        case "phone":
          if (age >= 12) {
            // Use more flexible phone validation
            isValid = value?.trim().length >= 10;
          } else {
            isValid = true; // Not required for under 12
          }
          break;
        case "country":
          if (age >= 12) {
            isValid = value?.trim().length > 0;
          } else {
            isValid = true; // Not required for under 12
          }
          break;
        case "currentAddress":
          if (age >= 12) {
            isValid = value?.trim().length >= 10;
          } else {
            isValid = true; // Not required for under 12
          }
          break;
        case "membershipCode":
          // Optional field - only validate if has value
          if (value?.trim()) {
            isValid =
              /^AK[0-9]{10}$/.test(value.trim()) &&
              passenger.membershipData?.valid;
          } else {
            isValid = true; // Empty is OK for optional field
          }
          break;
        default:
          if (customValidation) {
            isValid = customValidation(value);
          } else {
            isValid = value?.trim?.()?.length > 0;
          }
      }

      return isValid && value ? "border-green-500" : "";
    };

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
            <Label
              htmlFor={`p${index}-lastname`}
              className="text-sm dark:text-gray-200"
            >
              Họ <span className="text-red-500">*</span>
            </Label>
            <Input
              ref={firstInputRef}
              id={`p${index}-lastname`}
              placeholder="Họ (viết hoa, không dấu)"
              className={cn(
                "text-sm dark:bg-[#171717] dark:text-white",
                getFieldValidationClass("lastName", passenger.lastName)
              )}
              value={passenger.lastName || ""}
              onChange={(e) => {
                const formattedValue = removeDiacritics(
                  e.target.value
                ).toUpperCase();
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
            <Label
              htmlFor={`p${index}-firstname`}
              className="text-sm dark:text-gray-200"
            >
              Tên đệm và Tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`p${index}-firstname`}
              placeholder="Tên đệm và Tên (viết hoa, không dấu)"
              className={cn(
                "text-sm dark:bg-[#171717] dark:text-white",
                getFieldValidationClass("firstName", passenger.firstName)
              )}
              value={passenger.firstName || ""}
              onChange={(e) => {
                const formattedValue = removeDiacritics(
                  e.target.value
                ).toUpperCase();
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
            <Label
              htmlFor={`p${index}-dob`}
              className="text-sm dark:text-gray-200"
            >
              Ngày sinh <span className="text-red-500">*</span>
            </Label>
            <DateInput
              id={`p${index}-dob`}
              value={passenger.dob}
              onChange={(date) => updatePassenger(index, "dob", date)}
              placeholder="dd/mm/yyyy"
              error={!!validationErrors?.dateOfBirth}
              className={getFieldValidationClass("dob", passenger.dob)}
            />
            {validationErrors?.dob && (
              <p className="mt-1 text-xs text-red-500">
                {validationErrors.dob}
              </p>
            )}
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
            <Label
              htmlFor={`p${index}-gender`}
              className="text-sm dark:text-gray-200"
            >
              Giới tính <span className="text-red-500">*</span>
            </Label>
            <Select
              value={passenger.gender || ""}
              onValueChange={(value) => updatePassenger(index, "gender", value)}
            >
              <SelectTrigger
                className={cn(
                  "text-sm dark:bg-[#171717] dark:text-white",
                  getFieldValidationClass("gender", passenger.gender)
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
              <p className="mt-1 text-xs text-red-500">
                {validationErrors.gender}
              </p>
            )}
          </div>

          {(isInternationalFlight || showIdFieldForDomestic) && (
            <div className="sm:col-span-2">
              <Label
                htmlFor={`p${index}-id`}
                className="text-sm dark:text-gray-200"
              >
                {isInternationalFlight ? "Số hộ chiếu" : "Căn cước công dân"}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`p${index}-id`}
                placeholder={
                  isInternationalFlight
                    ? "Nhập số hộ chiếu"
                    : "Nhập số căn cước công dân"
                }
                className={cn(
                  "text-sm dark:bg-[#171717] dark:text-white",
                  getFieldValidationClass(
                    "passportNumber",
                    passenger.passportNumber
                  )
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

        {/* Additional fields for ADULT passengers only - based on age calculation */}
        {age >= 12 && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xs">+</span>
              </span>
              Thông tin bổ sung (dành cho người lớn)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30 dark:bg-blue-900/10">
              {/* Phone Number */}
              <div>
                <Label
                  htmlFor={`p${index}-phone`}
                  className="text-sm dark:text-gray-200"
                >
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <div
                  className={cn(
                    "mt-1 phone-input-wrapper",
                    // Apply border styling based on validation
                    validationErrors?.phone && "phone-input-error",
                    !validationErrors?.phone &&
                      passenger.phone &&
                      passenger.phone.length >= 10 &&
                      "phone-input-success"
                  )}
                >
                  <CustomPhoneInput
                    country={phoneCountry}
                    value={passenger.phone}
                    onChange={(value) =>
                      updatePassenger(index, "phone", value || "")
                    }
                    placeholder="Nhập số điện thoại"
                    className="phone-input"
                    forceKey={phoneKey}
                  />
                </div>
                {validationErrors?.phone && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Country */}
              <div>
                <Label
                  htmlFor={`p${index}-country`}
                  className="text-sm dark:text-gray-200"
                >
                  Quốc gia <span className="text-red-500">*</span>
                </Label>
                <CountrySelect
                  value={passenger.country || "Vietnam"}
                  onChange={(countryName) => {

                    updatePassenger(index, "country", countryName);
                  }}
                  error={!!validationErrors?.country}
                  className={cn(
                    "text-sm dark:bg-[#171717] dark:text-white",
                    getFieldValidationClass("country", passenger.country)
                  )}
                  placeholder="Chọn quốc gia"
                  defaultCountry="VN"
                  showFlag={true}
                />
                {validationErrors?.country && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.country}
                  </p>
                )}
              </div>

              {/* Current Address */}
              <div className="sm:col-span-2">
                <Label
                  htmlFor={`p${index}-address`}
                  className="text-sm dark:text-gray-200"
                >
                  Nơi ở hiện tại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`p${index}-address`}
                  placeholder="Nhập địa chỉ hiện tại"
                  className={cn(
                    "text-sm dark:bg-[#171717] dark:text-white",
                    getFieldValidationClass(
                      "currentAddress",
                      passenger.currentAddress
                    )
                  )}
                  value={passenger.currentAddress || ""}
                  onChange={(e) =>
                    updatePassenger(index, "currentAddress", e.target.value)
                  }
                />
                {validationErrors?.currentAddress && (
                  <p className="mt-1 text-xs text-red-500">
                    {validationErrors.currentAddress}
                  </p>
                )}
              </div>

              {/* Membership Code */}
              <div className="sm:col-span-2">
                <Label
                  htmlFor={`p${index}-membership`}
                  className="text-sm dark:text-gray-200"
                >
                  Mã hội viên AirSky (tùy chọn)
                </Label>
                <MembershipInput
                  value={passenger.membershipCode || ""}
                  onChange={(code, membershipData) => {
                    updatePassenger(index, "membershipCode", code);
                    updatePassenger(index, "membershipData", membershipData);
                  }}
                  passengerName={`${passenger.lastName || ""} ${
                    passenger.firstName || ""
                  }`.trim()}
                  validationErrors={validationErrors?.membershipCode}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập mã hội viên để tích lũy và sử dụng điểm thưởng
                </p>
              </div>
            </div>
          </div>
        )}

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
  }
);

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

  // Helper function for contact validation
  const getContactFieldValidationClass = (fieldName, value) => {
    const hasError = validationErrors && validationErrors[fieldName];

    if (hasError) {
      return "border-red-500 focus:border-red-500 focus:ring-red-500";
    }

    let isValid = false;
    switch (fieldName) {
      case "contactName":
        isValid = value?.trim().length >= 2;
        break;
      case "contactEmail":
        isValid = /\S+@\S+\.\S+/.test(value);
        break;
    }

    return isValid && value
      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
      : "";
  };

  return (
    <div className="w-full space-y-4">
      <h2 className="text-xl font-bold">Thông tin liên hệ</h2>
      <h6 className=" text-sm text-gray-600 dark:text-gray-300">
        Thông tin đặt vé sẽ được gửi đến địa chỉ email này.
      </h6>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div>
          <Label htmlFor="contact-name" className="text-sm dark:text-gray-200">
            Họ và tên người liên hệ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-name"
            type="text"
            placeholder="Nguyễn Văn A"
            value={formData.contactName || ""}
            onChange={(e) => updateFormData("contactName", e.target.value)}
            readOnly={!!user}
            className={cn(
              "text-sm dark:bg-[#171717] dark:text-white",
              user && "cursor-not-allowed bg-gray-100",
              getContactFieldValidationClass(
                "contactName",
                formData.contactName
              )
            )}
            required
          />
          {validationErrors?.contactName && (
            <p className="mt-1 text-xs text-red-500">
              {validationErrors.contactName}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-email" className="text-sm dark:text-gray-200">
            Email liên hệ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="example@email.com"
            value={formData.contactEmail || ""} // Đã sửa ở commit trước
            onChange={(e) => updateFormData("contactEmail", e.target.value)}
            readOnly={!!user}
            className={cn(
              "text-sm dark:bg-[#171717] dark:text-white",
              user && "cursor-not-allowed bg-gray-100",
              getContactFieldValidationClass(
                "contactEmail",
                formData.contactEmail
              )
            )}
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
  const passengers = Array.isArray(formData.passengers)
    ? formData.passengers
    : [];

  // Lưu form data vào localStorage mỗi khi nó thay đổi
  useEffect(() => {
    try {
      // Chuyển đổi Date objects thành ISO strings trước khi lưu
      const serializableFormData = {
        ...formData,
        passengers: passengers.map((p) => ({
          ...p,
          dob: p.dob ? p.dob.toISOString() : null,
        })),
      };
      localStorage.setItem(
        localStorageKey,
        JSON.stringify(serializableFormData)
      );
    } catch (error) {
      console.error("Failed to save form data to localStorage:", error);
    }
  }, [formData, localStorageKey, passengers]);

  useEffect(() => {
    // Update passenger type whenever DOB changes
    const newPassengers = passengers.map((p) => ({
      ...p,
      type: getPassengerType(p.dob, departureDate),
    }));
    if (JSON.stringify(newPassengers) !== JSON.stringify(passengers)) {
      updateFormData("passengers", newPassengers);
    }
  }, [passengers, departureDate, updateFormData]);

  const hasAtLeastOneAdult = useMemo(
    () => passengers.some((p) => p.type === "ADULT"),
    [passengers]
  );

  const addPassenger = useCallback(() => {
    if (passengers.length >= 10) {
      toast.warning("Số lượng hành khách tối đa trong một booking là 10.");
      return;
    }

    const newPassenger = {
      type: "ADULT",
      lastName: "",
      firstName: "",
      dob: null,
      gender: "",
      passportNumber: "",
      country: "Vietnam",
      phone: "",
    };

    newPassengerIndex.current = passengers.length;
    updateFormData("passengers", [...passengers, newPassenger]);
  }, [updateFormData, passengers]);

  const removePassenger = useCallback(
    (index) => {
      if (passengers.length > 1) {
        const updatedPassengers = passengers.filter((_, i) => i !== index);
        updateFormData("passengers", updatedPassengers);
      }
    },
    [updateFormData, passengers]
  );

  useEffect(() => {
    if (newPassengerIndex.current !== null) {
      const newPassengerForm = document.getElementById(
        `p${newPassengerIndex.current}-lastname`
      );
      if (newPassengerForm) {
        newPassengerForm.focus();
      }
      newPassengerIndex.current = null;
    }
  }, [passengers.length]);

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
            <strong>Cảnh báo:</strong> Cần có ít nhất một hành khách là người
            lớn (từ 12 tuổi trở lên) trong danh sách.
          </p>
        </div>
      )}

      {passengers.map((passenger, index) => (
        <PassengerForm
          key={`passenger-${index}`}
          passenger={passenger}
          index={index}
          updatePassenger={updatePassenger}
          removePassenger={removePassenger}
          isInternationalFlight={isInternationalFlight}
          canBeRemoved={passengers.length > 1}
          validationErrors={
            validationErrors?.passengers?.[`passenger_${index}`] || {}
          }
          departureDate={departureDate}
          isNew={
            index === passengers.length - 1 &&
            newPassengerIndex.current === index
          }
        />
      ))}

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
