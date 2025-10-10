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
          setTimeout(() => navigate("/my-flights"), 2500);
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
            onClick={() => navigate("/my-flights")}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách chuyến bay
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
            onClick={() => navigate("/my-flights")}
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
