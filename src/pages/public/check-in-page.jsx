import React, { useState } from "react";
import CheckInTermsModal from "@/components/checkin/checkin-terms-modal";
import CheckInSearchForm from "@/components/checkin/checkin-search-form";
import CheckInBookingDetails from "@/components/checkin/checkin-booking-details";
import CheckInSeatSelection from "@/components/checkin/checkin-seat-selection";
import CheckInSuccess from "@/components/checkin/checkin-success";
import CheckInAlreadyDone from "@/components/checkin/checkin-already-done";

// Mock data - in real app, this would come from API
const mockBookings = {
  VN123456: {
    code: "VN123456",
    passenger: "Nguyen Van A",
    flight: "VN123",
    from: "SGN",
    to: "HAN",
    date: "2025-10-01",
    time: "08:00",
    seat: null,
    status: "Chưa check-in",
    baggage: "20kg",
    gate: "A12",
    boardingTime: "07:30",
    canCheckIn: true,
    checkInTime: null,
  },
  VN789012: {
    code: "VN789012",
    passenger: "Tran Thi B",
    flight: "VN456",
    from: "HAN",
    to: "SGN",
    date: "2025-10-02",
    time: "14:00",
    seat: "15A",
    status: "Đã check-in",
    baggage: "15kg",
    gate: "B08",
    boardingTime: "13:30",
    canCheckIn: false,
    checkInTime: "2025-09-30T10:15:00",
  },
};

const availableSeats = [
  "12A",
  "12B",
  "12C",
  "13A",
  "13B",
  "13C",
  "14A",
  "14B",
  "14C",
  "15A",
  "15B",
  "15C",
  "16A",
  "16B",
  "16C",
  "17A",
  "17B",
  "17C",
];

export default function CheckInPage() {
  const [currentStep, setCurrentStep] = useState("search"); // search, details, seat-selection, success, already-done
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [booking, setBooking] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleShowTerms = () => {
    setShowTermsModal(true);
  };

  const handleSearchBooking = async (searchData) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const foundBooking = mockBookings[searchData.bookingCode];

      if (!foundBooking) {
        setError(
          "Không tìm thấy đặt chỗ với thông tin đã nhập. Vui lòng kiểm tra lại."
        );
        return;
      }

      // Check passenger name (case insensitive)
      if (
        foundBooking.passenger.toLowerCase() !==
        searchData.passengerName.toLowerCase()
      ) {
        setError(
          "Tên hành khách không khớp với mã đặt chỗ. Vui lòng kiểm tra lại."
        );
        return;
      }

      setBooking(foundBooking);

      // Check if already checked in
      if (
        foundBooking.status === "Đã check-in" ||
        foundBooking.status === "Checked-in"
      ) {
        setCurrentStep("already-done");
      } else {
        setCurrentStep("details");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tìm kiếm đặt chỗ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToSeatSelection = () => {
    setCurrentStep("seat-selection");
  };

  const handleSelectSeat = (seat) => {
    setSelectedSeat(seat);
  };

  const handleConfirmCheckIn = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update booking with selected seat and check-in status
      const updatedBooking = {
        ...booking,
        seat: selectedSeat,
        status: "Đã check-in",
        checkInTime: new Date().toISOString(),
      };

      setBooking(updatedBooking);
      setCurrentStep("success");
    } catch (err) {
      setError("Có lỗi xảy ra khi check-in. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBoardingPass = async () => {
    // Simulate download
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In real app, this would trigger a download
    console.log("Downloading boarding pass...");
  };

  const handleEmailBoardingPass = async () => {
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In real app, this would send email
    console.log("Sending boarding pass via email...");
  };

  const handleNewCheckIn = () => {
    setBooking(null);
    setSelectedSeat(null);
    setError("");
    setCurrentStep("search");
  };

  const handleBack = () => {
    if (currentStep === "details") {
      setCurrentStep("search");
    } else if (currentStep === "seat-selection") {
      setCurrentStep("details");
    }
  };

  const handleRefresh = () => {
    // In real app, this would refresh booking data
    console.log("Refreshing booking data...");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "search":
        return (
          <CheckInSearchForm
            onSearch={handleSearchBooking}
            onShowTerms={handleShowTerms}
            isLoading={isLoading}
            error={error}
          />
        );

      case "details":
        return (
          <CheckInBookingDetails
            booking={booking}
            onProceed={handleProceedToSeatSelection}
            onBack={handleBack}
          />
        );

      case "seat-selection":
        return (
          <CheckInSeatSelection
            booking={booking}
            onSelectSeat={handleSelectSeat}
            onConfirm={handleConfirmCheckIn}
            onBack={handleBack}
            selectedSeat={selectedSeat}
          />
        );

      case "success":
        return (
          <CheckInSuccess
            booking={booking}
            onNewCheckIn={handleNewCheckIn}
            onDownload={handleDownloadBoardingPass}
            onEmail={handleEmailBoardingPass}
          />
        );

      case "already-done":
        return (
          <CheckInAlreadyDone
            booking={booking}
            onNewCheckIn={handleNewCheckIn}
            onDownload={handleDownloadBoardingPass}
            onEmail={handleEmailBoardingPass}
            onRefresh={handleRefresh}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen mt-16 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-10 dark:from-gray-700 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-4xl px-4 flex justify-center items-center">
        {renderCurrentStep()}
      </div>

      <CheckInTermsModal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
