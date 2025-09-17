import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
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

// Clean Markdown text by removing formatting and emojis
const cleanMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/[#*`~>_-]+/g, "") // Remove Markdown syntax
    .replace(/[✅⏳❌🎯📅🕒💰🪑⏱️😊]/g, "") // Remove emojis
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
};

// Render Markdown with support for headers, lists, and bold text
const renderMarkdown = (text) => {
  if (!text) return "";

  return text
    .split("\n")
    .map((line, index) => {
      line = line.trim();
      if (!line) return `<br key=${index} />`;

      // Handle headers (###, ##, #)
      if (line.startsWith("###")) {
        return `<h3 key=${index} class="text-lg font-semibold text-gray-800 mt-4 mb-2">${cleanMarkdown(
          line.slice(3)
        )}</h3>`;
      } else if (line.startsWith("##")) {
        return `<h2 key=${index} class="text-xl font-bold text-gray-900 mt-6 mb-3">${cleanMarkdown(
          line.slice(2)
        )}</h2>`;
      } else if (line.startsWith("#")) {
        return `<h1 key=${index} class="text-2xl font-bold text-gray-900 mt-8 mb-4">${cleanMarkdown(
          line.slice(1)
        )}</h1>`;
      }

      // Handle bold text
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Handle bullet points
      if (line.startsWith("-")) {
        return `<li key=${index} class="ml-4 mb-1">${line
          .substring(1)
          .trim()}</li>`;
      }

      // Handle numbered lists
      if (/^\d+\./.test(line)) {
        return `<div key=${index} class="mb-2">${line}</div>`;
      }

      // Regular paragraphs
      return `<p key=${index} class="mb-2">${line}</p>`;
    })
    .join("");
};

// Parse flight text into structured flight data
const parseFlightText = (text) => {
  if (!text || !text.includes("**") || !text.includes("→")) return null;

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

// FlightList component to display paginated flights
const FlightList = ({
  flights,
  messageId,
  flightPagination,
  handlePageChange,
}) => {
  const { currentPage = 1, itemsPerPage = 3 } =
    flightPagination[messageId] || {};
  const paginatedFlights = flights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(flights.length / itemsPerPage);

  return (
    <div className="overflow-x-auto">
      {flights.length === 0 ? (
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
              flights.length > 1
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {paginatedFlights.map((flight, index) => (
              <Link
                key={index}
                to={`/detail/${flight.flightId}`}
                className="block mb-3 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 bg-white p-4 hover:border-blue-400 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-lg text-gray-800">
                      {flight.flightNumber}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {flight.airline}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center flex-1">
                        <div className="font-semibold text-gray-800">
                          {flight.departureCode}
                        </div>
                        <div className="text-xs text-gray-600">
                          {flight.departureAirport}
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-xs text-gray-400">→</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="font-semibold text-gray-800">
                          {flight.arrivalCode}
                        </div>
                        <div className="text-xs text-gray-600">
                          {flight.arrivalAirport}
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      <span className="font-medium">
                        {flight.departureTime} - {flight.arrivalTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-green-600 text-lg">
                      {flight.price}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        flight.tripType === "ROUND_TRIP"
                          ? "bg-purple-100 text-purple-800"
                          : flight.tripType === "MULTI_CITY"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {flight.tripType === "ROUND_TRIP"
                        ? "Khứ hồi"
                        : flight.tripType === "MULTI_CITY"
                        ? "Đa chặng"
                        : "Một chiều"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 border-t border-gray-200 pt-4 bg-gray-50 -mx-4 px-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 font-medium">
                  Trang {currentPage} / {totalPages} • Tổng {flights.length}{" "}
                  chuyến bay
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={flights.length}
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

// Main ChatbotWidget component
const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const [quickReplies] = useState(() => {
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

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Save quick replies to localStorage
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

  // Send message to chatbot service
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
          context: result.response?.context || null,
          data: result.response?.data || null,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        if (botMessage.context?.type === "flights") {
          setFlightPagination((prev) => ({
            ...prev,
            [botMessage.id]: { currentPage: 1, itemsPerPage: 3 },
          }));
        }
      } catch (error) {
        console.error("Chatbot error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: messages.length + 2,
            text: error.message?.includes("fetch")
              ? "Không thể kết nối đến server chatbot. Vui lòng kiểm tra kết nối mạng."
              : "Có lỗi xảy ra khi xử lý tin nhắn. Vui lòng thử lại.",
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
    },
    [inputMessage, sendMessage]
  );

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputMessage);
      }
    },
    [inputMessage, sendMessage]
  );

  // Handle quick reply click
  const handleQuickReply = useCallback((reply) => {
    setInputMessage(reply);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Clear chat history
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

  // Clean flight data
  const cleanFlightData = useCallback((flights) => {
    return flights.map((flight) => ({
      ...flight,
      flightNumber: cleanMarkdown(flight.flightNumber) || "N/A",
      airline: cleanMarkdown(flight.airline) || "Unknown Airline",
      departureAirport: cleanMarkdown(flight.departureAirport) || "N/A",
      departureCode: (flight.departureCode || "").toUpperCase(),
      arrivalAirport: cleanMarkdown(flight.arrivalAirport) || "N/A",
      arrivalCode: (flight.arrivalCode || "").toUpperCase(),
      departureTime: cleanMarkdown(flight.departureTime) || "N/A",
      arrivalTime: cleanMarkdown(flight.arrivalTime) || "N/A",
      price: flight.price || "Liên hệ",
      tripType: flight.tripType || "ONE_WAY",
    }));
  }, []);

  // Parse messages for flights
  const parsedMessages = useMemo(() => {
    return messages.map((message) => {
      let flights = [];

      if (
        message.context?.type === "flights" &&
        Array.isArray(message.data?.flights)
      ) {
        flights = cleanFlightData(message.data.flights);
      } else if (message.text && message.sender === "bot") {
        const flightBlocks = [];
        let currentBlock = [];
        const lines = message.text.split("\n");

        for (let i = 0; i < lines.length; i++) {
          if (/^\d+\./.test(lines[i].trim())) {
            if (currentBlock.length) flightBlocks.push(currentBlock.join("\n"));
            currentBlock = [lines[i]];
          } else if (currentBlock.length) {
            currentBlock.push(lines[i]);
          }
        }
        if (currentBlock.length) flightBlocks.push(currentBlock.join("\n"));

        flights = flightBlocks
          .map(parseFlightText)
          .filter(Boolean)
          .map((flight) => cleanFlightData([flight])[0]);
      }

      return { ...message, flights };
    });
  }, [messages, cleanFlightData]);

  // Handle pagination page change
  const handlePageChange = useCallback((messageId, page) => {
    setFlightPagination((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], currentPage: page },
    }));
  }, []);

  // Format timestamp for Vietnam locale
  const formatTime = (date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).format(date);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-22 right-8 z-[9999]">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
          title="Mở khung chat"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[95vw] max-w-[900px] h-[95vh] shadow-2xl bg-white border border-gray-300 rounded-lg overflow-hidden flex flex-col transition-all duration-400">
      <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
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
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-white hover:bg-blue-700"
            title="Thu nhỏ khung chat"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setMessages([
                {
                  id: 1,
                  text: "Xin chào! Tôi là trợ lý ảo của AirSky. Tôi có thể giúp bạn tìm kiếm chuyến bay, tư vấn về đặt vé, hoặc trả lời các câu hỏi về dịch vụ của chúng tôi. Bạn cần hỗ trợ gì hôm nay?",
                  sender: "bot",
                  timestamp: new Date(),
                },
              ]);
              setFlightPagination({});
            }}
            className="h-8 w-8 p-0 text-white hover:bg-blue-700"
            title="Đóng hoàn toàn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-4 pb-2">
          {parsedMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
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
                        className="mb-3"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(message.context.message),
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
                ) : message.context?.type === "airlines" ? (
                  <div className="overflow-x-auto">
                    {(message.data?.airlines || []).map((airline, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-2"
                      >
                        <img
                          src={airline.thumbnail || "/images/airline.png"}
                          alt={airline.name}
                          className="w-20 h-10 object-contain rounded"
                        />
                        <div>
                          <span className="font-medium">
                            {cleanMarkdown(airline.name) || "N/A"}
                          </span>
                          <span className="text-gray-600 ml-2">
                            ({(airline.code || "").toUpperCase()})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : message.context?.type === "airports" ? (
                  <div className="overflow-x-auto">
                    {(message.data?.airports || []).map((airport, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-2"
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
                    ))}
                  </div>
                ) : (
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(message.text),
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
    </div>
  );
};

export default ChatbotWidget;
