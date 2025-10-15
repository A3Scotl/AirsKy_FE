import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import CheckInTermsModal from "@/components/checkin/checkin-terms-modal";
import CheckInSearchForm from "@/components/checkin/checkin-search-form";
import CheckInBookingDetails from "@/components/checkin/checkin-booking-details";
import CheckInSeatSelection from "@/components/checkin/checkin-seat-selection";
import CheckInCompletion from "@/components/checkin/checkin-completion";
import { checkinApi } from "@/apis/checkin-api";
import { bookingApi } from "@/apis/booking-api";
import { boardingpassApi } from "@/apis/boardingpass-api";
import { formatCurrencyVND } from "@/utils/currency-utils";
import { toast } from "sonner";

export default function CheckInPage() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState("search");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [booking, setBooking] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalCost, setAdditionalCost] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);

  // Handle return from payment
  useEffect(() => {
    const bookingCode = searchParams.get("bookingCode");
    const paymentSuccess = searchParams.get("paymentSuccess");
    const paymentError = searchParams.get("paymentError");

    if (bookingCode && paymentSuccess) {
      // User returned from successful payment, trigger check-in process
      toast.success("Thanh toán thành công! Đang tiến hành check-in...");

      // Restore booking data and proceed with check-in
      // You might want to fetch booking data again or restore from localStorage
      const savedBookingData = localStorage.getItem(
        `checkin_booking_${bookingCode}`
      );
      const savedSeatData = localStorage.getItem(`checkin_seat_${bookingCode}`);
      const savedServicesData = localStorage.getItem(
        `checkin_services_${bookingCode}`
      );

      if (savedBookingData) {
        try {
          const bookingData = JSON.parse(savedBookingData);
          const seatData = savedSeatData ? JSON.parse(savedSeatData) : null;
          const servicesData = savedServicesData
            ? JSON.parse(savedServicesData)
            : [];

          console.log("🔄 Restoring booking data after payment success:", {
            bookingData,
            seatData,
            servicesData,
          });

          // Set booking data and passengers
          setBooking(bookingData);
          setPassengers(bookingData.checkinEligiblePassengers || []);
          setSelectedSeat(seatData);
          setSelectedServices(servicesData);
          setCurrentStep("success");

          // Trigger the check-in process after payment with restored data
          setTimeout(() => {
            proceedWithCheckinAfterPaymentWithData(
              bookingData,
              seatData,
              servicesData
            );
          }, 1000);

          // Clean up stored data
          localStorage.removeItem(`checkin_booking_${bookingCode}`);
          localStorage.removeItem(`checkin_seat_${bookingCode}`);
          localStorage.removeItem(`checkin_services_${bookingCode}`);
          localStorage.removeItem("checkin_payment_info_backup");
        } catch (error) {
          console.error("Error restoring booking data:", error);
          toast.error("Có lỗi khi khôi phục dữ liệu. Vui lòng thử lại.");
        }
      }
    } else if (bookingCode && paymentError) {
      toast.error("Thanh toán thất bại. Vui lòng thử lại.");
    }
  }, [searchParams]);

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

  const handleSelectSeat = (seatNumber, seatType, seatId) => {
    setSelectedSeat({ seatNumber, seatType, seatId });
  };

  const handleConfirmCheckIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Prepare check-in data according to new API specification
      const selectedPassenger = passengers[0]; // Get first passenger for now

      // Must get proper numeric seatId, never use seatNumber string
      let newSeatId;

      if (selectedSeat?.seatId) {
        // User selected a new seat - use the seatId
        newSeatId = selectedSeat.seatId;
        console.log("🪑 Using selected seat ID:", newSeatId);
      } else if (selectedPassenger.seatId) {
        // No new seat selected - use current seatId
        newSeatId = selectedPassenger.seatId;
        console.log("🪑 Using current passenger seat ID:", newSeatId);
      } else {
        // Critical: Must resolve seatId from seatNumber
        const currentSeatNumber = selectedPassenger.seatNumber;
        console.log("🔍 Resolving seat ID for seatNumber:", currentSeatNumber);

        // Try to find seatId from booking's seat details
        const seatDetails = booking.seatTypeDetails?.find(
          (detail) => detail.seatNumber === currentSeatNumber
        );

        if (seatDetails?.seatId) {
          newSeatId = seatDetails.seatId;
          console.log("✅ Resolved seat ID from booking details:", newSeatId);
        } else {
          throw new Error(
            `Không tìm thấy ID ghế số cho ghế ${currentSeatNumber}. Vui lòng thử lại.`
          );
        }
      }

      // Validate seatId is numeric
      if (!newSeatId || typeof newSeatId === "string") {
        throw new Error(
          `Seat ID phải là số, nhận được: ${newSeatId} (type: ${typeof newSeatId})`
        );
      }

      console.log("🪑 Seat ID resolution (direct checkin):", {
        selectedSeat: selectedSeat,
        currentPassenger: selectedPassenger,
        resolvedSeatId: newSeatId,
      });

      const checkinData = {
        bookingCode: booking.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId: newSeatId,
      };

      console.log("🚀 Sending check-in data:", checkinData);

      const response = await bookingApi.processCheckin(checkinData);
      console.log("📥 Check-in response received:", response);

      if (response.success && response.data) {
        // Update booking with new check-in response data structure
        const checkinResponse = response.data;
        console.log("✅ Check-in response data:", checkinResponse);

        const updatedBooking = {
          ...booking,
          seat: checkinResponse.seatNumber,
          seatNumber: checkinResponse.seatNumber,
          seatType: checkinResponse.seatType,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: new Date().toISOString(), // Use current time if not provided
          checkinId: checkinResponse.checkinId,
          boardingPassUrl: checkinResponse.boardingPassUrl,
          status: checkinResponse.status,
          // Preserve passenger info for success page - use response data or fallback to original
          passenger: checkinResponse.passengerName,
          passengerId:
            checkinResponse.passengerId || selectedPassenger.passengerId,
          ticketPrice: checkinResponse.ticketPrice,
          // Add new fields from updated API
          oldSeatNumber: checkinResponse.oldSeatNumber,
          newSeatNumber: checkinResponse.newSeatNumber,
          seatChangeCharge: checkinResponse.seatChangeCharge,
          servicesAddedCharge: checkinResponse.servicesAddedCharge,
          servicesRemovedRefund: checkinResponse.servicesRemovedRefund,
          totalCharge: checkinResponse.totalCharge,
          updatedTotalAmount: checkinResponse.updatedTotalAmount,
          paymentRequired: checkinResponse.paymentRequired,
          additionalPaymentId: checkinResponse.additionalPaymentId,
          additionalPaymentUrl: checkinResponse.additionalPaymentUrl,
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

        // Check if payment is required for additional charges
        if (
          checkinResponse.paymentRequired &&
          checkinResponse.totalCharge > 0
        ) {
          setAdditionalCost(checkinResponse.totalCharge);
          toast.info("Cần thanh toán phí phát sinh để hoàn tất check-in");
        } else {
          toast.success("Check-in thành công! Thẻ lên máy bay đã được tạo.");
        }

        setCurrentStep("success");
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

  const handleProceedToPayment = async (
    cost,
    services,
    seat,
    paymentData = null
  ) => {
    try {
      console.log("🔍 handleProceedToPayment called with:", {
        cost,
        services,
        seat,
        paymentData,
      });

      setAdditionalCost(cost);
      setSelectedServices(services);
      setSelectedSeat(seat);

      // Save data to localStorage before payment redirect (for restoration after payment)
      localStorage.setItem(
        `checkin_booking_${booking.bookingCode}`,
        JSON.stringify(booking)
      );
      localStorage.setItem(
        `checkin_seat_${booking.bookingCode}`,
        JSON.stringify(seat)
      );
      localStorage.setItem(
        `checkin_services_${booking.bookingCode}`,
        JSON.stringify(services)
      );

      // Validate cost is positive
      if (!cost || cost <= 0) {
        console.error("❌ Invalid payment amount:", cost);
        throw new Error(
          `Invalid payment amount: ${cost}. Amount must be positive.`
        );
      }

      // Store payment data for later use
      if (paymentData) {
        setBooking((prev) => ({
          ...prev,
          paymentData: paymentData,
        }));

        // Step 1 (Hidden): Update booking total first
        const updateData = {
          additionalAmount: cost,
          reason: "seat_change_and_services",
        };

        console.log(
          "📝 Step 1: Update booking total before payment:",
          updateData
        );

        const updateResponse = await bookingApi.updateBookingTotal(
          booking.bookingId || booking.id,
          updateData
        );

        if (updateResponse.success) {
          console.log(
            "✅ Step 1 completed: Booking total updated successfully"
          );
          // Store the new total for payment
          const newTotalAmount = (booking.totalAmount || 0) + cost;
          setBooking((prev) => ({
            ...prev,
            totalAmount: newTotalAmount,
            updatedTotalAmount: newTotalAmount,
          }));
        } else {
          throw new Error(
            "Failed to update booking total: " + updateResponse.message
          );
        }
      }

      setCurrentStep("success"); // Go to completion page with payment
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast.error("Có lỗi xảy ra khi chuẩn bị thanh toán: " + error.message);
    }
  };

  const handleProceedToFreeCheckIn = async (calculationData) => {
    try {
      // For free seat changes, update booking total if there's any charge, then proceed with check-in
      if (calculationData && calculationData.totalCharge > 0) {
        const updateData = {
          additionalAmount: calculationData.totalCharge,
          seatChangeCharge: calculationData.priceDifference || 0,
          servicesCharge: calculationData.servicesCharge || 0,
          description: `Seat change: ${calculationData.oldSeatNumber} → ${calculationData.newSeatNumber}`,
        };

        await bookingApi.updateBookingTotal(
          booking.bookingId || booking.id,
          updateData
        );
        console.log("📝 Booking total updated for free seat change");
      }

      // For free changes, proceed with check-in using current seat (no newSeatId)
      // This prevents the API from trying to create payment records
      await handleConfirmCheckIn(); // Pass flag to indicate free check-in
    } catch (error) {
      console.error("Error in free check-in process:", error);
      toast.error("Có lỗi xảy ra khi xử lý thay đổi ghế miễn phí");
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      console.log("✅ Payment successful:", paymentData);

      // Update booking status to show payment completed
      setBooking((prev) => ({
        ...prev,
        paymentCompleted: true,
      }));

      // After successful payment, proceed with check-in automatically
      toast.success("Thanh toán thành công! Đang tiến hành check-in...");

      // Proceed with check-in using the selected seat and services
      await proceedWithCheckinAfterPayment();

      toast.success("Check-in thành công!");
    } catch (error) {
      console.error("Error processing check-in after payment:", error);
      toast.error(
        "Thanh toán thành công nhưng có lỗi khi check-in. Vui lòng liên hệ hỗ trợ."
      );
    }
  };

  // Proceed with check-in after successful payment (using state)
  const proceedWithCheckinAfterPayment = async () => {
    try {
      const selectedPassenger = passengers[0];

      // Step 3: Check-in with new seat and services after payment success
      // If user didn't select a new seat, use their current seat ID
      let newSeatId;

      if (selectedSeat?.seatId) {
        // User selected a new seat - use the seatId
        newSeatId = selectedSeat.seatId;
      } else if (selectedPassenger.seatId) {
        // No new seat selected - use current seatId
        newSeatId = selectedPassenger.seatId;
      } else {
        // Fallback: try to find seatId from booking's seat details by seatNumber
        const currentSeatNumber = selectedPassenger.seatNumber;
        const seatDetails = booking.seatTypeDetails?.find(
          (detail) => detail.seatNumber === currentSeatNumber
        );
        newSeatId = seatDetails?.seatId;

        if (!newSeatId) {
          throw new Error(`Không tìm thấy ID ghế cho ghế ${currentSeatNumber}`);
        }
      }

      console.log("🪑 Seat ID resolution (payment flow):", {
        selectedSeat: selectedSeat,
        currentPassenger: selectedPassenger,
        resolvedSeatId: newSeatId,
      });

      const checkinData = {
        bookingCode: booking.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId: newSeatId,
        servicesToAdd: selectedServices.map((service) => ({
          serviceId: service.id || service.serviceId,
          quantity: service.quantity || 1,
        })),
      };

      console.log(
        "🚀 Step 3: Processing check-in after payment with data:",
        checkinData
      );

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {
        // Update booking with check-in response
        const checkinResponse = response.data;
        const updatedBooking = {
          ...booking,
          ...checkinResponse,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: new Date().toISOString(),
        };

        setBooking(updatedBooking);
        toast.success("Check-in hoàn tất thành công!");
      } else {
        toast.error(
          "Có lỗi xảy ra khi check-in: " +
            (response.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("Error during check-in after payment:", error);
      toast.error("Có lỗi xảy ra khi check-in sau thanh toán");
    }
  };

  // Proceed with check-in after successful payment (using provided data)
  const proceedWithCheckinAfterPaymentWithData = async (
    bookingData,
    seatData,
    servicesData
  ) => {
    try {
      const selectedPassenger = bookingData.checkinEligiblePassengers?.[0];

      if (!selectedPassenger) {
        throw new Error("Không tìm thấy thông tin hành khách để check-in");
      }

      // Step 3: Check-in with new seat and services after payment success
      // Must get proper numeric seatId, never use seatNumber string
      let newSeatId;

      if (seatData?.seatId) {
        // User selected a new seat - use the seatId
        newSeatId = seatData.seatId;
        console.log("🪑 Using selected seat ID:", newSeatId);
      } else if (selectedPassenger.seatId) {
        // No new seat selected - use current seatId
        newSeatId = selectedPassenger.seatId;
        console.log("🪑 Using current passenger seat ID:", newSeatId);
      } else {
        // Critical: Must resolve seatId from seatNumber
        const currentSeatNumber = selectedPassenger.seatNumber;
        console.log("🔍 Resolving seat ID for seatNumber:", currentSeatNumber);

        // Try to find seatId from booking's seat details
        const seatDetails = bookingData.seatTypeDetails?.find(
          (detail) => detail.seatNumber === currentSeatNumber
        );

        if (seatDetails?.seatId) {
          newSeatId = seatDetails.seatId;
          console.log("✅ Resolved seat ID from booking details:", newSeatId);
        } else {
          throw new Error(
            `Không tìm thấy ID ghế số cho ghế ${currentSeatNumber}. Vui lòng thử lại.`
          );
        }
      }

      // Validate seatId is numeric
      if (!newSeatId || typeof newSeatId === "string") {
        throw new Error(
          `Seat ID phải là số, nhận được: ${newSeatId} (type: ${typeof newSeatId})`
        );
      }

      const checkinData = {
        bookingCode: bookingData.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId: newSeatId,
        servicesToAdd: servicesData.map((service) => ({
          serviceId: service.id || service.serviceId,
          quantity: service.quantity || 1,
        })),
      };

      console.log(
        "🚀 Step 3: Processing check-in after payment with restored data:",
        checkinData
      );

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {
        // Update booking with check-in response
        const checkinResponse = response.data;
        const updatedBooking = {
          ...bookingData,
          ...checkinResponse,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: new Date().toISOString(),
        };

        setBooking(updatedBooking);
        toast.success("Check-in hoàn tất thành công!");

        // Update current step to show success page
        setCurrentStep("success");
      } else {
        toast.error(
          "Có lỗi xảy ra khi check-in: " +
            (response.message || "Lỗi không xác định")
        );
      }
    } catch (error) {
      console.error("Error during check-in after payment with data:", error);
      toast.error(
        "Có lỗi xảy ra khi check-in sau thanh toán: " + error.message
      );
    }
  };

  const handleDownloadBoardingPass = async () => {
    try {
      // Get passengerId from checkinEligiblePassengers or booking data
      const passengerId =
        booking.checkinEligiblePassengers?.[0]?.passengerId ||
        booking.passengerId;

      if (!passengerId) {
        toast.error("Không tìm thấy thông tin hành khách");
        return;
      }

      if (booking.boardingPassUrl) {
        // Download from boarding pass URL
        const fileName = `boarding-pass-${booking.bookingCode}-${passengerId}.png`;
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
          passengerId
        );
        if (response.success && response.data) {
          const fileName = `boarding-pass-${booking.bookingCode}-${passengerId}.png`;
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
    } else if (currentStep === "success") {
      setCurrentStep("seat-selection");
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
            onProceedToFreeCheckIn={handleProceedToFreeCheckIn}
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
            onBack={handleBack}
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
