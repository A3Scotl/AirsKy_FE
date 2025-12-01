import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Plane,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  DollarSign,
  Users,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FlightTable from "@/components/admin/flights/flight-table";
import FlightSchedule from "@/components/admin/flights/flight-schedule";
import FlightCalendar from "@/components/admin/flights/flight-calendar";
import FlightFormModal from "@/components/admin/flights/flight-form-modal";
import FlightDetailsModal from "@/components/admin/flights/flight-details-modal";
import { flightApi } from "@/apis/flight-api";
import { aircraftApi } from "@/apis/aircraft-api";
import { handleFetch } from "@/utils/fetch-helper.js";
import { toast } from "sonner";
import FlightTableSkeleton from "@/components/admin/flights/flight-table-skeleton";
import { DateTimePicker, TimePicker } from "@/components/ui/date-time-picker";

// Utility functions for flight statistics
const getWeekKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();

  // Tính ngày đầu tiên của năm
  const firstDayOfYear = new Date(year, 0, 1);
  // Tính số ngày từ đầu năm đến ngày hiện tại
  const daysSinceStartOfYear = Math.floor(
    (d - firstDayOfYear) / (1000 * 60 * 60 * 24)
  );

  // Tính tuần (bắt đầu từ 1)
  const weekNum = Math.floor(daysSinceStartOfYear / 7) + 1;

  return `${year}-W${weekNum}`;
};

const saveWeeklyStats = (stats) => {
  try {
    const currentWeek = getWeekKey(new Date());
    const stored = localStorage.getItem("flight_weekly_stats");
    const weeklyData = stored ? JSON.parse(stored) : {};

    // Lưu dữ liệu cho tuần hiện tại
    weeklyData[currentWeek] = {
      ...stats,
      timestamp: new Date().toISOString(),
    };

    // Giữ lại tối đa 12 tuần dữ liệu
    const weeks = Object.keys(weeklyData).sort().reverse();
    if (weeks.length > 12) {
      weeks.slice(12).forEach((week) => delete weeklyData[week]);
    }

    localStorage.setItem("flight_weekly_stats", JSON.stringify(weeklyData));
  } catch (error) {
    console.error("Error saving weekly stats:", error);
  }
};

const getLastWeekStats = () => {
  try {
    const stored = localStorage.getItem("flight_weekly_stats");
    if (!stored) {
      // Không có dữ liệu lưu trữ, trả về null

      return null;
    }

    const weeklyData = JSON.parse(stored);
    const currentWeek = getWeekKey(new Date());

    // Tính tuần trước bằng cách trừ 7 ngày
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekKey = getWeekKey(lastWeekDate);

    // Trả về dữ liệu của tuần trước nếu có
    const lastWeekData = weeklyData[lastWeekKey];
    if (lastWeekData) {
      return lastWeekData;
    }

    // Không có dữ liệu tuần trước

    return null;
  } catch (error) {
    console.error("Error getting last week stats:", error);
    return null;
  }
};

const clearWeeklyStats = () => {
  try {
    localStorage.removeItem("flight_weekly_stats");
    toast.success("Đã xóa dữ liệu thống kê lịch sử");
  } catch (error) {
    console.error("Error clearing weekly stats:", error);
  }
};
const AdminFlights = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active"); // Mặc định lọc chuyến bay hoạt động (không bao gồm đã hủy)
  const [aircraftFilter, setAircraftFilter] = useState("all");
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [activeTab, setActiveTab] = useState("overview");
  const [flights, setFlights] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [flightToCancel, setFlightToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [flightToDelay, setFlightToDelay] = useState(null);
  const [delayReason, setDelayReason] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [flightsResult, aircraftsResult] = await Promise.all([
          flightApi.getAllFlights({ size: 1000 }),
          aircraftApi.getAllAircrafts(),
        ]);

        if (flightsResult && flightsResult.success) {
          const newFlights = flightsResult.data?.content || flightsResult.data;
          setFlights(newFlights);
        } else {
          toast.error(
            flightsResult?.message || "Không thể tải danh sách chuyến bay"
          );
        }

        if (aircraftsResult && aircraftsResult.success) {
          setAircrafts(aircraftsResult.data);
        } else {
          toast.error(
            aircraftsResult?.message || "Không thể tải danh sách máy bay"
          );
        }
      } catch (error) {
        toast.error("Đã xảy ra lỗi khi tải dữ liệu ban đầu.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tự động cập nhật metrics khi dữ liệu flights thay đổi
  useEffect(() => {
    // Không cần lưu trữ weekly stats nữa vì đã bỏ comparison
    console.log(`Loaded ${flights.length} flights for metrics calculation`);
  }, [flights]);

  // Hàm tính toán thống kê chuyến bay toàn diện với dữ liệu lịch sử
  const calculateFlightStats = (currentFlights) => {
    if (!currentFlights || currentFlights.length === 0) {
      return [
        {
          title: "Tổng chuyến bay",
          value: "0",
          change: "0%",
          isPositive: true,
          icon: Plane,
          color: "bg-blue-500",
        },
        {
          title: "Chuyến bay hoạt động",
          value: "0",
          change: "0%",
          isPositive: true,
          icon: CheckCircle,
          color: "bg-green-500",
        },
        {
          title: "Tỷ lệ đúng giờ",
          value: "0%",
          change: "0%",
          isPositive: true,
          icon: Clock,
          color: "bg-indigo-500",
        },
        {
          title: "Doanh thu ước tính",
          value: "0M VNĐ",
          change: "0%",
          isPositive: true,
          icon: Users,
          color: "bg-emerald-500",
        },
      ];
    }

    // === TÍNH TOÁN THỐNG KÊ HIỆN TẠI ===
    const totalFlights = currentFlights.length;

    // Chuyến bay hoạt động (không bị hủy)
    const activeFlights = currentFlights.filter(
      (flight) => flight.status !== "CANCELLED" && flight.status !== "CANCELLED"
    ).length;

    // Tỷ lệ đúng giờ (chuyến bay ON_TIME, DEPARTED, hoặc ARRIVED đúng giờ)
    const onTimeFlights = currentFlights.filter((flight) =>
      ["ON_TIME", "DEPARTED", "ARRIVED"].includes(flight.status)
    ).length;
    const onTimeRate =
      totalFlights > 0 ? ((onTimeFlights / totalFlights) * 100).toFixed(1) : 0;

    // Tính tổng doanh thu tiềm năng từ chuyến bay
    const potentialRevenue = currentFlights.reduce((sum, flight) => {
      // Use flightTravelClasses for accurate revenue calculation
      if (flight.flightTravelClasses?.length > 0) {
        const flightRevenue = flight.flightTravelClasses.reduce((total, tc) => {
          return total + (tc.capacity || 0) * (tc.price || 0);
        }, 0);
        return sum + flightRevenue;
      }

      // Fallback for flights without flightTravelClasses
      const aircraftSeats = flight?.aircraft?.totalSeats || 0;
      const pricePerSeat =
        flight.basePrice || flight.priceNumeric || flight.price || 0;
      return sum + aircraftSeats * pricePerSeat;
    }, 0);

    // Đếm số tuyến bay khác nhau
    const uniqueRoutes = new Set(
      currentFlights.map(
        (flight) =>
          `${flight.departureAirport?.airportCode || "DEP"} - ${
            flight.arrivalAirport?.airportCode || "ARR"
          }`
      )
    ).size;

    // === TÍNH TOÁN METRICS ĐƠN GIẢN ===
    const bookedSeats = currentFlights.reduce((sum, flight) => {
      const aircraftSeats = flight?.aircraft?.totalSeats || 0;
      const availableSeats = flight.availableSeats || 0;
      return sum + Math.max(0, aircraftSeats - availableSeats);
    }, 0);

    const totalSeats = currentFlights.reduce(
      (sum, flight) => sum + (flight?.aircraft?.totalSeats || 0),
      0
    );

    const occupancyRate =
      totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : 0;

    return [
      {
        title: "Tổng chuyến bay",
        value: totalFlights.toString(),
        icon: Plane,
        color: "bg-blue-500",
        description: "Tổng số chuyến bay trong hệ thống",
      },
      {
        title: "Chuyến bay hoạt động",
        value: activeFlights.toString(),
        icon: CheckCircle,
        color: "bg-green-500",
        description: "Chuyến bay không bị hủy",
      },
      {
        title: "Tỷ lệ đúng giờ",
        value: `${onTimeRate}%`,
        icon: Clock,
        color: "bg-indigo-500",
        description: "Chuyến bay đúng lịch trình",
      },
      {
        title: "Doanh thu tiềm năng",
        value: `${(potentialRevenue / 1000000).toFixed(1)}M VNĐ`,
        icon: Users,
        color: "bg-emerald-500",
        description: `${bookedSeats}/${totalSeats} ghế đã đặt (${occupancyRate}%)`,
      },
    ];
  };
  const flightStats = calculateFlightStats(flights);

  const aircraftTypes = aircrafts.map((a) => ({
    name: a.aircraftName,
    code: a.aircraftCode,
    display: `${a.aircraftName} (${a.aircraftCode})`,
  }));

  const handleViewFlight = (flight) => {
    setSelectedFlight(flight);
    setShowDetailsModal(true);
  };

  const handleEditFlight = (flight) => {
    setSelectedFlight(flight);
    setModalMode("edit");
    setShowFlightModal(true);
    setShowDetailsModal(false);
  };

  const openCancelModal = (flight) => {
    setFlightToCancel(flight);
    setIsCancelModalOpen(true);
    setCancellationReason(""); // Reset lý do mỗi khi mở modal
  };

  const handleConfirmCancel = async () => {
    if (!flightToCancel) return;
    if (!cancellationReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy chuyến bay.");
      return;
    }

    try {
      const result = await flightApi.cancelFlight(flightToCancel.flightId, {
        reason: cancellationReason,
      });
      if (result.success) {
        toast.success("Hủy chuyến bay và xử lý booking thành công!");
        handleRefresh(); // Tải lại dữ liệu để cập nhật trạng thái
      }
    } catch (error) {
      console.error("Cancel flight error:", error);
      toast.error(
        `Lỗi khi hủy chuyến bay: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsCancelModalOpen(false);
      setFlightToCancel(null);
    }
  };

  const openDelayModal = (flight) => {
    setFlightToDelay(flight);
    setIsDelayModalOpen(true);
    setDelayReason(""); // Reset lý do mỗi khi mở modal
    // Set thời gian mặc định là 1 giờ sau thời gian khởi hành hiện tại
    const currentDepartureTime = new Date(flight.departureTime);
    const defaultTime = new Date(
      currentDepartureTime.getTime() + 60 * 60 * 1000
    ); // +1 giờ
    setSelectedDateTime(defaultTime);
  };

  const handleConfirmDelay = async () => {
    if (!flightToDelay) return;
    if (!delayReason.trim()) {
      toast.error("Vui lòng nhập lý do delay chuyến bay.");
      return;
    }
    if (!selectedDateTime) {
      toast.error("Vui lòng chọn thời gian khởi hành mới.");
      return;
    }
    // Validation: thời gian delay phải sau thời gian khởi hành hiện tại của chuyến bay
    const currentDepartureTime = new Date(flightToDelay.departureTime);

    if (selectedDateTime <= currentDepartureTime) {
      toast.error(
        "Thời gian khởi hành mới phải sau thời gian khởi hành hiện tại của chuyến bay."
      );
      return;
    }

    try {
      const result = await flightApi.delayFlight(flightToDelay.flightId, {
        reason: delayReason,
        newDepartureTime: selectedDateTime
          .toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
          .replace(" ", "T"),
      });
      if (result.success) {
        toast.success("Delay chuyến bay thành công!");
        handleRefresh(); // Tải lại dữ liệu để cập nhật trạng thái
      }
    } catch (error) {
      console.error("Delay flight error:", error);
      toast.error(
        `Lỗi khi delay chuyến bay: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsDelayModalOpen(false);
      setFlightToDelay(null);
    }
  };

  const handleAddFlight = () => {
    setSelectedFlight(null);
    setModalMode("add");
    setShowFlightModal(true);
  };

  const handleSaveFlight = async (flightData, isEdit) => {
    try {
      let result;
      if (isEdit) {
        result = await flightApi.updateFlight(flightData.flightId, flightData);
      } else {
        result = await flightApi.createFlight(flightData);
      }

      // Xử lý kết quả từ API
      if (result && result.success === true) {
        toast.success(
          isEdit
            ? "Cập nhật chuyến bay thành công!"
            : "Tạo chuyến bay thành công!"
        );
        // Cập nhật lại danh sách flights
        if (isEdit) {
          const updatedFlights = flights.map((flight) =>
            flight.flightId === flightData.flightId
              ? { ...flight, ...flightData }
              : flight
          );
          setFlights(updatedFlights);
        } else {
          setFlights((prevFlights) => [result.data, ...prevFlights]);
        }
        setShowFlightModal(false);
        return result;
      } else if (result && result.success === false) {
        // API trả về lỗi business logic với message cụ thể
        throw new Error(result.error || result.message || "Có lỗi xảy ra");
      } else {
        // API không trả về response hợp lệ
        throw new Error("API không trả về dữ liệu hợp lệ");
      }
    } catch (error) {
      console.error("Save flight error:", error);
      console.error("Error details:", error.response?.data || error.message);

      // Handle field-level validation errors from backend
      if (error.response?.errors) {
        // Backend returns field-specific errors - re-throw để modal xử lý
        throw error;
      } else {
        // Handle general API errors
        const errorMessage =
          error.response?.error || // Specific validation error
          error.response?.message || // General error message
          error.message || // JavaScript error message
          "Lỗi xảy ra"; // Fallback message

        // Show specific error for aircraft scheduling conflict
        if (
          errorMessage.includes("Aircraft is already scheduled") ||
          errorMessage.includes("Máy bay đã được lên lịch")
        ) {
          toast.error(
            `Lỗi lịch trình: ${errorMessage}. Vui lòng chọn thời gian hoặc máy bay khác.`
          );
        } else if (
          errorMessage.includes("Gate is already assigned") ||
          errorMessage.includes("Cổng đã được gán")
        ) {
          toast.error(`Lỗi cổng: ${errorMessage}. Vui lòng chọn cổng khác.`);
        } else if (
          errorMessage.includes("Departure time must be before arrival time") ||
          errorMessage.includes("Thời gian khởi hành phải trước thời gian đến")
        ) {
          toast.error("Thời gian khởi hành phải trước thời gian đến");
        } else if (
          errorMessage.includes(
            "Departure and arrival airports must be different"
          )
        ) {
          toast.error("Sân bay khởi hành và đến phải khác nhau");
        } else if (
          errorMessage.includes("Multi-city flight must have at least one stop")
        ) {
          toast.error("Chuyến bay đa thành phố phải có ít nhất một điểm dừng");
        } else if (
          errorMessage.includes("Stop duration must be at least 20 minutes")
        ) {
          toast.error("Thời gian dừng phải ít nhất 20 phút");
        } else if (errorMessage.includes("Stop order must be consecutive")) {
          toast.error("Thứ tự điểm dừng phải liên tiếp");
        } else if (
          errorMessage.includes(
            "Consecutive stops cannot be at the same airport"
          )
        ) {
          toast.error("Các điểm dừng liên tiếp không được ở cùng sân bay");
        } else {
          toast.error(errorMessage);
        }
      }

      // Re-throw error để modal có thể xử lý field-level errors
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);

      // Fetch dữ liệu mới
      const result = await flightApi.getAllFlights({ size: 1000 });

      if (result && result.success) {
        const newFlights = result.data?.content || result.data || [];
        setFlights(newFlights);

        toast.success("Đã cập nhật danh sách chuyến bay và thống kê!");
      } else {
        throw new Error(result?.message || "Không thể tải dữ liệu");
      }
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Lỗi khi tải lại danh sách: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between flex-wrap gap-3 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý chuyến bay
          </h1>
          <p className="text-gray-600">
            Quản lý chuyến bay, lịch trình và hoạt động
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          {/* Clear stats button */}
          {/* <Button
            variant="outline"
            onClick={clearWeeklyStats}
            className="flex items-center gap-2"
          >
            Clear Stats
          </Button> */}

          {/* Chỉ hiển thị khi role là BUSINESS */}
          {user?.role !== "ADMIN" && (
            <Button onClick={handleAddFlight}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm chuyến bay
            </Button>
          )}
        </div>
      </div>

      {/* Flight Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {flightStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                      {stat.value}
                    </p>
                    {stat.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {stat.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="schedule">Lịch trình trong ngày</TabsTrigger>
          <TabsTrigger value="calendar">Lịch tổng quát</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tổng quan</CardTitle>
              <CardDescription>
                Quản lý tất cả các chuyến bay, xem trạng thái theo thời gian
                thực và thực hiện các cập nhật
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters - vẫn giữ để tìm kiếm nhưng bảng luôn hiển thị tất cả */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm với mã chuyến bay, tuyến (HAN-SGN), mã sân bay, hoặc loại máy bay.."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-gray-900"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Chuyến bay hoạt động</SelectItem>
                    <SelectItem value="on-time">Đúng giờ</SelectItem>
                    <SelectItem value="departed">Đã khởi hành</SelectItem>
                    <SelectItem value="delayed">Trễ</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={aircraftFilter}
                  onValueChange={setAircraftFilter}
                >
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Aircraft type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả máy bay</SelectItem>
                    {aircraftTypes.map((aircraft) => (
                      <SelectItem
                        key={aircraft.code}
                        value={aircraft.name.toLowerCase().replace(/\s+/g, "-")}
                      >
                        {aircraft.display}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <FlightTableSkeleton />
              ) : (
                <FlightTable
                  flights={flights}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  aircraftFilter={aircraftFilter}
                  onViewFlight={handleViewFlight}
                  onEditFlight={handleEditFlight}
                  onDelayFlight={openDelayModal}
                  onDeleteFlight={openCancelModal}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <FlightSchedule flights={flights} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <FlightCalendar flights={flights} />
        </TabsContent>
      </Tabs>

      {/* Flight Form Modal */}
      <FlightFormModal
        open={showFlightModal}
        onClose={() => setShowFlightModal(false)}
        onSave={handleSaveFlight}
        aircraftTypes={aircraftTypes}
        flight={selectedFlight}
        mode={modalMode}
      />

      {/* Flight Details Modal */}
      <FlightDetailsModal
        flight={selectedFlight}
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={handleEditFlight}
        // onDelete={handleDeleteFlight}
      />

      {/* Cancel Flight Confirmation Modal */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy chuyến bay?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ hủy chuyến bay{" "}
              <strong>{flightToCancel?.flightNumber}</strong> và tất cả các
              booking liên quan. Các booking đã thanh toán sẽ được tự động hoàn
              tiền. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="cancellationReason" className="font-medium">
              Lý do hủy chuyến (bắt buộc)
            </label>
            <Input
              id="cancellationReason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ví dụ: Lý do kỹ thuật, thời tiết xấu..."
              className="dark:text-black"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delay Flight Modal */}
      <AlertDialog open={isDelayModalOpen} onOpenChange={setIsDelayModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delay chuyến bay</AlertDialogTitle>
            <AlertDialogDescription>
              Delay chuyến bay <strong>{flightToDelay?.flightNumber}</strong>.
              Thời gian khởi hành hiện tại:{" "}
              <strong>
                {flightToDelay?.departureTime
                  ? new Date(flightToDelay.departureTime).toLocaleString(
                      "vi-VN"
                    )
                  : "N/A"}
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="delayReason" className="font-medium">
                Lý do delay (bắt buộc)
              </label>
              <Input
                id="delayReason"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="Ví dụ: Thời tiết xấu, lý do kỹ thuật..."
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">
                Thời gian khởi hành mới (bắt buộc)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <DateTimePicker
                  date={selectedDateTime}
                  onDateChange={(date) => {
                    if (date) {
                      // Kiểm tra ngày không được trước ngày khởi hành hiện tại
                      const currentDepartureTime = new Date(
                        flightToDelay?.departureTime
                      );
                      const currentDepartureDate = new Date(
                        currentDepartureTime
                      );
                      currentDepartureDate.setHours(0, 0, 0, 0); // Reset time để so sánh chỉ ngày
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);

                      if (selectedDate < currentDepartureDate) {
                        toast.error(
                          "Không thể chọn ngày trước ngày khởi hành hiện tại của chuyến bay."
                        );
                        return;
                      }

                      // Tính thời gian tối thiểu cho phép (sau thời gian khởi hành hiện tại ít nhất 30 phút)
                      const minTime = new Date(
                        currentDepartureTime.getTime() + 30 * 60 * 1000
                      ); // +30 phút

                      let defaultTime = "00:00";
                      if (
                        date.toDateString() ===
                        currentDepartureTime.toDateString()
                      ) {
                        // Nếu chọn cùng ngày khởi hành, set time mặc định là sau minTime
                        defaultTime = minTime.toTimeString().slice(0, 5);
                      }

                      const currentTime = selectedDateTime
                        ? selectedDateTime.toTimeString().slice(0, 5)
                        : defaultTime;
                      const [hours, minutes] = currentTime.split(":");
                      const newDateTime = new Date(date);
                      newDateTime.setHours(parseInt(hours), parseInt(minutes));

                      // Nếu thời gian mới nhỏ hơn minTime, set thành minTime
                      if (newDateTime < minTime) {
                        newDateTime.setTime(minTime.getTime());
                      }

                      setSelectedDateTime(newDateTime);
                    } else {
                      setSelectedDateTime(null);
                    }
                  }}
                  placeholder="Chọn ngày"
                  minDate={
                    flightToDelay
                      ? new Date(flightToDelay.departureTime)
                      : new Date()
                  }
                />
                <TimePicker
                  value={
                    selectedDateTime
                      ? selectedDateTime.toTimeString().slice(0, 5)
                      : ""
                  }
                  onChange={(timeValue) => {
                    if (selectedDateTime && timeValue) {
                      const [hours, minutes] = timeValue.split(":");
                      const newDateTime = new Date(selectedDateTime);
                      newDateTime.setHours(parseInt(hours), parseInt(minutes));

                      // Validation: thời gian phải sau thời gian khởi hành hiện tại ít nhất 30 phút
                      const currentDepartureTime = new Date(
                        flightToDelay?.departureTime
                      );
                      const minTime = new Date(
                        currentDepartureTime.getTime() + 30 * 60 * 1000
                      );

                      if (newDateTime < minTime) {
                        toast.error(
                          "Thời gian delay phải ít nhất 30 phút sau thời gian khởi hành hiện tại."
                        );
                        // Reset về thời gian hợp lệ
                        setSelectedDateTime(minTime);
                        return;
                      }

                      setSelectedDateTime(newDateTime);
                    } else if (timeValue) {
                      // Nếu chỉ có time, tạo date từ ngày khởi hành hiện tại + 1 ngày
                      const currentDepartureTime = new Date(
                        flightToDelay?.departureTime
                      );
                      const nextDay = new Date(currentDepartureTime);
                      nextDay.setDate(nextDay.getDate() + 1);
                      const [hours, minutes] = timeValue.split(":");
                      nextDay.setHours(parseInt(hours), parseInt(minutes));

                      setSelectedDateTime(nextDay);
                    }
                  }}
                  placeholder="Chọn giờ"
                />
              </div>
              {selectedDateTime && (
                <div className="text-sm">
                  <p className="text-gray-600">
                    Thời gian đã chọn:{" "}
                    {selectedDateTime.toLocaleString("vi-VN")}
                  </p>
                  {(() => {
                    const currentDepartureTime = new Date(
                      flightToDelay?.departureTime
                    );
                    const diffMinutes = Math.floor(
                      (selectedDateTime - currentDepartureTime) / (1000 * 60)
                    );
                    if (diffMinutes < 30) {
                      return (
                        <p className="text-red-600">
                          ⚠️ Thời gian delay phải ít nhất 30 phút
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-green-600">
                          ✅ Delay {diffMinutes} phút
                        </p>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelay}>
              Xác nhận Delay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFlights;
