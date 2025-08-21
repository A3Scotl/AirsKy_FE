import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRouteTitle } from "@/hooks/use-route-title";

/**
 * Component TitleSync để đảm bảo title được sync đúng cách
 * khi navigate giữa các trang
 */
export const TitleSync = () => {
  const location = useLocation();

  useEffect(() => {
    // Force sync title sau mỗi lần navigate
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          mutation.target.nodeName === "TITLE"
        ) {
          // Title đã được cập nhật bởi Helmet
          console.log("Title updated:", document.title);
        }
      });
    });

    // Observe changes to title element
    const titleElement = document.querySelector("title");
    if (titleElement) {
      observer.observe(titleElement, { childList: true, subtree: true });
    }

    // Cleanup
    return () => observer.disconnect();
  }, [location.pathname]);

  // Force re-render của tất cả Helmet instances
  useEffect(() => {
    const event = new CustomEvent("helmetUpdate");
    window.dispatchEvent(event);
  }, [location]);

  return null; // Không render gì cả
};

/**
 * Component SEO chính để quản lý meta tags và title
 */
const SEO = ({
  title,
  description = "AirSky - Đặt vé máy bay trực tuyến với giá tốt nhất. Tìm kiếm và so sánh vé máy bay từ nhiều hãng hàng không.",
  keywords = "đặt vé máy bay, vé máy bay giá rẻ, AirSky, du lịch, hàng không",
  image,
  url,
  type = "website",
  siteName = "AirSky",
}) => {
  const siteTitle = "AirSky - Đặt vé máy bay trực tuyến";
  const fullTitle = title ? `${title} | ${siteName}` : siteTitle;

  // Force update title when route changes
  useRouteTitle(title, siteName);

  return (
    <Helmet>
      {/* Basic meta tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Additional SEO tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="AirSky Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Canonical URL */}
      {url && <link rel="canonical" href={url} />}
    </Helmet>
  );
};

export default SEO;
