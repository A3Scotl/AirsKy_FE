import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";


const destinations = [
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    image:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-D0OBowBPbZSKXKboOX2uEIk6rB0Zrf.png",
    routes: [
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Singapore",
        toCode: "SIN",
        dateRange: "Sep 20 - 29",
        price: "$154",
        priceFrom: "from",
      },
      {
        from: "Hanoi",
        fromCode: "HAN",
        to: "Singapore",
        toCode: "SIN",
        dateRange: "Sep 25 - 30",
        price: "$164",
        priceFrom: "from",
      },
      {
        from: "Da Nang",
        fromCode: "DAD",
        to: "Singapore",
        toCode: "SIN",
        dateRange: "Sep 22 - 28",
        price: "$174",
        priceFrom: "from",
      },
    ],
  },
  {
    id: "thailand",
    name: "Thailand",
    country: "Thailand",
    image: "/destinations/thailand.png",
    routes: [
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Chiang Mai",
        toCode: "CNX",
        dateRange: "Aug 28 - Sep 1",
        price: "$402",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Krabi",
        toCode: "KBV",
        dateRange: "Aug 29 - Sep 3",
        price: "$519",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Bangkok",
        toCode: "BKK",
        dateRange: "Sep 15 - 20",
        price: "$201",
        priceFrom: "from",
      },
      {
        from: "Hanoi",
        fromCode: "HAN",
        to: "Bangkok",
        toCode: "BKK",
        dateRange: "Sep 18 - 25",
        price: "$217",
        priceFrom: "from",
      },
    ],
  },
  {
    id: "japan",
    name: "Japan",
    country: "Japan",
    image: "/destinations/japan.png",
    routes: [
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Tokyo",
        toCode: "HND",
        dateRange: "Sep 28 - Oct 9",
        price: "$431",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Tokyo",
        toCode: "NRT",
        dateRange: "Oct 7 - 11",
        price: "$407",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Osaka",
        toCode: "KIX",
        dateRange: "Oct 12 - 18",
        price: "$421",
        priceFrom: "from",
      },
      {
        from: "Hanoi",
        fromCode: "HAN",
        to: "Tokyo",
        toCode: "NRT",
        dateRange: "Oct 20 - 27",
        price: "$436",
        priceFrom: "from",
      },
    ],
  },
  {
    id: "south-korea",
    name: "South Korea",
    country: "South Korea",
    image: "/destinations/south-korea.png",
    routes: [
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Jeju",
        toCode: "CJU",
        dateRange: "Sep 10 - 13",
        price: "$371",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Busan",
        toCode: "PUS",
        dateRange: "Sep 11 - 18",
        price: "$322",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Seoul",
        toCode: "ICN",
        dateRange: "Sep 5 - 12",
        price: "$294",
        priceFrom: "from",
      },
      {
        from: "Hanoi",
        fromCode: "HAN",
        to: "Seoul",
        toCode: "ICN",
        dateRange: "Sep 8 - 15",
        price: "$306",
        priceFrom: "from",
      },
    ],
  },
  {
    id: "australia",
    name: "Australia",
    country: "Australia",
    image: "/destinations/australia.png",
    routes: [
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Sydney",
        toCode: "SYD",
        dateRange: "Sep 5 - 16",
        price: "$601",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Perth",
        toCode: "PER",
        dateRange: "Aug 25 - Sep 1",
        price: "$349",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Melbourne",
        toCode: "MEL",
        dateRange: "Sep 10 - 20",
        price: "$625",
        priceFrom: "from",
      },
      {
        from: "Hanoi",
        fromCode: "HAN",
        to: "Sydney",
        toCode: "SYD",
        dateRange: "Sep 15 - 25",
        price: "$640",
        priceFrom: "from",
      },
    ],
  },
  {
    id: "china",
    name: "China",
    country: "China",
    image: "/destinations/china.png",
    routes: [
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Guangzhou",
        toCode: "CAN",
        dateRange: "Sep 5 - 9",
        price: "$182",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Nanjing",
        toCode: "NKG",
        dateRange: "Sep 14 - 19",
        price: "$226",
        priceFrom: "from",
      },
      {
        from: "Ho Chi Minh City",
        fromCode: "SGN",
        to: "Shenzhen",
        toCode: "SZX",
        dateRange: "Sep 12 - 17",
        price: "$199",
        priceFrom: "from",
      },
      {
        from: "Hanoi",
        fromCode: "HAN",
        to: "Beijing",
        toCode: "PEK",
        dateRange: "Sep 20 - 26",
        price: "$242",
        priceFrom: "from",
      },
    ],
  },
];

export function SuggestionDestination() {
  // State to manage visible routes for each destination
  const [visibleRoutes, setVisibleRoutes] = useState(
    destinations.reduce((acc, dest) => {
      acc[dest.id] = 2; // Initially show only 2 routes
      return acc;
    }, {})
  );

  // State to manage showing all destinations
  const [showAllDestinations, setShowAllDestinations] = useState(false);

  // Function to show more routes
  const handleShowMore = (destinationId) => {
    setVisibleRoutes((prev) => ({
      ...prev,
      [destinationId]: prev[destinationId] + 2, // Show 2 more routes
    }));
  };

  // Display only first 4 destinations initially
  const displayedDestinations = showAllDestinations ? destinations : destinations.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Những chuyến đi từ Việt Nam đến một số điểm đến phổ biến
        </h2>
        <p className="text-gray-600">
          Khám phá các ưu đãi chuyến bay đặc biệt đến những điểm đến hàng đầu toàn cầu.
        </p>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedDestinations.map((destination) => (
          <Card
            key={destination.id}
            className="overflow-hidden group hover:shadow-lg transition-shadow"
          >
            {/* Destination Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={
                  destination.image ||
                  `/placeholder.svg?height=200&width=400&query=${destination.name} landmark`
                }
                alt={destination.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 right-4">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Khám Phá Chuyến Bay
                </Button>
              </div>
              <div className="absolute bottom-4 left-4">
                <h3 className="text-white text-xl font-bold">
                  {destination.name}
                </h3>
              </div>
            </div>

            {/* Routes */}
            <div className="p-4 space-y-3">
              {destination.routes
                .slice(0, visibleRoutes[destination.id])
                .map((route, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {route.from} ({route.fromCode}) ⇄ {route.to} (
                        {route.toCode})
                      </p>
                      <p className="text-xs text-gray-500">{route.dateRange}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{route.priceFrom}</p>
                      <p className="font-bold text-red-600">{route.price}</p>
                    </div>
                  </div>
                ))}

              {/* View More Link */}
              {visibleRoutes[destination.id] < destination.routes.length && (
                <div className="pt-2 border-t">
                  <button
                    onClick={() => handleShowMore(destination.id)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                  >
                    Xem Thêm Chuyến Bay
                  </button>
                </div>
              )}

              {/* Show less option when all routes are visible */}
              {visibleRoutes[destination.id] >= destination.routes.length &&
                destination.routes.length > 2 && (
                  <div className="pt-2 border-t">
                    <button
                      onClick={() =>
                        setVisibleRoutes((prev) => ({
                          ...prev,
                          [destination.id]: 2,
                        }))
                      }
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200"
                    >
                      Xem Ít Hơn
                    </button>
                  </div>
                )}
            </div>
          </Card>
        ))}
      </div>

      {/* See More Destinations Button */}
      {!showAllDestinations && destinations.length > 4 && (
        <div className="text-center mt-8">
          <Button
            onClick={() => setShowAllDestinations(true)}
            variant="outline"
            className="px-8 py-2 text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Xem Thêm Điểm Đến
          </Button>
        </div>
      )}
    </div>
  );
}
