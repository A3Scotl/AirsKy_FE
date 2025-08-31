import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Plane,
  MapPin,
} from "lucide-react";
import chatbotService from "@/services/chatbot-service";

const cleanMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "") // Remove bold markdown
    .replace(/^\d+\.\s*/, "") // Remove numbering
    .replace(/^-\s*/, "") // Remove bullet points
    .replace(/[-|*_]/g, "") // Remove other markdown chars
    .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️😊]/g, "") // Remove emojis
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
};

const renderMarkdown = (text) => {
  if (!text) return "";

  return text
    .split("\n")
    .map((line, index) => {
      // Handle bold text
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Handle bullet points
      if (line.trim().startsWith("-")) {
        return `<li key=${index}>${line.trim().substring(1).trim()}</li>`;
      }

      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return `<div key=${index} class="mb-2">${line.trim()}</div>`;
      }

      // Regular paragraphs
      if (line.trim()) {
        return `<p key=${index} class="mb-2">${line.trim()}</p>`;
      }

      return `<br key=${index} />`;
    })
    .join("");
};

const parseFlightText = (text) => {
  if (!text) return null;

  try {
    console.log("Raw text to parse:", text);

    // Check if this looks like a flight block (contains flight number pattern)
    if (!text.includes("**") || !text.includes("→")) {
      return null;
    }

    // Extract flight number and airline from first line
    const flightMatch = text.match(/\d+\.\s*\*\*([A-Z0-9]+)\s*\(([^)]+)\)\*\*/);
    if (!flightMatch) return null;

    const flightNumber = flightMatch[1];
    const airline = flightMatch[2];

    // Extract route
    const routeMatch = text.match(/\*\*([^\*]+)→([^\*]+)\*\*/);
    if (!routeMatch) return null;

    const departure = routeMatch[1].trim();
    const arrival = routeMatch[2].trim();

    // Extract time
    const timeMatch = text.match(
      /Giờ:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/
    );
    if (!timeMatch) return null;

    const departureTime = timeMatch[1];
    const arrivalTime = timeMatch[2];

    // Extract price
    const priceMatch = text.match(/Giá:\s*\*\*([\d,.]+)\s*₫?\*\*/);
    const price = priceMatch ? priceMatch[1].replace(/[,.]/g, "") : "0";

    // Extract seats
    const seatsMatch = text.match(/Ghế\s*trống:\s*(\d+)/);
    const seats = seatsMatch ? seatsMatch[1] : "0";

    // Extract status
    const statusMatch = text.match(/Trạng\s*thái:\s*\*\*([^\*]+)\*\*/);
    const status = statusMatch ? statusMatch[1].trim() : "Đúng giờ";

    const flight = {
      flightNumber,
      airline,
      departure,
      arrival,
      departureTime,
      arrivalTime,
      price,
      seats,
      status,
    };

    console.log("Successfully parsed flight:", flight);
    return flight;
  } catch (error) {
    console.error("Error parsing flight text:", error, "Text:", text);
    return null;
  }
};

const FlightList = ({
  flights,
  messageId,
  flightPagination,
  handlePageChange,
}) => {
  const messagePagination = flightPagination[messageId] || {
    currentPage: 1,
    itemsPerPage: 3,
  };
  const paginatedFlights = flights.slice(
    (messagePagination.currentPage - 1) * messagePagination.itemsPerPage,
    messagePagination.currentPage * messagePagination.itemsPerPage
  );
  const totalFlights = flights.length;
  const totalPages = Math.ceil(totalFlights / messagePagination.itemsPerPage);

  return (
    <div className="overflow-x-auto">
      {totalFlights === 0 ? (
        <div className="text-center py-8">
          <Plane className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Không tìm thấy chuyến bay phù hợp.</p>
          <p className="text-sm text-gray-500 mt-2">
            Vui lòng thử lại với thông tin khác hoặc liên hệ hotline.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`grid gap-4 px-2 ${
              totalFlights > 1
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {paginatedFlights.map((flight, index) => (
              <div
                key={index}
                className="mb-3 border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-white p-4"
              >
                <div className="text-sm space-y-3">
                  {/* Flight header */}
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-gray-800">
                      ✈️ {flight.flightNumber}
                    </div>
                    <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {flight.airline}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="font-medium text-gray-700 text-center py-2 bg-gray-50 rounded">
                    {flight.departure} → {flight.arrival}
                  </div>

                  {/* Time and status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">
                        🕒 {flight.departureTime} - {flight.arrivalTime}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        flight.status?.toLowerCase().includes("đúng")
                          ? "bg-green-100 text-green-800"
                          : flight.status?.toLowerCase().includes("trễ")
                          ? "bg-yellow-100 text-yellow-800"
                          : flight.status?.toLowerCase().includes("hủy")
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {flight.status}
                    </div>
                  </div>

                  {/* Price and seats */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-green-600 text-lg">
                        💰 {flight.price}₫
                      </span>
                      <span className="text-gray-600">
                        🪑 {flight.seats} ghế trống
                      </span>
                    </div>
                  </div>

                  {/* Additional info */}
                  {(flight.date && flight.date !== "N/A") ||
                  (flight.duration && flight.duration !== "N/A") ? (
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {flight.date && flight.date !== "N/A" && (
                        <span>📅 {flight.date}</span>
                      )}
                      {flight.duration && flight.duration !== "N/A" && (
                        <span>⏱️ {flight.duration}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 border-t border-gray-200 pt-4 bg-gray-50 -mx-4 px-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                  Trang {messagePagination.currentPage} / {totalPages} • Tổng{" "}
                  {totalFlights} chuyến bay
                </div>
                <Pagination
                  currentPage={messagePagination.currentPage}
                  totalPages={totalPages}
                  itemsPerPage={messagePagination.itemsPerPage}
                  totalItems={totalFlights}
                  onPageChange={(page) => handlePageChange(messageId, page)}
                  showPageSizeSelector={false}
                  showFirstLast={false}
                  showInfo={false}
                  maxVisiblePages={5}
                  className="mb-0 mt-0"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý ảo của AirSky. Tôi có thể giúp bạn tìm kiếm chuyến bay, tư vấn về đặt vé, hoặc trả lời các câu hỏi về dịch vụ của chúng tôi. Bạn cần hỗ trợ gì hôm nay?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [flightPagination, setFlightPagination] = useState({});
  const [quickReplies, setQuickReplies] = useState(() => {
    try {
      const stored = localStorage.getItem("airsky_quick_replies");
      return stored
        ? JSON.parse(stored)
        : ["Tìm chuyến bay", "Đặt vé máy bay", "Hủy vé", "Thay đổi lịch bay"];
    } catch (error) {
      console.error("Error parsing quick replies from localStorage:", error);
      return [
        "Tìm chuyến bay",
        "Đặt vé máy bay",
        "Hủy vé",
        "Thay đổi lịch bay",
      ];
    }
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  }, [isOpen, hasBeenOpened]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "airsky_quick_replies",
        JSON.stringify(quickReplies)
      );
    } catch (error) {
      console.error("Error saving quick replies to localStorage:", error);
    }
  }, [quickReplies]);

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim()) return;

      setQuickReplies((prev) => {
        const trimmedMessage = message.trim();
        if (!prev.includes(trimmedMessage)) {
          return [trimmedMessage, ...prev].slice(0, 5);
        }
        return prev;
      });

      const userMessage = {
        id: messages.length + 1,
        text: message,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");
      setIsTyping(true);

      try {
        const result = await chatbotService.sendMessage(message, null);
        if (!result || typeof result !== "object") {
          throw new Error("Invalid response from server");
        }

        const botMessage = {
          id: messages.length + 2,
          text:
            result.response?.message ||
            "Xin lỗi, tôi không hiểu câu hỏi của bạn. Vui lòng thử lại.",
          context: result.context || null,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setFlightPagination((prev) => ({
          ...prev,
          [botMessage.id]: { currentPage: 1, itemsPerPage: 3 },
        }));
      } catch (error) {
        console.error("Chatbot error:", error);
        const errorMessage = {
          id: messages.length + 2,
          text: error.message?.includes("fetch")
            ? "Không thể kết nối đến server chatbot. Vui lòng kiểm tra kết nối mạng."
            : "Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại.",
          context: { type: "error", message: "Lỗi hệ thống" },
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      sendMessage(inputMessage);
    },
    [inputMessage, sendMessage]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputMessage);
      }
    },
    [inputMessage, sendMessage]
  );

  const handleQuickReply = useCallback((reply) => {
    setInputMessage(reply);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const clearChatHistory = useCallback(() => {
    setMessages([
      {
        id: 1,
        text: "Xin chào! Tôi là trợ lý ảo của AirSky. Tôi có thể giúp bạn tìm kiếm chuyến bay, tư vấn về đặt vé, hoặc trả lời các câu hỏi về dịch vụ của chúng tôi. Bạn cần hỗ trợ gì hôm nay?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setFlightPagination({});
  }, []);

  // Test function for debugging
  const testParse = useCallback(() => {
    const testText =
      "1. VJ202 (VietJet Air) Hà Nội → Đà Nẵng 09:00 11:30 1.350.000₫ 180 ghế trống ✅ Đúng giờ";
    const result = parseFlightText(testText);
    console.log("Test parse result:", result);
  }, []);

  useEffect(() => {
    console.log("ChatbotWidget mounted successfully!");
    console.log("Chatbot widget is rendering...");
  }, []);

  const cleanFlightData = useCallback((flights) => {
    return flights.map((flight) => ({
      flightNumber:
        flight.flightNumber
          ?.replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .replace(/₫/g, "")
          .trim() || "N/A",
      airline:
        flight.airline
          ?.replace(/\*\*/g, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "Unknown Airline",
      departure:
        flight.departure
          ?.replace(/[-*]\s*/g, "")
          .replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "N/A",
      arrival:
        flight.arrival
          ?.replace(/[-*]\s*/g, "")
          .replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "N/A",
      departureTime:
        flight.departureTime
          ?.replace(/\*\*/g, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "N/A",
      arrivalTime:
        flight.arrivalTime
          ?.replace(/\*\*/g, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "N/A",
      duration:
        flight.duration
          ?.replace(/\*\*/g, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "N/A",
      price:
        flight.price
          ?.replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .replace(/₫/g, "")
          .trim() || "N/A",
      seats:
        flight.seats
          ?.replace(/Ghế trống:\s*/i, "")
          .replace(/\|.*$/, "")
          .replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .replace(/₫/g, "")
          .trim() || "N/A",
      status:
        flight.status
          ?.replace(/Trạng thái:\s*/i, "")
          .replace(/\*\*/g, "")
          .replace(/^\d+\.\s*/, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .replace(/₫/g, "")
          .trim() || "ON_TIME",
      date:
        flight.date
          ?.replace(/\*\*/g, "")
          .replace(/[-|*_]/g, "")
          .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️]/g, "")
          .trim() || "N/A",
    }));
  }, []);

  const parsedMessages = useMemo(() => {
    console.log("Parsing messages:", messages);
    return messages.map((message) => {
      let flights = [];

      if (
        message.context?.type === "flights" &&
        Array.isArray(message.context.data)
      ) {
        flights = cleanFlightData(message.context.data);
        console.log("Flights from structured data:", flights);
      } else if (message.text && message.sender === "bot") {
        // Try to parse flights from text if no structured data
        console.log("Attempting to parse flights from text:", message.text);

        // Split text into flight blocks (each starts with a number)
        const lines = message.text.split("\n");
        const flightBlocks = [];
        let currentBlock = [];

        for (const line of lines) {
          // If line starts with a number followed by dot, it's a new flight block
          if (/^\d+\./.test(line.trim())) {
            // Save previous block if it exists
            if (currentBlock.length > 0) {
              flightBlocks.push(currentBlock.join("\n"));
            }
            // Start new block
            currentBlock = [line];
          } else if (currentBlock.length > 0) {
            // Add to current block
            currentBlock.push(line);
          }
        }

        // Don't forget the last block
        if (currentBlock.length > 0) {
          flightBlocks.push(currentBlock.join("\n"));
        }

        console.log("Flight blocks found:", flightBlocks.length);

        const parsedFlights = [];
        for (const block of flightBlocks) {
          const flight = parseFlightText(block);
          if (flight) {
            parsedFlights.push(flight);
          }
        }

        if (parsedFlights.length > 0) {
          flights = cleanFlightData(parsedFlights);
          console.log("Flights parsed from text:", flights);
        }
      }

      const result = {
        ...message,
        flights,
      };
      console.log("Parsed message result:", result);
      return result;
    });
  }, [messages, cleanFlightData]);

  const handlePageChange = useCallback((messageId, page) => {
    setFlightPagination((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        currentPage: page,
      },
    }));
  }, []);

  if (!isOpen && !hasBeenOpened) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  // format time by vi-VN
  const formatTime = (date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(date);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div
        className={`shadow-2xl transition-all duration-500 ease-in-out flex flex-col bg-white border border-gray-300 rounded-lg overflow-hidden ${
          isMinimized ? "h-14 w-[300px]" : "w-[900px] h-[95vh]"
        }`}
      >
        <div
          className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg cursor-pointer"
          onClick={() => isMinimized && setIsMinimized(false)}
          title={isMinimized ? "Click để phóng to khung chat" : ""}
        >
          <div className="flex items-center gap-2 flex-1">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold">SKYBOT</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChatHistory}
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                title="Xóa lịch sử trò chuyện"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              title={isMinimized ? "Phóng to khung chat" : "Thu nhỏ khung chat"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
                setHasBeenOpened(false);
              }}
              className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              title="Đóng hoàn toàn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="p-0 flex-1 flex flex-col min-h-0">
              <div className="flex-1 p-4 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-4 pb-2">
                  {parsedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[95%] rounded-lg px-4 py-3 text-sm ${
                          message.sender === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.flights.length > 0 ? (
                          <>
                            {message.context?.message && (
                              <div
                                className="font-semibold mb-3 text-blue-700"
                                dangerouslySetInnerHTML={{
                                  __html: renderMarkdown(
                                    message.context.message
                                  ),
                                }}
                              />
                            )}
                            {!message.context?.message &&
                              message.sender === "bot" && (
                                <div
                                  className="font-semibold mb-3 text-blue-700"
                                  dangerouslySetInnerHTML={{
                                    __html: renderMarkdown(
                                      message.text.split("\n")[0]
                                    ),
                                  }}
                                />
                              )}
                            <FlightList
                              flights={message.flights}
                              messageId={message.id}
                              flightPagination={flightPagination}
                              handlePageChange={handlePageChange}
                            />
                          </>
                        ) : message.context?.type === "airports" ? (
                          <div className="overflow-x-auto">
                            {message.context.message && (
                              <div
                                className="font-semibold mb-3 text-blue-700"
                                dangerouslySetInnerHTML={{
                                  __html: renderMarkdown(
                                    message.context.message
                                  ),
                                }}
                              />
                            )}
                            {(message.context.data || []).map(
                              (airport, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                >
                                  <MapPin className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <span className="font-medium">
                                      {cleanMarkdown(airport.name) || "N/A"}
                                    </span>
                                    <span className="text-gray-600 ml-2">
                                      ({cleanMarkdown(airport.code) || "N/A"})
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      - {cleanMarkdown(airport.city) || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div
                            className="whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                              __html:
                                message.flights.length > 0
                                  ? (() => {
                                      // Filter out flight blocks that have been parsed
                                      const lines = message.text.split("\n");
                                      const filteredLines = [];

                                      for (let i = 0; i < lines.length; i++) {
                                        const line = lines[i];

                                        // If this line starts a flight block, check if it should be skipped
                                        if (/^\d+\./.test(line.trim())) {
                                          // Collect the entire block
                                          const blockLines = [line];
                                          let j = i + 1;
                                          while (
                                            j < lines.length &&
                                            !/^\d+\./.test(lines[j].trim()) &&
                                            lines[j].trim()
                                          ) {
                                            blockLines.push(lines[j]);
                                            j++;
                                          }

                                          const block = blockLines.join("\n");
                                          const flight = parseFlightText(block);

                                          if (flight) {
                                            // Skip this entire block
                                            i = j - 1;
                                            continue;
                                          }
                                        }

                                        // If not part of a flight block, include the line
                                        filteredLines.push(line);
                                      }

                                      return renderMarkdown(
                                        filteredLines.join("\n").trim()
                                      );
                                    })()
                                  : renderMarkdown(message.text),
                            }}
                          />
                        )}
                        <span
                          className={`text-xs mt-1 block ${
                            message.sender === "user"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </div>
                          <span className="text-gray-500 text-xs ml-2">
                            Đang trả lời...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
            </div>
            <div className="p-4 border-t flex-shrink-0">
              <div className="mb-3 flex flex-wrap gap-1">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply)}
                    disabled={isTyping}
                    className="text-xs px-2 py-1 h-6 hover:bg-blue-50"
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
                  placeholder="Nhập tin nhắn của bạn..."
                  className="flex-1 border-gray-300 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="flex-1 flex items-center justify-center p-2">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                Gõ tin nhắn ở trên để trò chuyện
              </p>
              <p className="text-xs text-gray-500">
                Click tiêu đề để mở rộng khung chat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotWidget;
