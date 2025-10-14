import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MyFlightsSearchForm from "@/components/my-flights/my-flights-search-form";
import MyFlightsBookingDetails from "@/components/my-flights/my-flights-booking-details";
import MyFlightsSuccess from "@/components/my-flights/my-flights-success";
import { bookingApi } from "@/apis/booking-api";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";

export default function MyFlightsPage() {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState("search"); // search, details, success
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoSearched, setAutoSearched] = useState(false);

  // Handle automatic search when coming from "Pay Later" booking
  useEffect(() => {
    const state = location.state;

    if (state && state.shouldSearch && state.bookingCode && !autoSearched) {
      // Show success message from booking
      if (state.message) {
        toast.success(state.message, { duration: 5000 });
      }

      setAutoSearched(true);

      // For Pay Later bookings, show guidance message instead of auto-searching
      if (state.paymentPending) {
        toast.info(
          "Nhập mã đặt chỗ và tên để tiến hành thanh toán trong vòng 1 giờ.",
          { duration: 8000 }
        );
      }
    }
  }, [location.state, autoSearched]);

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
    setCurrentStep("success");
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
    const state = location.state;

    switch (currentStep) {
      case "search":
        return (
          <div className="w-full space-y-4">
            {/* Show success message for Pay Later bookings */}
            {state?.paymentPending && state?.bookingCode && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800">
                        🎉 Đặt chỗ thành công!
                      </p>
                      <p className="text-sm text-green-700">
                        Mã đặt chỗ: <strong>{state.bookingCode}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-orange-700">
                      Bạn có <strong>1 giờ</strong> để hoàn tất thanh toán
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <MyFlightsSearchForm
              onSearch={handleSearchBooking}
              isLoading={isLoading}
              error={error}
              initialBookingCode={state?.bookingCode || ""}
            />
          </div>
        );

      case "details":
        return (
          <MyFlightsBookingDetails
            booking={booking}
            onProceed={handleProceedToPayment}
            onBack={handleBack}
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
