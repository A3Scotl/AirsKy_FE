import React, { useState } from "react";
import CheckInTermsModal from "@/components/checkin/checkin-terms-modal";
import CheckInSearchForm from "@/components/checkin/checkin-search-form";
import CheckInBookingDetails from "@/components/checkin/checkin-booking-details";
import CheckInSeatSelection from "@/components/checkin/checkin-seat-selection";
import CheckInCompletion from "@/components/checkin/checkin-completion";
import { checkinApi } from "@/apis/checkin-api";
import { boardingpassApi } from "@/apis/boardingpass-api";
import { formatCurrencyVND } from "@/utils/currency-utils";
import { toast } from "sonner";

export default function CheckInPage() {
  const [currentStep, setCurrentStep] = useState("search"); // search, details, seat-selection, success, already-done
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]); // Array of eligible passengers
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalCost, setAdditionalCost] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);

  const handleShowTerms = () => {
    setShowTermsModal(true);
  };

  const handleSearchBooking = async (searchData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await checkinApi.lookupBookingForCheckin(
        searchData.bookingCode.trim(),
        searchData.passengerName.trim()
      );

      console.log("🔍 Lookup booking response:", response);

      // Check for specific check-in not available error
      if (
        response.message &&
        response.message.includes(
          "Check-in not available for this flight at this time"
        )
      ) {
        const errorMessage =
          "Bạn chưa được phép checkin lúc này. Hãy chú ý giờ khởi hành từ đơn đặt của bạn và thử lại sau.";
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (response.success && response.data) {
        const bookingData = response.data;

        // Check if there are eligible passengers
        if (
          !bookingData.checkinEligiblePassengers ||
          bookingData.checkinEligiblePassengers.length === 0
        ) {
          setError(
            "Không tìm thấy hành khách đủ điều kiện check-in với thông tin đã nhập."
          );
          toast.error("Không tìm thấy hành khách đủ điều kiện check-in");
          return;
        }

        // Set booking data - using the complete booking response
        setBooking(bookingData);

        // Set passengers data from checkin eligible passengers
        setPassengers(bookingData.checkinEligiblePassengers);

        // Use the first eligible passenger to check status
        const firstPassenger = bookingData.checkinEligiblePassengers[0];

        // Check for NOT_AVAILABLE status
        if (firstPassenger.checkinStatus === "NOT_AVAILABLE") {
          const errorMessage =
            "Bạn chưa được phép checkin lúc này. Hãy chú ý giờ khởi hành từ đơn đặt của bạn và thử lại sau.";
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        // Check check-in status
        if (
          firstPassenger.checkinStatus === "ALREADY_CHECKED_IN" ||
          firstPassenger.checkedIn
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

  const handleSelectSeat = (seatNumber, seatType) => {
    setSelectedSeat({ seatNumber, seatType });
  };

  const handleConfirmCheckIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Prepare check-in data according to API specification
      const selectedPassenger = passengers[0]; // Get first passenger for now
      const seatNumber =
        selectedSeat?.seatNumber || selectedPassenger.seatNumber;
      const seatType = selectedSeat?.seatType || selectedPassenger.seatType;

      const checkinData = {
        bookingId: booking.bookingId,
        passengerId: selectedPassenger.passengerId,
        seatNumber: seatNumber,
        seatType: seatType,
        ticketPrice: selectedPassenger.ticketPrice,
      };

      console.log("🚀 Sending check-in data:", checkinData);

      const response = await checkinApi.createCheckin(checkinData);
      console.log("📥 Check-in response received:", response);

      if (response.success && response.data) {
        // Update booking with check-in response data
        const checkinResponse = response.data;
        console.log("✅ Check-in response data:", checkinResponse);

        const updatedBooking = {
          ...booking,
          seat: seatNumber,
          seatNumber: seatNumber,
          seatType: seatType,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: checkinResponse.issueDate,
          checkinId: checkinResponse.checkinId,
          boardingPassUrl: checkinResponse.boardingPassUrl,
          status: checkinResponse.status,
          // Preserve passenger info for success page
          passenger:
            selectedPassenger.fullName ||
            `${selectedPassenger.firstName} ${selectedPassenger.lastName}`,
          passengerId: selectedPassenger.passengerId,
          ticketPrice: selectedPassenger.ticketPrice,
          // Add flight info if available
          flight:
            booking.flightSegments?.[0]?.flightNumber || booking.flightNumber,
          from:
            booking.flightSegments?.[0]?.departureAirport?.airportCode || "N/A",
          to: booking.flightSegments?.[0]?.arrivalAirport?.airportCode || "N/A",
          departureTime: booking.flightSegments?.[0]?.departureTime,
        };

        console.log("📦 Updated booking for success page:", updatedBooking);
        setBooking(updatedBooking);
        setCurrentStep("success");
        toast.success("Check-in thành công! Thẻ lên máy bay đã được tạo.");
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

  const handleProceedToPayment = (cost, services, seat) => {
    setAdditionalCost(cost);
    setSelectedServices(services);
    setSelectedSeat(seat);
    setCurrentStep("success"); // Go to completion page with payment
  };

  const handlePaymentSuccess = (paymentData) => {
    // Handle successful payment - could update booking status or navigate
    toast.success("Thanh toán thành công!");
    // Optionally navigate to a confirmation page or update booking
  };

  const handleDownloadBoardingPass = async () => {
    try {
      if (booking.boardingPassUrl) {
        // Download from boarding pass URL
        const fileName = `boarding-pass-${booking.bookingCode}-${booking.passengerId}.png`;
        const result = await boardingpassApi.downloadFromUrl(
          booking.boardingPassUrl,
          fileName
        );
        if (result.success) {
          toast.success("Thẻ lên máy bay đã được tải xuống thành công!");
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi tải xuống");
        }
      } else {
        // Try to get boarding pass URL from API
        const response = await boardingpassApi.getBoardingPassUrl(
          booking.bookingCode,
          booking.passengerId
        );
        if (response.success && response.data) {
          const fileName = `boarding-pass-${booking.bookingCode}-${booking.passengerId}.png`;
          const result = await boardingpassApi.downloadFromUrl(
            response.data,
            fileName
          );
          if (result.success) {
            toast.success("Thẻ lên máy bay đã được tải xuống thành công!");
          } else {
            toast.error(result.message || "Có lỗi xảy ra khi tải xuống");
          }
        } else {
          toast.error("Không tìm thấy thẻ lên máy bay");
        }
      }
    } catch (error) {
      console.error("Download boarding pass error:", error);
      toast.error("Có lỗi xảy ra khi tải xuống thẻ lên máy bay");
    }
  };

  const handleEmailBoardingPass = async () => {
    try {
      // For now, we'll just show a success message
      // In a real app, you would call an email API
      toast.success("Thẻ lên máy bay đã được gửi đến email của bạn!");
    } catch (error) {
      console.error("Email boarding pass error:", error);
      toast.error("Có lỗi xảy ra khi gửi email");
    }
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
            onProceedToPayment={handleProceedToPayment}
          />
        );

      case "success":
      case "already-done":
        return (
          <CheckInCompletion
            booking={booking}
            onNewCheckIn={handleNewCheckIn}
            onDownload={handleDownloadBoardingPass}
            onEmail={handleEmailBoardingPass}
            onRefresh={handleRefresh}
            isAlreadyCheckedIn={currentStep === "already-done"}
            additionalCost={additionalCost}
            selectedServices={selectedServices}
            selectedSeat={selectedSeat}
            onPaymentSuccess={handlePaymentSuccess}
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
