/**
 * OPTIMIZED Font loader utility for Vietnamese PDF export
 * Universal approach using best Vietnamese-compatible fonts
 */

class FontLoader {
  constructor() {
    this.loadedFonts = new Set();
    this.fontCache = new Map();
    this.vietnameseFontStack = null;
  }

  /**
   * Load optimal Vietnamese fonts - UNIVERSAL APPROACH
   * Uses multiple font sources for maximum compatibility
   */
  async loadRobotoFont() {
    const fontName = "Vietnamese-Optimized";

    if (this.loadedFonts.has(fontName)) {
      return fontName;
    }

    try {
      // Load comprehensive Vietnamese font stack from Google Fonts
      const fontUrls = [
        // Inter - excellent Vietnamese support, modern
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&subset=vietnamese,latin&display=swap",
        // Noto Sans - Google's comprehensive Unicode font
        "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&subset=vietnamese,latin&display=swap",
        // Source Sans Pro - Adobe's font with good Vietnamese
        "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&subset=vietnamese,latin&display=swap",
      ];

      // Load all font families in parallel
      const linkPromises = fontUrls.map((url) => {
        return new Promise((resolve) => {
          const link = document.createElement("link");
          link.href = url;
          link.rel = "stylesheet";
          link.onload = () => resolve(true);
          link.onerror = () => resolve(false);
          document.head.appendChild(link);
        });
      });

      await Promise.all(linkPromises);

      // Wait for fonts to be fully loaded
      await Promise.all([
        this.waitForFontLoad("Inter", 400),
        this.waitForFontLoad("Noto Sans", 400),
        this.waitForFontLoad("Source Sans Pro", 400),
      ]);

      // Set up Vietnamese-optimized font stack
      this.vietnameseFontStack =
        'Inter, "Noto Sans", "Source Sans Pro", "Segoe UI", system-ui, -apple-system, "Arial Unicode MS", sans-serif';

      this.loadedFonts.add(fontName);

      return fontName;
    } catch (error) {
      console.warn("Failed to load Vietnamese fonts:", error);
      // Ultimate fallback - use system fonts only
      this.vietnameseFontStack =
        '"Segoe UI", system-ui, -apple-system, "Arial Unicode MS", sans-serif';
      return "system-fallback";
    }
  }

  /**
   * Load custom font từ file base64
   */
  async loadCustomFont(fontName, fontData) {
    if (this.loadedFonts.has(fontName)) {
      return fontName;
    }

    try {
      // Đây là placeholder - trong thực tế cần implement
      // jsPDF addFileToVFS và addFont methods

      // Giả lập load font
      this.loadedFonts.add(fontName);
      return fontName;
    } catch (error) {
      console.warn(`Failed to load custom font ${fontName}:`, error);
      return "helvetica";
    }
  }

  /**
   * Đợi font load hoàn tất
   */
  waitForFontLoad(fontFamily, fontWeight = 400, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const checkFont = () => {
        // Kiểm tra font đã load chưa bằng cách đo width của text
        const testString =
          "Thử nghiệm font tiếng Việt: áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ";
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        ctx.font = `${fontWeight} 12px "${fontFamily}", monospace`;
        const widthWithFont = ctx.measureText(testString).width;

        ctx.font = `${fontWeight} 12px monospace`;
        const widthWithoutFont = ctx.measureText(testString).width;

        // Nếu width khác nhau có nghĩa là font đã load
        if (widthWithFont !== widthWithoutFont) {
          resolve();
        } else {
          // Chưa load, thử lại sau 100ms
          setTimeout(checkFont, 100);
        }
      };

      // Timeout sau 5 giây
      setTimeout(() => {
        reject(new Error(`Font ${fontFamily} load timeout`));
      }, timeout);

      checkFont();
    });
  }

  /**
   * Get font family name phù hợp cho PDF rendering
   */
  getFontForPDF() {
    // Ưu tiên Roboto nếu đã load
    if (this.loadedFonts.has("Roboto-Regular")) {
      return "Roboto";
    }

    // Fallback fonts có hỗ trợ Unicode tốt cho tiếng Việt
    const fallbackFonts = [
      "Segoe UI", // Windows system font với Unicode support tốt
      "DejaVu Sans", // Linux font với Unicode support
      "Liberation Sans", // Open source font
      "Arial Unicode MS", // MacOS/Windows Unicode font
      "Roboto", // Android system font
      "helvetica", // jsPDF default
    ];

    // Kiểm tra font có sẵn trong system
    for (const font of fallbackFonts) {
      if (
        typeof document !== "undefined" &&
        document.fonts &&
        document.fonts.check(`12px "${font}"`)
      ) {
        return font;
      }
    }

    return "helvetica"; // Final fallback
  }

  /**
   * Get OPTIMIZED Vietnamese font stack for PDF rendering
   */
  getVietnameseFontStack() {
    // Return pre-built optimized stack if available
    if (this.vietnameseFontStack) {
      return this.vietnameseFontStack;
    }

    // Fallback Vietnamese-optimized font stack
    return 'Inter, "Noto Sans", "Source Sans Pro", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", "Arial Unicode MS", Arial, sans-serif';
  }

  /**
   * Initialize fonts khi app start
   */
  async initialize() {
    try {
      // Load Roboto fonts ngay từ đầu cho PDF rendering
      await this.loadRobotoFont();

    } catch (error) {
      console.warn("Font loader initialization failed:", error);
    }
  }

  /**
   * Ensure font is ready for PDF generation
   */
  async ensureFontsForPDF() {
    try {
      if (!this.loadedFonts.has("Roboto-Regular")) {

        await this.loadRobotoFont();
      }
      return true;
    } catch (error) {
      console.warn("Failed to ensure fonts for PDF:", error);
      return false;
    }
  }
}

// Singleton instance
const fontLoader = new FontLoader();

export default fontLoader;
