"use client";

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SEO from "@/components/common/seo";
import Stepper from "@/lib/Stepper";
import PassengerDetails from "@/components/section/flight/passenger-detail-section";
import Extras from "@/components/section/flight/extras-section";
import Payment from "@/components/section/flight/payment-section";

const steps = [
  { title: "Chọn chuyến bay" },
  { title: "Thông tin hành khách" },
  { title: "Tiện ích" },
  { title: "Thanh toán" },
];

const FlightInfo = ({ flightDetails }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 my-6">
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
      {/* Thông tin chuyến bay */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {flightDetails.from} → {flightDetails.to}
          </div>
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
            {flightDetails.fare}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Ngày:
            </span>{" "}
            {flightDetails.date}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Hãng bay:
            </span>{" "}
            {flightDetails.airline}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-white">
              Hạng vé:
            </span>{" "}
            {flightDetails.fare}
          </div>
          {flightDetails.duration && (
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Thời gian bay:
              </span>{" "}
              {flightDetails.duration}
            </div>
          )}
          {flightDetails.availableSeats && (
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Ghế trống:
              </span>{" "}
              {flightDetails.availableSeats}
            </div>
          )}
          {flightDetails.aircraft && (
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Máy bay:
              </span>{" "}
              {flightDetails.aircraft}
            </div>
          )}
        </div>

        {/* Chi tiết giá */}
        {flightDetails.priceBreakdown && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-blue-200 dark:border-gray-500">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              Chi tiết giá vé
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-700 dark:text-gray-300">
                  💺 Vé máy bay cơ bản:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {flightDetails.priceBreakdown.basePrice} đ
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-700 dark:text-gray-300">
                  ⭐ Phí hạng {flightDetails.fare}:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {flightDetails.priceBreakdown.farePrice} đ
                </span>
              </div>
              <div className="border-t-2 border-blue-300 dark:border-gray-400 pt-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white text-base">
                    💰 Tổng cộng:
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                    {flightDetails.priceBreakdown.total} đ
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin bổ sung */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Có thể hủy miễn phí 24h trước chuyến bay
          </div>
          <div className="flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Bảo hiểm chuyến bay
          </div>
          <div className="flex items-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Hỗ trợ 24/7
          </div>
        </div>
      </div>

      {/* Tổng giá */}
      <div className="lg:text-right">
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {flightDetails.price} đ
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          cho 1 hành khách
        </div>
        {flightDetails.priceBreakdown && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Đã bao gồm thuế phí
          </div>
        )}
      </div>
    </div>
  </div>
);

export function FlightBookingStepper() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(2);
  const [flightData, setFlightData] = useState(null);
  const [selectedFare, setSelectedFare] = useState(null);
  const [formData, setFormData] = useState({
    contact: {
      fullName: "",
      phone: "",
      email: "",
      confirmEmail: "",
      isPassenger: false,
    },
    passengers: [
      {
        type: "Adult",
        fullName: "",
        gender: "",
        dob: null,
        passport: "",
        frequentFlyer: "",
      },
      {
        type: "Child",
        fullName: "",
        gender: "",
        dob: null,
        passport: "",
        frequentFlyer: "",
      },
    ],
  });

  // Load flight data from localStorage or location state
  useEffect(() => {
    console.log(
      "[BookingStepper] Component mounted, location state:",
      location.state
    );

    // Try to get from location state first (preferred)
    if (location.state?.flightData) {
      console.log(
        "[BookingStepper] LOADING FLIGHT data from location state:",
        location.state.flightData
      );
      setFlightData(location.state.flightData);
      if (location.state.flightData.selectedFare) {
        setSelectedFare(location.state.flightData.selectedFare);
      }
    } else {
      // Fallback to localStorage
      const storedFlight = localStorage.getItem("selectedFlight");
      const storedFare = localStorage.getItem("selectedFare");

      console.log(
        "[BookingStepper] localStorage selectedFlight:",
        storedFlight
      );
      console.log("[BookingStepper] localStorage selectedFare:", storedFare);

      if (storedFlight) {
        try {
          const parsedFlight = JSON.parse(storedFlight);
          console.log(
            "[BookingStepper] Loading flight data from localStorage:",
            parsedFlight
          );
          setFlightData(parsedFlight);
        } catch (error) {
          console.error(
            "[BookingStepper] Error parsing flight data from localStorage:",
            error
          );
        }
      }

      if (storedFare) {
        try {
          const parsedFare = JSON.parse(storedFare);
          console.log(
            "[BookingStepper] Loading fare data from localStorage:",
            parsedFare
          );
          setSelectedFare(parsedFare);
        } catch (error) {
          console.error(
            "[BookingStepper] Error parsing fare data from localStorage:",
            error
          );
        }
      }
    }

    console.log("[BookingStepper] Final flightData state:", flightData);
    console.log("[BookingStepper] Final selectedFare state:", selectedFare);
  }, [location.state]);

  // Debug: Log when flightData changes
  useEffect(() => {
    console.log("[BookingStepper] flightData updated:", flightData);
    console.log("[BookingStepper] selectedFare updated:", selectedFare);
    console.log(
      "[BookingStepper] Formatted flight details:",
      formatFlightDetails()
    );
  }, [flightData, selectedFare]);

  // Format flight data for FlightInfo component
  const formatFlightDetails = () => {
    console.log(
      "[BookingStepper] formatFlightDetails called with flightData:",
      flightData
    );

    if (!flightData) {
      console.log("[BookingStepper] No flightData, returning N/A");
      return {
        from: "N/A",
        to: "N/A",
        date: "N/A",
        airline: "N/A",
        fare: "N/A",
        price: "0",
      };
    }

    // Sử dụng dữ liệu đã được format sẵn từ flight-detail-page
    const from = flightData.departure
      ? `${flightData.departure.city} (${flightData.departure.code})`
      : `${flightData.departureAirport?.cityNames?.[0] || "N/A"} (${
          flightData.departureAirport?.airportCode || "N/A"
        })`;

    const to = flightData.arrival
      ? `${flightData.arrival.city} (${flightData.arrival.code})`
      : `${flightData.arrivalAirport?.cityNames?.[0] || "N/A"} (${
          flightData.arrivalAirport?.airportCode || "N/A"
        })`;

    const date = flightData.departure?.date
      ? `Ngày ${flightData.departure.date}`
      : (() => {
          const departureDate = new Date(flightData.departureTime);
          return departureDate.toLocaleDateString("vi-VN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        })();

    const airline = flightData.flightNumber
      ? `${
          typeof flightData.airline === "object"
            ? flightData.airline?.airlineName || "N/A"
            : flightData.airline || "N/A"
        } ${flightData.flightNumber}`
      : typeof flightData.airline === "object"
      ? flightData.airline?.airlineName || "N/A"
      : flightData.airline || "N/A";

    const fare =
      flightData.selectedFare?.type || selectedFare?.type || "Phổ thông";

    // Tính toán chi tiết giá
    const basePrice = flightData.price || flightData.basePrice || 0;
    const farePrice =
      flightData.selectedFare?.price || selectedFare?.price || 0;
    const totalPrice = basePrice + farePrice;

    const priceBreakdown = {
      basePrice: basePrice.toLocaleString("vi-VN"),
      farePrice: farePrice.toLocaleString("vi-VN"),
      total: totalPrice.toLocaleString("vi-VN"),
    };

    const result = {
      from,
      to,
      date,
      airline,
      fare,
      price: totalPrice.toLocaleString("vi-VN"),
      priceBreakdown,
      duration: flightData.duration || "N/A",
      availableSeats: flightData.availableSeats || "N/A",
      aircraft: flightData.aircraft || "N/A",
    };

    console.log("[BookingStepper] Final formatted result:", result);
    return result;
  };

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const updateFormData = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
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
        return <FlightInfo />;
      case 2:
        return (
          <PassengerDetails
            formData={formData}
            updateFormData={updateFormData}
            updatePassenger={updatePassenger}
          />
        );
      case 3:
        return <Extras />;
      case 4:
        return <Payment />;
      default:
        return null;
    }
  };

  // Dynamic title and description based on current step
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
          <FlightInfo flightDetails={formatFlightDetails()} />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
              onClick={handleNext}
              disabled={currentStep === steps.length}
            >
              {currentStep === steps.length ? "Hoàn tất" : "Tiếp tục →"}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

export default FlightBookingStepper;
