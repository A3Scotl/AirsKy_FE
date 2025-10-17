import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function QRPay() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from URL parameters or state
  const urlParams = new URLSearchParams(location.search);
  const bookingCode =
    urlParams.get("bookingCode") || location.state?.bookingCode;
  const approvalUrl =
    urlParams.get("approvalUrl") || location.state?.approvalUrl;
  const isCheckinPayment = urlParams.get("isCheckinPayment") === "true";
  const [status, setStatus] = useState("waiting");

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!bookingCode) return;

    // Check if QR payment for this booking already succeeded or is being processed
    const qrPaymentKey = `qr_payment_success_${bookingCode}`;
    const qrProcessingKey = `qr_payment_processing_${bookingCode}`;
    const alreadySucceeded = localStorage.getItem(qrPaymentKey);
    const currentlyProcessing = localStorage.getItem(qrProcessingKey);

    if (alreadySucceeded || currentlyProcessing) {
      console.log("💡 QR Payment already succeeded or in progress:", {
        bookingCode,
        alreadySucceeded: !!alreadySucceeded,
        currentlyProcessing: !!currentlyProcessing,
      });
      setStatus("success");
      toast.success("Thanh toán đã thành công!");
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        console.log("🏦 Checking QR payment status for booking:", bookingCode);

        const response = await axios.get(
          `http://localhost:8080/api/v1/payments/sepay/check/${bookingCode}`
        );

        console.log("🏦 QR payment check response:", response.data);

        if (response.data?.success) {
          // Mark QR payment as being processed and succeeded
          const qrPaymentKey = `qr_payment_success_${bookingCode}`;
          const qrProcessingKey = `qr_payment_processing_${bookingCode}`;
          localStorage.setItem(qrProcessingKey, Date.now().toString());
          localStorage.setItem(qrPaymentKey, Date.now().toString());
          console.log("🧹 Set QR payment flags:", {
            qrPaymentKey,
            qrProcessingKey,
          });

          setStatus("success");
          toast.success("Thanh toán thành công!");

          clearInterval(pollingRef.current);

          // Check if this is from check-in payment flow (use localStorage if URL param is not available)
          let isCheckinFlow = isCheckinPayment;
          let bookingCodeForRedirect = bookingCode;

          if (!isCheckinFlow) {
            const checkinPaymentInfo = localStorage.getItem(
              "checkin_payment_info"
            );
            if (checkinPaymentInfo) {
              try {
                const paymentInfo = JSON.parse(checkinPaymentInfo);
                isCheckinFlow = paymentInfo.isCheckinPayment;
                bookingCodeForRedirect = paymentInfo.bookingCode;
              } catch (error) {
                console.error("Error parsing checkin payment info:", error);
              }
            }
          }

          // Check if this is from my-flights payment flow
          let isMyFlightsFlow = false;
          let myFlightsBookingCodeForRedirect = bookingCode;

          if (!isMyFlightsFlow) {
            const myFlightsPaymentInfo = localStorage.getItem(
              "my_flights_payment_info"
            );
            if (myFlightsPaymentInfo) {
              try {
                const paymentInfo = JSON.parse(myFlightsPaymentInfo);
                isMyFlightsFlow = paymentInfo.isMyFlightsPayment;
                myFlightsBookingCodeForRedirect = paymentInfo.bookingCode;
              } catch (error) {
                console.error("Error parsing my flights payment info:", error);
              }
            }
          }

          if (isCheckinFlow && bookingCodeForRedirect) {
            console.log(
              "🔄 QR Payment success - redirecting to check-in for booking:",
              bookingCodeForRedirect
            );
            setTimeout(
              () =>
                navigate(
                  `/check-in?bookingCode=${bookingCodeForRedirect}&paymentSuccess=true`
                ),
              3000
            );
          } else if (isMyFlightsFlow && myFlightsBookingCodeForRedirect) {
            console.log(
              "🔄 QR Payment success - redirecting to my-flights success for booking:",
              myFlightsBookingCodeForRedirect
            );
            setTimeout(
              () =>
                navigate("/my-flights", {
                  state: {
                    bookingCode: myFlightsBookingCodeForRedirect,
                    paymentSuccess: true,
                    message:
                      "Thanh toán thành công! Đặt chỗ của bạn đã được xác nhận.",
                  },
                }),
              3000
            );
          } else {
            console.log(
              "🔄 QR Payment success - redirecting to confirm booking"
            );
            setTimeout(() => navigate("/confirm-booking"), 3000); // Auto redirect after 3 seconds
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra thanh toán:", error);
        // Optional: setStatus("error");
      }
    };

    // Gọi ngay lần đầu
    checkPaymentStatus();

    // Sau đó gọi mỗi 3 giây
    pollingRef.current = setInterval(checkPaymentStatus, 3000);

    // Cleanup khi component unmount
    return () => {
      clearInterval(pollingRef.current);
      // Clean up processing flag when component unmounts (optional cleanup)
      const qrProcessingKey = `qr_payment_processing_${bookingCode}`;
      // Note: We might not want to remove this here if user navigates away and comes back
      console.log("🧹 Component unmount - polling stopped for:", bookingCode);
    };
  }, [bookingCode, navigate]);

  if (!approvalUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Không tìm thấy đường dẫn thanh toán
        </h2>
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-6">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-semibold text-green-700">
          Thanh toán thành công!
        </h1>
        <p className="text-gray-600 mt-2">
          Cảm ơn bạn đã sử dụng dịch vụ. Hệ thống sẽ gửi thông tin đến email của
          bạn.
        </p>
        <button
          onClick={() => {
            // Check localStorage if URL params are not available
            let isCheckinFlow = isCheckinPayment;
            let bookingCodeForRedirect = bookingCode;

            if (!isCheckinFlow) {
              const checkinPaymentInfo = localStorage.getItem(
                "checkin_payment_info_backup"
              );
              if (checkinPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(checkinPaymentInfo);
                  isCheckinFlow = paymentInfo.isCheckinPayment;
                  bookingCodeForRedirect = paymentInfo.bookingCode;
                } catch (error) {
                  console.error("Error parsing checkin payment info:", error);
                }
              }
            }

            // Check my-flights payment info
            let isMyFlightsFlow = false;
            let myFlightsBookingCodeForRedirect = bookingCode;

            if (!isMyFlightsFlow) {
              const myFlightsPaymentInfo = localStorage.getItem(
                "my_flights_payment_info_backup"
              );
              if (myFlightsPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(myFlightsPaymentInfo);
                  isMyFlightsFlow = paymentInfo.isMyFlightsPayment;
                  myFlightsBookingCodeForRedirect = paymentInfo.bookingCode;
                } catch (error) {
                  console.error(
                    "Error parsing my flights payment info:",
                    error
                  );
                }
              }
            }

            if (isCheckinFlow && bookingCodeForRedirect) {
              navigate(
                `/check-in?bookingCode=${bookingCodeForRedirect}&paymentSuccess=true`
              );
            } else if (isMyFlightsFlow && myFlightsBookingCodeForRedirect) {
              navigate("/my-flights", {
                state: {
                  bookingCode: myFlightsBookingCodeForRedirect,
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
            let isCheckinFlow = isCheckinPayment;

            if (!isCheckinFlow) {
              const checkinPaymentInfo = localStorage.getItem(
                "checkin_payment_info_backup"
              );
              if (checkinPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(checkinPaymentInfo);
                  isCheckinFlow = paymentInfo.isCheckinPayment;
                } catch (error) {
                  console.error("Error parsing checkin payment info:", error);
                }
              }
            }

            let isMyFlightsFlow = false;
            if (!isMyFlightsFlow) {
              const myFlightsPaymentInfo = localStorage.getItem(
                "my_flights_payment_info_backup"
              );
              if (myFlightsPaymentInfo) {
                try {
                  const paymentInfo = JSON.parse(myFlightsPaymentInfo);
                  isMyFlightsFlow = paymentInfo.isMyFlightsPayment;
                } catch (error) {
                  console.error(
                    "Error parsing my flights payment info:",
                    error
                  );
                }
              }
            }

            if (isCheckinFlow) {
              return "Tiếp tục check-in";
            } else if (isMyFlightsFlow) {
              return "Xem chi tiết đặt chỗ ngay";
            } else {
              return "Xem chi tiết đặt chỗ ngay";
            }
          })()}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <Card className="max-w-md w-full shadow-lg border border-blue-200">
        <CardHeader className="text-center bg-blue-600 text-white rounded-t-2xl">
          <CardTitle className="text-xl font-semibold">
            Quét mã QR để thanh toán
          </CardTitle>
          <p className="text-sm opacity-90">
            Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã
          </p>
        </CardHeader>

        <CardContent className="flex flex-col items-center p-6 space-y-4">
          {/* QR Code */}
          <img
            src={approvalUrl}
            alt="QR Code"
            className="w-[300px] h-[300px]"
          />
          <p className="text-sm opacity-90">
            Sau khi thanh toán xong, hệ thống sẽ tự động chuyển hướng về trang
            danh sách chuyến bay trong 3 giây.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
