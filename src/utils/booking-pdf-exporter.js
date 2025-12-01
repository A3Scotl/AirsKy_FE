import PDFTemplate from "@/lib/pdf-template";

// Helper functions
const getStatusText = (status) => {
  const statusMap = {
    CONFIRMED: "ĐÃ XÁC NHẬN",
    PENDING: "CHỜ XỬ LÝ",
    CANCELLED: "ĐÃ HỦY",
    COMPLETED: "HOÀN THÀNH",
  };
  return statusMap[status] || status;
};

const getPaymentMethodName = (method) => {
  const methodMap = {
    PAYPAL: "PayPal",
    BANK_TRANSFER: "Chuyển khoản",
    SEPAY: "SePay",
    MOMO: "Momo",
    CREDIT_CARD: "Thẻ tín dụng",
  };
  return methodMap[method] || method;
};

const getPaymentStatusName = (status) => {
  const statusMap = {
    COMPLETED: "Đã thanh toán",
    PENDING: "Chờ thanh toán",
    FAILED: "Thất bại",
    REFUNDED: "Đã hoàn tiền",
  };
  return statusMap[status] || status;
};

const formatCurrency = (amount) => {
  if (!amount) return "0 VNĐ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";
};

const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString || "N/A";
  }
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  } catch {
    return dateString || "N/A";
  }
};

/**
 * Xuất booking details ra PDF với thiết kế chuyên nghiệp và đầy đủ thông tin
 */
export const exportBookingToPDF = async (bookingData) => {
  // Extract booking from data object if needed
  const booking = bookingData?.data || bookingData;

  if (!booking) {
    throw new Error("Không có thông tin đặt vé để xuất PDF");
  }

  try {
    const pdfTemplate = new PDFTemplate();
    await pdfTemplate.initialize();

    // Page settings
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let currentY = 30;
    let currentPage = 1;

    // Function to check if we need a new page
    const checkNewPage = (requiredHeight) => {
      if (currentY + requiredHeight > pageHeight - 40) {
        pdfTemplate.doc.addPage();
        currentPage++;
        currentY = 30;

        // Add header on new page
        pdfTemplate.addHeader("AIRSKY", "Hệ thống đặt vé máy bay");
        currentY = 70;
        return true;
      }
      return false;
    };

    // HEADER SECTION
    pdfTemplate.addHeader("AIRSKY", "Hệ thống đặt vé máy bay");

    // Booking Reference - Large and prominent
    pdfTemplate.addText(
      `MÃ ĐẶT VÉ: ${booking.bookingCode || "N/A"}`,
      margin,
      currentY,
      {
        fontSize: 18,
        style: "bold",
        color: [0, 102, 204],
      }
    );

    // Status badge
    const statusColor =
      booking.status === "CONFIRMED"
        ? [34, 139, 34]
        : booking.status === "PENDING"
        ? [255, 140, 0]
        : [220, 20, 60];

    pdfTemplate.addText(
      `TRẠNG THÁI: ${getStatusText(booking.status)}`,
      140,
      currentY,
      {
        fontSize: 12,
        style: "bold",
        color: statusColor,
      }
    );

    currentY += 25;

    // Booking date and ID
    pdfTemplate.addText(
      `Ngày đặt: ${formatDate(booking.bookingDate)}`,
      margin,
      currentY,
      {
        fontSize: 10,
        color: [100, 100, 100],
      }
    );

    pdfTemplate.addText(`ID đặt vé: ${booking.bookingId}`, 140, currentY, {
      fontSize: 10,
      color: [100, 100, 100],
    });

    currentY += 20;

    // FLIGHT INFORMATION SECTION
    const flightSegments = booking.flightSegments || [];
    if (flightSegments.length > 0) {
      flightSegments.forEach((segment, index) => {
        checkNewPage(80);
        pdfTemplate.doc.setFillColor(240, 248, 255);
        pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

        pdfTemplate.addText(
          `✈️ THÔNG TIN CHUYẾN BAY ${index + 1}`,
          margin + 5,
          currentY + 10,
          {
            fontSize: 14,
            style: "bold",
            color: [0, 51, 102],
          }
        );

        currentY += 20;

        // Flight details box
        pdfTemplate.doc.setDrawColor(200, 200, 200);
        pdfTemplate.doc.setLineWidth(0.5);
        pdfTemplate.doc.rect(margin, currentY, contentWidth, 60);

        // Left column - Flight info
        pdfTemplate.addText(
          `Mã chuyến bay: ${segment.flightNumber}`,
          margin + 5,
          currentY + 8,
          {
            fontSize: 11,
            style: "bold",
          }
        );

        pdfTemplate.addText(
          `Hạng ghế: ${segment.className}`,
          margin + 5,
          currentY + 18,
          {
            fontSize: 10,
          }
        );

        pdfTemplate.addText(
          `Máy bay: ${segment.aircraft || "N/A"}`,
          margin + 5,
          currentY + 28,
          {
            fontSize: 10,
          }
        );

        pdfTemplate.addText(
          `Thời gian bay: ${segment.duration || "N/A"}`,
          margin + 5,
          currentY + 38,
          {
            fontSize: 10,
          }
        );

        pdfTemplate.addText(
          `Giá vé: ${formatCurrency(segment.price)}`,
          margin + 5,
          currentY + 48,
          {
            fontSize: 11,
            style: "bold",
            color: [0, 128, 0],
          }
        );

        // Right column - Route and time
        const rightColX = margin + 85;

        pdfTemplate.addText("TUYẾN BAY:", rightColX, currentY + 8, {
          fontSize: 10,
          style: "bold",
        });

        pdfTemplate.addText(
          `${segment.departureAirport?.airportCode} → ${segment.arrivalAirport?.airportCode}`,
          rightColX,
          currentY + 18,
          {
            fontSize: 12,
            style: "bold",
            color: [0, 102, 204],
          }
        );

        pdfTemplate.addText(
          `${segment.departureAirport?.airportName}`,
          rightColX,
          currentY + 28,
          {
            fontSize: 9,
            color: [100, 100, 100],
          }
        );

        pdfTemplate.addText(
          `${segment.arrivalAirport?.airportName}`,
          rightColX,
          currentY + 38,
          {
            fontSize: 9,
            color: [100, 100, 100],
          }
        );

        // Times
        pdfTemplate.addText(
          `Khởi hành: ${formatDateTime(segment.departureTime)}`,
          rightColX,
          currentY + 48,
          {
            fontSize: 9,
          }
        );

        currentY += 70;

        // Arrival time on next line
        pdfTemplate.addText(
          `Đến nơi: ${formatDateTime(segment.arrivalTime)}`,
          margin + 5,
          currentY,
          {
            fontSize: 9,
          }
        );

        // Gate info if available
        const gate = segment.departureAirport?.gates?.[0];
        if (gate) {
          pdfTemplate.addText(
            `Cổng khởi hành: ${gate.gateName} - Terminal ${gate.terminal}`,
            margin + 85,
            currentY,
            {
              fontSize: 9,
            }
          );
        }

        currentY += 15;
      });
    }

    // CONTACT INFORMATION SECTION
    checkNewPage(40);
    pdfTemplate.doc.setFillColor(255, 248, 220);
    pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

    pdfTemplate.addText("👤 THÔNG TIN LIÊN HỆ", margin + 5, currentY + 10, {
      fontSize: 14,
      style: "bold",
      color: [102, 51, 0],
    });

    currentY += 20;

    pdfTemplate.doc.rect(margin, currentY, contentWidth, 25);
    pdfTemplate.addText(
      `Họ tên: ${booking.contactName}`,
      margin + 5,
      currentY + 8,
      {
        fontSize: 11,
        style: "bold",
      }
    );

    pdfTemplate.addText(
      `Email: ${booking.contactEmail}`,
      margin + 5,
      currentY + 16,
      {
        fontSize: 10,
      }
    );

    currentY += 35;

    // PASSENGER INFORMATION SECTION
    const passengersList = booking.passengers || [];
    if (passengersList.length > 0) {
      checkNewPage(50);
      pdfTemplate.doc.setFillColor(255, 240, 245);
      pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

      pdfTemplate.addText(
        "👥 DANH SÁCH HÀNH KHÁCH",
        margin + 5,
        currentY + 10,
        {
          fontSize: 14,
          style: "bold",
          color: [102, 0, 102],
        }
      );

      currentY += 20;

      passengersList.forEach((passenger, index) => {
        checkNewPage(60);

        // Passenger card
        pdfTemplate.doc.setDrawColor(200, 200, 200);
        pdfTemplate.doc.rect(margin, currentY, contentWidth, 50);

        // Passenger name and type
        pdfTemplate.addText(
          `${index + 1}. ${passenger.firstName} ${passenger.lastName}`,
          margin + 5,
          currentY + 8,
          {
            fontSize: 12,
            style: "bold",
          }
        );

        pdfTemplate.addText(
          `${
            passenger.type === "ADULT"
              ? "Người lớn"
              : passenger.type === "CHILD"
              ? "Trẻ em"
              : "Em bé"
          }`,
          margin + 80,
          currentY + 8,
          {
            fontSize: 10,
            color: [100, 100, 100],
          }
        );

        // Personal info
        pdfTemplate.addText(
          `Ngày sinh: ${formatDate(passenger.dateOfBirth)}`,
          margin + 5,
          currentY + 18,
          {
            fontSize: 9,
          }
        );

        pdfTemplate.addText(
          `Giới tính: ${
            passenger.gender === "MALE"
              ? "Nam"
              : passenger.gender === "FEMALE"
              ? "Nữ"
              : "N/A"
          }`,
          margin + 60,
          currentY + 18,
          {
            fontSize: 9,
          }
        );

        pdfTemplate.addText(
          `Passport: ${passenger.passportNumber}`,
          margin + 5,
          currentY + 28,
          {
            fontSize: 9,
          }
        );

        pdfTemplate.addText(
          `Quốc tịch: ${passenger.nationality || "Vietnam"}`,
          margin + 60,
          currentY + 28,
          {
            fontSize: 9,
          }
        );

        // Seat assignments
        if (passenger.seatAssignments && passenger.seatAssignments.length > 0) {
          passenger.seatAssignments.forEach((seat, seatIndex) => {
            const seatY = currentY + 38 + seatIndex * 8;
            pdfTemplate.addText(
              `Ghế ${seat.segmentOrder}: ${seat.seatNumber} (${
                seat.seatType === "EXTRA_LEGROOM"
                  ? "Chỗ để chân rộng"
                  : "Thường"
              })`,
              margin + 5,
              seatY,
              {
                fontSize: 9,
                style: "bold",
                color: [0, 102, 204],
              }
            );
          });
        }

        // Contact info
        if (passenger.phone) {
          pdfTemplate.addText(
            `Điện thoại: ${passenger.phone}`,
            margin + 110,
            currentY + 18,
            {
              fontSize: 9,
            }
          );
        }

        currentY += 60;
      });
    }

    // BAGGAGE INFORMATION SECTION
    const baggageList = booking.baggage || [];
    if (baggageList.length > 0) {
      checkNewPage(40);
      pdfTemplate.doc.setFillColor(240, 255, 240);
      pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

      pdfTemplate.addText("🧳 THÔNG TIN HÀNH LÝ", margin + 5, currentY + 10, {
        fontSize: 14,
        style: "bold",
        color: [0, 102, 0],
      });

      currentY += 20;

      baggageList.forEach((bag, index) => {
        checkNewPage(25);
        pdfTemplate.doc.rect(margin, currentY, contentWidth, 20);

        pdfTemplate.addText(
          `${index + 1}. ${
            bag.type === "CHECK_IN" ? "Hành lý ký gửi" : "Hành lý xách tay"
          }`,
          margin + 5,
          currentY + 8,
          {
            fontSize: 10,
          }
        );

        pdfTemplate.addText(
          `Gói: ${bag.purchasedPackage}`,
          margin + 5,
          currentY + 16,
          {
            fontSize: 9,
          }
        );

        pdfTemplate.addText(
          `Giá: ${formatCurrency(bag.packagePrice)}`,
          margin + 120,
          currentY + 8,
          {
            fontSize: 10,
            style: "bold",
          }
        );

        if (bag.actualWeight) {
          pdfTemplate.addText(
            `Cân nặng: ${bag.actualWeight}kg`,
            margin + 120,
            currentY + 16,
            {
              fontSize: 9,
            }
          );
        }

        currentY += 30;
      });
    }

    // ANCILLARY SERVICES SECTION
    const servicesList = booking.ancillaryServices || [];
    if (servicesList.length > 0) {
      checkNewPage(40);
      pdfTemplate.doc.setFillColor(255, 245, 238);
      pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

      pdfTemplate.addText("🛍️ DỊCH VỤ BỔ SUNG", margin + 5, currentY + 10, {
        fontSize: 14,
        style: "bold",
        color: [153, 51, 0],
      });

      currentY += 20;

      servicesList.forEach((service, index) => {
        checkNewPage(25);
        pdfTemplate.doc.rect(margin, currentY, contentWidth, 20);

        pdfTemplate.addText(
          `${index + 1}. ${
            service.serviceName || service.serviceTypeDisplayName
          }`,
          margin + 5,
          currentY + 8,
          {
            fontSize: 10,
          }
        );

        pdfTemplate.addText(
          `Số lượng: ${service.quantity || 1}`,
          margin + 5,
          currentY + 16,
          {
            fontSize: 9,
          }
        );

        pdfTemplate.addText(
          `Đơn giá: ${formatCurrency(service.unitPrice)}`,
          margin + 100,
          currentY + 8,
          {
            fontSize: 10,
          }
        );

        pdfTemplate.addText(
          `Tổng: ${formatCurrency(service.totalPrice)}`,
          margin + 100,
          currentY + 16,
          {
            fontSize: 10,
            style: "bold",
          }
        );

        currentY += 30;
      });
    }

    // PAYMENT INFORMATION SECTION
    if (booking.payment) {
      checkNewPage(60);
      pdfTemplate.doc.setFillColor(248, 248, 255);
      pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

      pdfTemplate.addText(
        "💳 THÔNG TIN THANH TOÁN",
        margin + 5,
        currentY + 10,
        {
          fontSize: 14,
          style: "bold",
          color: [51, 51, 153],
        }
      );

      currentY += 20;

      pdfTemplate.doc.rect(margin, currentY, contentWidth, 45);

      pdfTemplate.addText(
        `Phương thức thanh toán: ${getPaymentMethodName(
          booking.payment.paymentMethod
        )}`,
        margin + 5,
        currentY + 8,
        {
          fontSize: 11,
          style: "bold",
        }
      );

      pdfTemplate.addText(
        `Trạng thái: ${getPaymentStatusName(booking.payment.status)}`,
        margin + 5,
        currentY + 18,
        {
          fontSize: 10,
        }
      );

      pdfTemplate.addText(
        `Ngày thanh toán: ${formatDateTime(booking.payment.paymentDate)}`,
        margin + 5,
        currentY + 28,
        {
          fontSize: 10,
        }
      );

      if (booking.payment.transactionId) {
        pdfTemplate.addText(
          `Mã giao dịch: ${booking.payment.transactionId}`,
          margin + 5,
          currentY + 38,
          {
            fontSize: 9,
            color: [100, 100, 100],
          }
        );
      }

      currentY += 55;
    }

    // COST BREAKDOWN SECTION
    checkNewPage(80);
    pdfTemplate.doc.setFillColor(255, 255, 240);
    pdfTemplate.doc.rect(margin, currentY, contentWidth, 15, "F");

    pdfTemplate.addText("💰 CHI TIẾT CHI PHÍ", margin + 5, currentY + 10, {
      fontSize: 14,
      style: "bold",
      color: [102, 102, 0],
    });

    currentY += 20;

    pdfTemplate.doc.rect(margin, currentY, contentWidth, 60);

    // Calculate totals
    const flightTotal = flightSegments.reduce(
      (sum, segment) => sum + (segment.price || 0),
      0
    );
    const baggageTotal = baggageList.reduce(
      (sum, bag) => sum + (bag.packagePrice || 0),
      0
    );
    const ancillaryTotal = booking.ancillaryServicesAmount || 0;
    const seatTotal = booking.seatTypeAmount || 0;
    const discountTotal = booking.discountAmount || 0;
    const pointsDiscount = booking.pointsDiscountAmount || 0;

    let lineY = currentY + 8;
    pdfTemplate.addText(
      `Giá vé máy bay: ${formatCurrency(flightTotal)}`,
      margin + 5,
      lineY,
      {
        fontSize: 10,
      }
    );

    if (baggageTotal > 0) {
      lineY += 8;
      pdfTemplate.addText(
        `Hành lý: ${formatCurrency(baggageTotal)}`,
        margin + 5,
        lineY,
        {
          fontSize: 10,
        }
      );
    }

    if (ancillaryTotal > 0) {
      lineY += 8;
      pdfTemplate.addText(
        `Dịch vụ bổ sung: ${formatCurrency(ancillaryTotal)}`,
        margin + 5,
        lineY,
        {
          fontSize: 10,
        }
      );
    }

    if (seatTotal > 0) {
      lineY += 8;
      pdfTemplate.addText(
        `Phí chọn ghế: ${formatCurrency(seatTotal)}`,
        margin + 5,
        lineY,
        {
          fontSize: 10,
        }
      );
    }

    if (discountTotal > 0) {
      lineY += 8;
      pdfTemplate.addText(
        `Giảm giá: -${formatCurrency(discountTotal)}`,
        margin + 5,
        lineY,
        {
          fontSize: 10,
          color: [255, 0, 0],
        }
      );
    }

    if (pointsDiscount > 0) {
      lineY += 8;
      pdfTemplate.addText(
        `Giảm giá điểm: -${formatCurrency(pointsDiscount)}`,
        margin + 5,
        lineY,
        {
          fontSize: 10,
          color: [255, 0, 0],
        }
      );
    }

    // Total amount - prominent
    pdfTemplate.doc.setFillColor(240, 255, 240);
    pdfTemplate.doc.rect(margin, currentY + 55, contentWidth, 15, "F");

    pdfTemplate.addText(
      `TỔNG TIỀN: ${formatCurrency(booking.totalAmount)}`,
      margin + 5,
      currentY + 63,
      {
        fontSize: 14,
        style: "bold",
        color: [0, 128, 0],
      }
    );

    currentY += 80;

    // FOOTER
    pdfTemplate.addFooter(
      "Cảm ơn quý khách đã sử dụng dịch vụ AirSky!",
      "Hotline: 1900 xxxx | Email: support@airsky.vn | Website: www.airsky.vn"
    );

    // Save PDF
    const filename = `VeMayBay_${booking.bookingCode}_${Date.now()}.pdf`;
    pdfTemplate.save(filename);

    return true;
  } catch (error) {
    console.error("Error exporting booking to PDF:", error);
    throw new Error(`Lỗi xuất PDF: ${error.message}`);
  }
};

export default { exportBookingToPDF };
