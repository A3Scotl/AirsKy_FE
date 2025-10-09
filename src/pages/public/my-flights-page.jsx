import React, { useState } from "react";
import MyFlightsSearchForm from "@/components/my-flights/my-flights-search-form";
import MyFlightsBookingDetails from "@/components/my-flights/my-flights-booking-details";
import MyFlightsPayment from "@/components/my-flights/my-flights-payment";
import MyFlightsSuccess from "@/components/my-flights/my-flights-success";
import { bookingApi } from "@/apis/booking-api";
import { toast } from "sonner";

export default function MyFlightsPage() {
  const [currentStep, setCurrentStep] = useState("search"); // search, details, payment, success
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearchBooking = async (searchData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await bookingApi.lookupBooking(
        searchData.bookingCode.trim(),
        searchData.passengerName.trim()
      );

      if (response.success && response.data) {
        setBooking(response.data);
        setCurrentStep("details");
      } else {
        const errorMessage =
          response.message ||
          "Không tìm thấy đặt chỗ với thông tin đã nhập. Vui lòng kiểm tra lại.";
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

  const handleProceedToPayment = () => {
    setCurrentStep("payment");
  };

  const handlePaymentSuccess = async (paymentData) => {
    setIsLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update booking with payment info
      const updatedBooking = {
        ...booking,
        payment: {
          paymentId: Date.now(),
          amount: booking.totalAmount,
          paymentMethod: paymentData.paymentMethod,
          status: "COMPLETED",
          paymentDate: new Date().toISOString(),
          transactionId: `TXN_${Date.now()}`,
          ...paymentData,
        },
      };

      setBooking(updatedBooking);
      setCurrentStep("success");
    } catch (err) {
      setError("Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSearch = () => {
    setBooking(null);
    setError("");
    setCurrentStep("search");
  };

  const handleBack = () => {
    if (currentStep === "details") {
      setCurrentStep("search");
    } else if (currentStep === "payment") {
      setCurrentStep("details");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "search":
        return (
          <MyFlightsSearchForm
            onSearch={handleSearchBooking}
            isLoading={isLoading}
            error={error}
          />
        );

      case "details":
        return (
          <MyFlightsBookingDetails
            booking={booking}
            onProceed={handleProceedToPayment}
            onBack={handleBack}
          />
        );

      case "payment":
        return (
          <MyFlightsPayment
            booking={booking}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );

      case "success":
        return (
          <MyFlightsSuccess booking={booking} onNewSearch={handleNewSearch} />
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
    </div>
  );
}
