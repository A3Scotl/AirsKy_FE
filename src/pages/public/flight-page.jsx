"use client";

import SEO from "@/components/common/seo";
import { FlightSearchResults } from "../../components/section/flight/result-section";

export default function FlightPage() {
  return (
    <>
      <SEO
        title="Tìm kiếm chuyến bay"
        description="Tìm kiếm và so sánh vé máy bay từ hàng trăm hãng hàng không. Đặt vé máy bay giá rẻ với AirSky."
        keywords="tìm kiếm chuyến bay, so sánh vé máy bay, đặt vé máy bay"
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 pb-12">
        <FlightSearchResults />
      </div>
    </>
  );
}
