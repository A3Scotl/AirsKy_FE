import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const hasExecuted = useRef(false);

  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    const handlePaymentSuccess = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentId = params.get("paymentId");
      const payerId = params.get("PayerID");
      const bookingId = params.get("bookingId");

      // Check if this payment has already been processed
      const paymentKey = `payment_processed_${paymentId}_${bookingId}`;
      const processingKey = `processing_payment_${paymentId}_${bookingId}`;
      const alreadyProcessed = localStorage.getItem(paymentKey);
      const currentlyProcessing = localStorage.getItem(processingKey);

      if (alreadyProcessed || currentlyProcessing) {
        console.log("💡 Payment already processed or in progress:", {
          paymentKey,
          alreadyProcessed: !!alreadyProcessed,
          currentlyProcessing: !!currentlyProcessing,
        });
        setStatus("success");
        setMessage("Thanh toán đã được xử lý thành công!");

        // Still redirect to appropriate page
        // Check if this is from booking payment flow (normal booking from payment-section)
        const bookingPaymentInfo = localStorage.getItem("booking_payment_info");
        let isBookingPayment = false;
        let bookingPaymentBookingCode = null;

        if (bookingPaymentInfo) {
          try {
            const paymentInfo = JSON.parse(bookingPaymentInfo);
            isBookingPayment = paymentInfo.isBookingPayment;
            bookingPaymentBookingCode = paymentInfo.bookingCode;
          } catch (error) {
            console.error("Error parsing booking payment info:", error);
          }
        }

        const checkinPaymentInfo = localStorage.getItem("checkin_payment_info");
        let isCheckinPayment = false;
        let bookingCode = null;

        if (checkinPaymentInfo) {
          try {
            const paymentInfo = JSON.parse(checkinPaymentInfo);
            isCheckinPayment = paymentInfo.isCheckinPayment;
            bookingCode = paymentInfo.bookingCode;
          } catch (error) {
            console.error("Error parsing checkin payment info:", error);
          }
        }

        // Check my-flights payment info
        const myFlightsPaymentInfo = localStorage.getItem(
          "my_flights_payment_info"
        );
        let isMyFlightsPayment = false;
        let myFlightsBookingCode = null;

        if (myFlightsPaymentInfo) {
          try {
            const paymentInfo = JSON.parse(myFlightsPaymentInfo);
            isMyFlightsPayment = paymentInfo.isMyFlightsPayment;
            myFlightsBookingCode = paymentInfo.bookingCode;
          } catch (error) {
            console.error("Error parsing my flights payment info:", error);
          }
        }

        // Priority: booking payment > checkin payment > my-flights payment
        if (isBookingPayment && bookingPaymentBookingCode) {
          setTimeout(() => navigate("/confirm-booking"), 2500);
        } else if (isCheckinPayment && bookingCode) {
          setTimeout(
            () =>
              navigate(
                `/check-in?bookingCode=${bookingCode}&paymentSuccess=true`
              ),
            2500
          );
        } else if (isMyFlightsPayment && myFlightsBookingCode) {
          setTimeout(
            () =>
              navigate("/my-flights", {
                state: {
                  bookingCode: myFlightsBookingCode,
                  paymentSuccess: true,
                  message:
                    "Thanh toán thành công! Đặt chỗ của bạn đã được xác nhận.",
                },
              }),
            2500
          );
        } else {
          setTimeout(() => navigate("/confirm-booking"), 2500);
        }
        return;
      }

      // Mark payment as being processed (set processing flag first, then processed flag)
      localStorage.setItem(processingKey, Date.now().toString());
      localStorage.setItem(paymentKey, Date.now().toString());

      // Check if this is from check-in payment flow (stored in localStorage)
      const checkinPaymentInfo = localStorage.getItem("checkin_payment_info");
      let isCheckinPayment = false;
      let bookingCode = null;

      if (checkinPaymentInfo) {
        try {
          const paymentInfo = JSON.parse(checkinPaymentInfo);
          isCheckinPayment = paymentInfo.isCheckinPayment;
          bookingCode = paymentInfo.bookingCode;
          // Clean up after use
          localStorage.removeItem("checkin_payment_info");
        } catch (error) {
          console.error("Error parsing checkin payment info:", error);
        }
      }

      // Check if this is from my-flights payment flow
      const myFlightsPaymentInfo = localStorage.getItem(
        "my_flights_payment_info"
      );
      let isMyFlightsPayment = false;
      let myFlightsBookingCode = null;

      if (myFlightsPaymentInfo) {
        try {
          const paymentInfo = JSON.parse(myFlightsPaymentInfo);
          isMyFlightsPayment = paymentInfo.isMyFlightsPayment;
          myFlightsBookingCode = paymentInfo.bookingCode;
          // Clean up after use
          localStorage.removeItem("my_flights_payment_info");
        } catch (error) {
          console.error("Error parsing my flights payment info:", error);
        }
      }

      if (!paymentId || !payerId || !bookingId) {
        setStatus("error");
        setMessage("Thiếu thông tin thanh toán. Vui lòng kiểm tra lại.");
        return;
      }

      try {
        console.log("💳 Calling /payments/success API with:", {
          paymentId,
          PayerID: payerId,
          bookingId,
        });

        const response = await axios.get(
          `http://localhost:8080/api/v1/payments/success`,
          { params: { paymentId, PayerID: payerId, bookingId } }
        );

        console.log("💳 /payments/success API response:", response.data);

        if (response.data?.success) {
          setStatus("success");
          setMessage("Thanh toán thành công!");
          toast.success("Thanh toán thành công!");

          // Clean up processing flag after successful payment
          localStorage.removeItem(processingKey);
          console.log("🧹 Cleaned up processing flag:", processingKey);

          // Check if this is from booking payment flow (stored in localStorage)
          const bookingPaymentInfo = localStorage.getItem(
            "booking_payment_info"
          );
          let isBookingPayment = false;
          let bookingPaymentBookingCode = null;

          if (bookingPaymentInfo) {
            try {
              const paymentInfo = JSON.parse(bookingPaymentInfo);
              isBookingPayment = paymentInfo.isBookingPayment;
              bookingPaymentBookingCode = paymentInfo.bookingCode;
              // Clean up after use
              localStorage.removeItem("booking_payment_info");
            } catch (error) {
              console.error("Error parsing booking payment info:", error);
            }
          }

          // Priority: booking payment > checkin payment > my-flights payment
          if (isBookingPayment && bookingPaymentBookingCode) {
            console.log("🔄 Redirecting to confirm booking (booking payment)");
            // Booking payment - go to confirm booking
            setTimeout(() => navigate("/confirm-booking"), 2500);
          } else if (isCheckinPayment && bookingCode) {
            console.log(
              "🔄 Redirecting back to check-in page for booking:",
              bookingCode
            );
            // Redirect back to check-in page to continue with check-in process
            setTimeout(
              () =>
                navigate(
                  `/check-in?bookingCode=${bookingCode}&paymentSuccess=true`
                ),
              2500
            );
          } else if (isMyFlightsPayment && myFlightsBookingCode) {
            console.log(
              "🔄 Redirecting back to my-flights success page for booking:",
              myFlightsBookingCode
            );
            // Redirect back to my-flights page with success state
            setTimeout(
              () =>
                navigate("/my-flights", {
                  state: {
                    bookingCode: myFlightsBookingCode,
                    paymentSuccess: true,
                    message:
                      "Thanh toán thành công! Đặt chỗ của bạn đã được xác nhận.",
                  },
                }),
              2500
            );
          } else {
            console.log(
              "🔄 Redirecting to confirm booking (fallback - normal booking payment)"
            );
            // Fallback - assume normal booking payment
            setTimeout(() => navigate("/confirm-booking"), 2500);
          }
        } else {
          throw new Error(response.data?.message || "Lỗi cập nhật thanh toán");
        }
      } catch (error) {
        console.error("Payment success handling error:", error);
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Có lỗi xảy ra khi xác nhận thanh toán."
        );
        toast.error("Thanh toán thất bại!");

        // Clean up processing flag after error
        localStorage.removeItem(processingKey);
        console.log(
          "🧹 Cleaned up processing flag after error:",
          processingKey
        );
      }
    };

    handlePaymentSuccess();
  }, []); // ✅ Không có dependency
  // ↑ Không thêm navigate, không thêm toast — để React không trigger lại

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-6">
      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Đang xử lý thanh toán, vui lòng chờ...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-semibold text-green-700">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600 mt-2">{message}</p>
          <button
            onClick={() => {
              // Check localStorage for checkin payment info
              const checkinPaymentInfo = localStorage.getItem(
                "checkin_payment_info_backup"
              );
              let isCheckinPayment = false;
              let bookingCode = null;

              if (checkinPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(checkinPaymentInfo);
                  isCheckinPayment = paymentInfo.isCheckinPayment;
                  bookingCode = paymentInfo.bookingCode;
                } catch (error) {
                  console.error("Error parsing checkin payment info:", error);
                }
              }

              // Check my-flights payment info
              const myFlightsPaymentInfo = localStorage.getItem(
                "my_flights_payment_info_backup"
              );
              let isMyFlightsPayment = false;
              let myFlightsBookingCode = null;

              if (myFlightsPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(myFlightsPaymentInfo);
                  isMyFlightsPayment = paymentInfo.isMyFlightsPayment;
                  myFlightsBookingCode = paymentInfo.bookingCode;
                } catch (error) {
                  console.error(
                    "Error parsing my flights payment info:",
                    error
                  );
                }
              }

              if (isCheckinPayment && bookingCode) {
                navigate(
                  `/check-in?bookingCode=${bookingCode}&paymentSuccess=true`
                );
              } else if (isMyFlightsPayment && myFlightsBookingCode) {
                navigate("/my-flights", {
                  state: {
                    bookingCode: myFlightsBookingCode,
                    paymentSuccess: true,
                    message:
                      "Thanh toán thành công! Đặt chỗ của bạn đã được xác nhận.",
                  },
                });
              } else {
                navigate("/confirm-booking");
              }
            }}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {(() => {
              const checkinPaymentInfo = localStorage.getItem(
                "checkin_payment_info_backup"
              );
              let isCheckinPayment = false;

              if (checkinPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(checkinPaymentInfo);
                  isCheckinPayment = paymentInfo.isCheckinPayment;
                } catch (error) {
                  console.error("Error parsing checkin payment info:", error);
                }
              }

              const myFlightsPaymentInfo = localStorage.getItem(
                "my_flights_payment_info_backup"
              );
              let isMyFlightsPayment = false;

              if (myFlightsPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(myFlightsPaymentInfo);
                  isMyFlightsPayment = paymentInfo.isMyFlightsPayment;
                } catch (error) {
                  console.error(
                    "Error parsing my flights payment info:",
                    error
                  );
                }
              }

              if (isCheckinPayment) {
                return "Tiếp tục check-in";
              } else if (isMyFlightsPayment) {
                return "Xem chi tiết đặt chỗ";
              } else {
                return "Xem chi tiết đặt chỗ";
              }
            })()}
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold text-red-700">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-600 mt-2">{message}</p>
          <button
            onClick={() => {
              // Check localStorage for checkin payment info
              const checkinPaymentInfo = localStorage.getItem(
                "checkin_payment_info_backup"
              );
              let isCheckinPayment = false;
              let bookingCode = null;

              if (checkinPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(checkinPaymentInfo);
                  isCheckinPayment = paymentInfo.isCheckinPayment;
                  bookingCode = paymentInfo.bookingCode;
                } catch (error) {
                  console.error("Error parsing checkin payment info:", error);
                }
              }

              if (isCheckinPayment && bookingCode) {
                navigate(
                  `/check-in?bookingCode=${bookingCode}&paymentError=true`
                );
              } else {
                navigate("/confirm-booking");
              }
            }}
            className="mt-6 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Quay lại
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
