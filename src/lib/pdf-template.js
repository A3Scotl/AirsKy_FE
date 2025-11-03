import jsPDF from "jspdf";
import "jspdf-autotable";
import fontLoader from "@/utils/font-loader";

/**
 * PDF Template class với font chữ tùy chỉnh cho tiếng Việt
 * Sử dụng font Roboto (hỗ trợ Unicode tốt) cho PDF rendering thông qua canvas
 * Font Roboto đảm bảo hiển thị đúng ký tự tiếng Việt
 */
class PDFTemplate {
  constructor() {
    this.doc = null;
    this.fontLoaded = false;
    this.pageNumber = 1;
  }

  /**
   * Khởi tạo PDF document với font tùy chỉnh
   */
  async initialize() {
    // Initialize jsPDF with Unicode support and higher quality
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      floatPrecision: 16,
      compress: false, // Disable compression for better quality
      userUnit: 1.0,
      hotfixes: ["px_scaling"], // Enable pixel scaling hotfix
    });

    // Set document properties with Vietnamese text
    this.doc.setProperties({
      title: "BÁO CÁO AIRSKY",
      subject: "Báo cáo hệ thống đặt vé máy bay",
      author: "Hệ thống AirsKy",
      keywords: "báo cáo, thống kê, đặt vé, máy bay",
      creator: "AirsKy PDF Generator",
    });

    // Always use canvas-based Roboto font for consistency
    const robotoLoaded = await this.loadRobotoForPDF();

    // Use helvetica as base but all text will be rendered via canvas with Roboto
    this.doc.setFont("helvetica", "normal");
    this.fontLoaded = true;

    console.log(
      `PDF template initialized with Roboto canvas rendering ${
        robotoLoaded ? "(Roboto available)" : "(fallback to system font)"
      }`
    );

    return this.doc;
  }

  /**
   * Process Vietnamese text for proper PDF rendering - OPTIMIZED APPROACH
   */
  processVietnameseText(text) {
    if (!text || typeof text !== "string") return text;

    // STEP 1: Proper Unicode normalization
    let processedText = text.normalize("NFC");

    // STEP 2: Fix encoding issues at source - convert from malformed UTF-8 to proper Vietnamese
    try {
      // Handle double-encoded UTF-8 issues common in databases/APIs
      if (
        processedText.includes("Ã") ||
        processedText.includes("Ä") ||
        processedText.includes("á»")
      ) {
        // This is likely double-encoded UTF-8, decode it properly
        processedText = decodeURIComponent(escape(processedText));
      }
    } catch (e) {
      // If decoding fails, continue with original text
      console.log("UTF-8 decode failed, using original text");
    }

    // STEP 3: Apply minimal, high-impact replacements only for common broken patterns
    const essentialReplacements = {
      // Only fix the most common broken patterns, not individual characters
      SÑ: "Số",
      "Tr¡ng Thái": "Trạng Thái",
      "Qu£n trË viên": "Quản trị viên",
      "Ho¡t Ùng": "Hoạt động",
      "ã xác minh": "đã xác minh",
      "Tiêu chu©n": "Tiêu chuẩn",
      "Doanh nghiÇp": "Doanh nghiệp",
      NguyÅn: "Nguyễn",
      "Tr°Ýng": "Trường",
      "B£o": "Bảo",
      "iÇn Tho¡i": "iện Thoại",
      "iÃm Th°ßng": "Điểm Thưởng",
      "H¡ng Thành Viên": "Hạng Thành Viên",
    };

    // Apply only essential replacements
    for (const [broken, correct] of Object.entries(essentialReplacements)) {
      processedText = processedText.replace(new RegExp(broken, "g"), correct);
    }

    return processedText;
  }

  /**
   * Add text with Vietnamese support - consistent Roboto only
   */
  addText(text, x, y, options = {}) {
    if (!this.doc) return;

    const processedText = this.processVietnameseText(text);
    const fontSize = options.fontSize || 12;
    const style = options.style || "normal";

    // ALWAYS use canvas rendering for consistent Roboto display
    // This ensures all text uses the same font family and proper Unicode support
    return this.addTextWithCanvas(processedText, x, y, {
      ...options,
      fontSize,
      style,
      fontFamily: "Roboto", // Force consistent Roboto font
    });
  }

  /**
   * Check if we should use canvas rendering for better font support
   */
  shouldUseCanvasRendering() {
    // Always use canvas rendering for consistent font display
    return typeof document !== "undefined";
  }

  /**
   * Add text using canvas rendering for perfect Roboto font support
   */
  addTextWithCanvas(text, x, y, options = {}) {
    try {
      if (!text || typeof text !== "string") return;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const fontSize = options.fontSize || 12;
      const style = options.style || "normal";
      const fontWeight = style === "bold" ? "700" : "400";

      // Use high DPI for crisp text
      const devicePixelRatio = window.devicePixelRatio || 2;

      // Process Vietnamese text before rendering
      const processedText = this.processVietnameseText(text);

      // Use improved Vietnamese-friendly font stack from font loader
      const fontStack = fontLoader.getVietnameseFontStack();
      ctx.font = `${fontWeight} ${fontSize * devicePixelRatio}px ${fontStack}`;

      // Measure text with proper font using processed text
      const metrics = ctx.measureText(processedText);
      const textWidth = Math.ceil(metrics.width) + 8;
      const textHeight = Math.ceil(fontSize * devicePixelRatio * 1.4) + 8;

      // Set canvas size
      canvas.width = textWidth;
      canvas.height = textHeight;

      // Scale context for high DPI
      ctx.scale(devicePixelRatio, devicePixelRatio);

      // Set background to transparent
      ctx.clearRect(
        0,
        0,
        textWidth / devicePixelRatio,
        textHeight / devicePixelRatio
      );

      // Set text properties with improved Vietnamese font stack
      ctx.font = `${fontWeight} ${fontSize}px ${fontStack}`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      // Enable better text rendering
      ctx.textRenderingOptimization = "optimizeQuality";
      if (ctx.imageSmoothingEnabled !== undefined) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }

      // Set text color
      if (options.color) {
        ctx.fillStyle = `rgb(${options.color[0]}, ${options.color[1]}, ${options.color[2]})`;
      } else {
        ctx.fillStyle = "#000000";
      }

      // Draw processed text with anti-aliasing
      ctx.fillText(processedText, 4 / devicePixelRatio, 4 / devicePixelRatio);

      // Convert canvas to high-quality image
      const imgData = canvas.toDataURL("image/png", 1.0);

      // Add to PDF with proper scaling
      const pdfWidth = canvas.width / devicePixelRatio / 3.779527; // Convert px to mm
      const pdfHeight = canvas.height / devicePixelRatio / 3.779527;

      this.doc.addImage(
        imgData,
        "PNG",
        x,
        y - 1,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST"
      );
    } catch (error) {
      console.warn(
        "Canvas text rendering failed, using consistent fallback:",
        error
      );
      // Consistent fallback - no helvetica, keep trying canvas or use error placeholder
      try {
        // Try simpler canvas approach
        const simpleCanvas = document.createElement("canvas");
        const simpleCtx = simpleCanvas.getContext("2d");

        simpleCanvas.width = 200;
        simpleCanvas.height = 30;

        simpleCtx.font = `${
          options.fontSize || 12
        }px ${fontLoader.getVietnameseFontStack()}`;
        simpleCtx.fillStyle = "#000000";
        const fallbackText = this.processVietnameseText(text);
        simpleCtx.fillText(fallbackText, 2, options.fontSize || 12);

        const simpleImg = simpleCanvas.toDataURL("image/png");
        this.doc.addImage(simpleImg, "PNG", x, y - 1, 50, 8);
      } catch (fallbackError) {
        console.error("All text rendering failed:", fallbackError);
        // Last resort: add a placeholder
        this.doc.setFontSize(8);
        this.doc.setFont("courier", "normal");
        this.doc.text("[TEXT ERROR]", x, y);
      }
    }
  }

  /**
   * Get the preferred font - try Noto Sans first, fallback to helvetica
   */
  getPreferredFont() {
    // Check if Noto Sans is available
    if (
      this.doc &&
      this.doc.getFontList &&
      Array.isArray(this.doc.getFontList())
    ) {
      const fontList = this.doc.getFontList();
      if (fontList.includes("NotoSans")) {
        return "NotoSans";
      }
    }
    return "helvetica";
  }

  /**
   * Load Roboto font for PDF using improved font loader
   */
  async loadRobotoForPDF() {
    try {
      // Use the improved font loader
      await fontLoader.ensureFontsForPDF();

      // Test font rendering capability
      if (typeof document !== "undefined") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Test Vietnamese text with improved font stack
        const testText =
          "Hệ thống đặt vé máy bay - ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄ";
        const fontStack = fontLoader.getVietnameseFontStack();

        ctx.font = `16px ${fontStack}`;
        const textWidth = ctx.measureText(testText).width;

        // If we can measure text properly, fonts are working
        const fontsReady = textWidth > 0;

        console.log(
          `PDF fonts ready: ${fontsReady}, using font stack: ${fontStack}`
        );
        return fontsReady;
      }

      return true; // Server-side rendering fallback
    } catch (error) {
      console.warn("Error loading fonts for PDF:", error);
      return false;
    }
  }

  /**
   * Calculate optimal column widths based on content
   */
  calculateColumnWidths(headers, rows) {
    const pageWidth = 180; // Available width minus margins
    const minWidth = 15; // Minimum column width
    const maxWidth = 35; // Maximum column width to prevent overlap

    // Predefined widths for common column types
    const columnTypeWidths = {
      "Mã Chuyến Bay": 20,
      "Hãng Hàng Không": 25,
      "Tuyến Bay": 18,
      "Khởi Hành": 22,
      Đến: 22,
      "Thời Lượng": 18,
      "Loại Chuyến": 18,
      "Ghế Đặt/Tổng": 20,
      "Tỷ Lệ Lấp Đầy": 18,
      "Doanh Thu": 20,
      "Trạng Thái": 20,
    };

    const widths = headers.map((header, index) => {
      // Use predefined width if available
      const predefinedWidth = columnTypeWidths[header.trim()];
      if (predefinedWidth) {
        return predefinedWidth;
      }

      // Otherwise calculate based on content
      let maxContentWidth = this.doc.getTextWidth(
        this.processVietnameseText(header)
      );

      // Check content in this column (sample first few rows for performance)
      const sampleRows = rows.slice(0, Math.min(10, rows.length));
      sampleRows.forEach((row) => {
        if (row[index]) {
          const cellWidth = this.doc.getTextWidth(
            this.processVietnameseText(String(row[index]).substring(0, 50)) // Limit text length
          );
          maxContentWidth = Math.max(maxContentWidth, cellWidth);
        }
      });

      // Add padding and constrain to min/max
      const calculatedWidth = Math.max(
        minWidth,
        Math.min(maxWidth, maxContentWidth + 8)
      );
      return calculatedWidth;
    });

    // Ensure total width fits page - distribute proportionally if needed
    const totalWidth = widths.reduce((sum, w) => sum + w, 0);
    if (totalWidth > pageWidth) {
      const scaleFactor = pageWidth / totalWidth;
      return widths.map((w) => Math.max(minWidth, w * scaleFactor));
    }

    return widths;
  }

  /**
   * Thêm header cho mỗi trang
   */
  addHeader(
    companyName = "AIRSKY",
    subtitle = "Hệ thống đặt vé máy bay",
    reportTitle = ""
  ) {
    if (!this.doc) return;

    // Company header với gradient effect (simulated with multiple rects)
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(0, 0, 210, 25, "F");

    // Add subtle gradient effect
    this.doc.setFillColor(51, 138, 195);
    this.doc.rect(0, 0, 210, 2, "F");

    // Tên công ty với shadow effect
    this.addText(companyName, 14.5, 12.5, {
      fontSize: 20,
      font: "helvetica",
      style: "bold",
      color: [200, 200, 200], // Shadow
    });
    this.addText(companyName, 14, 12, {
      fontSize: 20,
      font: "helvetica",
      style: "bold",
      color: [255, 255, 255], // Main text
    });

    // Subtitle với better spacing
    this.addText(subtitle, 14, 19, {
      fontSize: 11,
      font: "helvetica",
      style: "normal",
      color: [240, 248, 255],
    });

    // Tiêu đề báo cáo bên phải với border
    if (reportTitle) {
      const titleText = this.processVietnameseText(reportTitle.toUpperCase());
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(12);
      const titleWidth = this.doc.getTextWidth(titleText);

      // Background for title
      this.doc.setFillColor(255, 255, 255, 0.1);
      this.doc.roundedRect(190 - titleWidth, 10, titleWidth + 8, 10, 2, 2, "F");

      this.addText(titleText, 194 - titleWidth, 15, {
        fontSize: 12,
        font: "helvetica",
        style: "bold",
        color: [255, 255, 255],
      });
    }

    // Professional line separator
    this.doc.setDrawColor(230, 230, 230);
    this.doc.setLineWidth(0.5);
    this.doc.line(14, 28, 196, 28);

    // Reset màu chữ
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Thêm footer cho mỗi trang
   */
  addFooter(generationDate = new Date(), dateRange = null) {
    if (!this.doc) return;

    const pageHeight = this.doc.internal.pageSize.height;

    // Footer background
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(0, pageHeight - 20, 210, 20, "F");

    this.doc.setFontSize(8);
    this.doc.setFont(this.getPreferredFont(), "normal");
    this.doc.setTextColor(100, 100, 100);

    // Bên trái - thông tin tạo
    const dateStr = generationDate.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    this.addText(`Tạo lúc: ${dateStr}`, 14, pageHeight - 12, {
      fontSize: 8,
      style: "normal",
      color: [100, 100, 100],
    });

    // Giữa - khoảng thời gian nếu có
    if (dateRange?.from && dateRange?.to) {
      const fromStr = dateRange.from.toLocaleDateString("vi-VN");
      const toStr = dateRange.to.toLocaleDateString("vi-VN");
      const dateRangeText = `Từ: ${fromStr} - Đến: ${toStr}`;
      const centerX = 105;
      const textWidth = this.doc.getTextWidth(
        this.processVietnameseText(dateRangeText)
      );
      this.addText(dateRangeText, centerX - textWidth / 2, pageHeight - 12, {
        fontSize: 8,
        style: "normal",
        color: [100, 100, 100],
      });
    }

    // Bên phải - số trang
    const pageText = `Trang ${this.pageNumber}`;
    const pageWidth = this.doc.getTextWidth(
      this.processVietnameseText(pageText)
    );
    this.addText(pageText, 196 - pageWidth, pageHeight - 12, {
      fontSize: 8,
      style: "normal",
      color: [100, 100, 100],
    });

    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Thêm tiêu đề báo cáo
   */
  addReportTitle(title, yPosition) {
    if (!this.doc) return yPosition;

    this.addText(title.toUpperCase(), 14, yPosition, {
      fontSize: 16,
      style: "bold",
      color: [41, 128, 185],
    });

    return yPosition + 10;
  }

  /**
   * Thêm phần tóm tắt
   */
  addSummary(summaryData, yPosition) {
    if (!this.doc || !summaryData) return yPosition;

    // Summary box
    this.doc.setFillColor(248, 249, 250);
    this.doc.setDrawColor(200, 200, 200);
    this.doc.roundedRect(14, yPosition, 182, 25, 3, 3, "FD");

    this.doc.setFontSize(9);
    this.doc.setFont(this.getPreferredFont(), "normal");
    this.doc.setTextColor(0, 0, 0);

    const summaryEntries = Object.entries(summaryData);
    let summaryY = yPosition + 8;
    let colX = 16;

    summaryEntries.forEach(([key, value], index) => {
      if (index > 0 && index % 3 === 0) {
        summaryY += 6;
        colX = 16;
      }

      this.addText(`${key}:`, colX, summaryY, { style: "bold" });
      this.addText(String(value), colX + 35, summaryY, { style: "normal" });
      colX += 60;
    });

    return yPosition + 35;
  }

  /**
   * Thêm biểu đồ vào PDF
   */
  async addChart(chartImage, title, yPosition) {
    if (!this.doc || !chartImage) return yPosition;

    // Kiểm tra cần trang mới không
    if (yPosition > 150) {
      this.addFooter();
      this.doc.addPage();
      this.pageNumber++;
      this.addHeader();
      yPosition = 35;
    }

    // Tiêu đề biểu đồ
    this.addText(title, 14, yPosition, {
      fontSize: 14,
      style: "bold",
      color: [41, 128, 185],
    });
    yPosition += 8;

    // Khung biểu đồ
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    const chartWidth = 160;
    const chartHeight = 90;
    this.doc.rect(25, yPosition, chartWidth, chartHeight);

    // Thêm ảnh biểu đồ
    try {
      this.doc.addImage(
        chartImage,
        "PNG",
        26,
        yPosition + 1,
        chartWidth - 2,
        chartHeight - 2
      );
      yPosition += chartHeight + 15;
    } catch (error) {
      console.error("Error adding chart image:", error);
      // Thêm thông báo lỗi
      this.addText("(Không thể tải biểu đồ)", 14, yPosition, {
        fontSize: 10,
        style: "italic",
        color: [150, 150, 150],
      });
      yPosition += 10;
    }

    return yPosition;
  }

  /**
   * Thêm bảng dữ liệu với font được cải thiện và tiêu đề tùy chỉnh
   */
  addTable(headers, rows, yPosition, tableTitle = null) {
    if (!this.doc) return yPosition;

    // Kiểm tra cần trang mới không
    if (yPosition > 120) {
      this.addFooter();
      this.doc.addPage();
      this.pageNumber++;
      this.addHeader();
      yPosition = 35;
    }

    // Clean headers and rows text before processing
    const cleanHeaders = headers.map((header) =>
      this.processVietnameseText(String(header || ""))
    );

    const cleanRows = rows.map((row) =>
      row.map((cell) => this.processVietnameseText(String(cell || "")))
    );

    // Tiêu đề bảng với tên tab
    const title = tableTitle || "DỮ LIỆU CHI TIẾT";
    this.addText(title.toUpperCase(), 14, yPosition, {
      fontSize: 16,
      style: "bold",
      color: [41, 128, 185],
    });
    yPosition += 12;

    // Tạo bảng với autoTable nếu có, hoặc fallback
    if (typeof this.doc.autoTable === "function") {
      try {
        this.doc.autoTable({
          head: [cleanHeaders],
          body: cleanRows,
          startY: yPosition,
          styles: {
            fontSize: 8, // Slightly larger font for better readability
            font: "helvetica",
            cellPadding: 2, // Increased padding
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [0, 0, 0],
            valign: "middle",
            halign: "left",
            fillColor: [255, 255, 255],
            overflow: "linebreak",
            cellWidth: "wrap",
            minCellHeight: 6,
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            font: "helvetica",
            fontStyle: "bold",
            fontSize: 7, // Smaller header font
            lineColor: [41, 128, 185],
            lineWidth: 0.2,
            halign: "center",
            cellPadding: 1.5,
            minCellHeight: 6,
          },
          bodyStyles: {
            lineColor: [240, 240, 240],
            lineWidth: 0.1,
            fontSize: 7,
            cellPadding: 1.5,
            minCellHeight: 6,
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          columnStyles: {
            // Định nghĩa width và alignment cụ thể cho từng cột
            ...headers.reduce((acc, header, index) => {
              const headerLower = header.toLowerCase();
              const headerTrim = header.trim();

              // Improved column width calculation based on common booking table fields
              let columnWidth = "auto"; // Let autoTable calculate width
              let halign = "left";
              let minCellWidth = 15; // Minimum width to prevent overlap

              // Map specific columns for booking data
              if (headerTrim === "Mã Đặt Vé" || headerTrim.includes("Mã")) {
                columnWidth = 20;
                minCellWidth = 18;
              } else if (
                headerTrim === "Khách Hàng" ||
                headerTrim.includes("Tên")
              ) {
                columnWidth = 25;
                minCellWidth = 20;
              } else if (headerTrim === "Tuyến Bay") {
                columnWidth = 22;
                minCellWidth = 18;
              } else if (
                headerTrim === "Ngày Đặt" ||
                headerTrim.includes("Ngày")
              ) {
                columnWidth = 20;
                minCellWidth = 18;
              } else if (
                headerTrim === "Số Hành Khách" ||
                headerTrim.includes("Số")
              ) {
                columnWidth = 15;
                minCellWidth = 12;
                halign = "center";
              } else if (
                headerTrim === "Tổng Tiền" ||
                headerTrim.includes("Tiền") ||
                headerTrim.includes("VND")
              ) {
                columnWidth = 25;
                minCellWidth = 20;
                halign = "right";
              } else if (
                headerTrim === "Phương Thức" ||
                headerTrim.includes("Phương")
              ) {
                columnWidth = 18;
                minCellWidth = 15;
                halign = "center";
              } else if (headerTrim === "Trạng Thái") {
                columnWidth = 22;
                minCellWidth = 18;
                halign = "center";
              }

              // Apply numeric alignment for monetary and count columns
              if (
                headerLower.includes("tổng") ||
                headerLower.includes("số") ||
                headerLower.includes("vnd") ||
                headerLower.includes("tiền") ||
                headerLower.includes("doanh thu") ||
                headerLower.includes("giá")
              ) {
                halign = "right";
              }

              acc[index] = {
                cellWidth: columnWidth,
                minCellWidth: minCellWidth,
                halign: halign,
                fontSize: 7, // Consistent smaller font
                cellPadding: 1.5,
                valign: "middle",
              };

              return acc;
            }, {}),
          },
          margin: { top: 12, left: 14, right: 14 },
          theme: "grid",
          tableWidth: "auto",
          showHead: "firstPage",
          useCss: false, // Disable CSS to prevent font issues
          pageBreak: "avoid", // Avoid page breaks to keep all data on one page
          rowPageBreak: "avoid",
          didDrawPage: () => {
            this.addFooter();
            if (this.pageNumber > 1) {
              this.addHeader();
            }
          },
        });

        // Return the final Y position after the table
        return this.doc.lastAutoTable.finalY + 10;
      } catch (error) {
        console.error("Error creating autoTable:", error);
        // Fallback to manual table
        return this.createFallbackTable(cleanHeaders, cleanRows, yPosition);
      }
    } else {
      // Fallback khi không có autoTable
      return this.createFallbackTable(cleanHeaders, cleanRows, yPosition);
    }
  }

  /**
   * Render bảng sử dụng canvas với font Noto Sans
   */
  renderTableWithCanvas(headers, rows, startY) {
    let tableY = startY;
    const pageHeight = this.doc.internal.pageSize.height;
    const maxRowsPerPage = Math.floor((pageHeight - tableY - 30) / 12);

    // Header
    this.renderTableRowWithCanvas(headers, 14, tableY, true);
    tableY += 12;

    // Data rows
    for (let i = 0; i < rows.length; i++) {
      if (i > 0 && i % maxRowsPerPage === 0) {
        // Thêm thông báo trang tiếp theo
        this.addText(`Tiếp tục trang sau...`, 14, pageHeight - 25, {
          fontSize: 8,
          font: "helvetica",
          style: "italic",
          color: [150, 150, 150],
        });

        this.doc.addPage();
        this.pageNumber++;
        this.addHeader();
        this.addFooter();

        tableY = 35;

        // Redraw headers
        this.renderTableRowWithCanvas(headers, 14, tableY, true);
        tableY += 12;
      }

      // Alternate row colors
      const isAlternateRow = i % 2 === 1;
      this.renderTableRowWithCanvas(rows[i], 14, tableY, false, isAlternateRow);
      tableY += 12;
    }

    return tableY + 10;
  }

  /**
   * Render một hàng của bảng sử dụng canvas
   */
  renderTableRowWithCanvas(
    rowData,
    x,
    y,
    isHeader = false,
    isAlternateRow = false
  ) {
    const columnWidth = 45; // Chiều rộng mỗi cột
    const rowHeight = 10;

    // Background cho header
    if (isHeader) {
      this.doc.setFillColor(41, 128, 185);
      this.doc.rect(x, y - 2, 182, rowHeight, "F");
    } else if (isAlternateRow) {
      this.doc.setFillColor(248, 249, 250);
      this.doc.rect(x, y - 2, 182, rowHeight, "F");
    }

    // Border
    this.doc.setDrawColor(
      isHeader ? 41 : 200,
      isHeader ? 128 : 200,
      isHeader ? 185 : 200
    );
    this.doc.setLineWidth(isHeader ? 0.5 : 0.3);
    this.doc.rect(x, y - 2, 182, rowHeight, "S");

    // Render từng cell
    rowData.forEach((cell, index) => {
      const cellX = x + 2 + index * columnWidth;
      const cellText = String(cell || "").substring(0, 8); // Giới hạn độ dài

      if (cellX < x + 180) {
        // Đảm bảo không vượt quá chiều rộng bảng
        this.renderCellWithCanvas(cellText, cellX, y + 4, isHeader);
      }
    });
  }

  /**
   * Render một cell sử dụng canvas với font Noto Sans
   */
  renderCellWithCanvas(text, x, y, isHeader = false) {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const fontSize = 8;

      // Set canvas size
      ctx.font = `${
        isHeader ? "bold" : "normal"
      } ${fontSize}px "Noto Sans", Arial, sans-serif`;
      const metrics = ctx.measureText(text);
      canvas.width = Math.min(Math.ceil(metrics.width) + 4, 40); // Giới hạn chiều rộng
      canvas.height = Math.ceil(fontSize * 1.2) + 4;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set text color
      ctx.fillStyle = isHeader ? "#FFFFFF" : "#000000";
      ctx.font = `${
        isHeader ? "bold" : "normal"
      } ${fontSize}px "Noto Sans", Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(text, 2, 2);

      // Convert to image and add to PDF
      const imgData = canvas.toDataURL("image/png");
      this.doc.addImage(
        imgData,
        "PNG",
        x,
        y - 3,
        canvas.width / 3,
        canvas.height / 3
      ); // Scale down
    } catch (error) {
      console.error("Error rendering cell with canvas:", error);
      // Fallback to regular text
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", isHeader ? "bold" : "normal");
      this.doc.setTextColor(
        isHeader ? 255 : 0,
        isHeader ? 255 : 0,
        isHeader ? 255 : 0
      );
      this.doc.text(text.substring(0, 8), x, y);
      this.doc.setTextColor(0, 0, 0);
    }
  }

  /**
   * Tạo bảng fallback khi autoTable không khả dụng
   */
  createFallbackTable(headers, rows, startY) {
    if (!this.doc) return startY;

    let tableY = startY;
    const pageHeight = this.doc.internal.pageSize.height;
    const rowHeight = 6; // Height per row
    const maxRowsPerPage = Math.floor((pageHeight - tableY - 40) / rowHeight);

    // Calculate column widths
    const columnWidths = this.calculateColumnWidths(headers, rows);
    const totalTableWidth = columnWidths.reduce((sum, w) => sum + w, 0);

    // Ensure table fits on page
    const tableWidth = Math.min(totalTableWidth, 182);
    const scaleFactor = tableWidth / totalTableWidth;
    const scaledWidths = columnWidths.map((w) => w * scaleFactor);

    let currentPage = 1;
    let processedRows = 0;

    while (processedRows < rows.length) {
      // Check if we need a new page
      if (tableY > pageHeight - 50) {
        this.addFooter();
        this.doc.addPage();
        this.pageNumber++;
        this.addHeader();
        tableY = 35;

        // Redraw table header on new page
        this.drawTableHeader(headers, scaledWidths, tableY);
        tableY += 8;
        currentPage++;
      }

      // Draw table header if this is the first page
      if (processedRows === 0) {
        this.drawTableHeader(headers, scaledWidths, tableY);
        tableY += 8;
      }

      // Draw data rows for this page
      const rowsForThisPage = Math.min(
        maxRowsPerPage,
        rows.length - processedRows
      );

      for (let i = 0; i < rowsForThisPage; i++) {
        const row = rows[processedRows + i];

        // Alternate row colors
        if (i % 2 === 1) {
          this.doc.setFillColor(248, 249, 250);
          this.doc.rect(14, tableY - 1, tableWidth, rowHeight, "F");
        }

        // Draw cells
        let currentX = 14;
        row.forEach((cell, cellIndex) => {
          const cellText = String(cell || ""); // Remove text length limit
          const cellWidth = scaledWidths[cellIndex] || 30;

          this.doc.setFont(this.getPreferredFont(), "normal");
          this.doc.setTextColor(0, 0, 0);

          // Handle text alignment
          const headerLower = headers[cellIndex].toLowerCase();
          let align = "left";
          if (
            headerLower.includes("tổng") ||
            headerLower.includes("số") ||
            headerLower.includes("vnd") ||
            headerLower.includes("điểm") ||
            headerLower.includes("tiền")
          ) {
            align = "right";
          }

          if (align === "right") {
            const textWidth = this.doc.getTextWidth(
              this.processVietnameseText(cellText)
            );
            // If text is too wide, truncate with ellipsis
            if (textWidth > cellWidth - 4) {
              let truncatedText = cellText;
              while (
                this.doc.getTextWidth(
                  this.processVietnameseText(truncatedText + "...")
                ) >
                  cellWidth - 4 &&
                truncatedText.length > 0
              ) {
                truncatedText = truncatedText.slice(0, -1);
              }
              this.doc.text(
                truncatedText + "...",
                currentX +
                  cellWidth -
                  this.doc.getTextWidth(
                    this.processVietnameseText(truncatedText + "...")
                  ) -
                  2,
                tableY + 3
              );
            } else {
              this.doc.text(
                cellText,
                currentX + cellWidth - textWidth - 2,
                tableY + 3
              );
            }
          } else {
            // For left-aligned text, wrap if too long
            const textWidth = this.doc.getTextWidth(
              this.processVietnameseText(cellText)
            );
            if (textWidth > cellWidth - 4) {
              // Simple word wrap logic
              const words = cellText.split(" ");
              let line = "";
              let lineY = tableY + 3;
              words.forEach((word) => {
                const testLine = line + (line ? " " : "") + word;
                if (
                  this.doc.getTextWidth(this.processVietnameseText(testLine)) >
                  cellWidth - 4
                ) {
                  if (line) {
                    this.doc.text(line, currentX + 2, lineY);
                    lineY += 4;
                  }
                  line = word;
                } else {
                  line = testLine;
                }
              });
              if (line) {
                this.doc.text(line, currentX + 2, lineY);
              }
            } else {
              this.doc.text(cellText, currentX + 2, tableY + 3);
            }
          }

          currentX += cellWidth;
        });

        tableY += rowHeight;
      }

      processedRows += rowsForThisPage;

      // If there are more rows, indicate continuation
      if (processedRows < rows.length) {
        this.addText(`Tiếp tục trang ${currentPage + 1}...`, 14, tableY + 2, {
          fontSize: 7,
          style: "italic",
          color: [150, 150, 150],
        });
        tableY += 8;
      }
    }

    return tableY + 10;
  }

  /**
   * Draw table header for fallback table
   */
  drawTableHeader(headers, columnWidths, yPosition) {
    // Header background
    this.doc.setFillColor(41, 128, 185);
    this.doc.rect(
      14,
      yPosition - 2,
      columnWidths.reduce((sum, w) => sum + w, 0),
      6,
      "F"
    );

    // Header border
    this.doc.setDrawColor(41, 128, 185);
    this.doc.setLineWidth(0.5);
    this.doc.rect(
      14,
      yPosition - 2,
      columnWidths.reduce((sum, w) => sum + w, 0),
      6
    );

    // Header text
    this.doc.setFont(this.getPreferredFont(), "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(7);

    let currentX = 14;
    headers.forEach((header, index) => {
      const headerText = String(header).substring(0, 15); // Limit header length
      const cellWidth = columnWidths[index] || 30;

      this.doc.text(headerText, currentX + 2, yPosition + 3);
      currentX += cellWidth;
    });

    // Reset colors
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Lưu PDF với tên file
   */
  save(filename) {
    if (this.doc) {
      this.doc.save(filename);
    }
  }

  /**
   * Xuất PDF dưới dạng blob
   */
  output(type = "blob") {
    return this.doc ? this.doc.output(type) : null;
  }

  /**
   * Lấy document jsPDF
   */
  getDocument() {
    return this.doc;
  }
}

export default PDFTemplate;
