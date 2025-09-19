"use client";

import { useState, useEffect } from "react";
import SEO from "@/components/common/seo";
import Stepper from "@/lib/Stepper";
import PassengerDetails from "@/components/section/flight/passenger-detail-section";
import Extras from "@/components/section/flight/extras-section";
import Payment from "@/components/section/flight/payment-section";
import PropTypes from "prop-types";

const steps = [
  { title: "Chọn chuyến bay" },
  { title: "Thông tin hành khách" },
  { title: "Tiện ích" },
  { title: "Thanh toán" },
];

const FlightInfo = ({ flightDetails, fare }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start my-6 sm:my-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">
           {flightDetails.departureAirport?.airportName}→ {flightDetails?.arrivalAirport?.airportName}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          {flightDetails.airline} - {fare?.travelClass?.className}
        </p>
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-blue-600 sm:text-gray-900 dark:text-white">
        {flightDetails?.price} đ
      </div>
    </div>
  );
};

function FlightBookingStepper() {
  const [flight, setFlight] = useState({});
  const [fare, setFare] = useState({});
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState({
    passengers: [
      {
        type: "ADULT",
        fullName: "",
        dob: null,
        passport: "",
        frequentFlyer: "",
      },
      {
        type: "CHILD",
        fullName: "",
        dob: null,
        passport: "",
        frequentFlyer: "",
      },
    ],
  });
  const [extrasData, setExtrasData] = useState({});

  useEffect(() => {
    const storedFlight = localStorage.getItem("selectedFlight");
    const storedFare = localStorage.getItem("selectedFare");
    if (storedFlight && storedFare) {
      setFlight(JSON.parse(storedFlight));
      setFare(JSON.parse(storedFare));
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
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
        return <Payment formData={formData} extrasData={extrasData} />;
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
        passport: PropTypes.string,
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