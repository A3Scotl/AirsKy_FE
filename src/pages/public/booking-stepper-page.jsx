"use client";

import { useState, useEffect, useMemo } from "react";
import SEO from "@/components/common/seo";
import Stepper from "@/lib/Stepper";
import PassengerDetails from "@/components/section/flight/passenger-detail-section";
import Extras from "@/components/section/flight/extras-section";
import Payment from "@/components/section/flight/payment-section";
import PropTypes from "prop-types";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from "sonner";

const steps = [
  { title: "Chọn chuyến bay" },
  { title: "Thông tin hành khách" },
  { title: "Tiện ích" },
  { title: "Thanh toán" },
];

import { formatCurrencyVND } from "@/utils/currency-utils";

const FlightInfo = ({ flightDetails, fare }) => {
  // Check flight type
  const isRoundTrip = flightDetails.type === "ROUND_TRIP";
  const isMultiCity =
    flightDetails.type === "MULTI_CITY" ||
    flightDetails.tripType === "MULTI_CITY";

  if (isMultiCity && (flightDetails.legs || flightDetails.multiCity?.legs)) {
    // Multi-city display - handle both new and old data structures
    const legs = flightDetails.legs || flightDetails.multiCity?.legs || [];
    const segmentCount =
      flightDetails.segmentCount ||
      flightDetails.multiCity?.segments ||
      legs.length;
    const routeInfo =
      flightDetails.multiCity?.routeInfo ||
      legs.map((leg) => leg.from || leg.departureAirport?.code).join(" → ") +
        (legs.length > 0
          ? ` → ${
              legs[legs.length - 1].to ||
              legs[legs.length - 1].arrivalAirport?.code
            }`
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
                  {leg.from ||
                    leg.departureAirport?.code ||
                    leg.departureAirport?.airportCode ||
                    "N/A"}{" "}
                  →{" "}
                  {leg.to ||
                    leg.arrivalAirport?.code ||
                    leg.arrivalAirport?.airportCode ||
                    "N/A"}
                </div>
                <div className="text-gray-600">
                  {leg.departureAirport?.name ||
                    leg.departureAirport?.airportName}{" "}
                  →{" "}
                  {leg.arrivalAirport?.name || leg.arrivalAirport?.airportName}
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

  if (isRoundTrip && flightDetails.outbound && flightDetails.return) {
    // Round-trip display
    return (
      <div className="my-6 sm:my-8 space-y-4">
        {/* Header with total price */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Chuyến bay khứ hồi
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {flightDetails.outbound?.airline || flightDetails.airline} /{" "}
              {flightDetails.return?.airline || flightDetails.airline}
            </p>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 sm:text-gray-900 dark:text-white">
            {formatCurrencyVND(flightDetails.totalPrice || 0)}
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
                {flightDetails.outbound?.flightNumber || "N/A"}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {flightDetails.outbound?.from || "N/A"} →{" "}
                {flightDetails.outbound?.arrivalAirport?.code || "N/A"}
              </div>
              <div className="text-gray-600">
                {flightDetails.outbound?.departureDate || "N/A"}
              </div>
              <div className="text-gray-600">
                {flightDetails.outbound?.departureTime} -{" "}
                {flightDetails.outbound?.arrivalTime}
              </div>
              <div className="text-blue-600 font-medium">
                {formatCurrencyVND(
                  flightDetails.outbound?.selectedClass?.price || 0
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
                {flightDetails.return?.flightNumber || "N/A"}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {flightDetails.return?.from || "N/A"} →{" "}
                {flightDetails.return?.arrivalAirport?.code || "N/A"}
              </div>
              <div className="text-gray-600">
                {flightDetails.return?.departureDate || "N/A"}
              </div>
              <div className="text-gray-600">
                {flightDetails.return?.departureTime} -{" "}
                {flightDetails.return?.arrivalTime}
              </div>
              <div className="text-blue-600 font-medium">
                {formatCurrencyVND(
                  flightDetails.return?.selectedClass?.price || 0
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
            {flightDetails.flight?.from || "N/A"} →{" "}
            {flightDetails.flight?.to ||
              flightDetails.flight?.arrivalAirport?.code ||
              "N/A"}
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

function FlightBookingStepper() {
  const [flight, setFlight] = useState({});
  const [fare, setFare] = useState({});
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState({
    passengers: [],
  });
  const [extrasData, setExtrasData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [isStepValid, setIsStepValid] = useState(false);
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
    const storedFlight = localStorage.getItem("selectedFlight");
    const storedSearchCriteria = localStorage.getItem("searchCriteria");

    console.log("Loading data from localStorage:", {
      flight: storedFlight,
      searchCriteria: storedSearchCriteria,
    });

    // Set flight data
    if (
      storedFlight &&
      storedFlight !== "undefined" &&
      storedFlight !== "null"
    ) {
      try {
        const flightData = JSON.parse(storedFlight);
        setFlight(flightData);

        // Extract fare data from flight data
        if (flightData.type === "ONE_WAY" && flightData.selectedClass) {
          setFare(flightData.selectedClass);
        } else if (flightData.type === "ROUND_TRIP") {
          // For round-trip, we can use outbound class as primary fare or create a combined fare object
          const combinedFare = {
            id: `${flightData.outbound?.selectedClass?.id || "outbound"}-${
              flightData.return?.selectedClass?.id || "return"
            }`,
            name: `${
              flightData.outbound?.selectedClass?.name || "Outbound"
            } / ${flightData.return?.selectedClass?.name || "Return"}`,
            price: flightData.totalPrice,
            outboundClass: flightData.outbound?.selectedClass,
            returnClass: flightData.return?.selectedClass,
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

    // Initialize passengers based on search criteria or default to 1 adult
    const passengers = [];

    if (
      storedSearchCriteria &&
      storedSearchCriteria !== "undefined" &&
      storedSearchCriteria !== "null"
    ) {
      try {
        // From search: create passengers based on search criteria
        const searchCriteria = JSON.parse(storedSearchCriteria);

        // Add adults
        for (let i = 0; i < (searchCriteria.passengers?.adults || 1); i++) {
          passengers.push({
            type: "ADULT",
            fullName: "",
            dob: null,
            gender: "",
            phone: "",
            email: "",
            passport: "",
            frequentFlyer: "",
          });
        }

        // Add children
        for (let i = 0; i < (searchCriteria.passengers?.children || 0); i++) {
          passengers.push({
            type: "CHILD",
            fullName: "",
            dob: null,
            gender: "",
            passport: "",
            frequentFlyer: "",
          });
        }

        // Add infants
        for (let i = 0; i < (searchCriteria.passengers?.infants || 0); i++) {
          passengers.push({
            type: "INFANT",
            fullName: "",
            dob: null,
            gender: "",
            passport: "",
            frequentFlyer: "",
          });
        }
      } catch (error) {
        console.error("Error parsing search criteria:", error);
        // Fallback to default 1 adult
        passengers.push({
          type: "ADULT",
          fullName: "",
          dob: null,
          gender: "",
          phone: "",
          email: "",
          passport: "",
          frequentFlyer: "",
        });
      }
    } else {
      // From flight list: default to 1 adult based on flight type
      passengers.push({
        type: "ADULT",
        fullName: "",
        dob: null,
        gender: "",
        phone: "",
        email: "",
        passport: flightType === "INTERNATIONAL" ? "" : null,
        frequentFlyer: "",
      });
    }

    if (passengers.length > 0) {
      setFormData((prev) => ({ ...prev, passengers }));
    }

    if (passengers.length > 0) {
      setFormData((prev) => ({ ...prev, passengers }));
    }
  }, []);

  // Validate current step whenever formData changes
  useEffect(() => {
    validateCurrentStepRealtime();
  }, [formData, currentStep, flightType]);

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone format (Vietnam)
  const validatePhone = (phone) => {
    const phoneRegex = /^(\+84|84|0)[3-9]\d{8}$/;
    return phoneRegex.test(phone);
  };

  // Real-time validation for current step
  const validateCurrentStepRealtime = () => {
    const errors = {};
    let isValid = true;

    switch (currentStep) {
      case 2: // Passenger Details
        // Check passengers
        if (!formData.passengers || formData.passengers.length === 0) {
          errors.passengers = "Cần ít nhất 1 hành khách";
          isValid = false;
        } else {
          formData.passengers.forEach((passenger, index) => {
            const passengerErrors = {};

            if (!passenger.firstName?.trim()) {
              passengerErrors.firstName = "Tên không được để trống";
              isValid = false;
            }

            if (!passenger.lastName?.trim()) {
              passengerErrors.lastName = "Họ không được để trống";
              isValid = false;
            }

            if (!passenger.dob) {
              passengerErrors.dateOfBirth = "Ngày sinh không được để trống";
              isValid = false;
            }

            if (!passenger.gender) {
              passengerErrors.gender = "Vui lòng chọn giới tính";
              isValid = false;
            }

            // For international flights, passport is required
            if (flightType === "INTERNATIONAL" && !passenger.passport?.trim()) {
              passengerErrors.passport =
                "Số hộ chiếu bắt buộc cho chuyến bay quốc tế";
              isValid = false;
            }

            if (Object.keys(passengerErrors).length > 0) {
              errors[`passenger_${index}`] = passengerErrors;
            }
          });
        }

        // // Check contact information
        // if (!formData.contactInfo?.email?.trim()) {
        //   errors.contactEmail = "Email liên hệ không được để trống";
        //   isValid = false;
        // } else if (!validateEmail(formData.contactInfo.email)) {
        //   errors.contactEmail = "Email không đúng định dạng";
        //   isValid = false;
        // }

        // if (!formData.contactInfo?.phone?.trim()) {
        //   errors.contactPhone = "Số điện thoại không được để trống";
        //   isValid = false;
        // } else if (!validatePhone(formData.contactInfo.phone)) {
        //   errors.contactPhone = "Số điện thoại không đúng định dạng";
        //   isValid = false;
        // }

        break;

      case 3: // Extras
        // Extras step is optional, always valid
        isValid = true;
        break;

      default:
        isValid = true;
        break;
    }

    setValidationErrors(errors);
    setIsStepValid(isValid);
    return isValid;
  };

  const validateCurrentStep = () => {
    const isValid = validateCurrentStepRealtime();

    if (!isValid) {
      // Show toast with first error
      const firstError = Object.values(validationErrors).find((error) =>
        typeof error === "string" ? error : Object.values(error)[0]
      );

      if (typeof firstError === "string") {
        toast.error(firstError);
      } else if (typeof firstError === "object") {
        const nestedError = Object.values(firstError)[0];
        toast.error(nestedError);
      }
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateFormData = (section, value, field = null) => {
    setFormData((prev) => {
      if (field) {
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
        <main className="max-w-5xl mx-auto py-8 pt-20 px-4 sm:px-6 lg:px-8">
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
              disabled={
                currentStep === steps.length ||
                (currentStep >= 2 && !isStepValid)
              }
            >
              {currentStep === steps.length ? "Hoàn tất" : "Tiếp tục →"}
            </button>
          </div>
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
