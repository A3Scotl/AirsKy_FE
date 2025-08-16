import { useState } from "react";
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

const AdminFlights = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aircraftFilter, setAircraftFilter] = useState("all");
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [activeTab, setActiveTab] = useState("overview");

  // Mock flight data
  const flights = [
    {
      id: "FL001",
      flightNumber: "AS101",
      aircraft: "Boeing 737-800",
      route: "New York (JFK) → Los Angeles (LAX)",
      departure: "2025-08-20 08:30",
      arrival: "2025-08-20 11:45",
      duration: "5h 15m",
      status: "On Time",
      capacity: 189,
      booked: 156,
      price: {
        economy: 299,
        business: 899,
        first: 1599,
      },
      gate: "A12",
      pilot: "Capt. Johnson",
    },
    {
      id: "FL002",
      flightNumber: "AS202",
      aircraft: "Airbus A320",
      route: "Chicago (ORD) → Miami (MIA)",
      departure: "2025-08-20 15:20",
      arrival: "2025-08-20 19:35",
      duration: "3h 15m",
      status: "Delayed",
      capacity: 180,
      booked: 165,
      price: {
        economy: 219,
        business: 649,
        first: 1199,
      },
      gate: "B8",
      pilot: "Capt. Williams",
    },
    {
      id: "FL003",
      flightNumber: "AS303",
      aircraft: "Boeing 777-300ER",
      route: "Seattle (SEA) → Boston (BOS)",
      departure: "2025-08-20 12:00",
      arrival: "2025-08-20 20:15",
      duration: "5h 15m",
      status: "Boarding",
      capacity: 396,
      booked: 384,
      price: {
        economy: 349,
        business: 1299,
        first: 2499,
      },
      gate: "C15",
      pilot: "Capt. Brown",
    },
  ];

  // Flight statistics
  const flightStats = [
    {
      title: "Total Flights Today",
      value: "156",
      change: "+8.2%",
      isPositive: true,
      icon: Plane,
      color: "bg-blue-500",
    },
    {
      title: "On Time Performance",
      value: "94.2%",
      change: "+2.1%",
      isPositive: true,
      icon: Clock,
      color: "bg-green-500",
    },
    {
      title: "Average Load Factor",
      value: "87.5%",
      change: "+5.3%",
      isPositive: true,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
    {
      title: "Delayed Flights",
      value: "9",
      change: "-15.2%",
      isPositive: true,
      icon: AlertCircle,
      color: "bg-orange-500",
    },
  ];

  const aircraftTypes = [
    "Boeing 737-800",
    "Boeing 777-300ER",
    "Airbus A320",
    "Airbus A350",
    "Boeing 787-9",
  ];

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
            Flight Management
          </h1>
          <p className="text-gray-600">
            Manage flights, schedules, and operations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleAddFlight}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Flight
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
                      <span className="text-gray-500 ml-1">vs last week</span>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flight Operations</CardTitle>
              <CardDescription>
                Manage all flights, view real-time status and make updates
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="on-time">On Time</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="boarding">Boarding</SelectItem>
                    <SelectItem value="departed">Departed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
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

        <TabsContent value="operations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flight Operations Center</CardTitle>
              <CardDescription>
                Real-time flight monitoring and operational controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Operations Dashboard
                </h3>
                <p className="text-gray-600">
                  Real-time flight operations monitoring coming soon
                </p>
              </div>
            </CardContent>
          </Card>
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
