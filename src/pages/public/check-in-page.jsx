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
  const [selectedSegment, setSelectedSegment] = useState(null); // Thêm state để lưu segment được chọn
  const [searchedPassengerName, setSearchedPassengerName] = useState(""); // Lưu tên hành khách được tìm kiếm

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

        // Save to localStorage if we have booking code
        if (bookingCodeFromUrl) {
          localStorage.setItem(
            `checkin_session_${bookingCodeFromUrl}`,
            newSession
          );
        }
      } else {
        updateSessionRef.current = sessionId;

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

      if (paymentSuccessProcessedRef.current.has(bookingCode)) {

        return;
      }

      paymentSuccessProcessedRef.current.add(bookingCode);
      setIsProcessingPaymentSuccess(true);
      setHasUpdatedTotal(true);

      toast.success("Thanh toán thành công! Đang tiến hành check-in...");

      const processPaymentSuccess = async () => {
        try {

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

          // ✅ Sửa logic tự động chọn segment để áp dụng quy tắc sequential check-in
          const eligibleSegments =
            updatedBookingData.checkinEligiblePassengers?.filter(
              (passenger) => passenger.checkinStatus === "ELIGIBLE"
            );

          if (eligibleSegments?.length > 0) {
            // Áp dụng quy tắc sequential check-in
            const sortedEligibleSegments = eligibleSegments.sort(
              (a, b) => a.segmentOrder - b.segmentOrder
            );

            // Tìm segment có thể check-in đầu tiên theo quy tắc
            let selectableSegment = null;

            for (const segment of sortedEligibleSegments) {
              // Segment 1 luôn có thể check-in nếu eligible
              if (segment.segmentOrder === 1) {
                selectableSegment = segment;
                break;
              }
              // Segment 2+ chỉ có thể check-in nếu segment trước đó đã check-in
              else {
                const previousSegment =
                  updatedBookingData.checkinEligiblePassengers.find(
                    (p) => p.segmentOrder === segment.segmentOrder - 1
                  );
                if (previousSegment?.checkinStatus === "COMPLETED") {
                  selectableSegment = segment;
                  break;
                }
              }
            }

            if (selectableSegment) {
              setSelectedSegment(selectableSegment);
            }
          }

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

    // Store the searched passenger name for filtering purposes
    setSearchedPassengerName(searchData.passengerName.trim());

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

        // ✅ Kiểm tra tất cả segments để tìm segment có thể check-in
        const allSegments = bookingData.checkinEligiblePassengers;
        const eligibleSegments = allSegments.filter(
          (passenger) => passenger.checkinStatus === "ELIGIBLE"
        );

        // Kiểm tra xem có segment nào đã check-in chưa
        const checkedInSegments = allSegments.filter(
          (passenger) =>
            passenger.checkinStatus === "ALREADY_CHECKED_IN" ||
            passenger.checkinStatus === "COMPLETED"
        );

        // ✅ Nếu có ít nhất một segment đã check-in, hiển thị booking details để xem thông tin
        if (checkedInSegments.length > 0) {
          setCurrentStep("details");
          toast.info(
            "Một số chuyến bay đã được check-in. Xem thông tin chi tiết bên dưới."
          );
          return;
        }

        // Nếu có segments eligible, áp dụng quy tắc sequential check-in
        if (eligibleSegments.length > 0) {
          // ✅ Xử lý one-way flight trước (segmentOrder là null)
          const oneWaySegments = eligibleSegments.filter(
            (passenger) => passenger.segmentOrder === null
          );

          if (oneWaySegments.length > 0) {
            // Với one-way, có thể check-in ngay lập tức
            setSelectedSegment(oneWaySegments[0]);
            setCurrentStep("details");
            toast.success(
              `Tìm thấy chuyến bay ${oneWaySegments[0].flightNumber} đủ điều kiện check-in`
            );
            return;
          }

          // ✅ Cho roundtrip: Kiểm tra quy tắc sequential check-in
          // Segment 1 (outbound) có thể check-in luôn
          // Segment 2 (return) chỉ có thể check-in sau khi segment 1 đã check-in
          const roundtripSegments = eligibleSegments.filter(
            (passenger) => passenger.segmentOrder !== null
          );

          if (roundtripSegments.length > 0) {
            const sortedEligibleSegments = roundtripSegments.sort(
              (a, b) => a.segmentOrder - b.segmentOrder
            );

            // Tìm segment có thể check-in đầu tiên theo quy tắc
            let selectableSegment = null;

            for (const segment of sortedEligibleSegments) {
              // Segment 1 luôn có thể check-in nếu eligible
              if (segment.segmentOrder === 1) {
                selectableSegment = segment;
                break;
              }
              // Segment 2+ chỉ có thể check-in nếu segment trước đó đã check-in
              else {
                const previousSegment = allSegments.find(
                  (p) => p.segmentOrder === segment.segmentOrder - 1
                );
                if (
                  previousSegment?.checkinStatus === "ALREADY_CHECKED_IN" ||
                  previousSegment?.checkinStatus === "COMPLETED"
                ) {
                  selectableSegment = segment;
                  break;
                }
              }
            }

            if (selectableSegment) {
              setSelectedSegment(selectableSegment);
              setCurrentStep("details");
              toast.success(
                `Tìm thấy chuyến bay ${selectableSegment.flightNumber} đủ điều kiện check-in`
              );
              return;
            }
          }
        }

        // Nếu không có segment nào eligible theo quy tắc, kiểm tra trạng thái cụ thể
        switch (firstPassenger.checkinStatus) {
          case "PAYMENT_PENDING":
            setError(
              "Vé chưa được thanh toán. Vui lòng thanh toán trước khi check-in."
            );
            toast.error("Vé chưa được thanh toán");
            break;
          case "PREVIOUS_SEGMENT_NOT_CHECKED_IN":
            setError(
              "Vui lòng check-in chuyến bay đi trước khi check-in chuyến bay về."
            );
            toast.error("Vui lòng check-in chuyến bay đi trước");
            break;
          default:
            setError("Không có chuyến bay nào đủ điều kiện check-in lúc này.");
            toast.error("Không có chuyến bay đủ điều kiện check-in");
        }
      } else {
        // Handle specific error cases
        let errorMessage =
          response.message || "Không tìm thấy đặt chỗ với thông tin đã nhập.";

        // Check if it's a "Booking not found" error
        if (
          response.error === "Booking not found" ||
          response.message?.toLowerCase().includes("booking not found") ||
          response.message?.toLowerCase().includes("không tìm thấy") ||
          response.message === "Đã xảy ra lỗi không mong muốn"
        ) {
          errorMessage =
            "Không tìm thấy đặt chỗ với thông tin đã nhập. Vui lòng kiểm tra lại mã đặt chỗ và tên hành khách.";
        }

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

  // Helper function to get the searched passenger from eligible passengers
  const getSearchedPassenger = () => {
    if (!booking?.checkinEligiblePassengers || !searchedPassengerName) {
      return booking?.checkinEligiblePassengers?.[0] || null;
    }

    // Find the exact passenger that was searched for
    const searchedPassenger = booking.checkinEligiblePassengers.find(
      (passenger) => {
        const passengerFullName =
          passenger.fullName ||
          `${passenger.firstName} ${passenger.lastName}`.trim();
        return (
          passengerFullName.toLowerCase() ===
          searchedPassengerName.toLowerCase()
        );
      }
    );

    return searchedPassenger || booking.checkinEligiblePassengers[0];
  };

  // Helper function to filter booking data for the searched passenger
  const getFilteredBookingData = () => {
    if (!booking) return null;

    const searchedPassenger = getSearchedPassenger();
    if (!searchedPassenger) return booking;

    // Filter checkinEligiblePassengers to show all segments for the searched passenger
    const passengerSegments =
      booking.checkinEligiblePassengers?.filter(
        (passenger) => passenger.passengerId === searchedPassenger.passengerId
      ) || [];

    const filteredBooking = {
      ...booking,
      checkinEligiblePassengers: passengerSegments,
      // Filter seatTypeDetails to show only seats for the searched passenger
      seatTypeDetails:
        booking.seatTypeDetails?.filter((seatDetail) => {
          const passengerFullName =
            searchedPassenger.fullName ||
            `${searchedPassenger.firstName} ${searchedPassenger.lastName}`.trim();
          return seatDetail.passengerName === passengerFullName;
        }) || [],
      // Filter ancillary services to show only services for the searched passenger
      ancillaryServices:
        booking.ancillaryServices?.filter((service) => {
          const passengerFullName =
            searchedPassenger.fullName ||
            `${searchedPassenger.firstName} ${searchedPassenger.lastName}`.trim();
          return (
            !service.passengerName ||
            service.passengerName === passengerFullName
          );
        }) || [],
    };

    return filteredBooking;
  };

  const handleProceedToSeatSelection = () => {
    setCurrentStep("seat-selection");
  };

  const handleSelectSeat = (seatNumber, seatType, seatId) => {
    setSelectedSeat({ seatNumber, seatType, seatId });
  };

  const resolveSeatId = (bookingData, seatData, passenger) => {
    // For INFANT passengers, no seat is required
    if (passenger?.type === "INFANT") {
      return null; // INFANT doesn't need a seat
    }

    if (seatData?.seatId) {
      return seatData.seatId;
    }

    // For new seats without seatId, use seatNumber as seatId
    if (seatData?.seatNumber && seatData.seatNumber !== passenger?.seatNumber) {
      return seatData.seatNumber;
    }

    if (passenger?.seatId) {
      return passenger.seatId;
    }

    const currentSeatNumber = passenger?.seatNumber;
    if (!currentSeatNumber) {
      throw new Error("Không tìm thấy thông tin ghế");
    }

    const seatDetails = bookingData.seatTypeDetails?.find((detail) => {
      const seatMatch = detail.seatNumber === currentSeatNumber;

      // For one-way flights, passenger.segmentId might be null
      if (passenger?.segmentId === null) {
        // One-way flight: just match by seat number and passenger name
        const passengerFullName =
          passenger.fullName ||
          `${passenger.firstName} ${passenger.lastName}`.trim();
        const match = seatMatch && detail.passengerName === passengerFullName;

        return match;
      } else {
        // Multi-segment flight: match by both seat number and segmentId
        const match = seatMatch && detail.segmentId === passenger.segmentId;

        return match;
      }
    });

    if (!seatDetails?.seatId) {
      throw new Error(`Không tìm thấy ID ghế cho ghế ${currentSeatNumber}`);
    }

    return seatDetails.seatId;
  };

  const handleConfirmCheckIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Validate payment status for the entire booking (not per segment)
      // For roundtrip bookings, if at least one segment is already checked-in,
      // we can assume payment was completed for the entire booking
      const hasCheckedInSegments = booking?.flightSegments?.some(
        (segment) => segment.checkinStatus === "COMPLETED"
      );

      const isBookingPaid =
        booking?.paymentStatus === "COMPLETED" ||
        booking?.status === "CONFIRMED" ||
        hasCheckedInSegments; // Roundtrip: if any segment checked-in, payment is valid

      if (!isBookingPaid) {
        throw new Error(
          "Payment not completed or insufficient. Please complete payment before check-in."
        );
      }

      // Get the correct passenger for the selected segment
      let selectedPassenger;
      if (selectedSegment) {
        // Find passenger that matches the selectedSegment
        selectedPassenger =
          booking.checkinEligiblePassengers?.find(
            (p) =>
              p.passengerId === selectedSegment.passengerId &&
              p.segmentId === selectedSegment.segmentId
          ) || selectedSegment;
      } else {
        // Fallback to filtered booking
        const filteredBooking = getFilteredBookingData();
        selectedPassenger =
          filteredBooking?.checkinEligiblePassengers?.[0] || passengers[0];
      }

      const newSeatId = resolveSeatId(booking, selectedSeat, selectedPassenger);

      // For INFANT passengers, seatId can be null
      if (
        selectedPassenger?.type !== "INFANT" &&
        (typeof newSeatId === "string" || !newSeatId)
      ) {
        throw new Error(`Seat ID không hợp lệ: ${newSeatId}`);
      }

      const finalSegmentId =
        selectedPassenger?.segmentId || selectedSegment?.segmentId;

      // Validate that seat ID belongs to the correct segment
      const seatValidation = booking.seatTypeDetails?.find(
        (d) =>
          d.seatId === newSeatId ||
          d.seatNumber === selectedPassenger?.seatNumber
      );

      // CRITICAL: Validate seat belongs to correct segment (only for multi-segment flights)
      if (
        finalSegmentId !== null &&
        seatValidation &&
        seatValidation.segmentId !== finalSegmentId
      ) {
        console.error(
          "❌ SEAT ID MISMATCH! Seat belongs to different segment:",
          {
            seatId: newSeatId,
            seatSegment: seatValidation.segmentId,
            expectedSegment: finalSegmentId,
          }
        );
        throw new Error(
          `Ghế không thuộc phân khúc đúng. Ghế ${newSeatId} thuộc phân khúc ${seatValidation.segmentId}, nhưng cần phân khúc ${finalSegmentId}`
        );
      }

      const checkinData = {
        bookingCode: booking.bookingCode,
        passengerFullName:
          selectedPassenger.fullName ||
          `${selectedPassenger.firstName} ${selectedPassenger.lastName}`.trim(),
        passengerId: selectedPassenger.passengerId,
        newSeatId: newSeatId, // Send as newSeatId for seat changes
        segmentId:
          finalSegmentId ||
          seatValidation?.segmentId ||
          selectedSeat?.segmentId, // Include segment ID
        seatNumber: selectedSeat?.seatNumber, // Include seat number for new seat assignments
      };

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {
        const checkinResponse = response.data;

        // Update the booking with check-in response
        const updatedBooking = {
          ...booking,
          ...checkinResponse,
          isCheckedIn: true,
          checkinStatus: "COMPLETED",
          checkInTime: new Date().toISOString(),
        };

        setBooking(updatedBooking);

        // Update the selected passenger's check-in status
        if (checkinResponse.boardingpassurl && selectedPassenger) {
          selectedPassenger.boardingpassurl = checkinResponse.boardingpassurl;
          selectedPassenger.checkinStatus = "ALREADY_CHECKED_IN";
          selectedPassenger.checkedIn = true;
        }

        if (checkinResponse.totalCharge > 0) {
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

          const updateResponse = await bookingApi.updateBookingTotal(
            booking.bookingId || booking.id,
            updateData
          );

          if (updateResponse.success) {
            setHasUpdatedTotal(true);

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

  // const proceedWithCheckinAfterPaymentWithData = async (
  //   bookingData,
  //   seatData,
  //   servicesData
  // ) => {
  //   try {
  //     console.log("🎫 Starting auto check-in after payment with data:", {
  //       bookingCode: bookingData.bookingCode,
  //       seatData,
  //       servicesData,
  //     });

  //     const selectedPassenger = bookingData.checkinEligiblePassengers?.[0];
  //     if (!selectedPassenger) {
  //       throw new Error("Không tìm thấy thông tin hành khách");
  //     }

  //     // ✅ Sử dụng selectedSegment để lấy segmentId cho check-in
  //     const segmentId = selectedSegment?.segmentId || selectedPassenger.segmentId;

  //     const newSeatId = resolveSeatId(bookingData, seatData, selectedPassenger);

  //     const checkinData = {
  //       bookingCode: bookingData.bookingCode,
  //       passengerId: selectedPassenger.passengerId,
  //       segmentId: segmentId, // ✅ Thêm segmentId cho roundtrip check-in
  //       newSeatId,
  //       servicesToAdd: servicesData.map((service) => ({
  //         serviceId: service.id || service.serviceId,
  //         quantity: service.quantity || 1,
  //       })),
  //     };

  //     console.log("📝 Submitting check-in data:", checkinData);

  //     const response = await bookingApi.processCheckin(checkinData);

  //     if (response.success && response.data) {
  //       console.log("✅ Auto check-in successful:", response.data);

  //       // Check-in is now complete after payment - no additional payment required
  //       const updatedBooking = {
  //         ...bookingData,
  //         ...response.data,
  //         isCheckedIn: true,
  //         checkinStatus: "COMPLETED",
  //         checkInTime: new Date().toISOString(),
  //         boardingPassUrl: response.data.boardingPassUrl,
  //       };

  //       setBooking(updatedBooking);
  //       setCurrentStep("success");
  //       toast.success("Check-in hoàn tất thành công!");
  //     } else {
  //       console.warn("⚠️ Auto check-in failed:", response);
  //       throw new Error(response.message || "Lỗi check-in");
  //     }
  //   } catch (error) {
  //     console.error("❌ Auto check-in failed:", error);

  //     // If auto check-in fails, redirect to completion page for manual check-in
  //     console.log("🔄 Redirecting to completion page for manual check-in");

  //     toast.info("Vui lòng hoàn tất check-in thủ công");

  //     // Set data for manual check-in
  //     setBooking(bookingData);
  //     setSelectedSeat(seatData);
  //     setSelectedServices(servicesData);
  //     setFromPaymentSuccess(true);
  //     setCurrentStep("completion");

  //     // Don't show error toast for auto check-in failure, just redirect
  //   }
  // };

  // Handle downloading boarding pass
  const handleDownloadBoardingPass = async () => {
    try {
      // TODO: Implement actual download logic
      // For now, just show a success message
      toast.success(
        "Tính năng tải xuống thẻ lên máy bay đang được phát triển!"
      );
    } catch (error) {
      console.error("Failed to download boarding pass:", error);
      toast.error("Có lỗi xảy ra khi tải xuống thẻ lên máy bay.");
    }
  };

  // Handle emailing boarding pass
  const handleEmailBoardingPass = async () => {
    try {
      // TODO: Implement actual email logic
      // For now, just show a success message
      toast.success(
        "Tính năng gửi email thẻ lên máy bay đang được phát triển!"
      );
    } catch (error) {
      console.error("Failed to email boarding pass:", error);
      toast.error("Có lỗi xảy ra khi gửi email thẻ lên máy bay.");
    }
  };

  const proceedWithCheckinAfterPaymentWithData = async (
    bookingData,
    seatData,
    servicesData
  ) => {
    try {

      const selectedPassenger = bookingData.checkinEligiblePassengers?.[0];
      if (!selectedPassenger) {
        throw new Error("Không tìm thấy thông tin hành khách");
      }

      // ✅ Sử dụng selectedSegment để lấy segmentId cho check-in
      const segmentId =
        selectedSegment?.segmentId || selectedPassenger.segmentId;

      const newSeatId = resolveSeatId(bookingData, seatData, selectedPassenger);

      const checkinData = {
        bookingCode: bookingData.bookingCode,
        passengerId: selectedPassenger.passengerId,
        segmentId: segmentId, // ✅ Thêm segmentId cho roundtrip check-in
        newSeatId,
        servicesToAdd: servicesData.map((service) => ({
          serviceId: service.id || service.serviceId,
          quantity: service.quantity || 1,
        })),
      };

      const response = await bookingApi.processCheckin(checkinData);

      if (response.success && response.data) {

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

  // Handle refreshing check-in status
  const handleRefreshCheckIn = async () => {
    try {
      if (!booking?.bookingCode) {
        console.warn("No booking code available for refresh");
        return;
      }

      // Re-fetch booking data to get updated check-in status
      const refreshResponse = await checkinApi.lookupBookingForCheckin(
        booking.bookingCode,
        booking.checkinEligiblePassengers?.[0]?.fullName ||
          booking.passengers?.[0]?.fullName
      );

      if (refreshResponse.success && refreshResponse.data) {
        const updatedBooking = refreshResponse.data;
        setBooking(updatedBooking);

        // ✅ Sửa logic để áp dụng quy tắc sequential check-in cho roundtrip
        // Check if there are still eligible segments for check-in with sequential rules
        const allSegments = updatedBooking.checkinEligiblePassengers || [];
        const checkedInSegments = allSegments.filter(
          (passenger) =>
            passenger.checkinStatus === "ALREADY_CHECKED_IN" ||
            passenger.checkinStatus === "COMPLETED"
        );

        // Nếu tất cả segments đã check-in, không làm gì thêm
        if (checkedInSegments.length === allSegments.length) {

          toast.success("Tất cả các chuyến bay đã được check-in thành công!");
          return;
        }

        // Tìm segments có thể check-in theo quy tắc sequential
        const sortedSegments = allSegments.sort(
          (a, b) => a.segmentOrder - b.segmentOrder
        );
        let nextSelectableSegment = null;

        for (const segment of sortedSegments) {
          // Nếu segment đã check-in, bỏ qua
          if (
            segment.checkinStatus === "ALREADY_CHECKED_IN" ||
            segment.checkinStatus === "COMPLETED"
          ) {
            continue;
          }

          // Segment 1 luôn có thể check-in nếu chưa check-in
          if (
            segment.segmentOrder === 1 &&
            segment.checkinStatus === "ELIGIBLE"
          ) {
            nextSelectableSegment = segment;
            break;
          }
          // Segment 2+ chỉ có thể check-in nếu segment trước đó đã check-in
          else if (segment.segmentOrder > 1) {
            const previousSegment = allSegments.find(
              (p) => p.segmentOrder === segment.segmentOrder - 1
            );
            if (
              previousSegment?.checkinStatus === "ALREADY_CHECKED_IN" ||
              previousSegment?.checkinStatus === "COMPLETED"
            ) {
              // Segment có thể eligible ngay cả khi status là "PREVIOUS_SEGMENT_NOT_CHECKED_IN"
              // nếu segment trước đã check-in
              nextSelectableSegment = segment;
              break;
            }
          }
        }

        if (nextSelectableSegment) {

          setSelectedSegment(nextSelectableSegment);

          // Reset seat and services selection for new segment
          setSelectedSeat(null);
          setSelectedServices([]);
          setAdditionalCost(0);

          toast.success(
            `Đã chuyển sang check-in chuyến ${nextSelectableSegment.segmentOrder}: ${nextSelectableSegment.flightNumber}`
          );
        } else {

          toast.info(
            "Vui lòng hoàn thành check-in chuyến bay trước đó trước khi tiếp tục."
          );
        }
      } else {
        throw new Error(
          refreshResponse.message || "Failed to refresh booking data"
        );
      }
    } catch (error) {
      console.error("Failed to refresh check-in status:", error);
      toast.error("Có lỗi xảy ra khi làm mới trạng thái check-in.");
    }
  };

  // ... rest of the functions remain the same (handleDownloadBoardingPass, handleEmailBoardingPass, etc.)

  const handlePassengerSelect = (passenger) => {
    setSelectedSegment(passenger);
    // Reset seat and services when changing passengers
    setSelectedSeat(null);
    setSelectedServices([]);
    setAdditionalCost(0);
    toast.success(
      `Đã chọn check-in cho hành khách: ${passenger.firstName} ${passenger.lastName}`
    );
  };

  const handleBack = () => {
    switch (currentStep) {
      case "details":
        setCurrentStep("search");
        // Reset searched passenger when going back to search
        setSearchedPassengerName("");
        break;
      case "seat-selection":
        setCurrentStep("details");
        break;
      case "success":
      case "already-done":
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
            booking={getFilteredBookingData()}
            selectedPassenger={selectedSegment}
            onProceed={handleProceedToSeatSelection}
            onBack={handleBack}
            onPassengerSelect={handlePassengerSelect}
          />
        );
      case "seat-selection":
        return (
          <CheckInSeatSelection
            booking={getFilteredBookingData()}
            selectedPassenger={selectedSegment}
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
            booking={getFilteredBookingData()}
            selectedSegment={selectedSegment}
            onNewCheckIn={() => {
              setBooking(null);
              setPassengers([]);
              setSelectedSeat(null);
              setSelectedSegment(null); // Reset selectedSegment
              setSearchedPassengerName(""); // Reset searched passenger name
              setError("");
              setCurrentStep("search");
            }}
            onDownload={handleDownloadBoardingPass}
            onEmail={handleEmailBoardingPass}
            onRefresh={handleRefreshCheckIn}
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
