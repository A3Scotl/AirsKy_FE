import { useState } from "react";
import { Eye, Edit, Trash2, MapPin, Clock, Plane, Users, AlertTriangle, CheckCircle, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const FlightTable = ({ flights, searchQuery, statusFilter, aircraftFilter, onViewFlight, onEditFlight, onDeleteFlight }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusConfig = {
    SCHEDULED: { variant: "outline", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    BOARDING: { variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-200", icon: Pause },
    DEPARTED: { variant: "outline", className: "bg-gray-100 text-gray-800 border-gray-200", icon: Plane },
    DELAYED: { variant: "secondary", className: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
    CANCELLED: { variant: "destructive", className: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle },
    COMPLETED: { variant: "default", className: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  };

  const getLoadFactorColor = (percentage) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 80) return "text-orange-600";
    if (percentage >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const filteredFlights = flights.filter((flight) => {
    const matchesSearch = flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.aircraft.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || flight.status === statusFilter;
    const matchesAircraft = aircraftFilter === "all" || flight.aircraft.toLowerCase().replace(/\s+/g, "-") === aircraftFilter;
    return matchesSearch && matchesStatus && matchesAircraft;
  });

  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
  const paginatedFlights = filteredFlights.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatTime = (dateTime) => new Date(dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (dateTime) => new Date(dateTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const calculateLoadFactor = (flight) => Math.round(((flight.totalSeats - flight.availableSeats) / flight.totalSeats) * 100);

  return (
    <div className="space-y-4">
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
              <TableHead>Stops</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFlights.map((flight) => {
              const { variant, className, icon: StatusIcon } = statusConfig[flight.status] || statusConfig.SCHEDULED;
              const loadFactor = calculateLoadFactor(flight);

              return (
                <TableRow key={flight.flightNumber} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-semibold text-blue-600">{flight.flightNumber}</div>
                    <div className="text-sm text-gray-500">{flight.duration} min</div>
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
                      <span>{flight.fromCode}</span>
                      <span>✈</span>
                      <span>{flight.toCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatTime(flight.arrivalTime)}</div>
                      <div className="text-gray-500">{formatDate(flight.departureTime)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant} className={`${className} flex items-center space-x-1 w-fit`}>
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
                            <span className={`font-medium ${getLoadFactorColor(loadFactor)}`}>{loadFactor}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{flight.totalSeats - flight.availableSeats}/{flight.totalSeats} passengers</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">{flight.gate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{flight.stops || "Direct"}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onViewFlight(flight)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View Details</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEditFlight(flight)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit Flight</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onDeleteFlight(flight)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Cancel Flight</p></TooltipContent>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFlights.length)} of {filteredFlights.length} flights
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
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
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {filteredFlights.length === 0 && (
        <div className="text-center py-12">
          <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default FlightTable;