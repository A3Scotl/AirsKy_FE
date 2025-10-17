import React, { useState, useEffect, useRef } from "react";
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
  const [fromPaymentSuccess, setFromPaymentSuccess] = useState(false);

  // Initialize hasUpdatedTotal from localStorage
  const bookingCodeFromUrl = new URLSearchParams(window.location.search).get(
    "bookingCode"
  );
  const [hasUpdatedTotal, setHasUpdatedTotal] = useState(() => {
    if (bookingCodeFromUrl) {
      const savedState = localStorage.getItem(
        `checkin_updated_total_${bookingCodeFromUrl}`
      );
      return savedState === "true";
    }
    return false;
  });

  // Create session ref properly
  const updateSessionRef = useRef(null);

  // Initialize session on mount - always create if not exists
  useEffect(() => {
    if (!updateSessionRef.current) {
      // Try to get from localStorage first
      let sessionId = null;
      if (bookingCodeFromUrl) {
        sessionId = localStorage.getItem(
          `checkin_session_${bookingCodeFromUrl}`
        );
      }

      if (!sessionId) {
        // Create new session if not found
        const newSession = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        updateSessionRef.current = newSession;
        console.log("🆔 Created new update session:", newSession);

        // Save to localStorage if we have booking code
        if (bookingCodeFromUrl) {
          localStorage.setItem(
            `checkin_session_${bookingCodeFromUrl}`,
            newSession
          );
        }
      } else {
        updateSessionRef.current = sessionId;
        console.log("🔄 Restored update session:", sessionId);
      }
    }
  }, []); // Run once on mount

  const processedPaymentRef = useRef(new Set());
  const paymentSuccessProcessedRef = useRef(new Set());
  const [isProcessingPaymentSuccess, setIsProcessingPaymentSuccess] =
    useState(false);

  // Save hasUpdatedTotal to localStorage when it changes
  useEffect(() => {
    if (bookingCodeFromUrl) {
      if (hasUpdatedTotal) {
        localStorage.setItem(
          `checkin_updated_total_${bookingCodeFromUrl}`,
          "true"
        );
      } else {
        localStorage.removeItem(`checkin_updated_total_${bookingCodeFromUrl}`);
      }
    }
  }, [hasUpdatedTotal, bookingCodeFromUrl]);

  // Handle return from payment
  useEffect(() => {
    const bookingCode = searchParams.get("bookingCode");
    const paymentSuccess = searchParams.get("paymentSuccess");
    const paymentError = searchParams.get("paymentError");

    if (!bookingCode) return;

    if (paymentSuccess) {
      console.log(
        "💰 Processing payment success for booking code:",
        bookingCode
      );

      if (paymentSuccessProcessedRef.current.has(bookingCode)) {
        console.log(
          "⏭️ Payment success already processed for booking:",
          bookingCode
        );
        return;
      }

      paymentSuccessProcessedRef.current.add(bookingCode);
      setIsProcessingPaymentSuccess(true);
      setHasUpdatedTotal(true);

      toast.success("Thanh toán thành công! Đang tiến hành check-in...");

      const processPaymentSuccess = async () => {
        try {
          console.log(
            "🔍 Looking for saved booking data with key:",
            `checkin_booking_${bookingCode}`
          );

          let savedBookingData = localStorage.getItem(
            `checkin_booking_${bookingCode}`
          );

          // If not found with current booking code, try to find any recent checkin booking data
          if (!savedBookingData) {
            console.warn(
              "⚠️ Booking data not found for:",
              bookingCode,
              "- searching for alternative data"
            );
            const keys = Object.keys(localStorage).filter((key) =>
              key.startsWith("checkin_booking_")
            );
            for (const key of keys) {
              const data = localStorage.getItem(key);
              if (data) {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.bookingCode === bookingCode) {
                    savedBookingData = data;
                    console.log(
                      "✅ Found booking data with matching booking code:",
                      key
                    );
                    break;
                  }
                } catch (e) {
                  // ignore parse errors
                }
              }
            }
          }

          if (!savedBookingData) {
            throw new Error(
              `Không tìm thấy dữ liệu booking đã lưu cho mã: ${bookingCode}`
            );
          }

          const bookingData = JSON.parse(savedBookingData);
          const savedSeatData = localStorage.getItem(
            `checkin_seat_${bookingCode}`
          );
          const savedServicesData = localStorage.getItem(
            `checkin_services_${bookingCode}`
          );
          const seatData = savedSeatData ? JSON.parse(savedSeatData) : null;
          const servicesData = savedServicesData
            ? JSON.parse(savedServicesData)
            : [];

          // Fetch latest booking data
          const latestBookingResponse =
            await checkinApi.lookupBookingForCheckin(
              bookingData.bookingCode,
              bookingData.checkinEligiblePassengers?.[0]?.fullName ||
                bookingData.passengers?.[0]?.fullName
            );

          let updatedBookingData;
          if (latestBookingResponse.success && latestBookingResponse.data) {
            updatedBookingData = {
              ...latestBookingResponse.data,
              paymentData: bookingData.paymentData,
            };
            console.log("📊 Latest booking data after payment:", {
              bookingCode: updatedBookingData.bookingCode,
              paymentStatus: updatedBookingData.status,
              checkinStatus:
                updatedBookingData.checkinEligiblePassengers?.[0]
                  ?.checkinStatus,
            });

            // Check if payment is still pending - if so, we need to wait or confirm payment
            if (updatedBookingData.status === "PAYMENT_PENDING") {
              console.warn(
                "⚠️ Payment still pending after payment success, waiting for backend sync..."
              );

              // Wait a bit and try to fetch again
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const retryResponse = await checkinApi.lookupBookingForCheckin(
                bookingData.bookingCode,
                bookingData.checkinEligiblePassengers?.[0]?.fullName ||
                  bookingData.passengers?.[0]?.fullName
              );

              if (retryResponse.success && retryResponse.data) {
                updatedBookingData = {
                  ...retryResponse.data,
                  paymentData: bookingData.paymentData,
                };
                console.log("🔄 Retried booking lookup:", {
                  bookingCode: updatedBookingData.bookingCode,
                  paymentStatus: updatedBookingData.status,
                });
              }

              // If still pending, force it to CONFIRMED for check-in purposes
              if (updatedBookingData.status === "PAYMENT_PENDING") {
                console.warn(
                  "⚠️ Force updating payment status to CONFIRMED for check-in"
                );
                updatedBookingData.status = "CONFIRMED";
              }
            }
          } else {
            updatedBookingData = bookingData;
          }

          setCurrentStep("success");
          setBooking(updatedBookingData);
          setPassengers(updatedBookingData.checkinEligiblePassengers || []);
          setSelectedSeat(seatData);
          setSelectedServices(servicesData);

          // Proceed with check-in after a short delay
          setTimeout(() => {
            proceedWithCheckinAfterPaymentWithData(
              updatedBookingData,
              seatData,
              servicesData
            );
          }, 1000);

          // Cleanup localStorage
          cleanupLocalStorage(bookingCode);
        } catch (error) {
          console.error("Error processing payment success:", error);
          toast.error("Có lỗi khi khôi phục dữ liệu. Vui lòng thử lại.");
        } finally {
          setTimeout(() => {
            paymentSuccessProcessedRef.current.delete(bookingCode);
            setIsProcessingPaymentSuccess(false);
          }, 5000);
        }
      };

      processPaymentSuccess();
    } else if (paymentError) {
      toast.error("Thanh toán thất bại. Vui lòng thử lại.");
    }
  }, [searchParams]);

  // Cleanup function
  const cleanupLocalStorage = (bookingCode) => {
    const keysToRemove = [
      `checkin_booking_${bookingCode}`,
      `checkin_seat_${bookingCode}`,
      `checkin_services_${bookingCode}`,
      `checkin_updated_total_${bookingCode}`,
      `checkin_session_${bookingCode}`,
      `checkin_update_session_${bookingCode}`,
    ];

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Cleanup payment related keys
    Object.keys(localStorage).forEach((key) => {
      if (
        key.includes(`_${bookingCode}`) &&
        (key.startsWith("payment_processed_") || key.startsWith("qr_payment_"))
      ) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleShowTerms = () => {
    setShowTermsModal(true);
  };

  const handleSearchBooking = async (searchData) => {
    setIsLoading(true);
    setError("");

    // Only reset hasUpdatedTotal if this is NOT a redirect from payment success
    // and if it's a different booking code than current one
    const currentUrlParams = new URLSearchParams(window.location.search);
    const isFromPaymentSuccess = currentUrlParams.get("paymentSuccess");
    const currentBookingCode = booking?.bookingCode;

    if (
      !isFromPaymentSuccess &&
      searchData.bookingCode !== currentBookingCode
    ) {
      setHasUpdatedTotal(false);
      setFromPaymentSuccess(false); // Reset payment success flag
    }

    processedPaymentRef.current.clear();
    paymentSuccessProcessedRef.current.clear();

    try {
      const response = await checkinApi.lookupBookingForCheckin(
        searchData.bookingCode.trim(),
        searchData.passengerName.trim()
      );

      if (
        response.message?.includes(
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

        if (!bookingData.checkinEligiblePassengers?.length) {
          setError(
            "Không tìm thấy hành khách đủ điều kiện check-in với thông tin đã nhập."
          );
          toast.error("Không tìm thấy hành khách đủ điều kiện check-in");
          return;
        }

        const firstPassenger = bookingData.checkinEligiblePassengers[0];

        if (firstPassenger.checkinStatus === "NOT_AVAILABLE") {
          const errorMessage =
            "Bạn chưa được phép checkin lúc này. Hãy chú ý giờ khởi hành từ đơn đặt của bạn và thử lại sau.";
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }

        setBooking(bookingData);
        setPassengers(bookingData.checkinEligiblePassengers);

        switch (firstPassenger.checkinStatus) {
          case "ALREADY_CHECKED_IN":
          case true: // checkedIn boolean
            setCurrentStep("already-done");
            toast.info("Hành khách đã check-in trước đó");
            break;
          case "PAYMENT_PENDING":
            setError(
              "Vé chưa được thanh toán. Vui lòng thanh toán trước khi check-in."
            );
            toast.error("Vé chưa được thanh toán");
            break;
          case "ELIGIBLE":
            setCurrentStep("details");
            toast.success("Tìm thấy hành khách đủ điều kiện check-in");
            break;
          default:
            setError("Trạng thái check-in không hợp lệ.");
            toast.error("Trạng thái check-in không hợp lệ");
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

  const resolveSeatId = (bookingData, seatData, passenger) => {
    if (seatData?.seatId) {
      return seatData.seatId;
    }

    if (passenger?.seatId) {
      return passenger.seatId;
    }

    const currentSeatNumber = passenger?.seatNumber;
    if (!currentSeatNumber) {
      throw new Error("Không tìm thấy thông tin ghế");
    }

    const seatDetails = bookingData.seatTypeDetails?.find(
      (detail) => detail.seatNumber === currentSeatNumber
    );

    if (!seatDetails?.seatId) {
      throw new Error(`Không tìm thấy ID ghế cho ghế ${currentSeatNumber}`);
    }

    return seatDetails.seatId;
  };

  const handleConfirmCheckIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const selectedPassenger = passengers[0];
      const newSeatId = resolveSeatId(booking, selectedSeat, selectedPassenger);

      if (typeof newSeatId === "string" || !newSeatId) {
        throw new Error(`Seat ID không hợp lệ: ${newSeatId}`);
      }

      const checkinData = {
        bookingCode: booking.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId: newSeatId,
      };

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {
        const checkinResponse = response.data;
        const updatedBooking = {
          ...booking,
          ...checkinResponse,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: new Date().toISOString(),
        };

        setBooking(updatedBooking);

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
        throw new Error(response.message || "Có lỗi xảy ra khi check-in.");
      }
    } catch (err) {
      console.error("Error during check-in:", err);
      const errorMessage =
        err.message || "Có lỗi xảy ra khi check-in. Vui lòng thử lại.";
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
      setHasUpdatedTotal(false);
      setAdditionalCost(cost);
      setSelectedServices(services);
      setSelectedSeat(seat);

      // Save to localStorage
      if (booking?.bookingCode) {
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
      }

      if (cost <= 0) {
        throw new Error("Số tiền thanh toán không hợp lệ");
      }

      // Update booking total if needed
      // Don't update if payment was already processed successfully
      const currentUrlParams = new URLSearchParams(window.location.search);
      const isFromPaymentSuccess = currentUrlParams.get("paymentSuccess");

      console.log("🔍 Checking update conditions:", {
        hasPaymentData: !!paymentData,
        hasUpdatedTotal,
        isProcessingPaymentSuccess,
        paymentAlreadyProcessed: processedPaymentRef.current.has(
          booking.bookingCode
        ),
        isFromPaymentSuccess: !!isFromPaymentSuccess,
        bookingCode: booking.bookingCode,
      });

      if (
        paymentData &&
        !hasUpdatedTotal &&
        !isProcessingPaymentSuccess &&
        !processedPaymentRef.current.has(booking.bookingCode) &&
        !isFromPaymentSuccess
      ) {
        const sessionId = updateSessionRef.current;
        const updateKey = `checkin_update_session_${booking.bookingCode}`;

        if (!localStorage.getItem(updateKey)) {
          localStorage.setItem(updateKey, sessionId);

          const updateData = {
            additionalAmount: cost,
            reason: "seat_change_and_services",
          };

          console.log("💰 Calling updateBookingTotal API:", {
            bookingId: booking.bookingId || booking.id,
            updateData,
            sessionId,
            bookingCode: booking.bookingCode,
          });

          const updateResponse = await bookingApi.updateBookingTotal(
            booking.bookingId || booking.id,
            updateData
          );

          if (updateResponse.success) {
            setHasUpdatedTotal(true);
            console.log("✅ updateBookingTotal successful:", {
              bookingCode: booking.bookingCode,
              additionalAmount: cost,
              newTotal: updateResponse.data?.totalAmount,
            });
          } else {
            console.error("❌ updateBookingTotal failed:", updateResponse);
            throw new Error(updateResponse.message);
          }
        }
      }

      setCurrentStep("success");
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast.error("Có lỗi xảy ra khi chuẩn bị thanh toán: " + error.message);
    }
  };

  const proceedWithCheckinAfterPaymentWithData = async (
    bookingData,
    seatData,
    servicesData
  ) => {
    try {
      console.log("🎫 Starting auto check-in after payment with data:", {
        bookingCode: bookingData.bookingCode,
        seatData,
        servicesData,
      });

      const selectedPassenger = bookingData.checkinEligiblePassengers?.[0];
      if (!selectedPassenger) {
        throw new Error("Không tìm thấy thông tin hành khách");
      }

      const newSeatId = resolveSeatId(bookingData, seatData, selectedPassenger);

      const checkinData = {
        bookingCode: bookingData.bookingCode,
        passengerId: selectedPassenger.passengerId,
        newSeatId,
        servicesToAdd: servicesData.map((service) => ({
          serviceId: service.id || service.serviceId,
          quantity: service.quantity || 1,
        })),
      };

      console.log("📝 Submitting check-in data:", checkinData);

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {
        console.log("✅ Auto check-in successful:", response.data);

        // Check-in is now complete after payment - no additional payment required
        const updatedBooking = {
          ...bookingData,
          ...response.data,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: new Date().toISOString(),
          boardingPassUrl: response.data.boardingPassUrl,
        };

        setBooking(updatedBooking);
        setCurrentStep("success");
        toast.success("Check-in hoàn tất thành công!");
      } else {
        console.warn("⚠️ Auto check-in failed:", response);
        throw new Error(response.message || "Lỗi check-in");
      }
    } catch (error) {
      console.error("❌ Auto check-in failed:", error);

      // If auto check-in fails, redirect to completion page for manual check-in
      console.log("🔄 Redirecting to completion page for manual check-in");

      toast.info("Vui lòng hoàn tất check-in thủ công");

      // Set data for manual check-in
      setBooking(bookingData);
      setSelectedSeat(seatData);
      setSelectedServices(servicesData);
      setFromPaymentSuccess(true);
      setCurrentStep("completion");

      // Don't show error toast for auto check-in failure, just redirect
    }
  };

  // ... rest of the functions remain the same (handleDownloadBoardingPass, handleEmailBoardingPass, etc.)

  const handleBack = () => {
    switch (currentStep) {
      case "details":
        setCurrentStep("search");
        break;
      case "seat-selection":
        setCurrentStep("details");
        break;
      case "success":
        setCurrentStep("seat-selection");
        break;
    }
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
            isProcessingPaymentSuccess={isProcessingPaymentSuccess}
          />
        );
      case "success":
      case "already-done":
        return (
          <CheckInCompletion
            booking={booking}
            onNewCheckIn={() => {
              setBooking(null);
              setPassengers([]);
              setSelectedSeat(null);
              setError("");
              setCurrentStep("search");
            }}
            isAlreadyCheckedIn={currentStep === "already-done"}
            additionalCost={additionalCost}
            selectedServices={selectedServices}
            selectedSeat={selectedSeat}
            fromPaymentSuccess={fromPaymentSuccess}
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
