import React, { useState } from "react";
import CheckInTermsModal from "@/components/checkin/checkin-terms-modal";
import CheckInSearchForm from "@/components/checkin/checkin-search-form";
import CheckInBookingDetails from "@/components/checkin/checkin-booking-details";
import CheckInSeatSelection from "@/components/checkin/checkin-seat-selection";
import CheckInSuccess from "@/components/checkin/checkin-success";
import CheckInAlreadyDone from "@/components/checkin/checkin-already-done";
import { checkinApi } from "@/apis/checkin-api";
import { toast } from "sonner";

export default function CheckInPage() {
  const [currentStep, setCurrentStep] = useState("search"); // search, details, seat-selection, success, already-done
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]); // Array of eligible passengers
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
      const response = await checkinApi.getCheckinEligiblePassengers(
        searchData.bookingCode.trim(),
        searchData.passengerName.trim()
      );

      if (response.success && response.data) {
        const eligiblePassengers = Array.isArray(response.data)
          ? response.data
          : [response.data];

        if (eligiblePassengers.length === 0) {
          setError(
            "Không tìm thấy hành khách đủ điều kiện check-in với thông tin đã nhập."
          );
          toast.error("Không tìm thấy hành khách đủ điều kiện check-in");
          return;
        }

        // Set passengers data
        setPassengers(eligiblePassengers);

        // For now, use the first passenger as the booking data
        // In a real app, you might want to show a selection if multiple passengers
        const firstPassenger = eligiblePassengers[0];

        // Create booking object from passenger data
        const bookingData = {
          code: searchData.bookingCode,
          passenger: firstPassenger.fullName,
          passengerId: firstPassenger.passengerId,
          passportNumber: firstPassenger.passportNumber,
          seat: firstPassenger.seatNumber,
          ticketPrice: firstPassenger.ticketPrice,
          isCheckedIn: firstPassenger.isCheckedIn,
          checkinStatus: firstPassenger.checkinStatus,
          // Additional fields that might come from flight info
          flight: "VN123", // This should come from API
          from: "SGN", // This should come from API
          to: "HAN", // This should come from API
          date: "2025-10-01", // This should come from API
          time: "08:00", // This should come from API
          baggage: "20kg", // This should come from API
          gate: "A12", // This should come from API
          boardingTime: "07:30", // This should come from API
        };

        setBooking(bookingData);

        // Check check-in status
        if (
          firstPassenger.checkinStatus === "ALREADY_CHECKED_IN" ||
          firstPassenger.isCheckedIn
        ) {
          setCurrentStep("already-done");
          toast.info("Hành khách đã check-in trước đó");
        } else if (firstPassenger.checkinStatus === "PAYMENT_PENDING") {
          setError(
            "Vé chưa được thanh toán. Vui lòng thanh toán trước khi check-in."
          );
          toast.error("Vé chưa được thanh toán");
          return;
        } else if (firstPassenger.checkinStatus === "ELIGIBLE") {
          setCurrentStep("details");
          toast.success("Tìm thấy hành khách đủ điều kiện check-in");
        } else {
          setError("Trạng thái check-in không hợp lệ.");
          toast.error("Trạng thái check-in không hợp lệ");
          return;
        }
      } else {
        const errorMessage =
          response.message || "Không tìm thấy đặt chỗ với thông tin đã nhập.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error searching booking:", err);
      const errorMessage =
        "Có lỗi xảy ra khi tìm kiếm đặt chỗ. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
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
    setError("");

    try {
      // Prepare check-in data
      const checkinData = {
        passengerId: booking.passengerId,
        seatNumber: selectedSeat || booking.seat, // Use selected seat or existing seat
        // Add other required fields based on your CheckinRequest DTO
      };

      const response = await checkinApi.createCheckin(checkinData);

      if (response.success && response.data) {
        // Update booking with check-in data
        const updatedBooking = {
          ...booking,
          seat: selectedSeat || booking.seat,
          isCheckedIn: true,
          checkinStatus: "ALREADY_CHECKED_IN",
          checkInTime: new Date().toISOString(),
        };

        setBooking(updatedBooking);
        setCurrentStep("success");
        toast.success("Check-in thành công!");
      } else {
        const errorMessage = response.message || "Có lỗi xảy ra khi check-in.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error("Error during check-in:", err);
      const errorMessage = "Có lỗi xảy ra khi check-in. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
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
    setPassengers([]);
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
