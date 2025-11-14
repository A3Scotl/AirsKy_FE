import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Trash2, Plane, MapPin } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import chatbotService from "@/services/chatbot-service";
import { flightApi } from "@/apis/flight-api";
import Pagination from "@/components/ui/pagination";

// Utility: Clean Markdown text
const cleanMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/[#*`~>_-]+/g, "") // Remove Markdown syntax
    .replace(/[\p{Emoji_Presentation}\p{Emoji}\u200D]/gu, "") // Remove emojis
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
};

// Utility: Parse flight text
const parseFlightText = (text) => {
  if (!text?.includes("**") || !text?.includes("→")) return null;

  try {
    const flightMatch = text.match(
      /\d+\.\s*\*\*([A-Z0-9\s]+?)\s*-\s*([^\*]+?)\*\*/
    );
    if (!flightMatch) return null;
    const [flightNumber, airline] = [
      flightMatch[1].trim(),
      flightMatch[2].trim(),
    ];

    const routeMatch = text.match(/Từ:\s*([^\(]+?)\s*\(([A-Z]{3})\)/);
    const arrivalMatch = text.match(/Đến:\s*([^\(]+?)\s*\(([A-Z]{3})\)/);
    if (!routeMatch || !arrivalMatch) return null;
    const [departureAirport, departureCode] = [
      routeMatch[1].trim(),
      routeMatch[2],
    ];
    const [arrivalAirport, arrivalCode] = [
      arrivalMatch[1].trim(),
      arrivalMatch[2],
    ];

    const timeMatch = text.match(
      /Giờ khởi hành:\s*(\d{1,2}:\d{2})\s*.*?\s*Giờ đến:\s*(\d{1,2}:\d{2})/
    );
    if (!timeMatch) return null;
    const [departureTime, arrivalTime] = [timeMatch[1], timeMatch[2]];

    const priceMatch = text.match(/Giá vé:\s*([^\n]+)/);
    const price = priceMatch ? cleanMarkdown(priceMatch[1]) : "Liên hệ";

    return {
      flightId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      flightNumber,
      airline,
      departureAirport,
      departureCode,
      arrivalAirport,
      arrivalCode,
      departureTime,
      arrivalTime,
      price,
      tripType: text.includes("Khứ hồi") ? "ROUND_TRIP" : "ONE_WAY",
    };
  } catch (error) {
    console.error("Error parsing flight text:", error, "Text:", text);
    return null;
  }
};

// Component: MarkdownRenderer
const MarkdownRenderer = ({ content }) => (
  <ReactMarkdown
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-md text-sm"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        ) : (
          <code
            className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      },
      h1: ({ children }) => (
        <h1 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-3">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-base font-medium text-gray-900 dark:text-white mt-3 mb-2">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mt-3 mb-2">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="mb-2 ml-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-2 ml-3 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-decimal">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="flex items-start">
          <span className="text-gray-500 dark:text-gray-400 mr-2 mt-1.5 text-xs">
            •
          </span>
          <span className="flex-1">{children}</span>
        </li>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 text-gray-600 dark:text-gray-300 italic">
          {children}
        </blockquote>
      ),
      strong: ({ children }) => (
        <strong className="font-medium text-gray-900 dark:text-white">
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em className="italic text-sm text-gray-600 dark:text-gray-400">
          {children}
        </em>
      ),
      a: ({ children, href }) => (
        <a
          href={href}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-600">
            {children}
          </table>
        </div>
      ),
      th: ({ children }) => (
        <th className="border border-gray-200 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left font-semibold text-gray-900 dark:text-white">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
          {children}
        </td>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

// Configuration for DataList rendering
const dataRenderConfig = {
  airlines: {
    render: (item) => (
      <>
        <span className="font-medium">
          {cleanMarkdown(item.airline_name) || "N/A"}
        </span>
        <span className="text-gray-500 ml-2">
          ({(item.airline_code || "").toUpperCase()})
        </span>
      </>
    ),
  },
  airports: {
    icon: <MapPin className="w-4 h-4 text-blue-500" />,
    render: (item) => (
      <>
        <span className="font-medium">
          {cleanMarkdown(item.airport_name) || "N/A"}
        </span>
        <span className="text-gray-500 ml-2">
          ({cleanMarkdown(item.airport_code) || "N/A"})
        </span>
        <span className="text-gray-400 ml-2">
          {" "}
          - {cleanMarkdown(item.city_name) || "N/A"}
        </span>
      </>
    ),
  },
  countries: {
    render: (item) => (
      <>
        <span className="font-medium">
          {cleanMarkdown(item.country_name) || "N/A"}
        </span>
        <span className="text-gray-500 ml-2">
          ({cleanMarkdown(item.country_code) || "N/A"})
        </span>
      </>
    ),
  },
  blogs: {
    render: (item) => (
      <div className="flex-1">
        <span className="font-medium text-gray-800 dark:text-gray-200 block mb-1">
          {cleanMarkdown(item.title) || "N/A"}
        </span>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-4">
            <span>
              📅 {new Date(item.published_date).toLocaleDateString("vi-VN")}
            </span>
            <span>👁️ {item.view_count || 0} lượt xem</span>
            <span>👍 {item.like_count || 0} lượt thích</span>
          </div>
        </div>
      </div>
    ),
  },
  deals: {
    render: (item) => (
      <>
        <span className="font-medium">
          {cleanMarkdown(item.title) || "N/A"}{" "}
          {item.deal_code ? `(${cleanMarkdown(item.deal_code)})` : ""}
        </span>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          💰 Giảm: {item.discount_percentage}% | Từ:{" "}
          {new Date(item.valid_from).toLocaleDateString("vi-VN")} Đến:{" "}
          {new Date(item.valid_to).toLocaleDateString("vi-VN")}
        </div>
      </>
    ),
  },
  aircrafts: {
    render: (item) => (
      <>
        <span className="font-medium">
          {cleanMarkdown(item.aircraft_name) || "N/A"}
        </span>
        <span className="text-gray-500 ml-2">
          ({cleanMarkdown(item.aircraft_code) || "N/A"})
        </span>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          💺 Số ghế: {item.total_seats}
        </div>
      </>
    ),
  },
  gates: {
    render: (item) => (
      <>
        <span className="font-medium">
          {cleanMarkdown(item.gate_name) || "N/A"}
        </span>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          🏢 Terminal: {item.terminal || "N/A"} | 🏙️ {item.city_name} -{" "}
          {item.airport_name}
        </div>
      </>
    ),
  },
};

// Component: DataList
const DataList = ({ data, dataType, messageId, pagination, onPageChange }) => {
  const { currentPage = 1, itemsPerPage = 10 } = pagination[messageId] || {};
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const config = dataRenderConfig[dataType] || {
    render: (item) => <span>{JSON.stringify(item)}</span>,
  };

  return (
    <div className="space-y-2">
      {data.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          Không tìm thấy dữ liệu.
        </p>
      ) : (
        <>
          {paginatedData.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {config.icon && <span>{config.icon}</span>}
              <div>{config.render(item)}</div>
            </div>
          ))}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-xs font-light text-gray-600 dark:text-gray-400">
              <span>
                Trang {currentPage} / {totalPages} • Tổng {data.length} mục
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
                onPageChange={(page) => onPageChange(messageId, page)}
                showPageSizeSelector={false}
                showFirstLast={false}
                maxVisiblePages={5}
                className="mb-0"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Utility function to convert flights to itinerary format
// Now fetches full flight data from API using flight ID

// Helper function to create normalized flight data
const createNormalizedFlight = async (
  flight,
  flightId,
  direction = "oneway"
) => {
  // Try to fetch full flight data from API
  let fullFlightData = null;
  try {
    const response = await flightApi.getFlightById(flightId);
    if (response.success && response.data) {
      fullFlightData = response.data;
    } else {
      console.warn(
        `[ChatbotWidget] API call failed or no data for flight ${flightId}:`,
        response
      );
    }
  } catch (apiError) {
    console.warn(
      `[ChatbotWidget] Failed to fetch full data for flight ${flightId}, using chatbot data:`,
      apiError
    );
  }

  // Use full flight data if available, otherwise fall back to chatbot data
  const flightToUse = fullFlightData || flight;

  // Normalize the flight data
  // Helper function to extract date and time from ISO datetime string
  const extractDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return { date: null, time: null };

    // If it's already in HH:MM format, return as time only
    if (
      typeof dateTimeStr === "string" &&
      dateTimeStr.match(/^\d{1,2}:\d{2}$/)
    ) {
      return { date: null, time: dateTimeStr };
    }

    // If it's ISO datetime format (YYYY-MM-DDTHH:MM:SS), extract date and time
    if (typeof dateTimeStr === "string" && dateTimeStr.includes("T")) {
      try {
        const date = new Date(dateTimeStr);
        const dateStr = date.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const timeStr = date.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return { date: dateStr, time: timeStr };
      } catch (error) {
        console.warn("Failed to parse datetime:", dateTimeStr, error);
        return { date: null, time: null };
      }
    }

    return { date: null, time: dateTimeStr };
  };

  const departureDateTime = extractDateTime(
    flightToUse.departureTime || flight.departureTime
  );
  const arrivalDateTime = extractDateTime(
    flightToUse.arrivalTime || flight.arrivalTime
  );

  return {
    flightId: flightId,
    flightNumber: flightToUse.flightNumber || flight.flightNumber,
    airline: {
      airlineName:
        flightToUse.airline?.airlineName ||
        flightToUse.airline ||
        flight.airline,
      airlineCode:
        flightToUse.airline?.airlineCode ||
        flightToUse.airlineCode ||
        flight.airlineCode ||
        (
          flightToUse.airline?.airlineName ||
          flightToUse.airline ||
          flight.airline
        )
          ?.substring(0, 2)
          .toUpperCase(),
      thumbnail:
        flightToUse.airline?.thumbnail ||
        flightToUse.airlineLogo ||
        flight.airlineLogo ||
        `https://logo.clearbit.com/${(
          flightToUse.airline?.airlineName ||
          flightToUse.airline ||
          flight.airline
        )
          ?.toLowerCase()
          .replace(/\s+/g, "")}.com`,
    },
    departureAirport: {
      airportCode:
        flightToUse.departureAirport?.airportCode ||
        flightToUse.departureCode ||
        flight.departureCode,
      airportName:
        flightToUse.departureAirport?.airportName ||
        flightToUse.departureAirport ||
        flight.departureAirport,
      cityNames: [
        flightToUse.departureAirport?.cityName ||
          flightToUse.departureAirport ||
          flight.departureAirport,
      ],
    },
    arrivalAirport: {
      airportCode:
        flightToUse.arrivalAirport?.airportCode ||
        flightToUse.arrivalCode ||
        flight.arrivalCode,
      airportName:
        flightToUse.arrivalAirport?.airportName ||
        flightToUse.arrivalAirport ||
        flight.arrivalAirport,
      cityNames: [
        flightToUse.arrivalAirport?.cityName ||
          flightToUse.arrivalAirport ||
          flight.arrivalAirport,
      ],
    },
    departureTime: departureDateTime.time,
    arrivalTime: arrivalDateTime.time,
    departureDate: departureDateTime.date,
    arrivalDate: arrivalDateTime.date,
    duration: flightToUse.duration || flight.duration || 120,
    type: flightToUse.type || flight.type || "DOMESTIC",
    status: flightToUse.status || flight.status || "ON_TIME",
    aircraft: flightToUse.aircraft || flight.aircraft || "N/A",
    priceNumeric:
      parseInt(
        (
          flightToUse.price ||
          flightToUse.basePrice ||
          flight.price ||
          flight.basePrice ||
          "0"
        )
          .toString()
          .replace(/[^\d]/g, "")
      ) || 0,
    basePrice:
      parseInt(
        (
          flightToUse.price ||
          flightToUse.basePrice ||
          flight.price ||
          flight.basePrice ||
          "0"
        )
          .toString()
          .replace(/[^\d]/g, "")
      ) || 0,
    availableSeats: flightToUse.availableSeats || flight.availableSeats || 100,
    totalSeats: flightToUse.totalSeats || flight.totalSeats || 180,
    tripType: flightToUse.tripType || flight.tripType,
    from:
      flightToUse.departureAirport?.airportName ||
      flightToUse.departureAirport ||
      flight.departureAirport,
    fromCode:
      flightToUse.departureAirport?.airportCode ||
      flightToUse.departureCode ||
      flight.departureCode,
    to:
      flightToUse.arrivalAirport?.airportName ||
      flightToUse.arrivalAirport ||
      flight.arrivalAirport,
    toCode:
      flightToUse.arrivalAirport?.airportCode ||
      flightToUse.arrivalCode ||
      flight.arrivalCode,
    stops: flightToUse.stops || flight.stops || 0,
    stopsList: flightToUse.stopsList || flight.stopsList || [],
    gate: flightToUse.gate || flight.gate || "TBA",
    terminal: flightToUse.terminal || flight.terminal || "TBA",
    businessName: flightToUse.businessName || flight.businessName || "",
    flightTravelClasses:
      flightToUse.flightTravelClasses || flight.flightTravelClasses || [],
    direction: direction, // Add direction for roundtrip flights
  };

  return normalizedFlight;
};

const convertToItineraries = async (flights) => {
  const itineraries = [];

  for (const flight of flights) {
    try {
      const tripType = flight.tripType || "ONE_WAY";

      if (tripType === "ROUND_TRIP") {
        // Handle ROUND_TRIP: create itinerary with outbound and return legs
        const roundtripId = flight.flightId || `roundtrip-${Date.now()}`;

        // Extract flight IDs from roundtrip format like "roundtrip-18-16"
        let outboundId = "1";
        let returnId = "2";
        const roundtripIdStr = String(roundtripId); // Convert to string to ensure .includes() works
        if (roundtripIdStr.includes("-")) {
          const parts = roundtripIdStr.split("-");
          if (parts.length >= 3) {
            outboundId = parts[1];
            returnId = parts[2];
          }
        }

        // Create outbound flight
        const outboundFlight = await createNormalizedFlight(
          flight,
          outboundId,
          "outbound"
        );
        // Create return flight (reverse direction)
        const returnFlight = await createNormalizedFlight(
          {
            ...flight,
            departureCode: flight.arrivalCode,
            departureAirport: flight.arrivalAirport,
            arrivalCode: flight.departureCode,
            arrivalAirport: flight.departureAirport,
            departureTime: flight.returnDepartureTime || flight.departureTime,
            arrivalTime: flight.returnArrivalTime || flight.arrivalTime,
          },
          returnId,
          "return"
        );

        const itinerary = {
          itineraryId: roundtripId,
          tripType: "ROUND_TRIP",
          legs: [outboundFlight, returnFlight],
          totalPrice:
            (outboundFlight.basePrice || 0) + (returnFlight.basePrice || 0),
          totalDuration:
            (outboundFlight.duration || 0) + (returnFlight.duration || 0),
          totalStops:
            (outboundFlight.stopsList?.length || 0) +
            (returnFlight.stopsList?.length || 0),
          originalFlight: flight,
        };

        itineraries.push(itinerary);
      } else {
        // Handle ONE_WAY (default)
        let flightId = flight.flightId;
        if (!flightId) {
          flightId = "1";
        } else if (typeof flightId === "string" && flightId.includes("-")) {
          // Handle generated IDs like "1234567890-abc123"
          const parts = flightId.split("-");
          const lastPart = parts[parts.length - 1];
          if (/^\d+$/.test(lastPart)) {
            flightId = lastPart;
          } else {
            // Use the first part if it's a number (real flight ID)
            const firstPart = parts[0];
            if (/^\d+$/.test(firstPart)) {
              flightId = firstPart;
            } else {
              flightId = "1";
            }
          }
        } else if (!/^\d+$/.test(flightId)) {
          // If flightId is not a pure number, try to extract number from it
          const numberMatch = flightId.toString().match(/\d+/);
          if (numberMatch) {
            flightId = numberMatch[0];
          } else {
            flightId = "1";
          }
        }
        // If flightId is still not a number, keep the original value
        if (!/^\d+$/.test(flightId)) {
          flightId = flight.flightId || "1";
        }

        const normalizedFlight = await createNormalizedFlight(
          flight,
          flightId,
          "oneway"
        );
        const itinerary = {
          itineraryId: `one_way-${flightId}`,
          tripType: "ONE_WAY",
          legs: [normalizedFlight],
          totalPrice: normalizedFlight.basePrice || 0,
          totalDuration: normalizedFlight.duration || 0,
          totalStops: normalizedFlight.stopsList?.length || 0,
          originalFlight: flight,
        };

        itineraries.push(itinerary);
      }
    } catch (error) {
      console.error(`[ChatbotWidget] Error processing flight:`, error);
      // Fallback to basic itinerary
      const basicItinerary = {
        itineraryId: `fallback-${flight.flightId || "unknown"}`,
        tripType: flight.tripType || "ONE_WAY",
        legs: [flight],
        totalPrice: flight.basePrice || flight.priceNumeric || 0,
        totalDuration: flight.duration || 120,
        totalStops: flight.stopsList?.length || 0,
        originalFlight: flight,
      };
      itineraries.push(basicItinerary);
    }
  }

  return itineraries;
};

// Component: FlightResultsWithGlobalTabs
const FlightResultsWithGlobalTabs = ({
  flights,
  onFareSelect,
  selectedFares,
  onFlightClick,
}) => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("economy");

  // Get all unique fare classes from all flights
  const getAllFareClasses = () => {
    const fareClasses = new Set();
    flights.forEach((flight) => {
      if (flight.flightTravelClasses && flight.flightTravelClasses.length > 0) {
        flight.flightTravelClasses.forEach((ftc) => {
          const className =
            ftc.travelClass?.className || ftc.className || ftc.travelClassName;
          if (className) fareClasses.add(className.toLowerCase());
        });
      }
    });

    // If no real data, use default classes
    if (fareClasses.size === 0) {
      return ["economy", "business", "first class"];
    }

    return Array.from(fareClasses);
  };

  const fareClasses = getAllFareClasses();

  const formatDuration = (duration) => {
    if (typeof duration === "string") {
      // Parse "1h 0m" format
      const hourMatch = duration.match(/(\d+)h/);
      const minuteMatch = duration.match(/(\d+)m/);
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      return hours * 60 + minutes;
    }
    if (typeof duration === "number") return duration;
    return 120; // default 2 hours
  };

  const formatCurrencyVND = (amount) => {
    if (!amount || amount === "Liên hệ") return "Liên hệ";
    if (typeof amount === "string") {
      const numericStr = amount.replace(/[₫\.\s]/g, "");
      const parsed = parseInt(numericStr, 10);
      if (isNaN(parsed)) return "Liên hệ";
      amount = parsed;
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFareForFlight = (flight, className) => {
    if (
      !flight.flightTravelClasses ||
      flight.flightTravelClasses.length === 0
    ) {
      // Fallback pricing
      const basePrice =
        typeof flight.price === "number" ? flight.price : 1450000;
      switch (className.toLowerCase()) {
        case "business":
          return { price: basePrice * 2, availableSeats: 20 };
        case "first class":
          return { price: basePrice * 3, availableSeats: 10 };
        default:
          return { price: basePrice, availableSeats: 50 };
      }
    }

    const fareOption = flight.flightTravelClasses.find((ftc) => {
      const ftcClassName =
        ftc.travelClass?.className || ftc.className || ftc.travelClassName;
      return (
        ftcClassName && ftcClassName.toLowerCase() === className.toLowerCase()
      );
    });

    if (fareOption) {
      return {
        price: fareOption.price || fareOption.basePrice || flight.price,
        availableSeats:
          fareOption.availableSeats || fareOption.available_seats || 0,
      };
    }

    // Fallback if specific class not found
    return { price: flight.price, availableSeats: 0 };
  };

  const handleFlightSelect = (flight) => {
    const fareData = getFareForFlight(flight, selectedTab);

    const bookingData = {
      type: "ONE_WAY",
      tripType: "ONE_WAY",
      flight: {
        ...flight,
        selectedFare: {
          travelClass: { className: selectedTab },
          price: fareData.price,
          availableSeats: fareData.availableSeats,
        },
      },
      passengers: 1,
      totalPrice: fareData.price,
      currency: "VND",
      source: "chatbot",
    };

    localStorage.setItem("chatbot_booking_data", JSON.stringify(bookingData));
    navigate("/booking-stepper", { state: { bookingData, source: "chatbot" } });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Global Fare Class Tabs */}
      <div className="space-y-3">
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          {fareClasses.map((className) => (
            <button
              key={className}
              onClick={() => setSelectedTab(className)}
              className={`flex-1 py-2 px-3 text-center text-sm font-medium transition-colors ${
                selectedTab === className
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {className.charAt(0).toUpperCase() + className.slice(1)}
            </button>
          ))}
        </div>

        {/* Flight List */}
        <div className="space-y-3">
          {flights.map((flight, index) => (
            <FlightWithFareOptions
              key={`${flight.flightId || flight.id}-${index}`}
              flight={flight}
              onFareSelect={onFareSelect}
              selectedFare={selectedFares[flight.flightId || flight.id]}
              onFlightClick={onFlightClick}
              selectedTab={selectedTab}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Component: FlightWithFareOptions
const FlightWithFareOptions = ({
  flight,
  onFareSelect,
  selectedFare,
  onFlightClick,
  selectedTab,
}) => {
  const navigate = useNavigate();

  // Debug: Log flight data to check if flightTravelClasses exists

  // Parse base price from flight.price (remove currency symbols and format)
  const parsePrice = (priceStr) => {
    if (typeof priceStr === "number") return priceStr;
    if (typeof priceStr === "string") {
      // Remove currency symbols, dots, and spaces
      const numericStr = priceStr.replace(/[₫\.\s]/g, "");
      const parsed = parseInt(numericStr, 10);
      return isNaN(parsed) ? 1450000 : parsed; // Default fallback
    }
    return 1450000; // Default fallback
  };

  const basePrice = parsePrice(flight.price);

  // Use real fare options from flight.flightTravelClasses if available, otherwise create default ones
  const fareOptions =
    flight.flightTravelClasses && flight.flightTravelClasses.length > 0
      ? flight.flightTravelClasses.map((ftc) => {
          return {
            id:
              ftc.id ||
              ftc.flightTravelClassId ||
              `${flight.flightId}-${
                ftc.travelClass?.className || ftc.className || "economy"
              }`,
            travelClass: {
              className:
                ftc.travelClass?.className ||
                ftc.className ||
                ftc.travelClassName ||
                "Economy",
              changeable: !!ftc.travelClass?.changeable || !!ftc.changeable,
              refundable: !!ftc.travelClass?.refundable || !!ftc.refundable,
              // Parse benefits string into array
              benefits:
                typeof ftc.travelClass?.benefits === "string"
                  ? ftc.travelClass.benefits.split(",").map((b) => b.trim())
                  : Array.isArray(ftc.travelClass?.benefits)
                  ? ftc.travelClass.benefits
                  : typeof ftc.benefits === "string"
                  ? ftc.benefits.split(",").map((b) => b.trim())
                  : Array.isArray(ftc.benefits)
                  ? ftc.benefits
                  : [],
            },
            price: (() => {
              const price = ftc.price || ftc.basePrice;
              if (typeof price === "number") return price;
              if (typeof price === "string") {
                const parsed = parseFloat(price.replace(/[₫\.\s]/g, ""));
                return isNaN(parsed) ? basePrice : parsed;
              }
              return basePrice;
            })(),
            availableSeats: (() => {
              const seats = ftc.availableSeats || ftc.available_seats;
              if (typeof seats === "number") return seats;
              if (typeof seats === "string") {
                const parsed = parseInt(seats, 10);
                return isNaN(parsed) ? 0 : parsed;
              }
              return 0;
            })(),
            capacity: ftc.capacity || ftc.totalSeats,
            bookedSeat: ftc.bookedSeat || ftc.booked_seats || 0,
          };
        })
      : [
          {
            id: `${flight.flightId}-economy`,
            travelClass: {
              className: "Economy",
              changeable: false,
              refundable: false,
              benefits: [
                "Hành lý xách tay 7kg",
                "Chọn chỗ ngồi trả phí",
                "Phục vụ nước uống",
              ],
            },
            price: basePrice,
            availableSeats: 50,
          },
          {
            id: `${flight.flightId}-business`,
            travelClass: {
              className: "Business",
              changeable: true,
              refundable: true,
              benefits: [
                "Hành lý xách tay 10kg",
                "Hành lý ký gửi 30kg",
                "Chọn chỗ ngồi miễn phí",
                "Ưu tiên check-in",
                "Suất ăn đặc biệt",
              ],
            },
            price: basePrice * 2,
            availableSeats: 20,
          },
          {
            id: `${flight.flightId}-first`,
            travelClass: {
              className: "First Class",
              changeable: true,
              refundable: true,
              benefits: [
                "Hành lý xách tay 15kg",
                "Hành lý ký gửi 50kg",
                "Ghế ngồi hạng nhất",
                "Phòng chờ VIP",
                "Dịch vụ 5 sao",
              ],
            },
            price: basePrice * 3,
            availableSeats: 10,
          },
        ];

  const formatDuration = (duration) => {
    if (typeof duration === "string") {
      // Parse "1h 0m" format
      const hourMatch = duration.match(/(\d+)h/);
      const minuteMatch = duration.match(/(\d+)m/);
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      return hours * 60 + minutes;
    }
    if (typeof duration === "number") return duration;
    return 120; // default 2 hours
  };

  const formatCurrencyVND = (amount) => {
    if (!amount || amount === "Liên hệ") return "Liên hệ";
    if (typeof amount === "string") {
      const numericStr = amount.replace(/[₫\.\s]/g, "");
      const parsed = parseInt(numericStr, 10);
      if (isNaN(parsed)) return "Liên hệ";
      amount = parsed;
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleProceedToBooking = () => {
    const selectedFareOption = fareOptions.find(
      (option) =>
        (option.travelClass?.className || "economy").toLowerCase() ===
        selectedTab
    );

    if (!selectedFareOption) return;

    const bookingData = {
      type: "ONE_WAY",
      flightId: flight.flightId || flight.id,
      flightNumber: flight.flightNumber || "N/A",
      airline: flight.airline?.airlineName || flight.airline || "N/A",
      airlineLogo: flight.airline?.thumbnail || flight.airlineLogo,
      flight: {
        id: flight.flightId || flight.id,
        flightId: flight.flightId || flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline?.airlineName || flight.airline,
        airlineName: flight.airline?.airlineName || flight.airline,
        airlineLogo: flight.airline?.thumbnail || flight.airlineLogo,
        selectedClass: selectedFareOption,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        departureDate: flight.departureTime, // Will be formatted by booking-stepper
        arrivalDate: flight.arrivalTime, // Will be formatted by booking-stepper
        from: flight.fromCode || flight.departureCode,
        to: flight.toCode || flight.arrivalCode,
        departureAirport: {
          code: flight.departureCode,
          name: flight.departureAirport?.airportName || flight.from,
          city: flight.departureAirport?.cityName || "N/A",
          airportName: flight.departureAirport?.airportName || flight.from,
          gate: flight.gate || "TBA",
          terminal: flight.terminal || "TBA",
        },
        arrivalAirport: {
          code: flight.arrivalCode,
          name: flight.arrivalAirport?.airportName || flight.to,
          city: flight.arrivalAirport?.cityName || "N/A",
          airportName: flight.arrivalAirport?.airportName || flight.to,
          gate: "TBA",
          terminal: "TBA",
        },
        duration: flight.duration,
        aircraft: flight.aircraft,
        aircraftName: flight.aircraft,
        seatLayout: "N/A",
        totalSeats: flight.totalSeats || 0,
        stops: flight.stops || 0,
      },
      selectedClass: selectedFareOption,
      totalPrice: selectedFareOption.price,
      formattedTotalPrice: formatCurrencyVND(selectedFareOption.price),
      currency: "VND",
      passengers: 1,
      bookingDate: new Date().toISOString(),
      source: "chatbot",
    };

    localStorage.setItem("selectedFlight", JSON.stringify(bookingData));
    navigate("/booking-stepper", { state: { bookingData } });
  };

  const getCurrentFare = () => {
    const tabToFind = selectedTab || "economy";
    return (
      fareOptions.find(
        (option) =>
          (option.travelClass?.className || "economy").toLowerCase() ===
          tabToFind.toLowerCase()
      ) || fareOptions[0]
    );
  };

  const currentFare = getCurrentFare();

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onFlightClick && onFlightClick(flight)}
    >
      {/* Flight Info Header - Simplified */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">
              ✈️
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white text-sm">
              {flight.flightNumber} -{" "}
              {(() => {
                if (typeof flight.airline === "string") return flight.airline;
                if (
                  flight.airline &&
                  typeof flight.airline === "object" &&
                  flight.airline.airlineName
                )
                  return flight.airline.airlineName;
                if (
                  flight.airlineName &&
                  typeof flight.airlineName === "string"
                )
                  return flight.airlineName;
                return "Unknown Airline";
              })()}
            </div>
            {/* <div className="text-xs text-gray-500 dark:text-gray-400">
              {(() => {
                if (typeof flight.aircraft === "string") return flight.aircraft;
                if (
                  flight.aircraft &&
                  typeof flight.aircraft === "object" &&
                  flight.aircraft.aircraftName
                )
                  return flight.aircraft.aircraftName;
                if (
                  flight.aircraft &&
                  typeof flight.aircraft === "object" &&
                  flight.aircraft.aircraftCode
                )
                  return flight.aircraft.aircraftCode;
                if (
                  flight.aircraftName &&
                  typeof flight.aircraftName === "string"
                )
                  return flight.aircraftName;
                return "N/A";
              })()}
            </div> */}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrencyVND(
              (() => {
                const price = currentFare.price;
                if (typeof price === "number") return price;
                if (typeof price === "string") {
                  const parsed = parseFloat(price.replace(/[₫\.\s]/g, ""));
                  return isNaN(parsed) ? basePrice : parsed;
                }
                return basePrice;
              })()
            )}
          </div>
        </div>
      </div>

      {/* Flight Route - Simplified */}
      <div className="flex items-center justify-between py-2">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {flight.departureTime}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {flight.departureDate || "N/A"}
          </div>
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {flight.departureCode ||
              (typeof flight.departureAirport === "object"
                ? flight.departureAirport.airportCode
                : flight.departureAirport) ||
              "N/A"}
          </div>
        </div>

        <div className="flex-1 text-center px-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            {Math.floor(formatDuration(flight.duration) / 60)}h{" "}
            {formatDuration(flight.duration) % 60}p
          </div>
          <div className="flex items-center justify-center">
            <div className="w-12 h-0.5 bg-blue-300 dark:bg-blue-600"></div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mx-1"></div>
            <div className="w-12 h-0.5 bg-blue-300 dark:bg-blue-600"></div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {flight.arrivalTime}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {flight.arrivalDate || "N/A"}
          </div>
          <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {flight.arrivalCode ||
              (typeof flight.arrivalAirport === "object"
                ? flight.arrivalAirport.airportCode
                : flight.arrivalAirport) ||
              "N/A"}
          </div>
        </div>
      </div>

      {/* Click hint */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Nhấn để xem chi tiết và chọn hạng vé
      </div>
    </div>
  );
};

// Component: FlightDetailModal
const FlightDetailModal = ({
  flight,
  isOpen,
  onClose,
  navigate,
  onFareSelect,
}) => {
  const [selectedTab, setSelectedTab] = useState("economy");

  if (!isOpen || !flight) return null;

  // Parse base price from flight.price (remove currency symbols and format)
  const parsePrice = (priceStr) => {
    if (typeof priceStr === "number") return priceStr;
    if (typeof priceStr === "string") {
      // Remove currency symbols, dots, and spaces
      const numericStr = priceStr.replace(/[₫\.\s]/g, "");
      const parsed = parseInt(numericStr, 10);
      return isNaN(parsed) ? 1450000 : parsed; // Default fallback
    }
    return 1450000; // Default fallback
  };

  const basePrice = parsePrice(flight.price);

  // Use real fare options from flight.flightTravelClasses if available, otherwise create default ones
  const fareOptions =
    flight.flightTravelClasses && flight.flightTravelClasses.length > 0
      ? flight.flightTravelClasses.map((ftc) => {
          return {
            id:
              ftc.id ||
              ftc.flightTravelClassId ||
              `${flight.flightId}-${
                ftc.travelClass?.className || ftc.className || "economy"
              }`,
            flightTravelClassId: ftc.id || ftc.flightTravelClassId,
            travelClassId: ftc.travelClass?.id || ftc.travelClassId,
            name:
              ftc.travelClass?.className ||
              ftc.className ||
              ftc.travelClassName ||
              "Economy",
            travelClass: {
              id: ftc.travelClass?.id || ftc.travelClassId,
              className:
                ftc.travelClass?.className ||
                ftc.className ||
                ftc.travelClassName ||
                "Economy",
              changeable: !!ftc.travelClass?.changeable || !!ftc.changeable,
              refundable: !!ftc.travelClass?.refundable || !!ftc.refundable,
              benefits:
                typeof ftc.travelClass?.benefits === "string"
                  ? ftc.travelClass.benefits.split(",").map((b) => b.trim())
                  : Array.isArray(ftc.travelClass?.benefits)
                  ? ftc.travelClass.benefits
                  : typeof ftc.benefits === "string"
                  ? ftc.benefits.split(",").map((b) => b.trim())
                  : Array.isArray(ftc.benefits)
                  ? ftc.benefits
                  : [],
            },
            price:
              typeof ftc.price === "number"
                ? ftc.price
                : typeof ftc.basePrice === "number"
                ? ftc.basePrice
                : basePrice,
            availableSeats: ftc.availableSeats || ftc.available_seats || 0,
            capacity: ftc.capacity || ftc.totalSeats,
            bookedSeat: ftc.bookedSeat || ftc.booked_seats || 0,
          };
        })
      : [
          {
            id: `${flight.flightId}-economy`,
            flightTravelClassId: `${flight.flightId}-economy`,
            travelClassId: 1, // Default economy travel class ID
            name: "Economy",
            travelClass: {
              id: 1,
              className: "Economy",
              changeable: false,
              refundable: false,
              benefits: [
                "Hành lý xách tay 7kg",
                "Chọn chỗ ngồi trả phí",
                "Phục vụ nước uống",
              ],
            },
            price: basePrice,
            availableSeats: 50,
          },
          {
            id: `${flight.flightId}-business`,
            flightTravelClassId: `${flight.flightId}-business`,
            travelClassId: 2, // Default business travel class ID
            name: "Business",
            travelClass: {
              id: 2,
              className: "Business",
              changeable: true,
              refundable: true,
              benefits: [
                "Hành lý xách tay 10kg",
                "Hành lý ký gửi 30kg",
                "Chọn chỗ ngồi miễn phí",
                "Ưu tiên check-in",
                "Suất ăn đặc biệt",
              ],
            },
            price: basePrice * 2,
            availableSeats: 20,
          },
          {
            id: `${flight.flightId}-first`,
            flightTravelClassId: `${flight.flightId}-first`,
            travelClassId: 3, // Default first class travel class ID
            name: "First Class",
            travelClass: {
              id: 3,
              className: "First Class",
              changeable: true,
              refundable: true,
              benefits: [
                "Hành lý xách tay 15kg",
                "Hành lý ký gửi 50kg",
                "Ghế ngồi hạng nhất",
                "Phòng chờ VIP",
                "Dịch vụ 5 sao",
              ],
            },
            price: basePrice * 3,
            availableSeats: 10,
          },
        ];

  const formatDuration = (duration) => {
    if (typeof duration === "string") {
      // Parse "1h 0m" format
      const hourMatch = duration.match(/(\d+)h/);
      const minuteMatch = duration.match(/(\d+)m/);
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      return hours * 60 + minutes;
    }
    if (typeof duration === "number") return duration;
    return 120; // default 2 hours
  };

  const formatCurrencyVND = (amount) => {
    if (!amount || amount === "Liên hệ") return "Liên hệ";
    if (typeof amount === "string") {
      const numericStr = amount.replace(/[₫\.\s]/g, "");
      const parsed = parseInt(numericStr, 10);
      if (isNaN(parsed)) return "Liên hệ";
      amount = parsed;
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentFare = () => {
    return (
      fareOptions.find(
        (option) => option.travelClass.className.toLowerCase() === selectedTab
      ) || fareOptions[0]
    );
  };

  const currentFare = getCurrentFare();

  const handleProceedToBooking = () => {
    const selectedFareOption = fareOptions.find(
      (option) => option.travelClass.className.toLowerCase() === selectedTab
    );
    if (!selectedFareOption) return;

    // Debug log the flight data to understand the structure

    // Helper functions for formatting (matching flight-detail-page.jsx)
    const formatTimeVN = (timeStr) => {
      if (!timeStr) return "N/A";

      // If already a time string (HH:MM format), return as is
      if (typeof timeStr === "string" && timeStr.match(/^\d{1,2}:\d{2}$/)) {
        return timeStr;
      }

      // If it's a string that looks like a datetime, try to parse
      if (typeof timeStr === "string") {
        try {
          const date = new Date(timeStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
          }
        } catch {
          // If parsing fails, return the original string or N/A
          return timeStr.includes(":") ? timeStr : "N/A";
        }
      }

      return "N/A";
    };

    const formatDateVN = (dateStr) => {
      if (!dateStr) {
        // Return today's date in DD/MM/YYYY format as fallback
        const today = new Date();
        return today.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      // If it's already a date string in DD/MM/YYYY format, return as is
      if (
        typeof dateStr === "string" &&
        dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)
      ) {
        return dateStr;
      }

      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }
      } catch {
        // If parsing fails, return today's date
        const today = new Date();
        return today.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      // Return today's date as final fallback
      const today = new Date();
      return today.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const formatDateTimeVN = (date) => {
      try {
        // Ensure we have a valid Date object
        const validDate =
          date instanceof Date ? date : new Date(date || Date.now());
        if (isNaN(validDate.getTime())) {
          return new Date().toLocaleString("vi-VN");
        }
        return validDate.toLocaleString("vi-VN");
      } catch {
        return new Date().toLocaleString("vi-VN");
      }
    };

    // Build booking data with the same structure as flight-detail-page.jsx
    const bookingData = {
      type: "ONE_WAY",
      flightId: flight.flightId || flight.id,
      flightNumber: flight.flightNumber || "N/A",
      airline: flight.airline?.airlineName || flight.airline || "N/A",
      airlineLogo: flight.airline?.thumbnail || flight.airlineLogo,
      flight: {
        id: flight.flightId || flight.id,
        flightId: flight.flightId || flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline?.airlineName || flight.airline,
        airlineName: flight.airline?.airlineName || flight.airline,
        airlineLogo: flight.airline?.thumbnail || flight.airlineLogo,
        selectedClass: selectedFareOption,
        // Format times properly with safe fallbacks and real dates
        departureTime: formatTimeVN(
          flight.departureTime || flight.departure_time || "14:00"
        ),
        arrivalTime: formatTimeVN(
          flight.arrivalTime || flight.arrival_time || "16:00"
        ),
        departureDate: formatDateVN(
          flight.departureDate || flight.departure_date || new Date()
        ),
        arrivalDate: formatDateVN(
          flight.arrivalDate || flight.arrival_date || new Date()
        ),
        from:
          flight.departureAirport?.airportCode ||
          flight.departureCode ||
          flight.fromCode,
        to:
          flight.arrivalAirport?.airportCode ||
          flight.arrivalCode ||
          flight.toCode,
        departureAirport: {
          code:
            flight.departureAirport?.airportCode ||
            flight.departureCode ||
            flight.fromCode ||
            "N/A",
          name:
            flight.departureAirport?.airportName ||
            flight.departureAirport?.name ||
            flight.from ||
            "N/A",
          city:
            flight.departureAirport?.cityNames?.[0] ||
            flight.departureAirport?.cityName ||
            flight.departureAirport?.city ||
            "N/A",
          airportName:
            flight.departureAirport?.airportName ||
            flight.departureAirport?.name ||
            flight.from ||
            "N/A",
          gate:
            flight.departureAirport?.gates?.[0]?.gateName ||
            flight.gate ||
            "TBA",
          terminal:
            flight.departureAirport?.gates?.[0]?.terminal ||
            flight.terminal ||
            "TBA",
        },
        arrivalAirport: {
          code:
            flight.arrivalAirport?.airportCode ||
            flight.arrivalCode ||
            flight.toCode ||
            "N/A",
          name:
            flight.arrivalAirport?.airportName ||
            flight.arrivalAirport?.name ||
            flight.to ||
            "N/A",
          city:
            flight.arrivalAirport?.cityNames?.[0] ||
            flight.arrivalAirport?.cityName ||
            flight.arrivalAirport?.city ||
            "N/A",
          airportName:
            flight.arrivalAirport?.airportName ||
            flight.arrivalAirport?.name ||
            flight.to ||
            "N/A",
          gate: flight.arrivalAirport?.gates?.[0]?.gateName || "TBA",
          terminal: flight.arrivalAirport?.gates?.[0]?.terminal || "TBA",
        },
        duration: flight.duration,
        // Handle aircraft info properly
        aircraft:
          typeof flight.aircraft === "object" && flight.aircraft !== null
            ? flight.aircraft.aircraftName || flight.aircraft.aircraftCode
            : flight.aircraft || flight.aircraftName || "N/A",
        aircraftName:
          typeof flight.aircraft === "object" && flight.aircraft !== null
            ? flight.aircraft.aircraftName || flight.aircraft.aircraftCode
            : flight.aircraftName || flight.aircraft || "N/A",
        seatLayout:
          flight.aircraftInfo?.seatLayout ||
          flight.seatLayout ||
          (typeof flight.aircraft === "object" &&
            flight.aircraft?.seatLayout) ||
          "N/A",
        totalSeats:
          flight.aircraftInfo?.totalSeats ||
          flight.totalSeats ||
          (typeof flight.aircraft === "object" &&
            flight.aircraft?.totalSeats) ||
          0,
        stops: flight.stops || 0,
      },
      selectedClass: selectedFareOption,
      totalPrice: selectedFareOption.price,
      formattedTotalPrice: formatCurrencyVND(selectedFareOption.price),
      currency: "VND",
      passengers: 1,
      bookingDate: formatDateTimeVN(new Date()),
      source: "chatbot",
    };

    localStorage.setItem("selectedFlight", JSON.stringify(bookingData));
    navigate("/booking-stepper", { state: { bookingData } });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Chi tiết chuyến bay
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Flight Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    ✈️
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {flight.flightNumber} -{" "}
                    {(() => {
                      if (typeof flight.airline === "string")
                        return flight.airline;
                      if (
                        flight.airline &&
                        typeof flight.airline === "object" &&
                        flight.airline.airlineName
                      )
                        return flight.airline.airlineName;
                      if (
                        flight.airlineName &&
                        typeof flight.airlineName === "string"
                      )
                        return flight.airlineName;
                      return "Unknown Airline";
                    })()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {(() => {
                      if (typeof flight.aircraft === "string")
                        return flight.aircraft;
                      if (
                        flight.aircraft &&
                        typeof flight.aircraft === "object" &&
                        flight.aircraft.aircraftName
                      )
                        return flight.aircraft.aircraftName;
                      if (
                        flight.aircraft &&
                        typeof flight.aircraft === "object" &&
                        flight.aircraft.aircraftCode
                      )
                        return flight.aircraft.aircraftCode;
                      if (
                        flight.aircraftName &&
                        typeof flight.aircraftName === "string"
                      )
                        return flight.aircraftName;
                      return "N/A";
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {(() => {
                    if (!flight.departureTime) return "N/A";
                    try {
                      const date = new Date(flight.departureTime);
                      if (isNaN(date.getTime())) return flight.departureTime;
                      return date.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return flight.departureTime;
                    }
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    if (!flight.departureTime) return "";
                    try {
                      const date = new Date(flight.departureTime);
                      if (isNaN(date.getTime())) return "";
                      return date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });
                    } catch {
                      return "";
                    }
                  })()}
                </div>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                  {flight.departureCode ||
                    (typeof flight.departureAirport === "object"
                      ? flight.departureAirport.airportCode
                      : flight.departureAirport) ||
                    "N/A"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {flight.departureCity ||
                    (typeof flight.departureAirport === "object"
                      ? flight.departureAirport.cityNames &&
                        flight.departureAirport.cityNames.length > 0
                        ? flight.departureAirport.cityNames[0]
                        : flight.departureAirport.airportName
                      : flight.departureAirport) ||
                    "Unknown"}
                </div>
              </div>

              <div className="flex-1 text-center px-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {Math.floor(formatDuration(flight.duration) / 60)}h{" "}
                  {formatDuration(flight.duration) % 60}p
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-16 h-0.5 bg-blue-300 dark:bg-blue-600"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full mx-2"></div>
                  <div className="w-16 h-0.5 bg-blue-300 dark:bg-blue-600"></div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {flight.stops === 0
                    ? "Bay thẳng"
                    : `${flight.stops} điểm dừng`}
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {(() => {
                    if (!flight.arrivalTime) return "N/A";
                    try {
                      const date = new Date(flight.arrivalTime);
                      if (isNaN(date.getTime())) return flight.arrivalTime;
                      return date.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {
                      return flight.arrivalTime;
                    }
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    if (!flight.arrivalTime) return "";
                    try {
                      const date = new Date(flight.arrivalTime);
                      if (isNaN(date.getTime())) return "";
                      return date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      });
                    } catch {
                      return "";
                    }
                  })()}
                </div>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                  {flight.arrivalCode ||
                    (typeof flight.arrivalAirport === "object"
                      ? flight.arrivalAirport.airportCode
                      : flight.arrivalAirport) ||
                    "N/A"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {flight.arrivalCity ||
                    (typeof flight.arrivalAirport === "object"
                      ? flight.arrivalAirport.cityNames &&
                        flight.arrivalAirport.cityNames.length > 0
                        ? flight.arrivalAirport.cityNames[0]
                        : flight.arrivalAirport.airportName
                      : flight.arrivalAirport) ||
                    "Unknown"}
                </div>
              </div>
            </div>
          </div>

          {/* Fare Class Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
              {fareOptions.map((fare) => (
                <button
                  key={fare.id}
                  onClick={() =>
                    setSelectedTab(fare.travelClass.className.toLowerCase())
                  }
                  className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${
                    selectedTab === fare.travelClass.className.toLowerCase()
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {fare.travelClass.className}
                </button>
              ))}
            </div>

            {/* Current Fare Details */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentFare.travelClass.className}
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrencyVND(currentFare.price)}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentFare.availableSeats} ghế trống
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Hạng{" "}
                  {currentFare.travelClass.changeable
                    ? "có thể đổi"
                    : "không đổi được"}
                  {currentFare.travelClass.refundable && ", có thể hủy"}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Quyền lợi:
                </div>
                {currentFare.travelClass.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-green-500">•</span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleProceedToBooking}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Tiến hành đặt vé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component: ChatbotWidget
const ChatbotWidget = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là SKYBOT của AirSky. Tôi có thể giúp bạn tìm chuyến bay, đặt vé, hoặc trả lời các câu hỏi du lịch. Bạn cần hỗ trợ gì hôm nay?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pagination, setPagination] = useState({});
  const [selectedFlightForDetail, setSelectedFlightForDetail] = useState(null);
  const [isFlightDetailModalOpen, setIsFlightDetailModalOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("airsky_quick_replies")) || [
          "Tìm chuyến bay",
          "Đặt vé máy bay",
          "Hủy vé",
          "Thay đổi lịch bay",
        ]
      );
    } catch {
      return [
        "Tìm chuyến bay",
        "Đặt vé máy bay",
        "Hủy vé",
        "Thay đổi lịch bay",
      ];
    }
  });
  const [flightItineraries, setFlightItineraries] = useState([]);
  const [currentFlights, setCurrentFlights] = useState([]);

  // Round-trip step-by-step selection states
  const [roundTripStep, setRoundTripStep] = useState("outbound"); // "outbound" | "return" | "completed"
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);
  const [roundTripSearchCriteria, setRoundTripSearchCriteria] = useState(null);
  const [selectedFares, setSelectedFares] = useState({}); // New state for selected fares per flight

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Round-trip selection handlers
  const handleOutboundFlightSelect = useCallback((flight) => {
    setSelectedOutboundFlight(flight);
    setRoundTripStep("return");

    // Add a message to indicate outbound flight selection
    const newMessage = {
      id: Date.now(),
      text: `✅ Đã chọn chuyến đi: ${flight.flightNumber} - ${flight.airline} (${flight.departureTime} → ${flight.arrivalTime})`,
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const handleReturnFlightSelect = useCallback(
    (flight) => {
      setSelectedReturnFlight(flight);
      setRoundTripStep("completed");

      // Navigate to booking stepper with round-trip data
      const bookingData = {
        type: "ROUND_TRIP",
        tripType: "ROUND_TRIP",
        outboundFlight: selectedOutboundFlight,
        returnFlight: flight,
        passengers: 1,
        totalPrice: (selectedOutboundFlight?.price || 0) + (flight?.price || 0),
        currency: "VND",
        source: "chatbot",
      };

      localStorage.setItem("chatbot_booking_data", JSON.stringify(bookingData));
      navigate("/booking-stepper", {
        state: { bookingData, source: "chatbot" },
      });
    },
    [selectedOutboundFlight, navigate]
  );

  // Handle fare selection for flights
  const handleFareSelect = useCallback((flightId, fare) => {
    setSelectedFares((prev) => ({
      ...prev,
      [flightId]: fare,
    }));
  }, []);

  // Handle flight detail modal
  const handleFlightDetailClick = useCallback((flight) => {
    setSelectedFlightForDetail(flight);
    setIsFlightDetailModalOpen(true);
  }, []);

  const handleCloseFlightDetailModal = useCallback(() => {
    setIsFlightDetailModalOpen(false);
    setSelectedFlightForDetail(null);
  }, []);

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);

  // Save quick replies
  useEffect(() => {
    try {
      localStorage.setItem(
        "airsky_quick_replies",
        JSON.stringify(quickReplies)
      );
    } catch (error) {
      console.error("Error saving quick replies:", error);
    }
  }, [quickReplies]);

  // Handle input persistence
  useEffect(() => {
    try {
      if (inputMessage.trim()) {
        localStorage.setItem("airsky_chat_input", inputMessage);
      } else {
        localStorage.removeItem("airsky_chat_input");
      }
    } catch (error) {
      console.error("Error saving input message:", error);
    }
  }, [inputMessage]);

  // Extract current flights from messages
  useEffect(() => {
    const latestMessageWithFlights = [...messages]
      .reverse()
      .find((message) => message.flights && message.flights.length > 0);
    if (latestMessageWithFlights) {
      setCurrentFlights(latestMessageWithFlights.flights);
    } else {
      setCurrentFlights([]);
    }
  }, [messages]);

  // Convert flights to itineraries when flights data changes
  useEffect(() => {
    const convertFlightsToItineraries = async () => {
      if (currentFlights && currentFlights.length > 0) {
        try {
          const itineraries = await convertToItineraries(currentFlights);
          setFlightItineraries(itineraries);
        } catch (error) {
          console.error(
            "[ChatbotWidget] Error converting flights to itineraries:",
            error
          );
          // Fallback to basic itineraries
          const basicItineraries = currentFlights.map((flight, index) => ({
            itineraryId: `one_way-${flight.flightId || index}`,
            tripType: "ONE_WAY",
            legs: [flight],
            totalPrice: flight.basePrice || 0,
            totalDuration: flight.duration || 120,
            totalStops: flight.stopsList?.length || 0,
            originalFlight: flight,
          }));
          setFlightItineraries(basicItineraries);
        }
      } else {
        setFlightItineraries([]);
      }
    };

    convertFlightsToItineraries();
  }, [currentFlights]);

  // Restore input on mount
  useEffect(() => {
    try {
      const savedInput = localStorage.getItem("airsky_chat_input");
      if (savedInput && !inputMessage) setInputMessage(savedInput);
    } catch (error) {
      console.error("Error restoring input message:", error);
    }
  }, []);

  // Close chat on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatContainerRef.current &&
        !chatContainerRef.current.contains(event.target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close chat on route change
  useEffect(() => {
    if (isOpen) setIsOpen(false);
  }, [location.pathname]);

  // Send message to chatbot
  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return;

      const userMessage = {
        id: messages.length + 1,
        text: message,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        const result = await chatbotService.sendMessage(message, null);

        if (!result?.response) throw new Error("Invalid response from server");

        // Handle template response
        let botMessage;
        if (
          result.response.response?.type === "flight_results" ||
          result.response.response?.type === "no_results"
        ) {
          // Template response - format for display
          const templateResponse = result.response.response;
          botMessage = {
            id: messages.length + 2,
            text:
              templateResponse.summary?.message ||
              templateResponse.message ||
              "Không có thông tin chuyến bay.",
            templateData: templateResponse, // Store full template data
            context: {
              type: "flight_template",
              tripType: templateResponse.tripType,
              totalFlights: templateResponse.flights?.length || 0,
            },
            data: templateResponse.flights || [],
            sender: "bot",
            timestamp: new Date(),
          };

          // Debug: Log flight data from chatbot service

          if (templateResponse.flights && templateResponse.flights.length > 0) {
            templateResponse.flights.forEach((flight, index) => {});
          }
        } else {
          // Legacy response format or fallback
          botMessage = {
            id: messages.length + 2,
            text:
              result.response.response?.message ||
              result.response.message ||
              "Xin lỗi, tôi không hiểu câu hỏi. Vui lòng thử lại.",
            context:
              result.response.response?.context ||
              result.response.context ||
              null,
            data:
              result.response.response?.data || result.response.data || null,
            sender: "bot",
            timestamp: new Date(),
          };
        }

        setMessages((prev) => [...prev, botMessage]);

        // Reset round-trip selection state for new flight search
        if (botMessage.templateData?.flights?.length > 0) {
          setRoundTripStep("outbound");
          setSelectedOutboundFlight(null);
          setSelectedReturnFlight(null);
          setSelectedFares({}); // Reset selected fares for new search
        }

        if (botMessage.context?.type || botMessage.data) {
          setPagination((prev) => ({
            ...prev,
            [botMessage.id]: {
              currentPage: 1,
              itemsPerPage:
                botMessage.context?.type === "flights" ||
                botMessage.context?.type === "flight_template"
                  ? 3
                  : 10,
            },
          }));
        }

        localStorage.removeItem("airsky_chat_input");
        setQuickReplies((prev) =>
          [message, ...prev.filter((r) => r !== message)].slice(0, 5)
        );
      } catch (error) {
        console.error("Chatbot error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: messages.length + 2,
            text: error.message.includes("fetch")
              ? "Lỗi kết nối server. Vui lòng kiểm tra mạng."
              : "Có lỗi xảy ra. Vui lòng thử lại.",
            context: { type: "error", message: "Lỗi hệ thống" },
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      sendMessage(inputMessage);
      setInputMessage("");
    },
    [inputMessage, sendMessage]
  );

  // Handle Enter key
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputMessage);
        setInputMessage("");
      }
    },
    [inputMessage, sendMessage]
  );

  // Handle quick reply
  const handleQuickReply = useCallback((reply) => {
    setInputMessage(reply);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setMessages([
      {
        id: 1,
        text: "Xin chào! Tôi là SKYBOT của AirSky. Tôi có thể giúp bạn tìm chuyến bay, đặt vé, hoặc trả lời các câu hỏi du lịch. Bạn cần hỗ trợ gì hôm nay?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setPagination({});
  }, []);

  // Clean flight data
  const cleanFlightData = useCallback((flights) => {
    return flights.map((flight) => {
      // Handle template flight format (new format)
      if (flight.flightId || flight.flightNumber) {
        const cleaned = {
          ...flight,
          flightId:
            flight.flightId || flight.flight_id || `flight-${Date.now()}`,
          flightNumber: flight.flightNumber || flight.flight_number || "VN6288",
          airline: flight.airline || flight.airline_name || "AirsKy Airlines",
          departureAirport:
            flight.departureAirport ||
            flight.departure_airport_name ||
            "Hà Nội",
          departureCode:
            flight.departureCode || flight.departure_airport_code || "HAN",
          arrivalAirport:
            flight.arrivalAirport || flight.arrival_airport_name || "TP.HCM",
          arrivalCode:
            flight.arrivalCode || flight.arrival_airport_code || "SGN",
          departureTime:
            flight.departureTime || flight.departure_time || "10:30",
          arrivalTime: flight.arrivalTime || flight.arrival_time || "12:45",
          price: flight.price || flight.base_price || 1440000,
          duration: flight.duration || flight.flight_duration || 135, // 2h 15m in minutes
          stops: flight.stops || flight.stop_count || 0,
          aircraft: flight.aircraft || flight.aircraft_model || "Airbus A321",
          tripType: flight.tripType || flight.trip_type || "ONE_WAY",
        };

        return cleaned;
      }

      // Handle legacy flight format
      const cleaned = {
        ...flight,
        flightNumber: cleanMarkdown(flight.flightNumber) || "VN6288",
        airline: cleanMarkdown(flight.airline) || "AirsKy Airlines",
        departureAirport: cleanMarkdown(flight.departureAirport) || "Hà Nội",
        departureCode: (flight.departureCode || "HAN").toUpperCase(),
        arrivalAirport: cleanMarkdown(flight.arrivalAirport) || "TP.HCM",
        arrivalCode: (flight.arrivalCode || "SGN").toUpperCase(),
        departureTime: flight.departureTime || "10:30",
        arrivalTime: flight.arrivalTime || "12:45",
        price: flight.price || 1440000,
        tripType: flight.tripType || "ONE_WAY",
      };

      return cleaned;
    });
  }, []);

  // Parse messages for flights
  const parsedMessages = useMemo(() => {
    return messages.map((message) => {
      let flights = [];
      if (
        message.templateData?.flights &&
        Array.isArray(message.templateData.flights)
      ) {
        // Handle template response flights

        flights = cleanFlightData(message.templateData.flights);
      } else if (
        message.context?.type === "flights" &&
        Array.isArray(message.data?.flights)
      ) {
        flights = cleanFlightData(message.data.flights);
      } else if (
        message.context?.type === "flights" &&
        Array.isArray(message.data)
      ) {
        flights = cleanFlightData(message.data);
      } else if (message.text && message.sender === "bot") {
        const flightBlocks = message.text.split("\n").reduce(
          (blocks, line, i, lines) => {
            if (/^\d+\./.test(line.trim())) {
              if (blocks.current.length)
                blocks.all.push(blocks.current.join("\n"));
              blocks.current = [line];
            } else if (blocks.current.length) {
              blocks.current.push(line);
            }
            if (i === lines.length - 1 && blocks.current.length)
              blocks.all.push(blocks.current.join("\n"));
            return blocks;
          },
          { all: [], current: [] }
        ).all;

        flights = flightBlocks
          .map(parseFlightText)
          .filter(Boolean)
          .map((f) => cleanFlightData([f])[0]);
      }

      return { ...message, flights };
    });
  }, [messages, cleanFlightData]);

  // Format timestamp
  const formatTime = (date) =>
    new Intl.DateTimeFormat("vi-VN", {
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).format(date);

  // Handle pagination
  const handlePageChange = useCallback((messageId, page) => {
    setPagination((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], currentPage: page },
    }));
  }, []);

  return (
    <div className="fixed bottom-22 right-8 sm:right-8 md:right-8 z-[100000]">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 sm:w-12 sm:h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Mở khung chat"
        >
          <MessageCircle className="w-5 h-5 sm:w-5 sm:h-5" />
        </Button>
      ) : (
        <div
          ref={chatContainerRef}
          className="w-[95vw] max-w-[350px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px] h-[85vh] max-h-[500px] sm:max-h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
        >
          <div className="flex items-center justify-between p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-bold text-sm">SKYBOT</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChatHistory}
                  className="p-1 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
                  aria-label="Xóa lịch sử trò chuyện"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="guest"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
                aria-label="Đóng khung chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            {parsedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } mb-3`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2 text-xs font-light ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {(message.flights.length > 0 ||
                    (message.data && Object.keys(message.data).length > 0)) &&
                    message.context?.message && (
                      <div className="mb-3 text-xs font-medium">
                        <MarkdownRenderer content={message.context.message} />
                      </div>
                    )}
                  {/* Template Response Display */}
                  {message.templateData ? (
                    <div className="space-y-3">
                      {/* Summary Message */}
                      <div className="text-xs font-light">
                        <MarkdownRenderer content={message.text} />
                      </div>

                      {/* Flight Results */}
                      {message.templateData.flights &&
                        message.templateData.flights.length > 0 && (
                          <FlightResultsWithGlobalTabs
                            flights={message.templateData.flights}
                            onFareSelect={(flightId, fare) =>
                              handleFareSelect(flightId, fare)
                            }
                            selectedFares={selectedFares}
                            onFlightClick={handleFlightDetailClick}
                          />
                        )}

                      {/* Additional Info */}
                      {message.templateData.additionalInfo && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            ℹ️ Thông tin bổ sung
                          </h4>
                          {message.templateData.additionalInfo.bookingTips && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                💡 Lưu ý đặt vé:
                              </p>
                              <ul className="text-xs font-light text-blue-600 dark:text-blue-400 space-y-1">
                                {message.templateData.additionalInfo.bookingTips.map(
                                  (tip, index) => (
                                    <li key={index}>• {tip}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {message.templateData.additionalInfo.contactInfo && (
                            <div className="text-xs font-light text-blue-600 dark:text-blue-400">
                              <p className="font-medium mb-1">
                                📞 Liên hệ hỗ trợ:
                              </p>
                              <p>
                                Hotline:{" "}
                                {
                                  message.templateData.additionalInfo
                                    .contactInfo.phone
                                }
                              </p>
                              <p>
                                Email:{" "}
                                {
                                  message.templateData.additionalInfo
                                    .contactInfo.email
                                }
                              </p>
                              <p>
                                Website:{" "}
                                {
                                  message.templateData.additionalInfo
                                    .contactInfo.website
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : message.flights.length > 0 ? (
                    <FlightResultsWithGlobalTabs
                      flights={message.flights}
                      onFareSelect={(flightId, fare) =>
                        handleFareSelect(flightId, fare)
                      }
                      selectedFares={selectedFares}
                      onFlightClick={handleFlightDetailClick}
                    />
                  ) : message.data && Object.keys(message.data).length > 0 ? (
                    <DataList
                      data={Object.values(message.data)[0] || []}
                      dataType={Object.keys(message.data)[0]}
                      messageId={message.id}
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  ) : (
                    <MarkdownRenderer content={message.text} />
                  )}
                  <span
                    className={`text-xs mt-1 block ${
                      message.sender === "user"
                        ? "text-blue-200"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs font-light">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-light">
                      Đang trả lời
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply)}
                  disabled={isTyping}
                  className="text-xs font-light px-3 py-1 h-7 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  {reply}
                </Button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 text-sm font-light"
                disabled={isTyping}
                aria-label="Nhập tin nhắn cho chatbot"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Flight Detail Modal */}
      <FlightDetailModal
        flight={selectedFlightForDetail}
        isOpen={isFlightDetailModalOpen}
        onClose={handleCloseFlightDetailModal}
        navigate={navigate}
        onFareSelect={(fare) => {
          // Handle fare selection from modal
          const flightId = selectedFlightForDetail?.flightId;
          if (flightId) {
            handleFareSelect(flightId, fare);
          }
        }}
      />
    </div>
  );
};

export default ChatbotWidget;
