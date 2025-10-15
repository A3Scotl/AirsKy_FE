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

      if (!paymentId || !payerId || !bookingId) {
        setStatus("error");
        setMessage("Thiếu thông tin thanh toán. Vui lòng kiểm tra lại.");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8080/api/v1/payments/success`,
          { params: { paymentId, PayerID: payerId, bookingId } }
        );

        if (response.data?.success) {
          setStatus("success");
          setMessage("Thanh toán thành công!");
          toast.success("Thanh toán thành công!");

          // Check if this is from check-in payment flow
          if (isCheckinPayment && bookingCode) {
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
          } else {
            console.log(
              "🔄 Redirecting to confirm booking (normal booking payment)"
            );
            // Normal booking payment - go to confirm booking
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

              if (isCheckinPayment && bookingCode) {
                navigate(
                  `/check-in?bookingCode=${bookingCode}&paymentSuccess=true`
                );
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

              return isCheckinPayment
                ? "Tiếp tục check-in"
                : "Xem chi tiết đặt chỗ";
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
