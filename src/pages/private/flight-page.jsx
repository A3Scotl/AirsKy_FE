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
import FlightFormModal from "@/components/admin/flights/flight-form-modal";
import FlightDetailsModal from "@/components/admin/flights/flight-details-modal";
import { flightApi } from "@/apis/flight-api";
import { aircraftApi } from "@/apis/aircraft-api";
import { handleFetch } from "@/utils/fetch-helper.js";
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
  const [aircrafts,setAircrafts]= useState([]);
  useEffect(() => {
    handleFetch({
      apiCall: flightApi.getAllFlights, 
      setData: (data) => setFlights(data?.content),
      setLoading: loading,
      errorMessage: "Failed to fetch flights",
    });
    handleFetch({
      apiCall: aircraftApi.getAllAircrafts, 
      setData: (data) => setAircrafts(data),
      setLoading: loading,
      errorMessage: "Failed to fetch aircrafts",
    });
  }, []);
  console.log(aircrafts);
  // Flight statistics
  const flightStats = [
    {
      title: "Tổng chuyến bay hôm nay",
      value: "156",
      change: "+8.2%",
      isPositive: true,
      icon: Plane,
      color: "bg-blue-500",
    },
    {
      title: "Hiệu suất đúng giờ",
      value: "94.2%",
      change: "+2.1%",
      isPositive: true,
      icon: Clock,
      color: "bg-green-500",
    },
    {
      title: "Hệ số tải trung bình",
      value: "87.5%",
      change: "+5.3%",
      isPositive: true,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Chuyến bay bị trì hoãn",
      value: "9",
      change: "-15.2%",
      isPositive: true,
      icon: AlertCircle,
      color: "bg-orange-500",
    },
  ];

  const aircraftTypes = aircrafts.map(a=>a.aircraftName)

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

  const handleDeleteFlight = (flight) => {
    if (
      window.confirm(
        `Are you sure you want to cancel flight ${flight.flightNumber}?`
      )
    ) {
      console.log("Delete flight:", flight);
      // Here you would implement the actual delete logic
      // For now, just close the modal
      setShowDetailsModal(false);
    }
  };

  const handleAddFlight = () => {
    setSelectedFlight(null);
    setModalMode("add");
    setShowFlightModal(true);
  };

  const handleSaveFlight = (flightData, isEdit) => {
    console.log(isEdit ? "Update flight:" : "Add flight:", flightData);
    // Here you would implement the actual save/update logic
    // For now, just log the data
    setShowFlightModal(false);
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
          <Button variant="outline" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Xuất
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleAddFlight}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm chuyến bay
          </Button>
        </div>
      </div>

      {/* Flight Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
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
                    placeholder="Search by flight number, route, or aircraft..."
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
                    <SelectItem value="delayed">Trễ</SelectItem>
                    <SelectItem value="boarding">Đang lên máy bay</SelectItem>
                    <SelectItem value="departed">Đã khởi hành</SelectItem>
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
                        key={aircraft}
                        value={aircraft.toLowerCase().replace(/\s+/g, "-")}
                      >
                        {aircraft}
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
