import { useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  MapPin,
  Clock,
  Plane,
  Users,
  AlertTriangle,
  CheckCircle,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FlightTable = ({
  flights,
  searchQuery,
  statusFilter,
  aircraftFilter,
  onViewFlight,
  onEditFlight,
  onDeleteFlight,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusBadge = (status) => {
    const variants = {
      "On Time": "bg-green-100 text-green-800 border-green-200",
      Delayed: "bg-red-100 text-red-800 border-red-200",
      Boarding: "bg-blue-100 text-blue-800 border-blue-200",
      Departed: "bg-gray-100 text-gray-800 border-gray-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      "On Time": CheckCircle,
      Delayed: AlertTriangle,
      Boarding: Pause,
      Departed: Plane,
      Cancelled: AlertTriangle,
    };
    return icons[status] || CheckCircle;
  };

  const getLoadFactorColor = (percentage) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 80) return "text-orange-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const filteredFlights = flights.filter((flight) => {
    const matchesSearch =
      flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.aircraft.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.pilot.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      flight.status.toLowerCase().replace(/\s+/g, "-") === statusFilter;

    const matchesAircraft =
      aircraftFilter === "all" ||
      flight.aircraft.toLowerCase().replace(/\s+/g, "-") === aircraftFilter;

    return matchesSearch && matchesStatus && matchesAircraft;
  });

  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
  const paginatedFlights = filteredFlights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateLoadFactor = (booked, capacity) => {
    return Math.round((booked / capacity) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Flight Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flight</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Load Factor</TableHead>
              <TableHead>Gate</TableHead>
              <TableHead>Pilot</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFlights.map((flight) => {
              const StatusIcon = getStatusIcon(flight.status);
              const loadFactor = calculateLoadFactor(
                flight.booked,
                flight.capacity
              );

              return (
                <TableRow key={flight.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-blue-600">
                        {flight.flightNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {flight.duration}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Plane className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{flight.aircraft}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span>{flight.route}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatTime(flight.departure)}
                      </div>
                      <div className="text-gray-500">
                        {formatDate(flight.departure)}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getStatusBadge(
                        flight.status
                      )} flex items-center space-x-1 w-fit`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{flight.status}</span>
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span
                              className={`font-medium ${getLoadFactorColor(
                                loadFactor
                              )}`}
                            >
                              {loadFactor}%
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {flight.booked}/{flight.capacity} passengers
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">{flight.gate}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">{flight.pilot}</div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                onViewFlight && onViewFlight(flight)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                onEditFlight && onEditFlight(flight)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Flight</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                onDeleteFlight && onDeleteFlight(flight)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cancel Flight</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredFlights.length)} of{" "}
            {filteredFlights.length} flights
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredFlights.length === 0 && (
        <div className="text-center py-12">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No flights found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default FlightTable;
