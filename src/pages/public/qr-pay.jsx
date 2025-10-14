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
  const [status, setStatus] = useState("waiting");

  const pollingRef = useRef(null);

  useEffect(() => {
    if (!bookingCode) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/v1/payments/sepay/check/${bookingCode}`
        );

        if (response.data?.success) {
          setStatus("success");
          toast.success("Thanh toán thành công!");

          clearInterval(pollingRef.current);
          setTimeout(() => navigate("/confirm-booking"), 3000); // Auto redirect after 3 seconds
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
    return () => clearInterval(pollingRef.current);
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
          onClick={() => navigate("/confirm-booking")}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Xem chi tiết đặt chỗ ngay
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
