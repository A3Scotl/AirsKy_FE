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
import { FlightCard } from "@/components/common/flight-card";

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
      tripType: text.includes("Đa chặng")
        ? "MULTI_CITY"
        : text.includes("Khứ hồi")
        ? "ROUND_TRIP"
        : "ONE_WAY",
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-6 mb-4">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-5 mb-3">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4 mb-2">
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="mb-3 ml-4 space-y-1 text-gray-700 dark:text-gray-300">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-3 ml-4 space-y-1 text-gray-700 dark:text-gray-300 list-decimal">
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
        <strong className="font-semibold text-gray-900 dark:text-white">
          {children}
        </strong>
      ),
      em: ({ children }) => (
        <em className="italic text-gray-600 dark:text-gray-300">{children}</em>
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
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
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
    console.log(
      `[ChatbotWidget] Fetching full flight data for ID: ${flightId}`
    );
    const response = await flightApi.getFlightById(flightId);
    if (response.success && response.data) {
      fullFlightData = response.data;
      console.log(
        `[ChatbotWidget] Successfully fetched full data for flight ${flightId}`
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
    departureTime: flightToUse.departureTime || flight.departureTime,
    arrivalTime: flightToUse.arrivalTime || flight.arrivalTime,
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
        if (roundtripId.includes("-")) {
          const parts = roundtripId.split("-");
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
      } else if (tripType === "MULTI_CITY") {
        // Handle MULTI_CITY: create itinerary with multiple legs
        const multicityId = flight.flightId || `multi_city-${Date.now()}`;

        // For multi-city, we need to create legs from the flight data
        // This is a simplified version - in real implementation, you'd have multiple segments
        const mainFlight = await createNormalizedFlight(
          flight,
          multicityId.replace("multi_city-", ""),
          "main"
        );

        const itinerary = {
          itineraryId: multicityId,
          tripType: "MULTI_CITY",
          legs: [mainFlight], // In real implementation, this would have multiple legs
          totalPrice: mainFlight.basePrice || 0,
          totalDuration: mainFlight.duration || 0,
          totalStops: mainFlight.stopsList?.length || 0,
          originalFlight: flight,
        };

        itineraries.push(itinerary);
      } else {
        // Handle ONE_WAY (default)
        let flightId = flight.flightId;
        if (!flightId) {
          flightId = "1";
        } else if (typeof flightId === "string" && flightId.includes("-")) {
          const parts = flightId.split("-");
          const lastPart = parts[parts.length - 1];
          if (/^\d+$/.test(lastPart)) {
            flightId = lastPart;
          } else {
            flightId = "1";
          }
        } else if (!/^\d+$/.test(flightId)) {
          flightId = "1";
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

// Component: FlightList
const FlightList = ({ flights, messageId, pagination, onPageChange }) => {
  const navigate = useNavigate();
  const [localItineraries, setLocalItineraries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Convert flights to itineraries for this specific message
  useEffect(() => {
    const convertFlightsToItineraries = async () => {
      if (flights && flights.length > 0) {
        setLoading(true);
        try {
          const itineraries = await convertToItineraries(flights);
          setLocalItineraries(itineraries);
        } catch (error) {
          console.error(
            "[FlightList] Error converting flights to itineraries:",
            error
          );
          // Fallback to basic itineraries
          const basicItineraries = flights.map((flight, index) => ({
            itineraryId: `one_way-${flight.flightId || index}`,
            tripType: "ONE_WAY",
            legs: [flight],
            totalPrice: flight.basePrice || 0,
            totalDuration: flight.duration || 120,
            totalStops: flight.stopsList?.length || 0,
            originalFlight: flight,
          }));
          setLocalItineraries(basicItineraries);
        } finally {
          setLoading(false);
        }
      } else {
        setLocalItineraries([]);
      }
    };

    convertFlightsToItineraries();
  }, [flights]);

  const { currentPage = 1, itemsPerPage = 3 } = pagination[messageId] || {};
  const paginatedFlights = flights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(flights.length / itemsPerPage);

  return (
    <div className="space-y-4">
      {flights.length === 0 ? (
        <div className="text-center py-8">
          <Plane className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Không tìm thấy chuyến bay phù hợp.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Vui lòng thử lại với thông tin khác hoặc liên hệ hotline.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedFlights.map((flight, index) => {
              // Find corresponding itinerary by flight ID
              const itinerary = localItineraries.find(
                (it) =>
                  it.originalFlight.flightId === flight.flightId ||
                  it.originalFlight.flightId === flight.flightId?.toString() ||
                  it.itineraryId.includes(flight.flightId)
              );

              if (!itinerary) {
                // Fallback: create basic itinerary if not found
                const basicItinerary = {
                  itineraryId: `one_way-${flight.flightId || index}`,
                  tripType: "ONE_WAY",
                  legs: [flight],
                  totalPrice: flight.basePrice || 0,
                  totalDuration: flight.duration || 120,
                  totalStops: flight.stopsList?.length || 0,
                  originalFlight: flight,
                };

                return (
                  <FlightCard
                    key={index}
                    flight={basicItinerary}
                    showSelectButton={true}
                    compact={true}
                    onSelect={() => {
                      navigate(`/detail/${flight.flightId}`, {
                        state: {
                          flight: flight,
                          tripType: "ONE_WAY",
                        },
                      });
                    }}
                  />
                );
              }

              return (
                <FlightCard
                  key={index}
                  flight={itinerary}
                  showSelectButton={true}
                  compact={true}
                  onSelect={() => {
                    // Use first leg's flightId for navigation URL
                    const firstLegId =
                      itinerary.legs?.[0]?.flightId ||
                      itinerary.originalFlight.flightId;
                    navigate(`/detail/${firstLegId}`, {
                      state: {
                        flight: itinerary, // Truyền toàn bộ itinerary object thay vì chỉ originalFlight
                        tripType: itinerary.tripType,
                      },
                    });
                  }}
                />
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Trang {currentPage} / {totalPages} • Tổng {flights.length}{" "}
                chuyến bay
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={flights.length}
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

// Main Component: ChatbotWidget
const ChatbotWidget = () => {
  const location = useLocation();
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      console.log("Raw flight data:", flight); // Debug log

      // Handle template flight format (new format)
      if (flight.flightId || flight.flightNumber) {
        const cleaned = {
          ...flight,
          flightId: flight.flightId || flight.flight_id,
          flightNumber: flight.flightNumber || flight.flight_number || "N/A",
          airline: flight.airline || flight.airline_name || "Unknown Airline",
          departureAirport:
            flight.departureAirport || flight.departure_airport_name || "N/A",
          departureCode:
            flight.departureCode || flight.departure_airport_code || "",
          arrivalAirport:
            flight.arrivalAirport || flight.arrival_airport_name || "N/A",
          arrivalCode: flight.arrivalCode || flight.arrival_airport_code || "",
          departureTime: flight.departureTime || flight.departure_time || "N/A",
          arrivalTime: flight.arrivalTime || flight.arrival_time || "N/A",
          price: flight.price || flight.base_price || "Liên hệ",
          duration: flight.duration || "N/A",
          stops: flight.stops || 0,
          aircraft: flight.aircraft || "N/A",
          tripType: flight.tripType || flight.trip_type || "ONE_WAY",
        };
        console.log("Cleaned template flight data:", cleaned);
        return cleaned;
      }

      // Handle legacy flight format
      const cleaned = {
        ...flight,
        flightNumber: cleanMarkdown(flight.flightNumber) || "N/A",
        airline: cleanMarkdown(flight.airline) || "Unknown Airline",
        departureAirport: cleanMarkdown(flight.departureAirport) || "N/A",
        departureCode: (flight.departureCode || "").toUpperCase(),
        arrivalAirport: cleanMarkdown(flight.arrivalAirport) || "N/A",
        arrivalCode: (flight.arrivalCode || "").toUpperCase(),
        departureTime: flight.departureTime || "N/A", // Remove cleanMarkdown for time
        arrivalTime: flight.arrivalTime || "N/A", // Remove cleanMarkdown for time
        price: flight.price || "Liên hệ",
        tripType: flight.tripType || "ONE_WAY",
      };
      console.log("Cleaned legacy flight data:", cleaned); // Debug log
      return cleaned;
    });
  }, []);

  // Parse messages for flights
  const parsedMessages = useMemo(() => {
    return messages.map((message) => {
      console.log("Processing message:", message); // Debug log
      console.log("Message context:", message.context); // Debug log
      console.log("Message data:", message.data); // Debug log

      let flights = [];
      if (
        message.templateData?.flights &&
        Array.isArray(message.templateData.flights)
      ) {
        // Handle template response flights
        console.log(
          "Using template data flights:",
          message.templateData.flights
        );
        flights = cleanFlightData(message.templateData.flights);
      } else if (
        message.context?.type === "flights" &&
        Array.isArray(message.data?.flights)
      ) {
        console.log("Using message.data.flights:", message.data.flights); // Debug log
        flights = cleanFlightData(message.data.flights);
      } else if (
        message.context?.type === "flights" &&
        Array.isArray(message.data)
      ) {
        console.log("Using message.data as flights array:", message.data); // Debug log
        flights = cleanFlightData(message.data);
      } else if (message.text && message.sender === "bot") {
        console.log("Parsing from text:", message.text); // Debug log
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
        console.log("Parsed flights from text:", flights); // Debug log
      }

      console.log("Final flights for message:", flights); // Debug log
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
    <div className="fixed bottom-22 right-8 z-[9999]">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Mở khung chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      ) : (
        <div
          ref={chatContainerRef}
          className="w-[90vw] max-w-[400px] sm:max-w-[500px] md:max-w-[700px] h-[80vh] max-h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
        >
          <div className="flex items-center justify-between p-3 bg-blue-600 dark:bg-blue-700 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">SKYBOT</span>
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
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {(message.flights.length > 0 ||
                    (message.data && Object.keys(message.data).length > 0)) &&
                    message.context?.message && (
                      <div className="mb-3 text-sm font-medium">
                        <MarkdownRenderer content={message.context.message} />
                      </div>
                    )}
                  {/* Template Response Display */}
                  {message.templateData ? (
                    <div className="space-y-3">
                      {/* Summary Message */}
                      <div className="text-sm">
                        <MarkdownRenderer content={message.text} />
                      </div>

                      {/* Flight Results */}
                      {message.templateData.flights &&
                        message.templateData.flights.length > 0 && (
                          <FlightList
                            flights={message.templateData.flights}
                            messageId={message.id}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                          />
                        )}

                      {/* Additional Info */}
                      {message.templateData.additionalInfo && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            ℹ️ Thông tin bổ sung
                          </h4>
                          {message.templateData.additionalInfo.bookingTips && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                💡 Lưu ý đặt vé:
                              </p>
                              <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                {message.templateData.additionalInfo.bookingTips.map(
                                  (tip, index) => (
                                    <li key={index}>• {tip}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {message.templateData.additionalInfo.contactInfo && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">
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
                    <FlightList
                      flights={message.flights}
                      messageId={message.id}
                      pagination={pagination}
                      onPageChange={handlePageChange}
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
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-sm">
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
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Đang trả lời...
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
                  className="text-xs px-3 py-1 h-7 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900"
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
                className="flex-1 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
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
    </div>
  );
};

export default ChatbotWidget;
