import { useState, useEffect } from "react";
import { X, Plane, MapPin, Calendar, Clock, Users, DollarSign, Save, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TEXT = {
  addFlight: "Thêm Chuyến Bay Mới",
  editFlight: "Sửa Chuyến Bay",
  updateFlightInfo: "Cập nhật thông tin chuyến bay",
  enterFlightDetails: "Nhập chi tiết chuyến bay để tạo chuyến bay mới",
  basicFlightInfo: "Thông Tin Cơ Bản Chuyến Bay",
  essentialFlightDetails: "Chi tiết chuyến bay và thông tin nhận dạng cần thiết",
  flightNumber: "Số Chuyến Bay",
  airlineName: "Hãng Hàng Không",
  aircraftType: "Loại Máy Bay",
  capacity: "Sức Chứa",
  flightStatus: "Trạng Thái Chuyến Bay",
  bookedSeats: "Ghế Đã Đặt",
  availableSeats: "Ghế Còn Trống",
  routeInfo: "Thông Tin Tuyến Bay",
  departureArrivalDetails: "Chi tiết sân bay đi và đến",
  departureAirport: "Sân Bay Đi",
  arrivalAirport: "Sân Bay Đến",
  scheduleInfo: "Thông Tin Lịch Trình",
  flightTiming: "Thời gian và lịch trình chuyến bay",
  departureDate: "Ngày Khởi Hành",
  departureTime: "Giờ Khởi Hành",
  arrivalDate: "Ngày Đến",
  arrivalTime: "Giờ Đến",
  operationalInfo: "Thông Tin Vận Hành",
  gateTerminalCrew: "Cổng, nhà ga và phi hành đoàn",
  gate: "Cổng",
  pilot: "Phi Công",
  terminal: "Nhà Ga",
  checkInCounter: "Quầy Check-in",
  pricingInfo: "Thông Tin Giá Vé",
  fareClasses: "Giá vé theo hạng",
  basePrice: "Giá Cơ Bản",
  flightType: "Loại Chuyến Bay",
  additionalServices: "Dịch Vụ Bổ Sung",
  servicesAmenities: "Dịch vụ và tiện ích trên chuyến bay",
  baggage: "Hành Lý",
  mealService: "Dịch Vụ Ăn Uống",
  entertainment: "Giải Trí",
  wifiAvailable: "Có WiFi",
  delayReason: "Lý Do Hoãn Bay",
  remarks: "Ghi Chú",
  requiredField: "Trường này là bắt buộc",
  flightNumberFormat: "Số chuyến bay phải có định dạng: AB123 hoặc AB1234",
  arrivalAfterDeparture: "Thời gian đến phải sau thời gian khởi hành",
  capacityGreaterZero: "Sức chứa phải lớn hơn 0",
  bookedExceedCapacity: "Ghế đã đặt không thể vượt quá sức chứa",
  priceGreaterZero: "Giá phải lớn hơn 0",
  selectAircraft: "Chọn loại máy bay",
  selectDepartureAirport: "Chọn sân bay đi",
  selectArrivalAirport: "Chọn sân bay đến",
  selectPilot: "Chọn phi công",
  selectAirline: "Chọn hãng hàng không",
  selectFlightType: "Chọn loại chuyến bay",
  save: "Lưu",
  reset: "Đặt Lại",
  cancel: "Hủy",
  scheduled: "Đã Lên Lịch",
  boarding: "Đang Lên Máy Bay",
  departed: "Đã Khởi Hành",
  delayed: "Hoãn",
  cancelled: "Đã Hủy",
  completed: "Hoàn Thành",
};

const FlightFormModal = ({ open, onClose, onSave, aircraftTypes = [], flight = null, mode = "add" }) => {
  const isEditMode = mode === "edit" && flight;
  const initialFormData = {
    flightNumber: "", airlineName: "", aircraft: "", fromCode: "", toCode: "", departureDate: "", departureTime: "",
    arrivalDate: "", arrivalTime: "", totalSeats: "", gate: "", pilot: "", basePrice: "", type: "", status: "SCHEDULED",
    availableSeats: "", bookedSeats: "", terminal: "", checkInCounter: "", baggage: "", mealService: "",
    entertainment: "", wifiAvailable: false, delayReason: "", remarks: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        flightNumber: flight.flightNumber || "",
        airlineName: flight.airlineName || "",
        aircraft: flight.aircraft || "",
        fromCode: flight.fromCode || "",
        toCode: flight.toCode || "",
        departureDate: flight.departureTime ? new Date(flight.departureTime).toISOString().split("T")[0] : "",
        departureTime: flight.departureTime ? new Date(flight.departureTime).toISOString().slice(11, 16) : "",
        arrivalDate: flight.arrivalTime ? new Date(flight.arrivalTime).toISOString().split("T")[0] : "",
        arrivalTime: flight.arrivalTime ? new Date(flight.arrivalTime).toISOString().slice(11, 16) : "",
        totalSeats: flight.totalSeats || "",
        gate: flight.gate || "",
        pilot: flight.pilot || "",
        basePrice: flight.basePrice || "",
        type: flight.type || "",
        status: flight.status || "SCHEDULED",
        availableSeats: flight.availableSeats || "",
        bookedSeats: (flight.totalSeats - flight.availableSeats) || "",
        terminal: flight.terminal || "",
        checkInCounter: flight.checkInCounter || "",
        baggage: flight.baggage || "",
        mealService: flight.mealService || "",
        entertainment: flight.entertainment || "",
        wifiAvailable: flight.wifiAvailable || false,
        delayReason: flight.delayReason || "",
        remarks: flight.remarks || "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [isEditMode, flight, open]);

  useEffect(() => {
    if (!open) {
      setErrors({});
      if (!isEditMode) setFormData(initialFormData);
    }
  }, [open, isEditMode]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ["flightNumber", "airlineName", "aircraft", "fromCode", "toCode", "departureDate", "departureTime", "arrivalDate", "arrivalTime", "totalSeats", "basePrice", "type"];
    if (!isEditMode) requiredFields.push("gate", "pilot");

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = TEXT.requiredField;
    });

    if (formData.flightNumber && !/^[A-Z]{2}\d{3,4}$/.test(formData.flightNumber)) {
      newErrors.flightNumber = TEXT.flightNumberFormat;
    }

    if (formData.departureDate && formData.arrivalDate) {
      const depDate = new Date(`${formData.departureDate} ${formData.departureTime}`);
      const arrDate = new Date(`${formData.arrivalDate} ${formData.arrivalTime}`);
      if (arrDate <= depDate) newErrors.arrivalDate = TEXT.arrivalAfterDeparture;
    }

    if (formData.totalSeats && parseInt(formData.totalSeats) <= 0) {
      newErrors.totalSeats = TEXT.capacityGreaterZero;
    }

    if (isEditMode && formData.bookedSeats && formData.totalSeats) {
      if (parseInt(formData.bookedSeats) > parseInt(formData.totalSeats)) {
        newErrors.bookedSeats = TEXT.bookedExceedCapacity;
      }
    }

    if (formData.basePrice && parseFloat(formData.basePrice) <= 0) {
      newErrors.basePrice = TEXT.priceGreaterZero;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const processedData = {
      ...formData,
      flightId: isEditMode ? flight.flightId : `FL${Date.now()}`,
      totalSeats: parseInt(formData.totalSeats),
      basePrice: parseFloat(formData.basePrice),
      availableSeats: isEditMode ? parseInt(formData.availableSeats) : parseInt(formData.totalSeats) - (parseInt(formData.bookedSeats) || 0),
      bookedSeats: isEditMode ? parseInt(formData.bookedSeats) || 0 : 0,
      wifiAvailable: Boolean(formData.wifiAvailable),
      departureTime: new Date(`${formData.departureDate}T${formData.departureTime}:00Z`).toISOString(),
      arrivalTime: new Date(`${formData.arrivalDate}T${formData.arrivalTime}:00Z`).toISOString(),
      createdAt: isEditMode ? flight.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(processedData, isEditMode);
    onClose();
  };

  const handleReset = () => {
    setFormData(isEditMode ? {
      flightNumber: flight.flightNumber || "",
      airlineName: flight.airlineName || "",
      aircraft: flight.aircraft || "",
      fromCode: flight.fromCode || "",
      toCode: flight.toCode || "",
      departureDate: flight.departureTime ? new Date(flight.departureTime).toISOString().split("T")[0] : "",
      departureTime: flight.departureTime ? new Date(flight.departureTime).toISOString().slice(11, 16) : "",
      arrivalDate: flight.arrivalTime ? new Date(flight.arrivalTime).toISOString().split("T")[0] : "",
      arrivalTime: flight.arrivalTime ? new Date(flight.arrivalTime).toISOString().slice(11, 16) : "",
      totalSeats: flight.totalSeats || "",
      gate: flight.gate || "",
      pilot: flight.pilot || "",
      basePrice: flight.basePrice || "",
      type: flight.type || "",
      status: flight.status || "SCHEDULED",
      availableSeats: flight.availableSeats || "",
      bookedSeats: (flight.totalSeats - flight.availableSeats) || "",
      terminal: flight.terminal || "",
      checkInCounter: flight.checkInCounter || "",
      baggage: flight.baggage || "",
      mealService: flight.mealService || "",
      entertainment: flight.entertainment || "",
      wifiAvailable: flight.wifiAvailable || false,
      delayReason: flight.delayReason || "",
      remarks: flight.remarks || "",
    } : initialFormData);
    setErrors({});
  };

  const airports = [
    { code: "HAN", name: "Noi Bai International Airport (Hanoi)" },
    { code: "SGN", name: "Tan Son Nhat Airport (Ho Chi Minh City)" },
    { code: "DAD", name: "Da Nang International Airport" },
    { code: "CXR", name: "Cam Ranh International Airport" },
    { code: "PQC", name: "Phu Quoc International Airport" },
    { code: "VCA", name: "Can Tho International Airport" },
    { code: "HPH", name: "Cat Bi International Airport (Hai Phong)" },
    { code: "UIH", name: "Phu Bai International Airport (Hue)" },
    { code: "NRT", name: "Narita International Airport (Tokyo)" },
    { code: "ICN", name: "Incheon International Airport (Seoul)" },
    { code: "SIN", name: "Singapore Changi Airport" },
    { code: "BKK", name: "Suvarnabhumi Airport (Bangkok)" },
    { code: "KUL", name: "Kuala Lumpur International Airport" },
  ];

  const pilots = [
    "Captain John Smith", "Captain Mary Johnson", "Captain David Wilson",
    "Captain Sarah Brown", "Captain Michael Davis", "Captain Lisa Anderson",
  ];

  const airlines = ["Vietnam Airlines", "Vietjet Air", "Bamboo Airways", "Pacific Airlines"];
  const flightTypes = ["DOMESTIC", "INTERNATIONAL"];
  const statusOptions = [
    { value: "SCHEDULED", label: TEXT.scheduled },
    { value: "BOARDING", label: TEXT.boarding },
    { value: "DEPARTED", label: TEXT.departed },
    { value: "DELAYED", label: TEXT.delayed },
    { value: "CANCELLED", label: TEXT.cancelled },
    { value: "COMPLETED", label: TEXT.completed },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditMode ? <Edit className="h-6 w-6 text-blue-600" /> : <Plus className="h-6 w-6 text-blue-600" />}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? TEXT.editFlight : TEXT.addFlight}</h2>
              <p className="text-sm text-gray-500">
                {isEditMode ? `${TEXT.updateFlightInfo} ${flight?.flightNumber || ""}` : TEXT.enterFlightDetails}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Plane className="h-5 w-5 mr-2 text-blue-600" />
                {TEXT.basicFlightInfo}
              </CardTitle>
              <CardDescription>{TEXT.essentialFlightDetails}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="flightNumber">{TEXT.flightNumber} *</Label>
                <Input
                  id="flightNumber"
                  value={formData.flightNumber}
                  onChange={(e) => handleInputChange("flightNumber", e.target.value)}
                  placeholder="VN123"
                  className={errors.flightNumber ? "border-red-500" : ""}
                />
                {errors.flightNumber && <p className="text-red-500 text-xs mt-1">{errors.flightNumber}</p>}
              </div>
              <div>
                <Label htmlFor="airlineName">{TEXT.airlineName} *</Label>
                <Select value={formData.airlineName} onValueChange={(value) => handleInputChange("airlineName", value)}>
                  <SelectTrigger className={errors.airlineName ? "border-red-500" : ""}>
                    <SelectValue placeholder={TEXT.selectAirline} />
                  </SelectTrigger>
                  <SelectContent>
                    {airlines.map((airline) => <SelectItem key={airline} value={airline}>{airline}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.airlineName && <p className="text-red-500 text-xs mt-1">{errors.airlineName}</p>}
              </div>
              <div>
                <Label htmlFor="aircraft">{TEXT.aircraftType} *</Label>
                <Select value={formData.aircraft} onValueChange={(value) => handleInputChange("aircraft", value)}>
                  <SelectTrigger className={errors.aircraft ? "border-red-500" : ""}>
                    <SelectValue placeholder={TEXT.selectAircraft} />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftTypes.map((aircraft) => <SelectItem key={aircraft} value={aircraft}>{aircraft}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.aircraft && <p className="text-red-500 text-xs mt-1">{errors.aircraft}</p>}
              </div>
              <div>
                <Label htmlFor="totalSeats">{TEXT.capacity} *</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={formData.totalSeats}
                  onChange={(e) => handleInputChange("totalSeats", e.target.value)}
                  placeholder="180"
                  className={errors.totalSeats ? "border-red-500" : ""}
                />
                {errors.totalSeats && <p className="text-red-500 text-xs mt-1">{errors.totalSeats}</p>}
              </div>
              <div>
                <Label htmlFor="type">{TEXT.flightType} *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder={TEXT.selectFlightType} />
                  </SelectTrigger>
                  <SelectContent>
                    {flightTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
              </div>
              {isEditMode && (
                <div>
                  <Label htmlFor="status">{TEXT.flightStatus}</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <Badge
                            variant={status.value === "COMPLETED" ? "default" : status.value === "CANCELLED" ? "destructive" : status.value === "DELAYED" ? "secondary" : "outline"}
                            className="mr-2"
                          >
                            {status.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isEditMode && (
                <>
                  <div>
                    <Label htmlFor="bookedSeats">{TEXT.bookedSeats}</Label>
                    <Input
                      id="bookedSeats"
                      type="number"
                      value={formData.bookedSeats}
                      onChange={(e) => handleInputChange("bookedSeats", e.target.value)}
                      placeholder="0"
                      className={errors.bookedSeats ? "border-red-500" : ""}
                    />
                    {errors.bookedSeats && <p className="text-red-500 text-xs mt-1">{errors.bookedSeats}</p>}
                  </div>
                  <div>
                    <Label htmlFor="availableSeats">{TEXT.availableSeats}</Label>
                    <Input
                      id="availableSeats"
                      type="number"
                      value={formData.availableSeats}
                      onChange={(e) => handleInputChange("availableSeats", e.target.value)}
                      placeholder="180"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                {TEXT.routeInfo}
              </CardTitle>
              <CardDescription>{TEXT.departureArrivalDetails}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromCode">{TEXT.departureAirport} *</Label>
                <Select value={formData.fromCode} onValueChange={(value) => handleInputChange("fromCode", value)}>
                  <SelectTrigger className={errors.fromCode ? "border-red-500" : ""}>
                    <SelectValue placeholder={TEXT.selectDepartureAirport} />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((airport) => (
                      <SelectItem key={airport.code} value={airport.code}>{airport.code} - {airport.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fromCode && <p className="text-red-500 text-xs mt-1">{errors.fromCode}</p>}
              </div>
              <div>
                <Label htmlFor="toCode">{TEXT.arrivalAirport} *</Label>
                <Select value={formData.toCode} onValueChange={(value) => handleInputChange("toCode", value)}>
                  <SelectTrigger className={errors.toCode ? "border-red-500" : ""}>
                    <SelectValue placeholder={TEXT.selectArrivalAirport} />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((airport) => (
                      <SelectItem key={airport.code} value={airport.code}>{airport.code} - {airport.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.toCode && <p className="text-red-500 text-xs mt-1">{errors.toCode}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                {TEXT.scheduleInfo}
              </CardTitle>
              <CardDescription>{TEXT.flightTiming}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="departureDate">{TEXT.departureDate} *</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange("departureDate", e.target.value)}
                  className={errors.departureDate ? "border-red-500" : ""}
                />
                {errors.departureDate && <p className="text-red-500 text-xs mt-1">{errors.departureDate}</p>}
              </div>
              <div>
                <Label htmlFor="departureTime">{TEXT.departureTime} *</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => handleInputChange("departureTime", e.target.value)}
                  className={errors.departureTime ? "border-red-500" : ""}
                />
                {errors.departureTime && <p className="text-red-500 text-xs mt-1">{errors.departureTime}</p>}
              </div>
              <div>
                <Label htmlFor="arrivalDate">{TEXT.arrivalDate} *</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange("arrivalDate", e.target.value)}
                  className={errors.arrivalDate ? "border-red-500" : ""}
                />
                {errors.arrivalDate && <p className="text-red-500 text-xs mt-1">{errors.arrivalDate}</p>}
              </div>
              <div>
                <Label htmlFor="arrivalTime">{TEXT.arrivalTime} *</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => handleInputChange("arrivalTime", e.target.value)}
                  className={errors.arrivalTime ? "border-red-500" : ""}
                />
                {errors.arrivalTime && <p className="text-red-500 text-xs mt-1">{errors.arrivalTime}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                {TEXT.operationalInfo}
              </CardTitle>
              <CardDescription>{TEXT.gateTerminalCrew}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pilot">{TEXT.pilot} {!isEditMode && "*"}</Label>
                <Select value={formData.pilot} onValueChange={(value) => handleInputChange("pilot", value)}>
                  <SelectTrigger className={errors.pilot ? "border-red-500" : ""}>
                    <SelectValue placeholder={TEXT.selectPilot} />
                  </SelectTrigger>
                  <SelectContent>
                    {pilots.map((pilot) => <SelectItem key={pilot} value={pilot}>{pilot}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.pilot && <p className="text-red-500 text-xs mt-1">{errors.pilot}</p>}
              </div>
              <div>
                <Label htmlFor="gate">{TEXT.gate} {!isEditMode && "*"}</Label>
                <Input
                  id="gate"
                  value={formData.gate}
                  onChange={(e) => handleInputChange("gate", e.target.value)}
                  placeholder="A12"
                  className={errors.gate ? "border-red-500" : ""}
                />
                {errors.gate && <p className="text-red-500 text-xs mt-1">{errors.gate}</p>}
              </div>
              {isEditMode && (
                <>
                  <div>
                    <Label htmlFor="terminal">{TEXT.terminal}</Label>
                    <Input
                      id="terminal"
                      value={formData.terminal}
                      onChange={(e) => handleInputChange("terminal", e.target.value)}
                      placeholder="Terminal 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkInCounter">{TEXT.checkInCounter}</Label>
                    <Input
                      id="checkInCounter"
                      value={formData.checkInCounter}
                      onChange={(e) => handleInputChange("checkInCounter", e.target.value)}
                      placeholder="Counter 12-15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="baggage">{TEXT.baggage}</Label>
                    <Input
                      id="baggage"
                      value={formData.baggage}
                      onChange={(e) => handleInputChange("baggage", e.target.value)}
                      placeholder="20kg checked, 7kg carry-on"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mealService">{TEXT.mealService}</Label>
                    <Select value={formData.mealService} onValueChange={(value) => handleInputChange("mealService", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dịch vụ ăn uống" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có dịch vụ ăn uống</SelectItem>
                        <SelectItem value="snack">Dịch vụ đồ ăn nhẹ</SelectItem>
                        <SelectItem value="meal">Dịch vụ ăn uống đầy đủ</SelectItem>
                        <SelectItem value="premium">Ăn uống cao cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entertainment">{TEXT.entertainment}</Label>
                    <Select value={formData.entertainment} onValueChange={(value) => handleInputChange("entertainment", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dịch vụ giải trí" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có giải trí</SelectItem>
                        <SelectItem value="basic">Giải trí cơ bản</SelectItem>
                        <SelectItem value="premium">Giải trí cao cấp</SelectItem>
                        <SelectItem value="live_tv">TV trực tiếp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="wifiAvailable"
                      checked={formData.wifiAvailable}
                      onChange={(e) => handleInputChange("wifiAvailable", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="wifiAvailable">{TEXT.wifiAvailable}</Label>
                  </div>
                  {formData.status === "DELAYED" && (
                    <div className="col-span-full">
                      <Label htmlFor="delayReason">{TEXT.delayReason}</Label>
                      <Input
                        id="delayReason"
                        value={formData.delayReason}
                        onChange={(e) => handleInputChange("delayReason", e.target.value)}
                        placeholder="Điều kiện thời tiết, sự cố kỹ thuật, v.v."
                      />
                    </div>
                  )}
                  <div className="col-span-full">
                    <Label htmlFor="remarks">{TEXT.remarks}</Label>
                    <textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => handleInputChange("remarks", e.target.value)}
                      placeholder="Ghi chú bổ sung về chuyến bay..."
                      className="w-full p-2 border border-gray-300 rounded-md resize-none"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
                {TEXT.pricingInfo}
              </CardTitle>
              <CardDescription>{TEXT.fareClasses}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="basePrice">{TEXT.basePrice} ($) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange("basePrice", e.target.value)}
                  placeholder="299"
                  className={errors.basePrice ? "border-red-500" : ""}
                />
                {errors.basePrice && <p className="text-red-500 text-xs mt-1">{errors.basePrice}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleReset}>{TEXT.reset}</Button>
            <Button type="button" variant="outline" onClick={onClose}>{TEXT.cancel}</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? "Cập Nhật Chuyến Bay" : TEXT.save}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlightFormModal;