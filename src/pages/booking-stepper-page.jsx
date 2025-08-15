"use client";

import { useState } from "react";
import Stepper from "@/lib/Stepper";
import PassengerDetails from "@/components/section/flight/passenger-detail-section";
import Extras from "@/components/section/flight/extras-section";
import Payment from "@/components/section/flight/payment-section";

const steps = [
  { title: "Flight Selection" },
  { title: "Passenger Details" },
  { title: "Extras" },
  { title: "Payment" },
];

const FlightInfo = ({ flightDetails }) => (
  <div className="flex justify-between items-start my-8">
    <div>
      <h1 className="text-2xl font-bold">
        {flightDetails.from} → {flightDetails.to}
      </h1>
      <p className="text-sm text-gray-500">
        {flightDetails.date} {flightDetails.airline} {flightDetails.fare}
      </p>
    </div>
    <div className="text-3xl font-bold">${flightDetails.price}</div>
  </div>
);

export function FlightBookingStepper() {
  const [currentStep, setCurrentStep] = useState(2);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto py-8">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          titleFontSize="text-sm"
          titleFontWeight="font-semibold"
          circleFontSize="text-sm"
          circleFontWeight="font-bold"
        />
        <FlightInfo
          flightDetails={{
            from: "New York (JFK)",
            to: "Los Angeles (LAX)",
            date: "Sep 15, 2025",
            airline: "Delta DL476",
            fare: "Main Cabin",
            price: 299,
          }}
        />
        {renderStepContent()}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={handleNext}
            disabled={currentStep === steps.length}
          >
            {currentStep === steps.length ? "Complete" : "Continue →"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default FlightBookingStepper;
