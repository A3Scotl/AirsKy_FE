import React, { useState, useCallback, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrencyVND, formatDateVN } from "@/utils/currency-utils";
import * as XLSX from "xlsx";
import { useLazyReports } from "@/hooks/use-lazy-reports";
import PDFExporter from "@/utils/pdf-exporter";

// === CHỤP BIỂU ĐỒ ===
const CHART_SELECTORS = [
  "canvas[id*='revenue']",
  "canvas[id*='booking']",
  "canvas[id*='customer']",
  "canvas[id*='flight']",
  "canvas[id*='chart']",
  ".chart-container canvas",
  ".h-64 canvas",
  "canvas.chartjs-render-monitor",
];

const captureChart = async (selector) => {
  try {
    let el = document.querySelector(selector);
    if (!el) {
      const containers = document.querySelectorAll(
        ".chart-container, .h-64, .h-80, .card-content, .card"
      );
      for (const c of containers) {
        el = c.querySelector(selector);
        if (el) break;
      }
    }
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    if (el.tagName === "CANVAS") {
      try {
        const img = el.toDataURL("image/png", 0.95);
        return img.length > 1000 ? img : null;
      } catch {}
    }

    const container = el.closest(".card, .chart-container") || el;
    const canvas = await import("html2canvas").then((m) =>
      m.default(container, {
        backgroundColor: "#fff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: Math.max(rect.width, 400),
        height: Math.max(rect.height, 200),
      })
    );
    return canvas.toDataURL("image/png", 0.95);
  } catch (err) {
    console.warn("Capture failed:", selector, err);
    return null;
  }
};

const captureAllCharts = async () => {
  const images = [];
  for (const sel of CHART_SELECTORS) {
    const img = await captureChart(sel);
    if (img) images.push(img);
  }
  return images;
};

// === COMPONENT ===
const OverviewExportButton = ({
  rawData = {},
  processedData = [],
  dateRange,
  variant = "outline",
  size = "default",
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [includeSheets, setIncludeSheets] = useState({
    overview: true,
    bookings: true,
    customers: true,
    flights: true,
    summary: true,
  });
  const [includeCharts, setIncludeCharts] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { useExportData } = useLazyReports(dateRange);
  const bookingsQuery = useExportData(
    "bookings",
    isModalOpen && includeSheets.bookings
  );
  const customersQuery = useExportData(
    "customers",
    isModalOpen && includeSheets.customers
  );
  const flightsQuery = useExportData(
    "flights",
    isModalOpen && includeSheets.flights
  );

  const fullBookings = useMemo(
    () => bookingsQuery.data?.bookings || rawData?.bookings || [],
    [bookingsQuery.data, rawData]
  );
  const fullCustomers = useMemo(
    () => customersQuery.data?.users || rawData?.users || [],
    [customersQuery.data, rawData]
  );
  const fullFlights = useMemo(
    () => flightsQuery.data?.flights || rawData?.flights || [],
    [flightsQuery.data, rawData]
  );

  const handleSheetToggle = useCallback((key, checked) => {
    setIncludeSheets((prev) => ({ ...prev, [key]: checked }));
  }, []);

  const handleSelectAll = useCallback((checked) => {
    setIncludeSheets({
      overview: checked,
      bookings: checked,
      customers: checked,
      flights: checked,
      summary: checked,
    });
  }, []);

  const formatOverview = useCallback(() => {
    return processedData.map((row) => ({
      Ngày:
        exportFormat === "csv" ? formatDateVN(row.date) : new Date(row.date),
      "Tổng Doanh Thu (VND)":
        exportFormat === "csv"
          ? formatCurrencyVND(row.revenue || 0)
          : row.revenue || 0,
      "Tổng Đặt Vé": row.bookings || 0,
      "Tổng Khách Hàng": row.customers || 0,
      "Tổng Chuyến Bay": row.flights || 0,
      "TB/Đặt Vé (VND)":
        exportFormat === "csv"
          ? formatCurrencyVND(row.avgRevenuePerBooking || 0)
          : row.avgRevenuePerBooking || 0,
      "Tỷ Lệ Thành Công (%)":
        exportFormat === "csv"
          ? `${row.successRate || 0}%`
          : row.successRate || 0,
    }));
  }, [processedData, exportFormat]);

  const formatBookings = useCallback(() => {
    return fullBookings.map((b) => {
      // Tạo tên khách hàng từ thông tin có sẵn
      const customerName =
        b.contactName ||
        b.contact_name ||
        b.customerName ||
        (b.user
          ? `${b.user.firstName || ""} ${b.user.lastName || ""}`.trim()
          : "") ||
        (b.passengers && b.passengers.length > 0
          ? b.passengers[0].fullName
          : "") ||
        "N/A";

      // Tạo tuyến bay từ thông tin chuyến bay
      const route = b.flight
        ? `${
            b.flight.departureAirport?.airportCode ||
            b.flight.departure_airport_code ||
            "N/A"
          } → ${
            b.flight.arrivalAirport?.airportCode ||
            b.flight.arrival_airport_code ||
            "N/A"
          }`
        : `${b.departureAirportCode || "N/A"} → ${
            b.arrivalAirportCode || "N/A"
          }`;

      return {
        "Mã Đặt Vé":
          b.bookingCode || b.booking_code || `BK${b.bookingId || b.id}`,
        "Khách Hàng": customerName,
        "Tuyến Bay": route,
        "Ngày Đặt":
          b.bookingDate || b.booking_date || b.createdAt
            ? exportFormat === "csv"
              ? formatDateVN(b.bookingDate || b.booking_date || b.createdAt)
              : new Date(b.bookingDate || b.booking_date || b.createdAt)
            : "",
        "Số Hành Khách": b.passengers?.length || b.passengerCount || 1,
        "Tổng Tiền":
          exportFormat === "csv"
            ? formatCurrencyVND(b.totalAmount || b.totalPrice || 0)
            : b.totalAmount || b.totalPrice || 0,
        "Phương Thức": b.paymentMethod || b.payment_method || "N/A",
        "Trạng Thái": [1, "CONFIRMED"].includes(b.status)
          ? "Đã xác nhận"
          : [0, "PENDING"].includes(b.status)
          ? "Đang chờ"
          : "Đã hủy",
      };
    });
  }, [fullBookings, exportFormat]);

  const formatCustomers = useCallback(() => {
    return fullCustomers.map((u) => ({
      "Khách Hàng": `${u.firstName || ""} ${u.lastName || ""}`.trim() || "N/A",
      Email: u.email || "N/A",
      "Số Điện Thoại": u.phone || "N/A",
      "Vai Trò": u.role === "ADMIN" ? "Quản trị viên" : "Khách hàng",
      "Xác Minh": u.verified ? "Đã xác minh" : "Chưa xác minh",
      "Hạng Thành Viên":
        u.loyaltyTier === "GOLD"
          ? "Vàng"
          : u.loyaltyTier === "SILVER"
          ? "Bạc"
          : "Tiêu chuẩn",
      "Điểm Thưởng": u.loyaltyPoints || 0,
      "Ngày Tham Gia": u.createdAt
        ? exportFormat === "csv"
          ? formatDateVN(u.createdAt)
          : new Date(u.createdAt)
        : "",
      "Trạng Thái": u.active ? "Hoạt động" : "Không hoạt động",
    }));
  }, [fullCustomers, exportFormat]);

  const formatFlights = useCallback(() => {
    return fullFlights.map((f) => {
      const revenue =
        f.flightTravelClasses?.reduce(
          (s, c) => s + (c.price || 0) * (c.bookedSeat || c.booked_seat || 0),
          0
        ) ||
        f.revenue ||
        0;
      const bookedSeats =
        f.flightTravelClasses?.reduce(
          (s, c) => s + (c.bookedSeat || c.booked_seat || 0),
          0
        ) ||
        f.bookedSeats ||
        0;
      const totalSeats = f.aircraft?.totalSeats || f.totalSeats || 0;
      const occupancyRate =
        totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : 0;

      return {
        "Mã Chuyến Bay":
          f.flightNumber || f.flight_number || `FL${f.flightId || f.id}`,
        "Hãng Hàng Không":
          f.airline?.airlineName || f.airline?.name || f.airlineName || "N/A",
        "Tuyến Bay": `${
          f.departureAirport?.airportCode || f.departure_airport_code || "N/A"
        } → ${
          f.arrivalAirport?.airportCode || f.arrival_airport_code || "N/A"
        }`,
        "Giờ Khởi Hành":
          f.departureTime || f.departure_time
            ? exportFormat === "csv"
              ? formatDateVN(f.departureTime || f.departure_time)
              : new Date(f.departureTime || f.departure_time)
            : "",
        "Giờ Đến":
          f.arrivalTime || f.arrival_time
            ? exportFormat === "csv"
              ? formatDateVN(f.arrivalTime || f.arrival_time)
              : new Date(f.arrivalTime || f.arrival_time)
            : "",
        "Thời Lượng": f.duration || f.flightDuration || "N/A",
        "Loại Chuyến Bay": f.type === "DOMESTIC" ? "Nội địa" : "Quốc tế",
        "Ghế Đặt/Tổng": `${bookedSeats}/${totalSeats}`,
        "Tỷ Lệ Lấp Đầy": `${occupancyRate}%`,
        "Doanh Thu":
          exportFormat === "csv" ? formatCurrencyVND(revenue) : revenue,
        "Trạng Thái":
          f.status === "CANCELLED"
            ? "Đã hủy"
            : f.status === "DELAYED"
            ? "Trễ"
            : f.status === "DEPARTED"
            ? "Đã khởi hành"
            : f.status === "ON_TIME"
            ? "Đúng giờ"
            : "Đã lên lịch",
      };
    });
  }, [fullFlights, exportFormat]);

  const generateSummary = useCallback(() => {
    const b = rawData?.bookings || [];
    const u = rawData?.users || [];
    const f = rawData?.flights || [];

    const totalRevenue = b.reduce(
      (s, x) => s + (x.totalAmount || x.totalPrice || 0),
      0
    );
    const confirmed = b.filter((x) =>
      [1, "CONFIRMED"].includes(x.status)
    ).length;
    const confirmRate = b.length > 0 ? (confirmed / b.length) * 100 : 0;

    const totalSeats = f.reduce(
      (s, x) => s + (x.aircraft?.totalSeats || x.totalSeats || 0),
      0
    );
    const totalBooked = f.reduce((s, x) => {
      const booked =
        x.flightTravelClasses?.reduce(
          (ss, c) => ss + (c.bookedSeat || c.booked_seat || 0),
          0
        ) ||
        x.bookedSeats ||
        0;
      return s + booked;
    }, 0);
    const occupancy = totalSeats > 0 ? (totalBooked / totalSeats) * 100 : 0;

    const flightRevenue = f.reduce((s, x) => {
      const rev =
        x.flightTravelClasses?.reduce(
          (ss, c) => ss + (c.price || 0) * (c.bookedSeat || c.booked_seat || 0),
          0
        ) ||
        x.revenue ||
        0;
      return s + rev;
    }, 0);

    return [
      ["Thông Tin Báo Cáo", "Giá Trị"],
      ["Thời gian tạo báo cáo", format(new Date(), "dd/MM/yyyy HH:mm:ss")],
      ...(dateRange?.from && dateRange?.to
        ? [
            [
              "Khoảng thời gian",
              `${format(dateRange.from, "dd/MM/yyyy")} - ${format(
                dateRange.to,
                "dd/MM/yyyy"
              )}`,
            ],
          ]
        : []),
      [""],
      ["=== THỐNG KÊ TỔNG QUAN ===", ""],
      ["Tổng số đặt vé", b.length],
      ["Tổng số khách hàng", u.length],
      ["Tổng số chuyến bay", f.length],
      [
        "Tổng doanh thu (VND)",
        exportFormat === "csv" ? formatCurrencyVND(totalRevenue) : totalRevenue,
      ],
      [
        "Tỷ lệ xác nhận (%)",
        exportFormat === "csv" ? `${confirmRate.toFixed(2)}%` : confirmRate,
      ],
      [""],
      ["=== THỐNG KÊ ĐẶT VÉ ===", ""],
      ["Đặt vé đã xác nhận", confirmed],
      [
        "Đặt vé đang chờ",
        b.filter((x) => [0, "PENDING"].includes(x.status)).length,
      ],
      [
        "Đặt vé đã hủy",
        b.filter((x) => [2, "CANCELLED"].includes(x.status)).length,
      ],
      [
        "Tổng số hành khách",
        b.reduce(
          (s, x) => s + (x.passengers?.length || x.passengerCount || 1),
          0
        ),
      ],
      ...(b.length > 0
        ? [
            [
              "Doanh thu TB/vé (VND)",
              exportFormat === "csv"
                ? formatCurrencyVND(totalRevenue / b.length)
                : totalRevenue / b.length,
            ],
          ]
        : []),
      [""],
      ["=== THỐNG KÊ CHUYẾN BAY ===", ""],
      ["Tổng ghế", totalSeats],
      ["Tổng ghế đã đặt", totalBooked],
      ...(totalSeats > 0
        ? [
            [
              "Tỷ lệ lấp đầy (%)",
              exportFormat === "csv" ? `${occupancy.toFixed(2)}%` : occupancy,
            ],
          ]
        : []),
      [
        "Doanh thu từ chuyến bay (VND)",
        exportFormat === "csv"
          ? formatCurrencyVND(flightRevenue)
          : flightRevenue,
      ],
    ];
  }, [rawData, dateRange, exportFormat]);

  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    if (includeSheets.overview && processedData.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(formatOverview()),
        "Tổng Quan"
      );
    }
    if (includeSheets.bookings && fullBookings.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(formatBookings()),
        "Đặt Vé"
      );
    }
    if (includeSheets.customers && fullCustomers.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(formatCustomers()),
        "Khách Hàng"
      );
    }
    if (includeSheets.flights && fullFlights.length > 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(formatFlights()),
        "Chuyến Bay"
      );
    }
    if (includeSheets.summary) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet(generateSummary()),
        "Tóm Tắt"
      );
    }

    XLSX.writeFile(
      wb,
      `Bao_Cao_Tong_Quan_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
    );
  }, [
    includeSheets,
    processedData,
    fullBookings,
    fullCustomers,
    fullFlights,
    formatOverview,
    formatBookings,
    formatCustomers,
    formatFlights,
    generateSummary,
  ]);

  const exportToCSV = useCallback(() => {
    const parts = [];
    if (includeSheets.overview && processedData.length > 0) {
      parts.push("=== TỔNG QUAN ===");
      const data = formatOverview();
      const headers = Object.keys(data[0]);
      parts.push(headers.join(","));
      data.forEach((row) => {
        parts.push(
          headers
            .map((h) => {
              const v = row[h];
              return typeof v === "string" &&
                (v.includes(",") || v.includes('"'))
                ? `"${v.replace(/"/g, '""')}"`
                : v;
            })
            .join(",")
        );
      });
      parts.push("");
    }
    if (includeSheets.summary) {
      parts.push("=== TÓM TẮT ===");
      generateSummary().forEach((row) => parts.push(row.join(",")));
    }

    const blob = new Blob(["\uFEFF" + parts.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bao_Cao_Tong_Quan_${format(
      new Date(),
      "yyyyMMdd_HHmmss"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [includeSheets, processedData, formatOverview, generateSummary]);

  const exportToPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      // Chuẩn bị dữ liệu cho từng sheet
      const pdfData = [];
      const columns = [];

      if (includeSheets.overview && processedData.length > 0) {
        const overviewColumns = [
          { key: "date", title: "Ngày" },
          { key: "revenue", title: "Doanh Thu" },
          { key: "bookings", title: "Đặt Vé" },
          { key: "customers", title: "Khách Hàng" },
          { key: "flights", title: "Chuyến Bay" },
        ];
        pdfData.push({
          title: "DỮ LIỆU TỔNG QUAN",
          data: formatOverview(),
          columns: overviewColumns,
        });
      }

      if (includeSheets.bookings && fullBookings.length > 0) {
        const bookingColumns = [
          { key: "Mã Đặt Vé", title: "Mã Đặt Vé" },
          { key: "Khách Hàng", title: "Khách Hàng" },
          { key: "Tuyến Bay", title: "Tuyến Bay" },
          { key: "Ngày Đặt", title: "Ngày Đặt" },
          { key: "Số Hành Khách", title: "Số Hành Khách" },
          { key: "Tổng Tiền", title: "Tổng Tiền" },
          { key: "Phương Thức", title: "Phương Thức" },
          { key: "Trạng Thái", title: "Trạng Thái" },
        ];
        pdfData.push({
          title: "DỮ LIỆU ĐẶT VÉ",
          data: formatBookings(),
          columns: bookingColumns,
        });
      }

      if (includeSheets.customers && fullCustomers.length > 0) {
        const customerColumns = [
          { key: "Khách Hàng", title: "Khách Hàng" },
          { key: "Email", title: "Email" },
          { key: "Số Điện Thoại", title: "Số Điện Thoại" },
          { key: "Vai Trò", title: "Vai Trò" },
          { key: "Xác Minh", title: "Xác Minh" },
          { key: "Hạng Thành Viên", title: "Hạng Thành Viên" },
          { key: "Điểm Thưởng", title: "Điểm Thưởng" },
          { key: "Ngày Tham Gia", title: "Ngày Tham Gia" },
          { key: "Trạng Thái", title: "Trạng Thái" },
        ];
        pdfData.push({
          title: "DỮ LIỆU KHÁCH HÀNG",
          data: formatCustomers(),
          columns: customerColumns,
        });
      }

      if (includeSheets.flights && fullFlights.length > 0) {
        const flightColumns = [
          { key: "Mã Chuyến Bay", title: "Mã Chuyến Bay" },
          { key: "Hãng Hàng Không", title: "Hãng Hàng Không" },
          { key: "Tuyến Bay", title: "Tuyến Bay" },
          { key: "Giờ Khởi Hành", title: "Khởi Hành" },
          { key: "Giờ Đến", title: "Đến" },
          { key: "Thời Lượng", title: "Thời Lượng" },
          { key: "Loại Chuyến Bay", title: "Loại Chuyến" },
          { key: "Ghế Đặt/Tổng", title: "Ghế Đặt/Tổng" },
          { key: "Tỷ Lệ Lấp Đầy", title: "Tỷ Lệ Lấp Đầy" },
          { key: "Doanh Thu", title: "Doanh Thu" },
          { key: "Trạng Thái", title: "Trạng Thái" },
        ];
        pdfData.push({
          title: "DỮ LIỆU CHUYẾN BAY",
          data: formatFlights(),
          columns: flightColumns,
        });
      }

      // Chụp biểu đồ nếu được chọn
      let chartImages = [];
      if (includeCharts) {
        await new Promise((r) => setTimeout(r, 3000));
        chartImages = await captureAllCharts();
      }

      // Xuất từng sheet riêng biệt
      for (let i = 0; i < pdfData.length; i++) {
        const sheet = pdfData[i];
        await PDFExporter.exportToPDF(
          sheet.data,
          sheet.columns,
          sheet.title,
          "AIRSKY",
          chartImages[i] || null
        );
      }

      toast.success("Xuất PDF thành công!");
    } catch (err) {
      toast.error("Lỗi xuất PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [
    includeSheets,
    includeCharts,
    processedData,
    fullBookings,
    fullCustomers,
    fullFlights,
    formatOverview,
    formatBookings,
    formatCustomers,
    formatFlights,
    captureAllCharts,
  ]);

  const handleExport = useCallback(async () => {
    const selected = Object.values(includeSheets).filter(Boolean).length;
    if (selected === 0) return toast.error("Chọn ít nhất một sheet");

    setIsExporting(true);
    try {
      if (exportFormat === "xlsx") exportToExcel();
      else if (exportFormat === "pdf") await exportToPDF();
      else exportToCSV();
      toast.success("Xuất báo cáo thành công!");
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Lỗi: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [exportFormat, includeSheets, exportToExcel, exportToPDF, exportToCSV]);

  const selectedCount = Object.values(includeSheets).filter(Boolean).length;
  const hasData =
    processedData.length > 0 ||
    fullBookings.length > 0 ||
    fullCustomers.length > 0 ||
    fullFlights.length > 0;

  if (!hasData) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Download className="h-4 w-4 mr-2" /> Xuất file
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsModalOpen(true)}
      >
        <Download className="h-4 w-4 mr-2" /> Xuất file
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-lg lg:max-w-xl max-h-[80vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Download className="h-5 w-5" /> Xuất Báo Cáo Tổng Quan
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Xuất báo cáo tổng hợp bao gồm tất cả dữ liệu
            </DialogDescription>
            {dateRange?.from && dateRange?.to && (
              <div className="text-sm text-muted-foreground -mt-2 dark:text-gray-500">
                <Calendar className="h-4 w-4 inline mr-1" />
                Từ {format(dateRange.from, "dd/MM/yyyy")} đến{" "}
                {format(dateRange.to, "dd/MM/yyyy")}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="dark:text-white">Định dạng file</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-600">
                  <SelectItem
                    value="xlsx"
                    className="dark:text-white dark:focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="csv"
                    className="dark:text-white dark:focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="pdf"
                    className="dark:text-white dark:focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" /> PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="dark:text-white">
                  Chọn dữ liệu ({selectedCount}/5)
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all"
                    checked={Object.values(includeSheets).every(Boolean)}
                    onCheckedChange={handleSelectAll}
                    className="dark:border-gray-600"
                  />
                  <Label htmlFor="all" className="text-sm dark:text-white">
                    Tất cả
                  </Label>
                </div>
              </div>
              <div className="space-y-3 border rounded-md p-4 dark:border-gray-700 dark:bg-gray-800">
                {[
                  {
                    key: "overview",
                    label: "Tổng quan theo ngày",
                    count: processedData.length,
                  },
                  {
                    key: "bookings",
                    label: "Chi tiết đặt vé",
                    count: fullBookings.length,
                  },
                  {
                    key: "customers",
                    label: "Chi tiết khách hàng",
                    count: fullCustomers.length,
                  },
                  {
                    key: "flights",
                    label: "Chi tiết chuyến bay",
                    count: fullFlights.length,
                  },
                  {
                    key: "summary",
                    label: "Tóm tắt thống kê tổng hợp",
                    count: null,
                  },
                ].map(({ key, label, count }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={includeSheets[key]}
                      onCheckedChange={(c) => handleSheetToggle(key, !!c)}
                      disabled={count !== null && count === 0}
                      className="dark:border-gray-600"
                    />
                    <Label htmlFor={key} className="text-sm dark:text-white">
                      {key === "overview" && (
                        <BarChart3 className="h-4 w-4 inline mr-1" />
                      )}
                      {label} {count !== null && `(${count} bản ghi)`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {exportFormat === "pdf" && (
              <div className="space-y-3">
                <Label className="dark:text-white">Tùy chọn</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={setIncludeCharts}
                    className="dark:border-gray-600"
                  />
                  <Label
                    htmlFor="charts"
                    className="text-sm flex items-center gap-2 dark:text-white"
                  >
                    <BarChart3 className="h-4 w-4" /> Biểu đồ
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6 dark:text-gray-500">
                  Xuất biểu đồ doanh thu, booking, khách hàng
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="dark:bg-gray-900 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
            >
              Hủy
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedCount === 0}
              className="dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {isExporting
                ? "Đang xuất..."
                : `Xuất ${exportFormat.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OverviewExportButton;
