import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Plane,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { flightApi } from "@/apis/flight-api";
import { format } from "date-fns";

const ConflictModal = ({
  open,
  onClose,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  departureAirportId,
  arrivalAirportId,
  aircraftId,
  gateId,
  airports,
  aircrafts,
}) => {
  const [conflicts, setConflicts] = useState({
    aircraft: [],
    departureAirport: [],
    arrivalAirport: [],
    gate: [],
  });
  const [loading, setLoading] = useState(false);

  // Hàm kiểm tra conflict
  const checkConflicts = async () => {
    if (!departureDate || !departureTime || !arrivalDate || !arrivalTime)
      return;

    setLoading(true);
    try {
      const params = {
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
        departureAirportId: departureAirportId
          ? parseInt(departureAirportId)
          : undefined,
        arrivalAirportId: arrivalAirportId
          ? parseInt(arrivalAirportId)
          : undefined,
        aircraftId: aircraftId ? parseInt(aircraftId) : undefined,
        gateId: gateId ? parseInt(gateId) : undefined,
        // excludeFlightId: excludeFlightId ? parseInt(excludeFlightId) : undefined,
      };

      const response = await flightApi.checkScheduleConflicts(params);

      if (response.success && response.data) {
        setConflicts({
          aircraft: response.data.aircraft || [],
          departureAirport: response.data.departureAirport || [],
          arrivalAirport: response.data.arrivalAirport || [],
          gate: response.data.gate || [],
        });
      } else {
        // Fallback: nếu API mới chưa có, dùng searchFlights cũ
        await checkConflictsFallback();
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
      // Fallback to old method
      await checkConflictsFallback();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method using searchFlights (old way)
  const checkConflictsFallback = async () => {
    try {
      const departureDateTime = new Date(
        `${departureDate}T${departureTime}:00`
      );
      const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}:00`);

      // Kiểm tra conflict máy bay
      let aircraftConflicts = [];
      if (aircraftId) {
        try {
          const response = await flightApi.searchFlights({
            aircraftId: parseInt(aircraftId),
            startTime: departureDateTime.toISOString(),
            endTime: arrivalDateTime.toISOString(),
            size: 100,
          });
          if (response.success && response.data?.content) {
            aircraftConflicts = response.data.content;
          }
        } catch (error) {
          console.error("Error checking aircraft conflicts:", error);
        }
      }

      // Kiểm tra conflict sân bay khởi hành
      let departureConflicts = [];
      if (departureAirportId) {
        try {
          const response = await flightApi.searchFlights({
            departureAirportId: parseInt(departureAirportId),
            startTime: departureDateTime.toISOString(),
            endTime: arrivalDateTime.toISOString(),
            size: 100,
          });
          if (response.success && response.data?.content) {
            departureConflicts = response.data.content;
          }
        } catch (error) {
          console.error("Error checking departure airport conflicts:", error);
        }
      }

      // Kiểm tra conflict sân bay đến
      let arrivalConflicts = [];
      if (arrivalAirportId) {
        try {
          const response = await flightApi.searchFlights({
            arrivalAirportId: parseInt(arrivalAirportId),
            startTime: departureDateTime.toISOString(),
            endTime: arrivalDateTime.toISOString(),
            size: 100,
          });
          if (response.success && response.data?.content) {
            arrivalConflicts = response.data.content;
          }
        } catch (error) {
          console.error("Error checking arrival airport conflicts:", error);
        }
      }

      setConflicts({
        aircraft: aircraftConflicts,
        departureAirport: departureConflicts,
        arrivalAirport: arrivalConflicts,
        gate: [],
      });
    } catch (error) {
      console.error("Error in fallback conflict check:", error);
    }
  };

  useEffect(() => {
    if (open) {
      checkConflicts();
    }
  }, [
    open,
    departureDate,
    departureTime,
    arrivalDate,
    arrivalTime,
    departureAirportId,
    arrivalAirportId,
    aircraftId,
    gateId,
  ]);

  const getAirportName = (airportId) => {
    const airport = airports.find(
      (a) => String(a.airportId) === String(airportId)
    );
    return airport
      ? `${airport.airportCode} - ${airport.airportName}`
      : `Airport ${airportId}`;
  };

  const getAircraftName = (aircraftId) => {
    const aircraft = aircrafts.find(
      (a) => String(a.aircraftId) === String(aircraftId)
    );
    return aircraft
      ? `${aircraft.aircraftCode} - ${aircraft.aircraftName}`
      : `Aircraft ${aircraftId}`;
  };

  const formatDateTime = (dateTimeString) => {
    try {
      return format(new Date(dateTimeString), "dd/MM/yyyy HH:mm");
    } catch {
      return dateTimeString;
    }
  };

  const hasConflicts =
    conflicts.aircraft.length > 0 ||
    conflicts.departureAirport.length > 0 ||
    conflicts.arrivalAirport.length > 0 ||
    conflicts.gate.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Kiểm tra xung đột lịch trình
          </DialogTitle>
          <DialogDescription>
            Kiểm tra các chuyến bay xung đột trong khoảng thời gian đã chọn
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin thời gian đã chọn */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thời gian đã chọn</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Khởi hành</Label>
                  <p className="text-sm text-gray-600">
                    {departureDate && departureTime
                      ? format(
                          new Date(`${departureDate}T${departureTime}:00`),
                          "dd/MM/yyyy HH:mm"
                        )
                      : "Chưa chọn"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Đến</Label>
                  <p className="text-sm text-gray-600">
                    {arrivalDate && arrivalTime
                      ? format(
                          new Date(`${arrivalDate}T${arrivalTime}:00`),
                          "dd/MM/yyyy HH:mm"
                        )
                      : "Chưa chọn"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kết quả kiểm tra */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang kiểm tra xung đột...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Máy bay */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Máy bay đã chọn
                    {aircraftId && (
                      <Badge variant="outline">
                        {getAircraftName(aircraftId)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conflicts.aircraft.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">Có xung đột!</span>
                      </div>
                      <div className="space-y-2">
                        {conflicts.aircraft.map((flight) => (
                          <div
                            key={flight.flightId}
                            className="p-3 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Chuyến bay #{flight.flightId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {flight.departureAirport
                                    ? `${flight.departureAirport.airportCode} - ${flight.departureAirport.airportName}`
                                    : `Airport ${flight.departureAirportId}`}{" "}
                                  →{" "}
                                  {flight.arrivalAirport
                                    ? `${flight.arrivalAirport.airportCode} - ${flight.arrivalAirport.airportName}`
                                    : `Airport ${flight.arrivalAirportId}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDateTime(flight.departureTime)} -{" "}
                                  {formatDateTime(flight.arrivalTime)}
                                </p>
                              </div>
                              <Badge variant="destructive">
                                {flight.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Không có xung đột</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sân bay khởi hành */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Sân bay khởi hành
                    {departureAirportId && (
                      <Badge variant="outline">
                        {getAirportName(departureAirportId)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conflicts.departureAirport.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Có chuyến bay khác khởi hành!
                        </span>
                      </div>
                      <div className="space-y-2">
                        {conflicts.departureAirport.map((flight) => (
                          <div
                            key={flight.flightId}
                            className="p-3 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Chuyến bay #{flight.flightId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {flight.departureAirport
                                    ? `${flight.departureAirport.airportCode} - ${flight.departureAirport.airportName}`
                                    : `Airport ${flight.departureAirportId}`}{" "}
                                  →{" "}
                                  {flight.arrivalAirport
                                    ? `${flight.arrivalAirport.airportCode} - ${flight.arrivalAirport.airportName}`
                                    : `Airport ${flight.arrivalAirportId}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDateTime(flight.departureTime)} -{" "}
                                  {formatDateTime(flight.arrivalTime)}
                                </p>
                              </div>
                              <Badge variant="destructive">
                                {flight.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Không có chuyến bay khác</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sân bay đến */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Sân bay đến
                    {arrivalAirportId && (
                      <Badge variant="outline">
                        {getAirportName(arrivalAirportId)}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conflicts.arrivalAirport.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Có chuyến bay khác đến!
                        </span>
                      </div>
                      <div className="space-y-2">
                        {conflicts.arrivalAirport.map((flight) => (
                          <div
                            key={flight.flightId}
                            className="p-3 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Chuyến bay #{flight.flightId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {flight.departureAirport
                                    ? `${flight.departureAirport.airportCode} - ${flight.departureAirport.airportName}`
                                    : `Airport ${flight.departureAirportId}`}{" "}
                                  →{" "}
                                  {flight.arrivalAirport
                                    ? `${flight.arrivalAirport.airportCode} - ${flight.arrivalAirport.airportName}`
                                    : `Airport ${flight.arrivalAirportId}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDateTime(flight.departureTime)} -{" "}
                                  {formatDateTime(flight.arrivalTime)}
                                </p>
                              </div>
                              <Badge variant="destructive">
                                {flight.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Không có chuyến bay khác</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cổng */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Cổng
                    {gateId && <Badge variant="outline">Gate {gateId}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {conflicts.gate.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="font-medium">
                          Có chuyến bay khác sử dụng cổng này!
                        </span>
                      </div>
                      <div className="space-y-2">
                        {conflicts.gate.map((flight) => (
                          <div
                            key={flight.flightId}
                            className="p-3 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Chuyến bay #{flight.flightId}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {flight.departureAirport
                                    ? `${flight.departureAirport.airportCode} - ${flight.departureAirport.airportName}`
                                    : `Airport ${flight.departureAirportId}`}{" "}
                                  →{" "}
                                  {flight.arrivalAirport
                                    ? `${flight.arrivalAirport.airportCode} - ${flight.arrivalAirport.airportName}`
                                    : `Airport ${flight.arrivalAirportId}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDateTime(flight.departureTime)} -{" "}
                                  {formatDateTime(flight.arrivalTime)}
                                </p>
                              </div>
                              <Badge variant="destructive">
                                {flight.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Cổng khả dụng</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tổng kết */}
          {!loading && (
            <Card
              className={
                hasConflicts
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {hasConflicts ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">
                        Có xung đột lịch trình! Vui lòng chọn thời gian hoặc tài
                        nguyên khác.
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        Không có xung đột lịch trình.
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {!loading && (
            <Button onClick={checkConflicts} variant="outline">
              Kiểm tra lại
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictModal;
