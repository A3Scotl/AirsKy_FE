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
          console.log("Title updated:", document.title);
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
  description = "AirSky - Đặt vé máy bay trực tuyến với giá tốt nhất. Tìm kiếm và so sánh vé máy bay từ nhiều hãng hàng không.",
  keywords = "đặt vé máy bay, vé máy bay giá rẻ, AirSky, du lịch, hàng không",
  image,
  url,
  type = "website",
  siteName = "AirSky",
}) => {
  const siteTitle = "AirSky - Đặt vé máy bay trực tuyến";
  const fullTitle = title ? `${title} | ${siteName}` : siteTitle;

  useRouteTitle(title, siteName);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      <meta name="robots" content="index, follow" />
      <meta name="author" content="AirSky Team" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {url && <link rel="canonical" href={url} />}
    </Helmet>
  );
};

export default SEO;
