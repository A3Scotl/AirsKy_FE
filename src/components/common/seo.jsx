import { Helmet } from "@dr.pogodin/react-helmet";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRouteTitle } from "@/hooks/use-route-title";

export const TitleSync = () => {
  const location = useLocation();

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "childList" &&
          mutation.target.nodeName === "TITLE"
        ) {
          // console.log("Title updated:", document.title);
        }
      });
    });

    const titleElement = document.querySelector("title");
    if (titleElement) {
      observer.observe(titleElement, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [location.pathname]);

  useEffect(() => {
    const event = new CustomEvent("helmetUpdate");
    window.dispatchEvent(event);
  }, [location]);

  return null;
};

const SEO = ({
  title,
  description = "AirSky - Đặt vé máy bay trực tuyến với giá tốt nhất Việt Nam 2025. Tìm kiếm, so sánh và đặt vé máy bay từ 20+ hãng hàng không. Giá rẻ, thanh toán an toàn, hỗ trợ 24/7. Vietnam Airlines, Vietjet, Bamboo Airways, Jetstar.",
  keywords = "đặt vé máy bay, vé máy bay giá rẻ 2025, vé máy bay online, so sánh giá vé máy bay, AirSky, du lịch Việt Nam, Vietnam Airlines, Vietjet, Bamboo Airways, Jetstar Pacific, hàng không, vé máy bay nội địa, vé máy bay quốc tế, đặt vé 24/7",
  image = "https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png",
  url,
  type = "website",
  siteName = "AirSky",
  structuredData,
}) => {
  const siteTitle = "AirSky - Đặt Vé Máy Bay Trực Tuyến Giá Tốt Nhất 2025";
  const fullTitle = title ? `${title} | ${siteName}` : siteTitle;

  useRouteTitle(title, siteName);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Basic Meta Tags */}
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <meta name="author" content="AirSky Team" />
      <meta name="publisher" content="AirSky" />
      <meta name="language" content="vi-VN" />
      <meta name="geo.region" content="VN" />
      <meta name="geo.country" content="Vietnam" />
      <meta name="distribution" content="global" />
      <meta name="revisit-after" content="1 days" />
      <meta name="rating" content="general" />

      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="vi_VN" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="AirSky - Đặt vé máy bay trực tuyến"
      />
      {url && <meta property="og:url" content={url} />}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@airsky_vn" />
      <meta name="twitter:creator" content="@airsky_vn" />

      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      <meta name="application-name" content="AirSky" />

      {/* Canonical URL */}
      {url && <link rel="canonical" href={url} />}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Default Structured Data for Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AirSky",
          url: "https://airsky.online",
          logo: "https://res.cloudinary.com/dzwjgfd7t/image/upload/v1755141382/flight%20booking/main_logo-removebg_xyofym.png",
          description:
            "Nền tảng đặt vé máy bay trực tuyến hàng đầu Việt Nam 2025 - Giá rẻ, an toàn, hỗ trợ 24/7",
          foundingDate: "2025",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+84-xxx-xxx-xxx",
            contactType: "customer service",
            availableLanguage: "Vietnamese",
          },
          sameAs: [
            "https://www.facebook.com/airsky.vn",
            "https://www.instagram.com/airsky.vn",
            "https://twitter.com/airsky_vn",
          ],
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
