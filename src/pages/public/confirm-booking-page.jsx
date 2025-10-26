"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/common/seo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  MapPin,
  Plane,
  CheckSquare,
  Tag,
  CreditCard,
} from "lucide-react";
import {
  formatCurrencyVND,
  formatDateVN,
  formatTimeVN,
} from "@/utils/currency-utils";
import { getPassengerMultiplier } from "@/utils/flight-booking-utils";
import { paymentApi } from "@/apis/payment-api";

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [isRefreshingPayment, setIsRefreshingPayment] = useState(false);

  useEffect(() => {
    const storedBookingData = localStorage.getItem("bookingConfirmation");
    if (storedBookingData) {
      setBookingData(JSON.parse(storedBookingData));
    } else {
      // Redirect to home if no booking data
      navigate("/");
    }
  }, [navigate]);

  // Check and refresh payment status when returning from PayPal
  useEffect(() => {
    const checkPaymentStatus = async () => {
      const storedBookingData = localStorage.getItem("bookingConfirmation");
      if (!storedBookingData) return;

      const bookingData = JSON.parse(storedBookingData);
      const bookingCode = bookingData.bookingCode;

      if (!bookingCode) return;

      // Check if user just returned from PayPal payment via URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const paymentReturn = urlParams.get("paymentReturn");
      const urlBookingCode = urlParams.get("bookingCode");

      // Check localStorage flags for payment completion
      const paymentCompletedFlag = localStorage.getItem(
        `payment_completed_${bookingCode}`
      );
      const paypalSuccessFlag = localStorage.getItem("paypal_payment_success");
      const paymentReturnFlag = localStorage.getItem(
        `payment_return_${bookingCode}`
      );

      // Check if this is a payment return (from URL param or localStorage flag)
      const isPaymentReturn =
        paymentReturn === "true" ||
        (paymentReturnFlag && urlBookingCode === bookingCode);

      if (isPaymentReturn || paymentCompletedFlag || paypalSuccessFlag) {
        console.log(
          "🔄 Detected payment return, refreshing payment status for booking:",
          bookingCode,
          {
            paymentReturn,
            urlBookingCode,
            paymentReturnFlag: !!paymentReturnFlag,
            paymentCompletedFlag: !!paymentCompletedFlag,
            paypalSuccessFlag: !!paypalSuccessFlag,
          }
        );
        setIsRefreshingPayment(true);

        try {
          const response = await paymentApi.getPaymentStatusByBookingCode(
            bookingCode
          );

          if (response.success && response.data) {
            const paymentData = response.data;
            console.log("✅ Refreshed payment status:", paymentData.status);

            // Update booking data with new payment information
            const updatedBookingData = {
              ...bookingData,
              payment: {
                method: paymentData.paymentMethod,
                status: paymentData.status,
                transactionId: paymentData.transactionId,
                paidAt: paymentData.paymentDate,
                amount: paymentData.amount,
                paymentId: paymentData.paymentId,
                bookingId: paymentData.bookingId,
                payerId: paymentData.payerId,
                checkoutUrl: paymentData.checkoutUrl,
              },
            };

            // Update localStorage and state
            localStorage.setItem(
              "bookingConfirmation",
              JSON.stringify(updatedBookingData)
            );
            setBookingData(updatedBookingData);

            // Clean up flags
            localStorage.removeItem(`payment_completed_${bookingCode}`);
            localStorage.removeItem("paypal_payment_success");
            localStorage.removeItem(`payment_return_${bookingCode}`);

            // Clean up URL parameters
            if (paymentReturn) {
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
            }

            console.log("✅ Payment status updated successfully");
          }
        } catch (error) {
          console.error("❌ Error refreshing payment status:", error);
        } finally {
          setIsRefreshingPayment(false);
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(checkPaymentStatus, 500);
    return () => clearTimeout(timer);
  }, []);

  // Helper function to get flight segment info from API response
  const getFlightSegmentInfo = (segments, flight) => {
    if (!segments || segments.length === 0) {
      // Fallback to main flight data if segments not available
      if (flight) {
        return [
          {
            departure: {
              city: flight.departureAirport?.cityNames?.[0] || flight.from,
              airport: flight.departureAirport?.airportName || "N/A",
              airportCode: flight.departureAirport?.airportCode || flight.from,
              country: flight.departureAirport?.country || "N/A",
              time: flight.departureTime || "N/A",
              date: flight.departureDate || "N/A",
              terminal: flight.departureAirport?.gates?.[0]?.terminal || "N/A",
              gate: flight.departureAirport?.gates?.[0]?.gateName || "N/A",
            },
            arrival: {
              city: flight.arrivalAirport?.cityNames?.[0] || flight.to,
              airport: flight.arrivalAirport?.airportName || "N/A",
              airportCode: flight.arrivalAirport?.airportCode || flight.to,
              country: flight.arrivalAirport?.country || "N/A",
              time: flight.arrivalTime || "N/A",
              date: flight.arrivalDate || "N/A",
              terminal: flight.arrivalAirport?.gates?.[0]?.terminal || "N/A",
              gate: flight.arrivalAirport?.gates?.[0]?.gateName || "N/A",
            },
            flight: {
              flightNumber: flight.flightNumber,
              airline: flight.airline || flight.airlineName,
              aircraft: flight.aircraft || flight.aircraftName,
              duration: flight.duration ? `${flight.duration} minutes` : "N/A",
            },
          },
        ];
      }
      return [];
    }

    return segments.map((segment) => ({
      departure: {
        city:
          segment.departureAirport?.cityNames?.[0] ||
          segment.departureAirport?.city,
        airport:
          segment.departureAirport?.airportName ||
          segment.departureAirport?.name,
        airportCode: segment.departureAirport?.airportCode || "N/A",
        country: segment.departureAirport?.country || "N/A",
        time: formatTimeVN(segment.departureTime),
        date: formatDateVN(segment.departureTime),
        terminal: segment.departureAirport?.gates?.[0]?.terminal || "N/A",
        gate: segment.departureAirport?.gates?.[0]?.gateName || "N/A",
      },
      arrival: {
        city:
          segment.arrivalAirport?.cityNames?.[0] ||
          segment.arrivalAirport?.city,
        airport:
          segment.arrivalAirport?.airportName || segment.arrivalAirport?.name,
        airportCode: segment.arrivalAirport?.airportCode || "N/A",
        country: segment.arrivalAirport?.country || "N/A",
        time: formatTimeVN(segment.arrivalTime),
        date: formatDateVN(segment.arrivalTime),
        terminal: segment.arrivalAirport?.gates?.[0]?.terminal || "N/A",
        gate: segment.arrivalAirport?.gates?.[0]?.gateName || "N/A",
      },
      flight: {
        flightNumber: segment.flightNumber,

        aircraft: segment.aircraft || "N/A",
        duration: segment.duration || "N/A",
      },
    }));
  };

  if (!bookingData) {
    return (
      <>
        <SEO title="Đang tải..." description="Đang tải thông tin booking..." />
        <div className="min-h-screen bg-gray-50 py-8 pt-20 dark:bg-gray-700 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Đang tải thông tin booking...
            </p>
          </div>
        </div>
      </>
    );
  }

  // Process booking details from API response
  const bookingDetails = {
    bookingId: bookingData.bookingId || bookingData.bookingCode,
    bookingCode: bookingData.bookingCode || bookingData.bookingId,
    status: bookingData.status || bookingData.bookingStatus || "CONFIRMED",
    flightType: bookingData.flightType || bookingData.flight?.type || "ONE_WAY",
    flightSegments: getFlightSegmentInfo(
      bookingData.flightSegments || [],
      bookingData.flight
    ),
    passengers: bookingData.passengers || [],
    baggage: bookingData.baggage || [],
    ancillaryServices: bookingData.ancillaryServices
      ? bookingData.ancillaryServices.map((service) => ({
          serviceName: service.serviceName || "Unknown Service",
          serviceType: service.serviceType || "UNKNOWN",
          serviceTypeDisplayName:
            service.serviceTypeDisplayName || service.serviceType || "Dịch vụ",
          price: service.unitPrice || service.totalPrice || 0,
          totalPrice:
            service.totalPrice || service.unitPrice * service.quantity || 0,
          unitPrice: service.unitPrice || service.totalPrice || 0,
          quantity: service.quantity || 1,
          notes: service.notes || "",
          passengerName: service.passengerName || null,
          passengerId: service.passengerId || null,
        }))
      : bookingData.selectedAncillaryServices
      ? Object.values(bookingData.selectedAncillaryServices).map((service) => ({
          name:
            bookingData.availableAncillaryServices?.find(
              (s) => s.serviceId === service.serviceId
            )?.serviceName || "Unknown Service",
          price:
            bookingData.availableAncillaryServices?.find(
              (s) => s.serviceId === service.serviceId
            )?.price || 0,
          quantity: service.quantity || 1,
          notes: service.notes || "",
        }))
      : [],
    assignedSeats:
      bookingData.assignedSeats || bookingData.extrasData?.selectedSeats || {},
    seatTypeDetails: bookingData.seatTypeDetails || [],
    appliedDeal:
      bookingData.appliedDeal && bookingData.pointsRedeemed === 0
        ? {
            code:
              bookingData.appliedDeal.code ||
              (bookingData.pointsRedeemed === 0
                ? bookingData.appliedDealCode
                : ""),
            name:
              bookingData.appliedDeal.code ||
              (bookingData.pointsRedeemed === 0
                ? bookingData.appliedDealCode
                : ""),
            discount:
              bookingData.appliedDeal.discount || bookingData.discountAmount,
            discountAmount:
              bookingData.appliedDeal.discount || bookingData.discountAmount,
            discountType: bookingData.discountPercentage
              ? "PERCENTAGE"
              : "FIXED",
            discountValue:
              bookingData.discountPercentage ||
              bookingData.appliedDeal.discount,
            originalAmount:
              bookingData.appliedDeal.originalAmount || bookingData.totalAmount,
            finalAmount:
              bookingData.appliedDeal.finalAmount || bookingData.totalAmount,
            description: `Giảm ${bookingData.discountPercentage || 0}%`,
          }
        : null,
    pointsRedeemed: bookingData.pointsRedeemed || 0,
    pointsDiscountAmount: bookingData.pointsDiscountAmount || 0,
    price: {
      subtotal:
        bookingData.fare?.price ||
        bookingData.total ||
        bookingData.flight?.totalPrice ||
        bookingData.totalAmount ||
        bookingData.totalPrice ||
        0,
      taxes: bookingData.taxes || bookingData.price?.taxes || 0,
      total:
        bookingData.totalAmount ||
        bookingData.totalPrice ||
        bookingData.price?.total ||
        bookingData.appliedDeal?.finalAmount,
    },
    payment: {
      method:
        bookingData.payment?.paymentMethod ||
        bookingData.payment?.method ||
        "N/A",
      status:
        bookingData.payment?.status || bookingData.paymentStatus || "PENDING",
      transactionId:
        bookingData.payment?.transactionId ||
        bookingData.payment?.reference ||
        bookingData.bookingCode,
      amount: bookingData.payment?.amount || bookingData.totalAmount,
      paidAt: bookingData.payment?.paidAt || bookingData.payment?.paymentDate,
    },
  };

  // Detect flight type
  const flightType =
    bookingDetails.flightSegments.length === 1
      ? "ONE_WAY"
      : bookingDetails.flightSegments.length === 2
      ? "ROUND_TRIP"
      : "MULTI_CITY";

  const copyBookingCode = () => {
    navigator.clipboard.writeText(bookingDetails.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SEO
        title="Đã đặt vé"
        description="Đặt vé máy bay thành công! Xem chi tiết booking và thông tin chuyến bay của bạn."
        keywords="xác nhận đặt vé, booking thành công, vé máy bay đã đặt, chi tiết chuyến bay"
      />
      <div className="min-h-screen bg-gray-50 py-8 pt-20 dark:bg-gray-700 ">
        <div className="max-w-4xl mx-auto px-4">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Đặt Vé Thành Công!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Cảm ơn bạn đã tin tương chúng tôi. Thông tin chi tiết booking của
              bạn như sau:
            </p>
          </div>

          {/* Booking Code */}
          <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  Mã đặt chỗ của bạn
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {bookingDetails.bookingCode}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBookingCode}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    {copied ? "Đã sao chép!" : "Sao chép"}
                  </Button>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  Vui lòng lưu mã này để tra cứu booking
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flight Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Flight Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Chi Tiết Chuyến Bay
                    <Badge variant="secondary" className="ml-2">
                      {flightType === "ONE_WAY"
                        ? "Một chiều"
                        : flightType === "ROUND_TRIP"
                        ? "Khứ hồi"
                        : "Nhiều thành phố"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingDetails.flightSegments.length > 0 ? (
                    <div className="space-y-6">
                      {bookingDetails.flightSegments.map((segment, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <Badge variant="outline">
                              Chặng {index + 1}: {segment.flight.flightNumber}
                            </Badge>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Máy bay: {segment.flight.aircraft || "N/A"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            {/* Departure */}
                            <div className="text-center">
                              <MapPin className="mx-auto mb-2 text-blue-600" />
                              <p className="font-semibold dark:text-gray-200">
                                {segment.departure.city}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {segment.departure.airport}
                              </p>

                              <p className="text-lg font-bold dark:text-gray-200 mt-2">
                                {segment.departure.time}
                              </p>
                              <p className="text-xs text-gray-500">
                                {segment.departure.date}
                              </p>
                              <p className="text-xs text-gray-500">
                                Terminal: {segment.departure.terminal} | Cổng:{" "}
                                {segment.departure.gate}
                              </p>
                            </div>

                            {/* Flight Duration */}
                            <div className="text-center">
                              <div className="flex items-center justify-center">
                                <div className="h-px bg-gray-300 flex-1"></div>
                                <Plane
                                  className="mx-2 text-gray-400"
                                  size={16}
                                />
                                <div className="h-px bg-gray-300 flex-1"></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {segment.flight.duration}
                              </p>
                            </div>

                            {/* Arrival */}
                            <div className="text-center">
                              <MapPin className="mx-auto mb-2 text-green-600" />
                              <p className="font-semibold dark:text-gray-200">
                                {segment.arrival.city}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {segment.arrival.airport}
                              </p>

                              <p className="text-lg font-bold dark:text-gray-200 mt-2">
                                {segment.arrival.time}
                              </p>
                              <p className="text-xs text-gray-500">
                                {segment.arrival.date}
                              </p>
                              <p className="text-xs text-gray-500">
                                Terminal: {segment.arrival.terminal} | Cổng:{" "}
                                {segment.arrival.gate}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <p>Không có thông tin chuyến bay từ API</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Passengers */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Hành Khách</CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingDetails.passengers.length > 0 ? (
                    <div className="space-y-3">
                      {bookingDetails.passengers.map((passenger, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div>
                            <p className="font-medium dark:text-gray-200">
                              {passenger.firstName} {passenger.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {passenger.passengerType} •{" "}
                              {passenger.dateOfBirth}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {passenger.gender === "MALE"
                              ? "Nam"
                              : passenger.gender === "FEMALE"
                              ? "Nữ"
                              : "Khác"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Không có thông tin hành khách từ API
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Selected Seats */}
              {bookingDetails.seatTypeDetails &&
                bookingDetails.seatTypeDetails.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        Ghế Đã Chọn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Group seats by flight segment (for round-trip) */}
                        {(() => {
                          // Group seat details by segment (0 = outbound, 1 = return)
                          const groupedSeats =
                            bookingDetails.seatTypeDetails.reduce(
                              (acc, seatDetail) => {
                                // For now, we'll assume all seats are outbound unless we have segment info
                                // This can be enhanced when segment info is available in API
                                const segmentKey =
                                  seatDetail.segmentOrder === 1
                                    ? "return"
                                    : "outbound";
                                if (!acc[segmentKey]) acc[segmentKey] = [];
                                acc[segmentKey].push(seatDetail);
                                return acc;
                              },
                              { outbound: [], return: [] }
                            );

                          return (
                            <>
                              {/* Outbound Seats */}
                              {groupedSeats.outbound.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">
                                    Chuyến đi
                                  </h4>
                                  <div className="space-y-2">
                                    {groupedSeats.outbound.map(
                                      (seatDetail, index) => (
                                        <div
                                          key={`outbound-seat-${index}`}
                                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                          <div className="flex-1">
                                            <span className="font-medium dark:text-gray-200">
                                              {seatDetail.passengerName ||
                                                `Hành khách ${index + 1}`}
                                            </span>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                              <div className="flex items-center gap-2">
                                                <span>
                                                  Ghế:{" "}
                                                  <strong>
                                                    {seatDetail.seatNumber}
                                                  </strong>
                                                </span>
                                                <span>•</span>
                                                <span>
                                                  {seatDetail.seatTypeDescription ||
                                                    (() => {
                                                      const seatTypeLabels = {
                                                        STANDARD: "Tiêu chuẩn",
                                                        EXTRA_LEGROOM:
                                                          "Chỗ để chân rộng",
                                                        EXIT_ROW:
                                                          "Hàng thoát hiểm",
                                                        FRONT_ROW: "Hàng đầu",
                                                        ACCESSIBLE:
                                                          "Khuyết tật",
                                                      };
                                                      return (
                                                        seatTypeLabels[
                                                          seatDetail.seatType
                                                        ] || seatDetail.seatType
                                                      );
                                                    })()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            {seatDetail.additionalPrice > 0 ? (
                                              <div className="font-medium text-blue-600">
                                                +
                                                {formatCurrencyVND(
                                                  seatDetail.additionalPrice
                                                )}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-green-600">
                                                Miễn phí
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Return Seats */}
                              {groupedSeats.return.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">
                                    Chuyến về
                                  </h4>
                                  <div className="space-y-2">
                                    {groupedSeats.return.map(
                                      (seatDetail, index) => (
                                        <div
                                          key={`return-seat-${index}`}
                                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                          <div className="flex-1">
                                            <span className="font-medium dark:text-gray-200">
                                              {seatDetail.passengerName ||
                                                `Hành khách ${index + 1}`}
                                            </span>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                              <div className="flex items-center gap-2">
                                                <span>
                                                  Ghế:{" "}
                                                  <strong>
                                                    {seatDetail.seatNumber}
                                                  </strong>
                                                </span>
                                                <span>•</span>
                                                <span>
                                                  {seatDetail.seatTypeDescription ||
                                                    (() => {
                                                      const seatTypeLabels = {
                                                        STANDARD: "Tiêu chuẩn",
                                                        EXTRA_LEGROOM:
                                                          "Chỗ để chân rộng",
                                                        EXIT_ROW:
                                                          "Hàng thoát hiểm",
                                                        FRONT_ROW: "Hàng đầu",
                                                        ACCESSIBLE:
                                                          "Khuyết tật",
                                                      };
                                                      return (
                                                        seatTypeLabels[
                                                          seatDetail.seatType
                                                        ] || seatDetail.seatType
                                                      );
                                                    })()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            {seatDetail.additionalPrice > 0 ? (
                                              <div className="font-medium text-blue-600">
                                                +
                                                {formatCurrencyVND(
                                                  seatDetail.additionalPrice
                                                )}
                                              </div>
                                            ) : (
                                              <div className="text-sm text-green-600">
                                                Miễn phí
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Fallback: Show seats from extrasData if seatTypeDetails not available */}
              {!bookingDetails.seatTypeDetails?.length &&
                bookingData.extrasData &&
                (Object.keys(bookingData.extrasData.selectedSeats || {})
                  .length > 0 ||
                  Object.keys(bookingData.extrasData.selectedReturnSeats || {})
                    .length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" />
                        Ghế Đã Chọn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Outbound Seats */}
                        {Object.keys(bookingData.extrasData.selectedSeats || {})
                          .length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">
                              Chuyến đi
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(
                                bookingData.extrasData.selectedSeats
                              ).map(([passengerId, seatInfo]) => {
                                const passengerIndex =
                                  parseInt(
                                    passengerId.replace("passenger", "")
                                  ) - 1;
                                const passenger =
                                  bookingDetails.passengers[passengerIndex];
                                const passengerName = passenger
                                  ? `${passenger.firstName} ${passenger.lastName}`
                                  : `Hành khách ${passengerIndex + 1}`;

                                return (
                                  <div
                                    key={`outbound-${passengerId}`}
                                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <span className="font-medium dark:text-gray-200">
                                        {passengerName}
                                      </span>
                                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        <div className="flex items-center gap-2">
                                          <span>
                                            Ghế:{" "}
                                            <strong>
                                              {seatInfo.seatNumber}
                                            </strong>
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {(() => {
                                              // Convert seatType to Vietnamese label
                                              const seatTypeLabels = {
                                                STANDARD: "Tiêu chuẩn",
                                                EXTRA_LEGROOM:
                                                  "Chỗ để chân rộng",
                                                EXIT_ROW: "Hàng thoát hiểm",
                                                FRONT_ROW: "Hàng đầu",
                                                ACCESSIBLE: "Khuyết tật",
                                              };
                                              return (
                                                seatTypeLabels[
                                                  seatInfo.seatType
                                                ] ||
                                                seatInfo.seatType ||
                                                "Tiêu chuẩn"
                                              );
                                            })()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {seatInfo.priceVND > 0 ? (
                                        <div className="font-medium text-blue-600">
                                          +
                                          {formatCurrencyVND(seatInfo.priceVND)}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-green-600">
                                          Miễn phí
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Return Seats */}
                        {bookingData.extrasData.isRoundTrip &&
                          Object.keys(
                            bookingData.extrasData.selectedReturnSeats || {}
                          ).length > 0 && (
                            <div>
                              <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">
                                Chuyến về
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(
                                  bookingData.extrasData.selectedReturnSeats
                                ).map(([passengerId, seatInfo]) => {
                                  const passengerIndex =
                                    parseInt(
                                      passengerId.replace("passenger", "")
                                    ) - 1;
                                  const passenger =
                                    bookingDetails.passengers[passengerIndex];
                                  const passengerName = passenger
                                    ? `${passenger.firstName} ${passenger.lastName}`
                                    : `Hành khách ${passengerIndex + 1}`;

                                  return (
                                    <div
                                      key={`return-${passengerId}`}
                                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium dark:text-gray-200">
                                          {passengerName}
                                        </span>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          <div className="flex items-center gap-2">
                                            <span>
                                              Ghế:{" "}
                                              <strong>
                                                {seatInfo.seatNumber}
                                              </strong>
                                            </span>
                                            <span>•</span>
                                            <span>
                                              {(() => {
                                                // Convert seatType to Vietnamese label
                                                const seatTypeLabels = {
                                                  STANDARD: "Tiêu chuẩn",
                                                  EXTRA_LEGROOM:
                                                    "Chỗ để chân rộng",
                                                  EXIT_ROW: "Hàng thoát hiểm",
                                                  FRONT_ROW: "Hàng đầu",
                                                  ACCESSIBLE: "Khuyết tật",
                                                };
                                                return (
                                                  seatTypeLabels[
                                                    seatInfo.seatType
                                                  ] ||
                                                  seatInfo.seatType ||
                                                  "Tiêu chuẩn"
                                                );
                                              })()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {seatInfo.priceVND > 0 ? (
                                          <div className="font-medium text-blue-600">
                                            +
                                            {formatCurrencyVND(
                                              seatInfo.priceVND
                                            )}
                                          </div>
                                        ) : (
                                          <div className="text-sm text-green-600">
                                            Miễn phí
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Baggage & Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Hành Lý & Dịch Vụ Bổ Sung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Baggage */}
                    {bookingDetails.baggage.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 dark:text-gray-200">
                          Hành lý:
                        </h4>
                        <div className="space-y-2">
                          {bookingDetails.baggage.map((bag, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="font-medium dark:text-gray-200">
                                  {bag.type === "CHECK_IN"
                                    ? "Hành lý ký gửi"
                                    : "Hành lý xách tay"}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Gói:{" "}
                                  {bag.purchasedPackage ||
                                    bag.weight ||
                                    bag.packageName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-blue-600">
                                  {formatCurrencyVND(
                                    bag.packagePrice || bag.price || 0
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {bag.isIncluded ? "Đã bao gồm" : "Phụ thu"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ancillary Services */}
                    {bookingDetails.ancillaryServices.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 dark:text-gray-200">
                          Dịch vụ bổ sung:
                        </h4>
                        <div className="space-y-2">
                          {bookingDetails.ancillaryServices.map(
                            (service, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="font-medium dark:text-gray-200">
                                    {service.serviceName}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {service.serviceTypeDisplayName} • Số lượng:{" "}
                                    {service.quantity}
                                  </p>
                                  {service.passengerName && (
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                      Hành khách: {service.passengerName}
                                    </p>
                                  )}
                                  {service.notes && (
                                    <p className="text-xs text-gray-500">
                                      Ghi chú: {service.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-blue-600">
                                    {formatCurrencyVND(service.totalPrice)}
                                  </p>
                                  {service.quantity > 1 && (
                                    <p className="text-xs text-gray-500">
                                      {formatCurrencyVND(service.unitPrice)} x{" "}
                                      {service.quantity}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {bookingDetails.baggage.length === 0 &&
                      bookingDetails.ancillaryServices.length === 0 && (
                        <p className="text-gray-500">
                          Không có dịch vụ bổ sung nào
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Price Summary */}
            <div className="space-y-6">
              {/* Applied Deal */}
              {bookingDetails.appliedDeal && (
                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Tag className="w-5 h-5" />
                      Ưu Đãi Áp Dụng
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-800 dark:text-green-300">
                          {bookingDetails.appliedDeal.name ||
                            bookingDetails.appliedDeal.code}
                        </span>
                        <Badge variant="success">
                          {bookingDetails.appliedDeal.discountType ===
                          "PERCENTAGE"
                            ? `${bookingDetails.appliedDeal.discountValue}%`
                            : formatCurrencyVND(
                                bookingDetails.appliedDeal.discount
                              )}
                        </Badge>
                      </div>
                      {bookingDetails.appliedDeal.description && (
                        <p className="text-sm text-green-700 dark:text-green-400">
                          {bookingDetails.appliedDeal.description}
                        </p>
                      )}
                      <div className="flex justify-between font-medium text-green-800 dark:text-green-300">
                        <span>Tiết kiệm:</span>
                        <span>
                          -
                          {formatCurrencyVND(
                            bookingDetails.appliedDeal.discountAmount
                          )}
                        </span>
                      </div>
                      {bookingDetails.appliedDeal.originalAmount && (
                        <div className="text-xs text-green-600 dark:text-green-500">
                          Giá gốc:{" "}
                          {formatCurrencyVND(
                            bookingDetails.appliedDeal.originalAmount
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Tổng Quan Giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Flight fare breakdown */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>✈️ Vé máy bay</span>
                        <span>
                          {formatCurrencyVND(bookingDetails.price.subtotal)}
                        </span>
                      </div>
                      {/* Passenger breakdown */}
                      <div className="ml-4 text-sm text-gray-600 space-y-1">
                        {(() => {
                          const passengers = bookingDetails.passengers || [];
                          const passengerCounts = passengers.reduce(
                            (counts, passenger) => {
                              const type =
                                passenger.passengerType || passenger.type;
                              counts[type] = (counts[type] || 0) + 1;
                              return counts;
                            },
                            {}
                          );

                          const isRoundTrip =
                            bookingDetails.flight?.isRoundTrip ||
                            bookingDetails.flight?.type === "ROUND_TRIP" ||
                            bookingData?.flight?.isRoundTrip;

                          return Object.entries(passengerCounts).map(
                            ([type, count]) => {
                              const typeLabel =
                                type === "ADULT"
                                  ? "Người lớn"
                                  : type === "CHILD"
                                  ? "Trẻ em"
                                  : "Em bé";
                              return (
                                <div
                                  key={type}
                                  className="flex justify-between"
                                >
                                  <span>
                                    {count} {typeLabel}
                                  </span>
                                  <span>Đã bao gồm</span>
                                </div>
                              );
                            }
                          );
                        })()}
                      </div>
                    </div>

                    {/* Ancillary Services charges */}
                    {bookingDetails.ancillaryServices.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span>🛎️ Dịch vụ bổ sung</span>
                          <span>
                            {formatCurrencyVND(
                              bookingDetails.ancillaryServices.reduce(
                                (total, service) => total + service.totalPrice,
                                0
                              )
                            )}
                          </span>
                        </div>
                        {/* Services breakdown */}
                        <div className="ml-4 space-y-1">
                          {bookingDetails.ancillaryServices.map(
                            (service, index) => {
                              const passenger = bookingDetails.passengers?.find(
                                (p) =>
                                  p.id === service.passengerId ||
                                  p.passengerId === service.passengerId
                              );
                              const passengerName = passenger
                                ? `${passenger.firstName} ${passenger.lastName}`.trim()
                                : service.passengerId
                                ? `Hành khách ${service.passengerId}`
                                : "Toàn booking";

                              const isRoundTrip =
                                bookingDetails.flight?.isRoundTrip ||
                                bookingDetails.flight?.type === "ROUND_TRIP" ||
                                bookingData?.flight?.isRoundTrip;

                              const segmentCount = isRoundTrip ? 2 : 1;
                              const isPerSegment = service.isPerSegment;
                              const isPerPassenger = service.isPerPassenger;
                              const hasSpecificPassenger =
                                service.passengerId !== null &&
                                service.passengerId !== undefined;
                              const totalPassengers =
                                bookingDetails.passengers?.length || 0;

                              return (
                                <div
                                  key={index}
                                  className="text-xs text-gray-600"
                                >
                                  <div className="flex justify-between">
                                    <span>
                                      <span className="font-medium">
                                        {service.serviceName || service.name}
                                      </span>
                                      {service.quantity > 1 &&
                                        ` (×${service.quantity})`}
                                      {hasSpecificPassenger &&
                                        isPerSegment &&
                                        segmentCount > 1 && (
                                          <span className="text-orange-600">
                                            {" "}
                                            (×{segmentCount} chặng)
                                          </span>
                                        )}
                                      {!hasSpecificPassenger &&
                                        isPerPassenger && (
                                          <span className="text-blue-600">
                                            {" "}
                                            (×{totalPassengers} người)
                                          </span>
                                        )}
                                      {!hasSpecificPassenger &&
                                        isPerSegment &&
                                        segmentCount > 1 && (
                                          <span className="text-orange-600">
                                            {" "}
                                            (×{segmentCount} chặng)
                                          </span>
                                        )}
                                    </span>
                                    <span>
                                      {formatCurrencyVND(service.totalPrice)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {passengerName}
                                    {hasSpecificPassenger
                                      ? isPerSegment
                                        ? " - Tính theo chặng cho hành khách này"
                                        : " - Dịch vụ cho hành khách này"
                                      : isPerPassenger && isPerSegment
                                      ? " - Tính theo hành khách và chặng"
                                      : isPerPassenger
                                      ? " - Tính theo số hành khách"
                                      : isPerSegment
                                      ? " - Tính theo chặng"
                                      : " - Giá cố định cho booking"}
                                    {service.notes && ` - ${service.notes}`}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {/* Baggage charges */}
                    {bookingDetails.baggage.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span>🧳 Hành lý</span>
                          <span>
                            {formatCurrencyVND(
                              bookingData.baggageTotal ||
                                bookingDetails.baggage.reduce(
                                  (total, bag) =>
                                    total +
                                    (bag.packagePrice || bag.price || 0),
                                  0
                                ) ||
                                0
                            )}
                          </span>
                        </div>
                        {/* Baggage breakdown */}
                        <div className="ml-4 space-y-1">
                          {bookingDetails.baggage.map((bag, index) => {
                            const passenger = bookingDetails.passengers?.find(
                              (p) =>
                                p.id === bag.passengerId ||
                                p.passengerId === bag.passengerId
                            );
                            const passengerName = passenger
                              ? `${passenger.firstName} ${passenger.lastName}`.trim()
                              : `Hành khách ${index + 1}`;

                            const isRoundTrip =
                              bookingDetails.flight?.isRoundTrip ||
                              bookingDetails.flight?.type === "ROUND_TRIP" ||
                              bookingData?.flight?.isRoundTrip;

                            const segmentCount = isRoundTrip ? 2 : 1;
                            const totalPrice =
                              bag.packagePrice || bag.price || 0;

                            return (
                              <div
                                key={index}
                                className="text-xs text-gray-600"
                              >
                                <span className="font-medium">
                                  {passengerName}:
                                </span>{" "}
                                {bag.weight}kg
                                <span className="ml-1">
                                  ({formatCurrencyVND(totalPrice)})
                                </span>
                                {segmentCount > 1 && (
                                  <span className="text-orange-600 ml-1">
                                    (× {segmentCount} chặng)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Seat charges */}
                    {(bookingData.seatTotal > 0 ||
                      bookingData.seatTypeAmount > 0) && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span>💺 Phụ phí ghế</span>
                          <span>
                            {formatCurrencyVND(
                              bookingData.seatTotal ||
                                bookingData.seatTypeAmount ||
                                0
                            )}
                          </span>
                        </div>
                        <div className="ml-4 text-xs text-gray-600">
                          {(() => {
                            const passengerCount =
                              bookingDetails.passengers?.length || 0;
                            const isRoundTrip =
                              bookingDetails.flight?.isRoundTrip ||
                              bookingDetails.flight?.type === "ROUND_TRIP" ||
                              bookingData?.flight?.isRoundTrip;
                            const segmentText = isRoundTrip ? " × Khứ hồi" : "";

                            return (
                              <div>
                                {passengerCount} hành khách{segmentText} - Ghế
                                đã chọn và tự động
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {bookingDetails.appliedDeal && (
                      <div className="flex justify-between text-green-600">
                        <span>
                          Giảm giá ({bookingDetails.appliedDeal.code})
                        </span>
                        <span>
                          -
                          {formatCurrencyVND(
                            bookingDetails.appliedDeal.discountAmount
                          )}
                        </span>
                      </div>
                    )}

                    {bookingDetails.pointsRedeemed > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>
                          Giảm giá (đổi {bookingDetails.pointsRedeemed} điểm)
                        </span>
                        <span>
                          -
                          {formatCurrencyVND(
                            bookingDetails.pointsDiscountAmount
                          )}
                        </span>
                      </div>
                    )}

                    {bookingDetails.price.taxes > 0 && (
                      <div className="flex justify-between">
                        <span>Thuế và phí</span>
                        <span>
                          {formatCurrencyVND(bookingDetails.price.taxes)}
                        </span>
                      </div>
                    )}

                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-blue-600">
                        {formatCurrencyVND(bookingDetails.price.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              {bookingDetails.payment &&
                Object.keys(bookingDetails.payment).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Thông Tin Thanh Toán
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {isRefreshingPayment ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">
                              Đang cập nhật trạng thái thanh toán...
                            </p>
                          </div>
                        ) : bookingDetails.payment.status === "PENDING" ||
                          bookingDetails.payment.status === "PAY_LATER" ? (
                          <div className="text-center py-4">
                            <div className="text-yellow-600 font-medium">
                              ⏳ Chưa thanh toán
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Bạn có 1 giờ để hoàn tất thanh toán
                            </p>
                          </div>
                        ) : (
                          <>
                            {bookingDetails.payment.method && (
                              <div className="flex justify-between">
                                <span>Phương thức:</span>
                                <span className="font-medium">
                                  {bookingDetails.payment.method === "CARD"
                                    ? "Thẻ tín dụng/Ghi nợ"
                                    : bookingDetails.payment.method ===
                                      "BANK_TRANSFER"
                                    ? "Chuyển khoản ngân hàng"
                                    : bookingDetails.payment.method ===
                                      "E_WALLET"
                                    ? "Ví điện tử"
                                    : bookingDetails.payment.method === "PAYPAL"
                                    ? "PayPal"
                                    : bookingDetails.payment.method}
                                </span>
                              </div>
                            )}
                            {bookingDetails.payment.transactionId && (
                              <div className="flex justify-between">
                                <span>Mã giao dịch:</span>
                                <span className="font-mono text-sm">
                                  {bookingDetails.payment.transactionId}
                                </span>
                              </div>
                            )}
                            {bookingDetails.payment.status && (
                              <div className="flex justify-between">
                                <span>Trạng thái:</span>
                                <Badge
                                  variant={
                                    bookingDetails.payment.status ===
                                      "COMPLETED" ||
                                    bookingDetails.payment.status === "SUCCESS"
                                      ? "success"
                                      : bookingDetails.payment.status ===
                                        "PENDING"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {bookingDetails.payment.status ===
                                    "COMPLETED" ||
                                  bookingDetails.payment.status === "SUCCESS"
                                    ? "Thành công"
                                    : bookingDetails.payment.status ===
                                      "PENDING"
                                    ? "Đang xử lý"
                                    : bookingDetails.payment.status === "FAILED"
                                    ? "Thất bại"
                                    : bookingDetails.payment.status}
                                </Badge>
                              </div>
                            )}
                            {bookingDetails.payment.paidAt && (
                              <div className="flex justify-between">
                                <span>Thời gian thanh toán:</span>
                                <span className="text-sm">
                                  {new Date(
                                    bookingDetails.payment.paidAt
                                  ).toLocaleString("vi-VN")}
                                </span>
                              </div>
                            )}
                            {bookingDetails.payment.amount && (
                              <div className="flex justify-between">
                                <span>Số tiền:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrencyVND(
                                    bookingDetails.payment.amount
                                  )}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* What's Next */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tiếp Theo Là Gì?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate("/checkin")}
                  >
                    Check-in Online
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/my-flights")}
                  >
                    Tìm Đặt Chỗ Của Tôi
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="bg-blue-100/50 dark:bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-green-700">
                  Những Lưu Ý Quan Trọng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-blue-800 dark:text-green-800">
                  <li>✔ Mang theo giấy tờ tùy thân hợp lệ</li>
                  <li>
                    ✔ Có mặt tại sân bay trước 2 tiếng (nội địa) / 3 tiếng (quốc
                    tế)
                  </li>
                  <li>✔ Check-in online để tiết kiệm thời gian</li>
                  <li>✔ Xem lại quy định và hạn chế về hành lý</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingConfirmation;
