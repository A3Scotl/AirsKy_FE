/**
 * PDF Export với font tiếng Việt chuẩn sử dụng html2canvas
 * Tránh các vấn đề color function bằng cách sử dụng CSS đơn giản
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default class PDFExporter {
  /**
   * Export data to PDF with Vietnamese support and charts
   */
  static async exportToPDF(
    data,
    columns,
    title,
    company = "AIRSKY",
    chartImage = null
  ) {

    if (!data || data.length === 0) {
      console.error("No data to export");
      throw new Error("Không có dữ liệu để xuất");
    }

    if (!columns || columns.length === 0) {
      console.error("No columns defined");
      throw new Error("Chưa định nghĩa cột dữ liệu");
    }

    try {
      // Load Vietnamese fonts first
      await this.loadVietnameseFonts();

      // Chia dữ liệu thành các trang (khoảng 20 dòng mỗi trang)
      const rowsPerPage = 20;
      const totalPages = Math.ceil(data.length / rowsPerPage);

      // Create PDF
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      const contentHeight = pageHeight - 2 * margin;

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const startRow = pageIndex * rowsPerPage;
        const endRow = Math.min(startRow + rowsPerPage, data.length);
        const pageData = data.slice(startRow, endRow);

        // Create HTML content for this page
        const htmlContent = this.createHTMLTablePage(
          pageData,
          columns,
          title,
          company,
          chartImage,
          pageIndex + 1,
          totalPages
        );

        // Create an isolated iframe for this page
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "1200px";
        iframe.style.height = "800px";
        iframe.style.border = "none";
        document.body.appendChild(iframe);

        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&subset=vietnamese&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&subset=vietnamese&display=swap');
              body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', 'Noto Sans', 'Segoe UI', 'Arial Unicode MS', sans-serif;
                background: #ffffff;
                color: #000000;
                font-size: 14px;
                line-height: 1.4;
              }
              * {
                box-sizing: border-box;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `);
        iframeDoc.close();

        // Wait for iframe content to load
        await new Promise((resolve) => {
          iframe.onload = resolve;
          setTimeout(resolve, 1000); // Fallback timeout
        });

        // Use html2canvas on the iframe content
        const canvas = await html2canvas(iframeDoc.body, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          width: 1200,
          height: 600, // Fixed height for each page
          logging: false,
          letterRendering: true,
          foreignObjectRendering: false,
          imageTimeout: 0,
          removeContainer: false,
        });

        // Clean up iframe
        document.body.removeChild(iframe);

        // Add page to PDF
        const imgData = canvas.toDataURL("image/png", 1.0);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          contentWidth,
          imgHeight,
          "",
          "FAST"
        );

        // Add page number
        pdf.setFontSize(8);
        pdf.text(
          `Trang ${pageIndex + 1}/${totalPages}`,
          pageWidth - margin,
          pageHeight - margin / 2,
          { align: "right" }
        );
      }

      // Generate filename
      const dateStr = new Date()
        .toLocaleDateString("vi-VN")
        .replace(/\//g, "-");
      const sanitizedTitle = title.replace(/[^a-zA-Z0-9\-_]/g, "_");
      const filename = `${sanitizedTitle}_${dateStr}.pdf`;

      // Save the PDF
      pdf.save(filename);

      return true;
    } catch (error) {
      console.error("❌ PDF export failed:", error);
      throw new Error(`Lỗi xuất PDF: ${error.message}`);
    }
  }

  /**
   * Load Vietnamese fonts for html2canvas rendering
   */
  static async loadVietnameseFonts() {
    const fontUrls = [
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&subset=vietnamese&display=swap",
      "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&subset=vietnamese&display=swap",
    ];

    const promises = fontUrls.map((url) => {
      return new Promise((resolve) => {
        if (!document.querySelector(`link[href="${url}"]`)) {
          const link = document.createElement("link");
          link.href = url;
          link.rel = "stylesheet";
          link.onload = () => resolve(true);
          link.onerror = () => resolve(false);
          document.head.appendChild(link);
        } else {
          resolve(true);
        }
      });
    });

    await Promise.all(promises);

    // Wait longer for fonts to load completely
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Create HTML table for a single page with Vietnamese font support
   */
  static createHTMLTablePage(
    data,
    columns,
    title,
    company,
    chartImage = null,
    pageNum = 1,
    totalPages = 1
  ) {
    const dateStr = new Date().toLocaleDateString("vi-VN");

    let html = `
      <div style="font-family: 'Inter', 'Noto Sans', 'Segoe UI', 'Arial Unicode MS', 'Microsoft YaHei', 'SimSun', sans-serif; padding: 15px; background-color: #ffffff; color: #000000; font-size: 12px; line-height: 1.3;">
        <div style="text-align: center; margin-bottom: 15px;">
          <h1 style="margin: 0; font-size: 18px; color: #1f2937; font-weight: bold;">${company}</h1>
          <p style="margin: 3px 0; font-size: 11px; color: #6b7280;">Hệ thống đặt vé máy bay</p>
          <h2 style="margin: 5px 0; font-size: 14px; color: #374151; font-weight: bold;">${title}</h2>
          <p style="margin: 0; font-size: 10px; color: #6b7280;">Xuất ngày: ${dateStr} | Trang ${pageNum}/${totalPages}</p>
        </div>`;

    // Add chart if provided (only on first page)
    if (chartImage && pageNum === 1) {
      html += `
        <div style="text-align: center; margin: 10px 0;">
          <img src="${chartImage}" style="max-width: 100%; max-height: 200px; border: 1px solid #e5e7eb;" alt="Biểu đồ" />
        </div>`;
    }

    // Create table
    html += `
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; font-family: 'Inter', 'Noto Sans', 'Segoe UI', 'Arial Unicode MS', sans-serif;">
          <thead>
            <tr style="background-color: #3b82f6; color: #ffffff;">
              ${columns
                .map(
                  (col) =>
                    `<th style="padding: 6px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; font-size: 10px;">${col.title}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>`;

    // Add data rows
    data.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? "#f9fafb" : "#ffffff";
      html += `<tr style="background-color: ${bgColor};">`;

      columns.forEach((col) => {
        const value = row[col.key] || "";
        const displayValue = this.formatValue(value);
        html += `<td style="padding: 4px; border: 1px solid #e5e7eb; font-size: 9px;">${displayValue}</td>`;
      });

      html += `</tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>`;

    return html;
  }

  /**
   * Format value for display
   */
  static formatValue(value) {
    if (value === null || value === undefined) return "-";

    // Handle boolean
    if (typeof value === "boolean") {
      return value ? "Có" : "Không";
    }

    // Handle numbers (currency)
    if (typeof value === "number") {
      if (value > 1000) {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value);
      }
      return new Intl.NumberFormat("vi-VN").format(value);
    }

    // Handle dates
    if (
      value instanceof Date ||
      (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    ) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString("vi-VN");
      } catch (e) {
        return String(value);
      }
    }

    return String(value);
  }
}
