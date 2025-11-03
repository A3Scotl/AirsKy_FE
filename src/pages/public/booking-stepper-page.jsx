"use client";

import { useState, useEffect } from "react";
import SEO from "@/components/common/seo";
import Stepper from "@/lib/Stepper";
import PassengerDetails from "@/components/section/flight/passenger-detail-section";
import Extras, {
  autoAssignStandardSeats,
  processExtrasDataForBooking,
} from "@/components/section/flight/extras-section";
import Payment from "@/components/section/flight/payment-section";
import PropTypes from "prop-types";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isPossiblePhoneNumber } from "libphonenumber-js";

const steps = [
  { title: "Chọn chuyến bay" },
  { title: "Thông tin hành khách" },
  { title: "Tiện ích" },
  { title: "Thanh toán" },
];

import { formatCurrencyVND } from "@/utils/currency-utils";

const FlightInfo = ({ flightDetails, fare }) => {
  // Debug logging
  console.log("🔍 FlightInfo received data:", flightDetails);
  console.log("🔍 FlightInfo fare:", fare);

  // Helper to get airport code - aligned with result-section.jsx structure
  const getAirportCode = (airport) => {
    if (!airport) return "N/A";
    return airport.code || airport.airportCode || "N/A";
  };

  // Helper to get airport name - aligned with result-section.jsx structure
  const getAirportName = (airport) => {
    if (!airport) return "N/A";
    return airport.name || airport.airportName || airport.city || "N/A";
  };
  // Check flight type
  const isRoundTrip =
    flightDetails.type === "ROUND_TRIP" ||
    flightDetails.tripType === "ROUND_TRIP";
  const isMultiCity =
    flightDetails.type === "MULTI_CITY" ||
    flightDetails.tripType === "MULTI_CITY";

  // Debug round-trip structure
  if (isRoundTrip) {
    console.log("🔍 Round-trip flight structure:", {
      hasOutbound: !!flightDetails.outbound,
      hasOutboundFlight: !!flightDetails.outboundFlight,
      hasReturn: !!flightDetails.return,
      hasReturnFlight: !!flightDetails.returnFlight,
    });
  }

  if (isMultiCity && (flightDetails.legs || flightDetails.multiCity?.legs)) {
    // Multi-city display - handle both new and old data structures
    const legs = flightDetails.legs || flightDetails.multiCity?.legs || [];
    const segmentCount =
      flightDetails.segmentCount ||
      flightDetails.multiCity?.segments ||
      legs.length;
    const routeInfo =
      legs.map((leg) => getAirportCode(leg.departureAirport)).join(" → ") +
      (legs.length > 0
        ? ` → ${getAirportCode(legs[legs.length - 1].arrivalAirport)}`
        : "");

    return (
      <div className="my-6 sm:my-8 space-y-4">
        {/* Header with total price */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Chuyến bay đa thành phố
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {segmentCount} chặng - {routeInfo}
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 sm:text-gray-900 dark:text-white">
            {formatCurrencyVND(flightDetails.totalPrice || 0)}
          </div>
        </div>

        {/* Flight legs */}
        <div className="grid grid-cols-1 gap-4">
          {legs.map((leg, index) => (
            <div
              key={leg.id || index}
              className="border rounded-lg p-4 bg-purple-50 border-purple-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-700"
                >
                  {leg.segmentLabel || `Chặng ${index + 1}`}
                </Badge>
                <span className="font-semibold">
                  {leg.flightNumber || "N/A"}
                </span>
                <span className="text-sm text-gray-600">
                  {leg.airline || leg.airlineName}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="font-medium">
                  {getAirportCode(leg.departureAirport)} →{" "}
                  {getAirportCode(leg.arrivalAirport)}
                </div>
                <div className="text-gray-600">
                  {getAirportName(leg.departureAirport)} →{" "}
                  {getAirportName(leg.arrivalAirport)}
                </div>
                <div className="text-gray-600">
                  {leg.departureDate || "N/A"}
                </div>
                <div className="text-gray-600">
                  {leg.departureTime} - {leg.arrivalTime}
                </div>
                <div className="text-blue-600 font-medium">
                  {formatCurrencyVND(
                    leg.segmentFare?.price ||
                      leg.selectedClass?.price ||
                      flightDetails.selectedClass?.price ||
                      0
                  )}
                </div>
                {leg.selectedClass && (
                  <div className="text-xs text-gray-500">
                    Hạng vé:{" "}
                    {leg.selectedClass.travelClass?.className ||
                      leg.segmentFare?.className}
                  </div>
                )}
                {leg.aircraft && (
                  <div className="text-xs text-gray-500">
                    Máy bay: {leg.aircraft}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle round-trip with the EXACT structure from result-section.jsx
  if (
    isRoundTrip &&
    flightDetails.outboundFlight &&
    flightDetails.returnFlight
  ) {
    // Use exact field names from result-section.jsx: outboundFlight & returnFlight
    const outbound = flightDetails.outboundFlight;
    const returnFlight = flightDetails.returnFlight;

    console.log("🔥 Round-trip detected!");
    console.log("🔥 Outbound data:", outbound);
    console.log("🔥 Return data:", returnFlight);

    return (
      <div className="my-6 sm:my-8 space-y-4">
        {/* Header with total price */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Chuyến bay khứ hồi
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {outbound?.airline ||
                outbound?.airlineName ||
                flightDetails.airline}{" "}
              /{" "}
              {returnFlight?.airline ||
                returnFlight?.airlineName ||
                flightDetails.airline}
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 sm:text-gray-900 dark:text-white">
            {flightDetails.formattedTotalPrice ||
              formatCurrencyVND(flightDetails.totalPrice || 0)}
          </div>
        </div>

        {/* Flight legs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Outbound flight */}
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Chuyến đi
              </Badge>
              <span className="font-semibold">
                {outbound?.flightNumber || "N/A"}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {getAirportCode(outbound?.departureAirport)} →{" "}
                {getAirportCode(outbound?.arrivalAirport)}
              </div>
              <div className="text-gray-600">
                {getAirportName(outbound?.departureAirport)} →{" "}
                {getAirportName(outbound?.arrivalAirport)}
              </div>
              <div className="text-gray-600">
                {outbound?.departureDate || "N/A"}
              </div>
              <div className="text-gray-600">
                {outbound?.departureTime} - {outbound?.arrivalTime}
              </div>
              <div className="text-blue-600 font-medium">
                {formatCurrencyVND(
                  outbound?.selectedClass?.price ||
                    (flightDetails.totalPrice || 0) / 2
                )}
              </div>
            </div>
          </div>

          {/* Return flight */}
          <div className="border rounded-lg p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-red-100 text-red-700">
                Chuyến về
              </Badge>
              <span className="font-semibold">
                {returnFlight?.flightNumber || "N/A"}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {getAirportCode(returnFlight?.departureAirport)} →{" "}
                {getAirportCode(returnFlight?.arrivalAirport)}
              </div>
              <div className="text-gray-600">
                {getAirportName(returnFlight?.departureAirport)} →{" "}
                {getAirportName(returnFlight?.arrivalAirport)}
              </div>
              <div className="text-gray-600">
                {returnFlight?.departureDate || "N/A"}
              </div>
              <div className="text-gray-600">
                {returnFlight?.departureTime} - {returnFlight?.arrivalTime}
              </div>
              <div className="text-blue-600 font-medium">
                {formatCurrencyVND(
                  returnFlight?.selectedClass?.price ||
                    (flightDetails.totalPrice || 0) / 2
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single flight display (one-way)
  return (
    <div className="my-6 sm:my-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Chuyến bay một chiều
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {flightDetails.airline} - {flightDetails.flightNumber}
          </p>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-blue-600 sm:text-gray-900 dark:text-white">
          {flightDetails.formattedTotalPrice ||
            formatCurrencyVND(flightDetails.totalPrice || 0)}
        </div>
      </div>

      {/* Flight details */}
      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            {flightDetails.flightNumber}
          </Badge>
          <span className="font-medium text-sm">
            {flightDetails.selectedClass?.name || fare?.name}
          </span>
        </div>
        <div className="text-sm space-y-1">
          <div className="font-medium">
            {getAirportCode(flightDetails.flight?.departureAirport)} →{" "}
            {getAirportCode(flightDetails.flight?.arrivalAirport)}
          </div>
          <div className="text-gray-600">
            {flightDetails.flight?.departureDate || "N/A"}
          </div>
          <div className="text-gray-600">
            {flightDetails.flight?.departureTime} -{" "}
            {flightDetails.flight?.arrivalTime}
          </div>
          <div className="text-blue-600 font-medium">
            {formatCurrencyVND(flightDetails.selectedClass?.price || 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- BẮT ĐẦU: CÁC HÀM TIỆN ÍCH (Bạn có thể đặt trong file utils) ---

// Hàm tính tuổi (cần thiết cho validation)
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

// Hàm xác thực dữ liệu form
const validateForm = (formData, flightType, departureDate) => {
  const errors = { passengers: {} };
  let isValid = true;

  // 1. Xác thực thông tin liên hệ
  if (!formData.contactName?.trim()) {
    errors.contactName = "Họ và tên liên hệ là bắt buộc.";
    isValid = false;
  } else if (formData.contactName.trim().length < 2) {
    errors.contactName = "Họ và tên phải có ít nhất 2 ký tự.";
    isValid = false;
  }

  if (!formData.contactEmail?.trim()) {
    errors.contactEmail = "Email liên hệ là bắt buộc.";
    isValid = false;
  } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail.trim())) {
    errors.contactEmail = "Email không hợp lệ.";
    isValid = false;
  }

  // Kiểm tra nếu không có hành khách nào
  if (!formData.passengers || formData.passengers.length === 0) {
    errors.passengers.general = "Phải có ít nhất một hành khách.";
    isValid = false;
    return { isValid: false, errors };
  }

  // 2. Xác thực thông tin từng hành khách
  formData.passengers.forEach((p, index) => {
    const passengerErrors = {};

    // Basic required fields
    if (!p.firstName?.trim()) {
      passengerErrors.firstName = "Tên là bắt buộc.";
      isValid = false;
    }
    if (!p.lastName?.trim()) {
      passengerErrors.lastName = "Họ là bắt buộc.";
      isValid = false;
    }
    if (!p.dob) {
      passengerErrors.dob = "Ngày sinh là bắt buộc.";
      isValid = false;
    }
    if (!p.gender) {
      passengerErrors.gender = "Giới tính là bắt buộc.";
      isValid = false;
    }

    const age = getAge(p.dob, departureDate);
    const isInternational = flightType === "INTERNATIONAL";
    const isAdult = p.type === "ADULT" || age >= 12;

    // ID/Passport validation
    if (!isInternational && age >= 14) {
      if (!p.passportNumber?.trim()) {
        passengerErrors.passportNumber =
          "CCCD là bắt buộc cho người từ 14 tuổi.";
        isValid = false;
      } else if (!/^\d{12}$/.test(p.passportNumber.trim())) {
        passengerErrors.passportNumber = "CCCD phải có đúng 12 chữ số.";
        isValid = false;
      }
    }

    if (isInternational) {
      if (!p.passportNumber?.trim()) {
        passengerErrors.passportNumber = "Số hộ chiếu là bắt buộc.";
        isValid = false;
      }
    }

    // Additional validation for passengers >= 12 years old (based on age, not type)
    if (age >= 12) {
      // Phone validation - required for adults
      if (!p.phone?.trim()) {
        passengerErrors.phone =
          "Số điện thoại là bắt buộc cho người từ 12 tuổi trở lên.";
        isValid = false;
      } else if (!isPossiblePhoneNumber(p.phone.trim())) {
        passengerErrors.phone = "Số điện thoại không hợp lệ.";
        isValid = false;
      }

      // Country validation - required for adults
      if (!p.country?.trim()) {
        passengerErrors.country =
          "Quốc gia là bắt buộc cho người từ 12 tuổi trở lên.";
        isValid = false;
      }

      // Current address validation - required for adults
      if (!p.currentAddress?.trim()) {
        passengerErrors.currentAddress =
          "Nơi ở hiện tại là bắt buộc cho người từ 12 tuổi trở lên.";
        isValid = false;
      } else if (p.currentAddress.trim().length < 10) {
        passengerErrors.currentAddress = "Địa chỉ quá ngắn (ít nhất 10 ký tự).";
        isValid = false;
      }

      // Membership code validation - optional but if entered must be valid
      if (p.membershipCode?.trim()) {
        // Check format
        if (!/^AK[0-9]{10}$/.test(p.membershipCode.trim())) {
          passengerErrors.membershipCode =
            "Mã hội viên không đúng định dạng (AK + 10 số).";
        } else {
          // Check if membership data exists and is valid
          if (!p.membershipData || !p.membershipData.valid) {
            passengerErrors.membershipCode =
              "Mã hội viên không hợp lệ hoặc chưa được xác thực.";
            // Show toast for name mismatch or invalid code
            const passengerName = `${p.lastName || ""} ${
              p.firstName || ""
            }`.trim();
            if (p.membershipData && p.membershipData.userName) {
              toast.error(
                `Tên hội viên không khớp: ${p.membershipData.userName} ≠ ${passengerName}`
              );
            } else {
              toast.error("Mã hội viên không hợp lệ. Vui lòng kiểm tra lại.");
            }
          }
        }
      }
    }

    if (Object.keys(passengerErrors).length > 0) {
      errors.passengers[`passenger_${index}`] = passengerErrors;
      isValid = false;
    }
  });

  return { isValid, errors };
};

function FlightBookingStepper() {
  const [flight, setFlight] = useState({});
  const [fare, setFare] = useState({});
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    passengers: [],
  });

  const [extrasData, setExtrasData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Determine flight type based on departure and arrival airports
  const getFlightType = () => {
    if (!flight.departureAirport || !flight.arrivalAirport) return "DOMESTIC";

    // Check if countries are different (simplified logic)
    const departureCountry = flight.departureAirport.country || "Vietnam";
    const arrivalCountry = flight.arrivalAirport.country || "Vietnam";

    return departureCountry !== arrivalCountry ? "INTERNATIONAL" : "DOMESTIC";
  };

  const flightType = getFlightType();

  useEffect(() => {
    // Lấy dữ liệu từ localStorage theo cấu trúc mới
    const flightId = flight.flightId || "defaultFlight";
    const localStorageKey = `passengerFormData_${flightId}`;
    const storedFlight = localStorage.getItem("selectedFlight");
    const storedFormData = localStorage.getItem(localStorageKey);

    console.log("Loading data from localStorage:", {
      flight: storedFlight,
      formData: storedFormData,
    });

    if (storedFormData) {
      try {
        const parsedData = JSON.parse(storedFormData);
        // Chuyển đổi chuỗi ngày sinh thành đối tượng Date
        parsedData.passengers = parsedData.passengers.map((p) => ({
          ...p,
          dob: p.dob ? new Date(p.dob) : null,
        }));
        setFormData(parsedData);
      } catch (error) {
        console.error("Error parsing stored form data:", error);
      }
    }
    // Set flight data
    if (
      storedFlight &&
      storedFlight !== "undefined" &&
      storedFlight !== "null"
    ) {
      try {
        const flightData = JSON.parse(storedFlight);
        console.log("📍 Flight data loaded:", flightData);
        console.log("📍 Flight type:", flightData.type || flightData.tripType);
        console.log(
          "📍 Outbound flight:",
          flightData.outbound || flightData.outboundFlight
        );
        console.log(
          "📍 Return flight:",
          flightData.return || flightData.returnFlight
        );

        // Set flight data directly - data from result-section.jsx should be clean
        setFlight(flightData);

        // Extract fare data from flight data
        if (flightData.type === "ONE_WAY" && flightData.selectedClass) {
          setFare(flightData.selectedClass);
        } else if (
          flightData.type === "ROUND_TRIP" ||
          flightData.tripType === "ROUND_TRIP"
        ) {
          // For round-trip, use EXACT field names from result-section.jsx
          const outbound = flightData.outboundFlight;
          const returnFlight = flightData.returnFlight;

          console.log("📍 Round-trip fare extraction:", {
            outbound: outbound,
            returnFlight: returnFlight,
            totalPrice: flightData.totalPrice,
          });

          const combinedFare = {
            id: `${outbound?.id || "outbound"}-${returnFlight?.id || "return"}`,
            name: `${outbound?.segmentLabel || "Chiều đi"} / ${
              returnFlight?.segmentLabel || "Chiều về"
            }`,
            price: flightData.totalPrice,
            formattedPrice: flightData.formattedTotalPrice,
            outboundClass: outbound?.selectedClass,
            returnClass: returnFlight?.selectedClass,
            outbound: outbound,
            returnFlight: returnFlight,
          };
          setFare(combinedFare);
        } else if (
          flightData.type === "MULTI_CITY" &&
          flightData.segmentFares
        ) {
          // For multi-city, create combined fare from all segments
          const segmentFaresList = Object.values(flightData.segmentFares);
          const combinedFare = {
            id: `multi-city-${flightData.flightId}`,
            name: segmentFaresList.map((sf) => sf.className).join(" / "),
            price: flightData.totalPrice,
            segmentFares: flightData.segmentFares,
            segmentCount: flightData.segmentCount,
            legs: flightData.legs,
          };
          setFare(combinedFare);
        }
      } catch (error) {
        console.error("Error parsing flight data:", error);
      }
    }

    // Initialize passengers if formData is empty
    if (!storedFormData) {
      const storedSearchCriteria = localStorage.getItem("searchCriteria");
      const passengers = [];
      if (storedSearchCriteria) {
        try {
          const searchCriteria = JSON.parse(storedSearchCriteria);
          for (let i = 0; i < (searchCriteria.passengers?.adults || 1); i++)
            passengers.push({ type: "ADULT", phone: "", country: "Vietnam" });
          for (let i = 0; i < (searchCriteria.passengers?.children || 0); i++)
            passengers.push({ type: "CHILD", phone: "", country: "Vietnam" });
          for (let i = 0; i < (searchCriteria.passengers?.infants || 0); i++)
            passengers.push({ type: "INFANT", phone: "", country: "Vietnam" });
        } catch (e) {
          passengers.push({ type: "ADULT", phone: "", country: "Vietnam" });
        }
      } else {
        passengers.push({ type: "ADULT", phone: "", country: "Vietnam" });
      }
      setFormData((prev) => ({ ...prev, passengers }));
    }
  }, []);

  const proceedToNextStep = () => {
    // Logic to actually change the step
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
    setIsConfirmModalOpen(false);
  };

  const handleNext = () => {
    switch (currentStep) {
      case 2: // Passenger Details
        const { isValid, errors } = validateForm(
          formData,
          flightType,
          flight.departureDate
        );

        console.log("Validation result:", { isValid, errors });
        setValidationErrors(errors || {});

        if (!isValid) {
          toast.error(
            "Vui lòng kiểm tra lại các thông tin được đánh dấu màu đỏ."
          );
          // Scroll to first error
          setTimeout(() => {
            const firstError = document.querySelector(".border-red-500");
            if (firstError) {
              firstError.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 100);
        } else {
          setIsConfirmModalOpen(true);
        }
        break;

      case 3: // Extrasx
        proceedToNextStep();
        break;

      default:
        proceedToNextStep();
        break;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateFormData = (section, value, field = null) => {
    setFormData((prev) => {
      if (field !== null) {
        return {
          ...prev,
          [section]: { ...prev[section], [field]: value },
        };
      }
      return {
        ...prev,
        [section]: value,
      };
    });
  };

  const updatePassenger = (index, field, value) => {
    setFormData((prev) => {
      const passengers = [...prev.passengers];
      passengers[index] = { ...passengers[index], [field]: value };
      return { ...prev, passengers };
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <FlightInfo flightDetails={flight} fare={fare} />;
      case 2:
        return (
          <PassengerDetails
            formData={formData}
            updateFormData={updateFormData}
            updatePassenger={updatePassenger}
            flightType={flightType}
            departureDate={flight.departureDate}
            validationErrors={validationErrors}
          />
        );
      case 3:
        return (
          <Extras
            flight={flight}
            fare={fare}
            formData={formData}
            setExtrasData={setExtrasData}
          />
        );
      case 4:
        return (
          <Payment
            formData={formData}
            extrasData={extrasData}
            flight={flight}
            fare={fare}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = (step) => {
    const titles = [
      "Chọn chuyến bay",
      "Thông tin hành khách",
      "Tiện ích bổ sung",
      "Thanh toán",
    ];
    return titles[step - 1];
  };

  const getStepDescription = (step) => {
    const descriptions = [
      "Chọn chuyến bay phù hợp với lịch trình của bạn từ nhiều hãng hàng không uy tín.",
      "Điền thông tin hành khách để hoàn tất việc đặt vé máy bay.",
      "Lựa chọn các tiện ích bổ sung để chuyến bay của bạn thoải mái hơn.",
      "Thanh toán an toàn để hoàn tất việc đặt vé máy bay của bạn.",
    ];
    return descriptions[step - 1];
  };

  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={4000} />
      <SEO
        title={getStepTitle(currentStep)}
        description={getStepDescription(currentStep)}
        keywords="đặt vé máy bay, booking chuyến bay, thông tin hành khách, thanh toán vé máy bay"
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700">
        <main className="max-w-7xl mx-auto py-8 pt-20 px-4 sm:px-6 lg:px-8">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            titleFontSize="text-sm"
            titleFontWeight="font-semibold"
            circleFontSize="text-sm"
            circleFontWeight="font-bold"
          />
          <FlightInfo flightDetails={flight} fare={fare} />
          {renderStepContent()}
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-8">
            <button
              type="button"
              className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 order-2 sm:order-1 dark:text-gray-300"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Quay lại
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              onClick={handleNext}
              disabled={currentStep === steps.length}
            >
              {currentStep === steps.length ? "" : "Tiếp tục →"}
            </button>
          </div>
          <AlertDialog
            open={isConfirmModalOpen}
            onOpenChange={setIsConfirmModalOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận thông tin</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn chắc chắn các thông tin đã nhập là chính xác? Thông tin
                  sai có thể ảnh hưởng đến việc làm thủ tục chuyến bay.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Kiểm tra lại</AlertDialogCancel>
                <AlertDialogAction onClick={proceedToNextStep}>
                  Chính xác
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </>
  );
}

FlightBookingStepper.propTypes = {
  flight: PropTypes.shape({
    id: PropTypes.number,
    airline: PropTypes.string,
    price: PropTypes.number,
    arrivalAirport: PropTypes.shape({
      airportName: PropTypes.string,
    }),
    departureAirport: PropTypes.shape({
      airportName: PropTypes.string,
    }),
  }),
  fare: PropTypes.shape({
    travelClass: PropTypes.shape({
      id: PropTypes.number,
      className: PropTypes.string,
    }),
  }),
  formData: PropTypes.shape({
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
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
    ),
  }),
  extrasData: PropTypes.shape({
    selectedSeats: PropTypes.object,
    baggage: PropTypes.object,
    additionalServices: PropTypes.object,
    total: PropTypes.number,
  }),
};

export default FlightBookingStepper;
