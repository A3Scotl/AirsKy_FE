import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  FileType,
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
import {
  formatCurrencyVND,
  formatDateVN,
  formatDateTimeVN,
} from "@/utils/currency-utils";
import * as XLSX from "xlsx";
import PDFExporter from "@/utils/pdf-exporter";
import { useLazyReports } from "@/hooks/use-lazy-reports";

// === CẤU HÌNH TRƯỜNG DỮ LIỆU ===
const REPORT_CONFIG = {
  revenue: {
    displayName: "Báo Cáo Doanh Thu",
    fields: [
      { key: "date", displayName: "Ngày", default: true },
      { key: "revenue", displayName: "Doanh Thu", default: true },
      { key: "bookings", displayName: "Số Đặt Vé", default: true },
      {
        key: "avgRevenuePerBooking",
        displayName: "TB Doanh Thu/Vé",
        default: true,
      },
      { key: "confirmationRate", displayName: "Tỷ Lệ Xác Nhận", default: true },
    ],
  },
  bookings: {
    displayName: "Báo Cáo Đặt Vé",
    fields: [
      { key: "bookingCode", displayName: "Mã Đặt Vé", default: true },
      { key: "customerName", displayName: "Khách Hàng", default: true },
      { key: "route", displayName: "Tuyến Bay", default: true },
      { key: "bookingDate", displayName: "Ngày Đặt", default: true },
      { key: "passengerCount", displayName: "Số Hành Khách", default: true },
      { key: "totalAmount", displayName: "Tổng Tiền", default: true },
      { key: "paymentMethod", displayName: "Phương Thức", default: true },
      { key: "status", displayName: "Trạng Thái", default: true },
    ],
  },
  customers: {
    displayName: "Báo Cáo Khách Hàng",
    fields: [
      { key: "fullName", displayName: "Khách Hàng", default: true },
      { key: "email", displayName: "Email", default: true },
      { key: "phone", displayName: "Số Điện Thoại", default: true },
      { key: "role", displayName: "Vai Trò", default: true },
      { key: "verified", displayName: "Xác Minh", default: true },
      { key: "loyaltyTier", displayName: "Hạng Thành Viên", default: true },
      { key: "loyaltyPoints", displayName: "Điểm Thưởng", default: true },
      { key: "joinDate", displayName: "Ngày Tham Gia", default: true },
      { key: "status", displayName: "Trạng Thái", default: true },
    ],
  },
  flights: {
    displayName: "Báo Cáo Chuyến Bay",
    fields: [
      { key: "flightNumber", displayName: "Mã Chuyến Bay", default: true },
      { key: "route", displayName: "Tuyến Bay", default: true },
      { key: "departureTime", displayName: "Khởi Hành", default: true },
      { key: "arrivalTime", displayName: "Đến", default: true },
      { key: "duration", displayName: "Thời Lượng", default: true },
      { key: "flightType", displayName: "Loại Chuyến", default: true },
      { key: "seatOccupancy", displayName: "Ghế Đặt/Tổng", default: true },
      { key: "revenue", displayName: "Doanh Thu", default: true },
      { key: "status", displayName: "Trạng Thái", default: true },
    ],
  },
};

// === CẤU HÌNH CHỤP BIỂU ĐỒ ===
const CHART_SELECTORS = {
  revenue: [
    "canvas[id*='revenue']",
    "canvas[id*='chart']",
    ".chart-container canvas",
  ],
  bookings: [
    "canvas[id*='booking']",
    "canvas[id*='chart']",
    ".chart-container canvas",
  ],
  customers: [
    "canvas[id*='customer']",
    "canvas[id*='chart']",
    ".chart-container canvas",
  ],
  flights: [
    "canvas[id*='flight']",
    "canvas[id*='chart']",
    ".chart-container canvas",
  ],
};

const ReportExportButton = ({
  reportType,
  data = [],
  dateRange,
  variant = "outline",
  size = "default",
  className = "",
  isLoading = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [selectedFields, setSelectedFields] = useState([]);
  const [includeCharts, setIncludeCharts] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Lazy load export data
  const { useExportData } = useLazyReports(dateRange);
  const exportQuery = useExportData(reportType, isModalOpen && includeCharts);
  const fullData =
    exportQuery.data?.[reportType === "customers" ? "users" : reportType] ||
    data;

  const config = useMemo(
    () => REPORT_CONFIG[reportType] || { displayName: "Báo Cáo", fields: [] },
    [reportType]
  );

  // === DEFAULT FIELDS ===
  useEffect(() => {
    if (isModalOpen && config.fields) {
      const defaults = config.fields.filter((f) => f.default).map((f) => f.key);
      setSelectedFields(defaults);
    }
  }, [isModalOpen, config.fields]);

  // === TOGGLE FIELD ===
  const handleFieldToggle = useCallback((fieldKey, checked) => {
    setSelectedFields((prev) =>
      checked ? [...prev, fieldKey] : prev.filter((k) => k !== fieldKey)
    );
  }, []);

  const handleSelectAll = useCallback(
    (checked) => {
      setSelectedFields(checked ? config.fields.map((f) => f.key) : []);
    },
    [config.fields]
  );

  // === FORMAT DATA ===
  const formatDataForExport = useCallback(() => {
    if (!fullData?.length) return [];

    return fullData.map((row) => {
      const formatted = {};
      selectedFields.forEach((fieldKey) => {
        const field = config.fields.find((f) => f.key === fieldKey);
        if (!field) return;

        let value = row[fieldKey];

        // Tiền tệ
        if (
          /Amount|revenue|cost|profit|totalSpent|avgRevenue/i.test(fieldKey)
        ) {
          value = Number(value) || 0;
          if (exportFormat === "csv" || exportFormat === "pdf") {
            value = formatCurrencyVND(value);
          }
        }
        // Ngày tháng
        else if (
          /Date|date|Time|time|joinDate|lastLogin/i.test(fieldKey) &&
          value
        ) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            if (/Time|time/i.test(fieldKey)) {
              const time = date.toTimeString().slice(0, 5);
              value =
                exportFormat === "csv" || exportFormat === "pdf"
                  ? `${formattedDate} ${time}`
                  : date;
            } else {
              value =
                exportFormat === "csv" || exportFormat === "pdf"
                  ? formattedDate
                  : date;
            }
          }
        }
        // Phần trăm
        else if (fieldKey === "roi") {
          value = Number(value) || 0;
          if (exportFormat === "csv") value = `${value}%`;
        }

        formatted[field.displayName] = value ?? "";
      });
      return formatted;
    });
  }, [fullData, selectedFields, config.fields, exportFormat]);

  // === TÓM TẮT ===
  const generateSummary = useCallback(() => {
    if (!data?.length) return null;

    const summary = {
      "Tổng số bản ghi": data.length,
      "Thời gian tạo báo cáo": format(new Date(), "dd/MM/yyyy HH:mm:ss"),
    };

    if (dateRange?.from && dateRange?.to) {
      summary["Khoảng thời gian"] = `${format(
        dateRange.from,
        "dd/MM/yyyy"
      )} - ${format(dateRange.to, "dd/MM/yyyy")}`;
    }

    // Cụ thể theo loại
    if (reportType === "revenue") {
      const totalRevenue = data.reduce((s, r) => s + (r.revenue || 0), 0);
      const totalBookings = data.reduce((s, r) => s + (r.bookingCount || 0), 0);
      const confirmed = data.reduce(
        (s, r) => s + (r.confirmedBookings || 0),
        0
      );
      summary["Tổng doanh thu (VND)"] =
        exportFormat === "csv" ? formatCurrencyVND(totalRevenue) : totalRevenue;
      summary["Tổng số đặt vé"] = totalBookings;
      summary["Tổng đặt vé xác nhận"] = confirmed;
      if (totalBookings > 0) {
        const rate = (confirmed / totalBookings) * 100;
        summary["Tỷ lệ xác nhận (%)"] =
          exportFormat === "csv" ? `${rate.toFixed(2)}%` : rate;
      }
    }
    // ... (tương tự cho bookings, customers, flights)

    return summary;
  }, [data, dateRange, exportFormat, reportType]);

  // === XUẤT EXCEL ===
  const exportToExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();
    const formatted = formatDataForExport();

    const ws = XLSX.utils.json_to_sheet(formatted);
    ws["!cols"] = Object.keys(formatted[0] || {}).map((key) => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...formatted.map((r) => String(r[key] || "").length)
        ) + 2,
        50
      ),
    }));
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
    XLSX.utils.book_append_sheet(wb, ws, "Dữ liệu");

    if (includeSummary) {
      const summary = generateSummary();
      if (summary) {
        const arr = Object.entries(summary).map(([k, v]) => ({
          "Thông tin": k,
          "Giá trị": v,
        }));
        const wsSum = XLSX.utils.json_to_sheet(arr);
        wsSum["!cols"] = [{ wch: 30 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsSum, "Tóm tắt");
      }
    }

    const filename = `${config.displayName.replace(/\s+/g, "_")}_${format(
      new Date(),
      "yyyyMMdd_HHmmss"
    )}.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [
    formatDataForExport,
    generateSummary,
    includeSummary,
    config.displayName,
  ]);

  // === CHỤP BIỂU ĐỒ ===
  const captureChart = useCallback(async (selector) => {
    try {
      let el = document.querySelector(selector);
      if (!el) {
        const containers = document.querySelectorAll(
          ".chart-container, .h-64, .h-80, .h-96, [data-chart-container], .card"
        );
        for (const c of containers) {
          el = c.querySelector(selector);
          if (el) break;
        }
      }
      if (!el || el.getBoundingClientRect().width === 0) return null;

      if (el.tagName === "CANVAS") {
        try {
          return el.toDataURL("image/png", 0.95);
        } catch {}
      }

      const container =
        el.closest(".chart-container, .chart-wrapper, .card") || el;
      const canvas = await import("html2canvas").then((m) =>
        m.default(container, {
          backgroundColor: "#fff",
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          onclone: (doc) => {
            doc.querySelectorAll("*").forEach((e) => {
              const style = e.style;
              if (
                style.backgroundColor?.includes("oklch") ||
                style.color?.includes("oklch")
              ) {
                style.backgroundColor = "#fff";
                style.color = "#000";
              }
            });
          },
        })
      );
      return canvas.toDataURL("image/png", 0.95);
    } catch (err) {
      console.warn("Capture failed:", selector, err);
      return null;
    }
  }, []);

  const captureAllCharts = useCallback(async () => {
    const selectors = CHART_SELECTORS[reportType] || [];
    const images = [];
    for (const sel of selectors) {
      const img = await captureChart(sel);
      if (img) images.push(img);
    }
    return images;
  }, [reportType, captureChart]);

  // === XUẤT PDF ===
  const exportToPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const formatted = formatDataForExport();
      if (!formatted.length) throw new Error("Không có dữ liệu");

      const columns = selectedFields.map((key) => {
        const f = config.fields.find((x) => x.key === key);
        return {
          key,
          title: f?.displayName || key,
          displayName: f?.displayName || key,
        };
      });

      const pdfData = formatted.map((row) => {
        const obj = {};
        selectedFields.forEach((k) => {
          const f = config.fields.find((x) => x.key === k);
          obj[k] = row[f?.displayName];
        });
        return obj;
      });

      const chartImages = includeCharts ? await captureAllCharts() : [];
      await PDFExporter.exportToPDF(
        pdfData,
        columns,
        config.displayName,
        "AIRSKY",
        chartImages[0] || null
      );

      toast.success("Xuất PDF thành công!");
    } catch (err) {
      toast.error("Lỗi xuất PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [
    formatDataForExport,
    selectedFields,
    config,
    includeCharts,
    captureAllCharts,
  ]);

  // === XUẤT CSV ===
  const exportToCSV = useCallback(() => {
    const formatted = formatDataForExport();
    if (!formatted.length) return toast.error("Không có dữ liệu");

    const headers = Object.keys(formatted[0]);
    const csv = [
      headers.join(","),
      ...formatted.map((row) =>
        headers
          .map((h) => {
            const v = row[h];
            return typeof v === "string" && (v.includes(",") || v.includes('"'))
              ? `"${v.replace(/"/g, '""')}"`
              : v;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.displayName.replace(/\s+/g, "_")}_${format(
      new Date(),
      "yyyyMMdd_HHmmss"
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formatDataForExport, config.displayName]);

  // === XỬ LÝ XUẤT ===
  const handleExport = useCallback(async () => {
    if (!selectedFields.length) return toast.error("Chọn ít nhất một trường");
    if (!data?.length) return toast.error("Không có dữ liệu");

    setIsExporting(true);
    try {
      if (exportFormat === "xlsx") exportToExcel();
      else if (exportFormat === "pdf") await exportToPDF();
      else exportToCSV();

      toast.success("Xuất file thành công!");
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Lỗi: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [
    exportFormat,
    selectedFields,
    data,
    exportToExcel,
    exportToPDF,
    exportToCSV,
  ]);

  // === RENDER ===
  if (isLoading || !data?.length) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Download className="h-4 w-4 mr-2" />
        {isLoading ? "Đang tải..." : "Xuất file"}
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
        <Download className="h-4 w-4 mr-2" />
        Xuất file
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[80vw] md:max-w-lg lg:max-w-xl max-h-[80vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Download className="h-5 w-5" />
              Xuất {config.displayName}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Chọn định dạng và trường dữ liệu ({data.length} bản ghi)
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
            {/* Định dạng */}
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
                      <FileType className="h-4 w-4" /> PDF (.pdf)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tùy chọn */}
            <div className="space-y-3">
              <Label>Tùy chọn</Label>
              {exportFormat === "xlsx" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sum"
                    checked={includeSummary}
                    onCheckedChange={setIncludeSummary}
                  />
                  <Label htmlFor="sum" className="text-sm">
                    Sheet tóm tắt
                  </Label>
                </div>
              )}
              {exportFormat === "pdf" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={setIncludeCharts}
                  />
                  <Label
                    htmlFor="charts"
                    className="text-sm flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" /> Biểu đồ
                  </Label>
                </div>
              )}
            </div>

            {/* Trường dữ liệu */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="dark:text-white">
                  Chọn trường ({selectedFields.length}/{config.fields.length})
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="all"
                    checked={selectedFields.length === config.fields.length}
                    onCheckedChange={handleSelectAll}
                    className="dark:border-gray-600"
                  />
                  <Label htmlFor="all" className="text-sm dark:text-white">
                    Tất cả
                  </Label>
                </div>
              </div>
              <div className="space-y-3 border rounded-md p-4 max-h-48 overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
                {config.fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <Checkbox
                      id={field.key}
                      checked={selectedFields.includes(field.key)}
                      onCheckedChange={(c) => handleFieldToggle(field.key, c)}
                    />
                    <Label htmlFor={field.key} className="text-sm">
                      {field.displayName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
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
              disabled={isExporting || !selectedFields.length}
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

export default ReportExportButton;
