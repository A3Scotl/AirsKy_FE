import { useState, useEffect } from "react";
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
import FlightTable from "@/components/admin/flights/flight-table";
import FlightSchedule from "@/components/admin/flights/flight-schedule";
import FlightCalendar from "@/components/admin/flights/flight-calendar";
import FlightFormModal from "@/components/admin/flights/flight-form-modal";
import FlightDetailsModal from "@/components/admin/flights/flight-details-modal";
import { flightApi } from "@/apis/flight-api";
import { aircraftApi } from "@/apis/aircraft-api";
import { handleFetch } from "@/utils/fetch-helper.js";
import { toast } from "sonner";
import ExportButton from "@/components/common/export-button";
const AdminFlights = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aircraftFilter, setAircraftFilter] = useState("all");
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [activeTab, setActiveTab] = useState("overview");
  const [flights, setFlights] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [previousFlights, setPreviousFlights] = useState([]); // Để tính % thay đổi

  useEffect(() => {
    handleFetch({
      apiCall: () => flightApi.getAllFlights({ size: 1000 }), // Lấy nhiều flights hơn
      setData: (data) => {
        const newFlights = data?.content || data;
        setPreviousFlights(flights); // Lưu dữ liệu cũ để tính % thay đổi
        setFlights(newFlights);
      }, // Fallback nếu không có content
      setLoading: setLoading,
      errorMessage: "Failed to fetch flights",
    });
    handleFetch({
      apiCall: aircraftApi.getAllAircrafts,
      setData: (data) => {
        setAircrafts(data);
      },
      setLoading: setLoading,
      errorMessage: "Failed to fetch aircrafts",
    });
  }, []);

  // Hàm tính toán thống kê chuyến bay toàn diện
  const calculateFlightStats = (currentFlights, prevFlights = []) => {
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
          title: "Tổng doanh thu",
          value: "0 VND",
          change: "0%",
          isPositive: true,
          icon: DollarSign,
          color: "bg-green-600",
        },
        {
          title: "Tỷ lệ lấp đầy",
          value: "0%",
          change: "0%",
          isPositive: true,
          icon: Users,
          color: "bg-purple-500",
        },
        {
          title: "Chuyến bay hôm nay",
          value: "0",
          change: "0%",
          isPositive: true,
          icon: Calendar,
          color: "bg-orange-500",
        },
      ];
    }

    // === THỐNG KÊ TỔNG QUÁT ===
    const totalFlights = currentFlights.length;
    const activeFlights = currentFlights.filter(
      (flight) => flight.status !== "CANCELLED"
    ).length;
    const activeRate =
      totalFlights > 0 ? ((activeFlights / totalFlights) * 100).toFixed(1) : 0;

    // Tính tỷ lệ đúng giờ (chuyến bay ON_TIME hoặc DEPARTED)
    const onTimeFlights = currentFlights.filter(
      (flight) => flight.status === "ON_TIME" || flight.status === "DEPARTED"
    ).length;
    const onTimeRate =
      totalFlights > 0 ? ((onTimeFlights / totalFlights) * 100).toFixed(1) : 0;

    // Tính tổng doanh thu ước tính
    const totalRevenue = currentFlights.reduce((sum, flight) => {
      const bookedSeats = flight.totalSeats - (flight.availableSeats || 0);
      return sum + bookedSeats * (flight.basePrice || 0);
    }, 0);

    // Tính tỷ lệ lấp đầy trung bình
    const totalSeats = currentFlights.reduce(
      (sum, flight) => sum + (flight.totalSeats || 0),
      0
    );
    const bookedSeats = currentFlights.reduce((sum, flight) => {
      return sum + (flight.totalSeats - (flight.availableSeats || 0));
    }, 0);
    const occupancyRate =
      totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(1) : 0;

    // === THỐNG KÊ HÔM NAY ===
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFlights = currentFlights.filter((flight) => {
      const departureDate = new Date(flight.departureTime);
      return departureDate >= today && departureDate < tomorrow;
    });

    const todayFlightsCount = todayFlights.length;

    // === TÍNH % THAY ĐỔI ===
    const prevTotalFlights = prevFlights.length;
    const prevActiveFlights = prevFlights.filter(
      (flight) => flight.status !== "CANCELLED"
    ).length;
    const prevOnTimeFlights = prevFlights.filter(
      (flight) => flight.status === "ON_TIME" || flight.status === "DEPARTED"
    ).length;
    const prevTotalRevenue = prevFlights.reduce((sum, flight) => {
      const bookedSeats = flight.totalSeats - (flight.availableSeats || 0);
      return sum + bookedSeats * (flight.basePrice || 0);
    }, 0);
    const prevTotalSeats = prevFlights.reduce(
      (sum, flight) => sum + (flight.totalSeats || 0),
      0
    );
    const prevBookedSeats = prevFlights.reduce((sum, flight) => {
      return sum + (flight.totalSeats - (flight.availableSeats || 0));
    }, 0);

    const prevTodayFlights = prevFlights.filter((flight) => {
      const departureDate = new Date(flight.departureTime);
      return departureDate >= today && departureDate < tomorrow;
    }).length;

    // Tính % thay đổi
    const totalChange =
      prevTotalFlights > 0
        ? (
            ((totalFlights - prevTotalFlights) / prevTotalFlights) *
            100
          ).toFixed(1)
        : "0";

    const activeChange =
      prevActiveFlights > 0
        ? (
            ((activeFlights - prevActiveFlights) / prevActiveFlights) *
            100
          ).toFixed(1)
        : "0";

    const onTimeChange =
      prevOnTimeFlights > 0
        ? (
            ((onTimeFlights - prevOnTimeFlights) / prevOnTimeFlights) *
            100
          ).toFixed(1)
        : "0";

    const revenueChange =
      prevTotalRevenue > 0
        ? (
            ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) *
            100
          ).toFixed(1)
        : "0";

    const prevOccupancyRate =
      prevTotalSeats > 0
        ? ((prevBookedSeats / prevTotalSeats) * 100).toFixed(1)
        : 0;
    const occupancyChange =
      prevOccupancyRate > 0
        ? (occupancyRate - prevOccupancyRate).toFixed(1)
        : "0";

    const todayChange =
      prevTodayFlights > 0
        ? (
            ((todayFlightsCount - prevTodayFlights) / prevTodayFlights) *
            100
          ).toFixed(1)
        : "0";

    return [
      {
        title: "Tổng chuyến bay",
        value: totalFlights.toString(),
        change: `${totalChange > 0 ? "+" : ""}${totalChange}%`,
        isPositive: totalChange >= 0,
        icon: Plane,
        color: "bg-blue-500",
      },
      {
        title: "Chuyến bay hoạt động",
        value: activeFlights.toString(),
        change: `${activeChange > 0 ? "+" : ""}${activeChange}%`,
        isPositive: activeChange >= 0,
        icon: CheckCircle,
        color: "bg-green-500",
      },
      {
        title: "Tỷ lệ đúng giờ",
        value: `${onTimeRate}%`,
        change: `${onTimeChange > 0 ? "+" : ""}${onTimeChange}%`,
        isPositive: onTimeChange >= 0,
        icon: Clock,
        color: "bg-indigo-500",
      },
      {
        title: "Tổng doanh thu",
        value: `${(totalRevenue / 1000000).toFixed(1)}M VND`,
        change: `${revenueChange > 0 ? "+" : ""}${revenueChange}%`,
        isPositive: revenueChange >= 0,
        icon: DollarSign,
        color: "bg-green-600",
      },
      {
        title: "Tỷ lệ lấp đầy",
        value: `${occupancyRate}%`,
        change: `${occupancyChange > 0 ? "+" : ""}${occupancyChange}%`,
        isPositive: occupancyChange >= 0,
        icon: Users,
        color: "bg-purple-500",
      },
      {
        title: "Chuyến bay hôm nay",
        value: todayFlightsCount.toString(),
        change: `${todayChange > 0 ? "+" : ""}${todayChange}%`,
        isPositive: todayChange >= 0,
        icon: Calendar,
        color: "bg-orange-500",
      },
    ];
  };

  // Tính toán flightStats dựa trên dữ liệu thực
  const flightStats = calculateFlightStats(flights, previousFlights);

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

  const handleDeleteFlight = async (flight) => {
    if (
      window.confirm(
        `Are you sure you want to cancel flight ${flight.flightNumber}?`
      )
    ) {
      try {
        const result = await flightApi.deleteFlight(flight.flightId);
        if (result.success) {
          toast.success("Xóa chuyến bay thành công!");
          // Xóa chuyến bay khỏi danh sách
          setFlights((prevFlights) =>
            prevFlights.filter((f) => f.flightId !== flight.flightId)
          );
        } else {
          toast.error(`Lỗi xóa chuyến bay: ${result.message}`);
        }
        setShowDetailsModal(false);
      } catch (error) {
        console.error("Delete flight error:", error);
        toast.error("Có lỗi xảy ra khi xóa chuyến bay");
      }
    }
  };

  const handleAddFlight = () => {
    setSelectedFlight(null);
    setModalMode("add");
    setShowFlightModal(true);
  };

  const handleSaveFlight = async (flightData, isEdit) => {
    try {
      if (isEdit) {
        const result = await flightApi.updateFlight(
          flightData.flightId,
          flightData
        );

        if (result.success) {
          toast.success("Cập nhật chuyến bay thành công!");
          // Cập nhật lại danh sách flights
          const updatedFlights = flights.map((flight) =>
            flight.flightId === flightData.flightId
              ? { ...flight, ...flightData }
              : flight
          );
          setFlights(updatedFlights);
        } else {
          toast.error(`Lỗi cập nhật chuyến bay: ${result.message}`);
        }
      } else {
        const result = await flightApi.createFlight(flightData);

        if (result.success) {
          toast.success("Tạo chuyến bay thành công!");
          // Thêm chuyến bay mới vào danh sách
          setFlights((prevFlights) => [result.data, ...prevFlights]);
        } else {
          toast.error(`Lỗi tạo chuyến bay: ${result.message}`);
        }
      }
      setShowFlightModal(false);
    } catch (error) {
      console.error("Save flight error:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(
        `Có lỗi xảy ra khi lưu chuyến bay: ${error.message || "Unknown error"}`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý chuyến bay
          </h1>
          <p className="text-gray-600">
            Quản lý chuyến bay, lịch trình và hoạt động
          </p>
        </div>
        <div className="flex space-x-3">
          <ExportButton entity="flights" />
          <Button onClick={handleAddFlight}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm chuyến bay
          </Button>
        </div>
      </div>

      {/* Flight Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {flightStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center mt-2 text-xs">
                      <TrendingUp
                        className={`h-3 w-3 mr-1 ${
                          stat.isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      />
                      <span
                        className={
                          stat.isPositive ? "text-green-600" : "text-red-600"
                        }
                      >
                        {stat.change}
                      </span>
                      <span className="text-gray-500 ml-1">
                        so với tuần trước
                      </span>
                    </div>
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
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by flight number, route (HAN-SGN), airport code, or aircraft..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
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
                    <SelectItem value="all">All Aircraft</SelectItem>
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

              <FlightTable
                flights={flights}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                aircraftFilter={aircraftFilter}
                onViewFlight={handleViewFlight}
                onEditFlight={handleEditFlight}
                onDeleteFlight={handleDeleteFlight}
              />
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
        onDelete={handleDeleteFlight}
      />
    </div>
  );
};

export default AdminFlights;
