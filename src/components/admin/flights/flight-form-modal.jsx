import { useState, useEffect } from "react";
import {
  X,
  Plane,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Save,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateTimePicker, TimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";
import ConflictModal from "./conflict-modal";
import { airportApi } from "@/apis/airport-api";
import { airlineApi } from "@/apis/airline-api";
import { aircraftApi } from "@/apis/aircraft-api";
import { flightApi } from "@/apis/flight-api";

// Constants for text labels
const TEXT = {
  addFlight: "Thêm Chuyến Bay Mới",
  editFlight: "Sửa Chuyến Bay",
  updateFlightInfo: "Cập nhật thông tin chuyến bay",
  enterFlightDetails: "Nhập chi tiết chuyến bay để tạo chuyến bay mới",
  basicFlightInfo: "Thông Tin Cơ Bản Chuyến Bay",
  essentialFlightDetails:
    "Chi tiết chuyến bay và thông tin nhận dạng cần thiết",
  airlineName: "Hãng Hàng Không",
  aircraftType: "Loại Máy Bay",
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
  terminal: "Nhà Ga",
  checkInCounter: "Quầy Check-in",
  pricingInfo: "Thông Tin Giá Vé",
  flightType: "Loại Chuyến Bay",
  requiredField: "Trường này là bắt buộc",
  arrivalAfterDeparture: "Thời gian đến phải sau thời gian khởi hành",
  selectGate: "Chọn cổng",
  selectDepartureAirportFirst: "Chọn sân bay khởi hành trước",
  save: "Lưu",
  reset: "Đặt Lại",
  cancel: "Hủy",
  onTime: "Đúng Giờ",
  departed: "Đã Khởi Hành",
  delayed: "Hoãn",
  cancelled: "Đã Hủy",
  businessName: "Tên Doanh Nghiệp",
  gateId: "ID Cổng",
  airlineId: "ID Hãng Hàng Không",
  departureAirportId: "ID Sân Bay Đi",
  arrivalAirportId: "ID Sân Bay Đến",
  aircraftId: "ID Máy Bay",
  selectAirline: "Hãng Hàng Không",
  selectAircraft: "Máy Bay",
  selectFlightType: "Loại Chuyến Bay",
  selectDepartureAirport: "Sân Bay Đi",
  selectArrivalAirport: "Sân Bay Đến",
  delayReason: "Lý Do Hoãn Bay",
  remarks: "Ghi Chú",
  baggage: "Hành Lý",
  mealService: "Dịch Vụ Ăn Uống",
  entertainment: "Giải Trí",
  wifiAvailable: "Có WiFi",
};

// Flight types and status options
const flightTypes = ["DOMESTIC", "INTERNATIONAL"];
const statusOptions = [
  { value: "ON_TIME", label: TEXT.onTime },
  { value: "DEPARTED", label: TEXT.departed },
  { value: "DELAYED", label: TEXT.delayed },
  { value: "CANCELLED", label: TEXT.cancelled },
];

/**
 * FlightFormModal component for creating/editing one-way flight information
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility state
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback to save flight data
 * @param {Object} [props.flight] - Existing flight data for edit mode
 * @param {string} [props.mode="add"] - Mode ("add" or "edit")
 */
const FlightFormModal = ({
  open,
  onClose,
  onSave,
  flight = null,
  mode = "add",
}) => {
  const isEditMode = mode === "edit" && flight;

  // Initial form state
  const initialFormData = {
    airlineId: "1", // Default to Vietnam Airlines
    aircraftId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    gateId: "",
    basePrice: "",
    tripType: "ONE_WAY",
    type: "",
    status: "ON_TIME",
    businessId: "",
    terminal: "",
    checkInCounter: "",
    baggage: "",
    mealService: "",
    entertainment: "",
    wifiAvailable: false,
    delayReason: "",
    remarks: "",
  };

  // State management
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [gates, setGates] = useState([]);

  const [showConflictModal, setShowConflictModal] = useState(false);

  // Calculate minimum date and time constraints
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const minDepartureTime = new Date();
  minDepartureTime.setHours(minDepartureTime.getHours() + 4); // 4 hours from now

  // Load initial data when modal opens
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        try {
          const [airportsRes, airlinesRes, aircraftsRes] = await Promise.all([
            airportApi.getAllAirports(),
            airlineApi.getAllAirlines(),
            aircraftApi.getAllAircrafts(),
          ]);

          const ensureArray = (data) =>
            Array.isArray(data) ? data : data ? [data] : [];

          setAirports(
            ensureArray(airportsRes?.data?.content || airportsRes?.data).filter(
              (a) => a.active === true
            )
          );
          setAirlines(
            ensureArray(airlinesRes?.data?.content || airlinesRes?.data).filter(
              (a) => a.active === true
            )
          );
          setAircrafts(
            ensureArray(aircraftsRes?.data?.content || aircraftsRes?.data)
          );
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      };
      loadData();
    } else {
      setFormData(initialFormData);
      setErrors({});
      setGates([]);
    }
  }, [open]);

  // Load gates when departure airport changes
  useEffect(() => {
    if (formData.departureAirportId && open) {
      const loadGates = async () => {
        try {
          const airportRes = await airportApi.getAirportById(
            formData.departureAirportId
          );
          setGates(
            Array.isArray(airportRes?.data?.gates) ? airportRes.data.gates : []
          );
        } catch (error) {
          setGates([]);
        }
      };
      loadGates();
    } else {
      setGates([]);
    }
  }, [formData.departureAirportId, open]);

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEditMode && flight) {
      const departureTime = flight.departureTime
        ? new Date(flight.departureTime)
        : null;
      const arrivalTime = flight.arrivalTime
        ? new Date(flight.arrivalTime)
        : null;

      setFormData({
        ...initialFormData,
        airlineId: String(flight.airline?.airlineId || flight.airlineId || ""),
        aircraftId: String(
          flight.aircraft?.aircraftId || flight.aircraftId || ""
        ),
        departureAirportId: String(
          flight.departureAirport?.airportId || flight.departureAirportId || ""
        ),
        arrivalAirportId: String(
          flight.arrivalAirport?.airportId || flight.arrivalAirportId || ""
        ),
        departureDate: departureTime ? format(departureTime, "yyyy-MM-dd") : "",
        departureTime: departureTime ? format(departureTime, "HH:mm") : "",
        arrivalDate: arrivalTime ? format(arrivalTime, "yyyy-MM-dd") : "",
        arrivalTime: arrivalTime ? format(arrivalTime, "HH:mm") : "",
        gateId: String(flight.gateId || ""),
        basePrice: flight.basePrice || "",
        type: flight.type || "",
        status: flight.status || "ON_TIME",
        businessId: String(flight.business?.id || flight.businessId || ""),
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

  /**
   * Validate individual form field
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @param {Object} currentFormData - Current form data
   * @returns {string} Error message or empty string
   */
  const validateField = (field, value, currentFormData = formData) => {
    if (
      !value &&
      [
        "airlineId",
        "aircraftId",
        "departureAirportId",
        "arrivalAirportId",
      ].includes(field)
    ) {
      return TEXT.requiredField;
    }

    switch (field) {
      case "airlineId":
        if (!value) return TEXT.requiredField;
        const selectedAirline = airlines.find(
          (a) => String(a.airlineId) === value
        );
        if (!selectedAirline) return "Hãng hàng không không tồn tại";
        if (!selectedAirline.active) return "Hãng hàng không không hoạt động";
        return "";

      case "aircraftId":
        if (!value) return TEXT.requiredField;
        if (!aircrafts.find((a) => String(a.aircraftId) === value)) {
          return "Máy bay không tồn tại";
        }
        return "";

      case "departureAirportId":
        if (!value) return TEXT.requiredField;
        const selectedDepartureAirport = airports.find(
          (a) => String(a.airportId) === value
        );
        if (!selectedDepartureAirport) return "Sân bay khởi hành không tồn tại";
        if (!selectedDepartureAirport.active)
          return "Sân bay khởi hành không hoạt động";
        return "";

      case "arrivalAirportId":
        if (!value) return TEXT.requiredField;
        const selectedArrivalAirport = airports.find(
          (a) => String(a.airportId) === value
        );
        if (!selectedArrivalAirport) return "Sân bay đến không tồn tại";
        if (!selectedArrivalAirport.active)
          return "Sân bay đến không hoạt động";
        if (value === currentFormData.departureAirportId)
          return "Phải khác sân bay khởi hành";
        return "";

      case "gateId":
        if (!isEditMode && !value) return TEXT.requiredField;
        if (!isEditMode && !gates.find((g) => String(g.gateId) === value)) {
          return "Cổng không tồn tại";
        }
        const selectedGate = gates.find((g) => String(g.gateId) === value);
        if (value && currentFormData.departureAirportId && !isEditMode) {
          if (
            gates.length > 0 &&
            selectedGate &&
            String(selectedGate.airportId) !==
              String(currentFormData.departureAirportId)
          ) {
            return "Cổng phải thuộc về sân bay khởi hành";
          }
        }
        return "";

      case "departureDate":
      case "departureTime":
        // Check if departure date is today and time is less than 4 hours from now
        if (currentFormData.departureDate && currentFormData.departureTime) {
          const selectedDate = new Date(currentFormData.departureDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (selectedDate.getTime() === today.getTime()) {
            const selectedTime = new Date(
              `${currentFormData.departureDate}T${currentFormData.departureTime}`
            );
            const minTime = new Date();
            minTime.setHours(minTime.getHours() + 4);

            if (selectedTime < minTime) {
              return "Thời gian khởi hành phải cách ít nhất 4 tiếng so với hiện tại";
            }
          }
        }
      case "arrivalDate":
      case "arrivalTime":
        if (
          currentFormData.departureDate &&
          currentFormData.arrivalDate &&
          currentFormData.departureTime &&
          currentFormData.arrivalTime
        ) {
          const dep = new Date(
            `${currentFormData.departureDate}T${currentFormData.departureTime}`
          );
          const arr = new Date(
            `${currentFormData.arrivalDate}T${currentFormData.arrivalTime}`
          );
          if (dep >= arr) return TEXT.arrivalAfterDeparture;
        }
        return "";

      default:
        return "";
    }
  };

  /**
   * Handle input changes and validate in real-time
   * @param {string} field - Field name
   * @param {string} value - New value
   */
  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    const fieldError = validateField(field, value, newFormData);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldError,
      ...(field === "departureAirportId" && newFormData.arrivalAirportId
        ? {
            arrivalAirportId: validateField(
              "arrivalAirportId",
              newFormData.arrivalAirportId,
              newFormData
            ),
          }
        : {}),
      ...(field === "departureAirportId" ? { gateId: "" } : {}),
    }));

    if (field === "departureAirportId") {
      setFormData((prev) => ({ ...prev, gateId: "" }));
    }
  };

  /**
   * Validate entire form
   * @returns {boolean} Whether form is valid
   */
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      "airlineId",
      "aircraftId",
      "departureAirportId",
      "arrivalAirportId",
      "departureDate",
      "departureTime",
      "arrivalDate",
      "arrivalTime",
      "basePrice",
    ];
    if (!isEditMode) requiredFields.push("gateId");

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = TEXT.requiredField;
    });

    if (
      formData.departureDate &&
      formData.arrivalDate &&
      formData.departureTime &&
      formData.arrivalTime
    ) {
      const dep = new Date(
        `${formData.departureDate}T${formData.departureTime}`
      );
      const arr = new Date(`${formData.arrivalDate}T${formData.arrivalTime}`);
      if (dep >= arr) newErrors.arrivalTime = TEXT.arrivalAfterDeparture;
    }

    if (!airlines.find((a) => String(a.airlineId) === formData.airlineId))
      newErrors.airlineId = "Hãng hàng không không tồn tại";
    if (!aircrafts.find((a) => String(a.aircraftId) === formData.aircraftId))
      newErrors.aircraftId = "Máy bay không tồn tại";
    if (
      !airports.find((a) => String(a.airportId) === formData.departureAirportId)
    )
      newErrors.departureAirportId = "Sân bay khởi hành không tồn tại";
    if (
      !airports.find((a) => String(a.airportId) === formData.arrivalAirportId)
    )
      newErrors.arrivalAirportId = "Sân bay đến không tồn tại";

    const selectedAirline = airlines.find(
      (a) => String(a.airlineId) === formData.airlineId
    );
    const selectedDepartureAirport = airports.find(
      (a) => String(a.airportId) === formData.departureAirportId
    );
    const selectedArrivalAirport = airports.find(
      (a) => String(a.airportId) === formData.arrivalAirportId
    );

    if (selectedAirline && !selectedAirline.active)
      newErrors.airlineId = "Hãng hàng không không hoạt động";
    if (selectedDepartureAirport && !selectedDepartureAirport.active)
      newErrors.departureAirportId = "Sân bay khởi hành không hoạt động";
    if (selectedArrivalAirport && !selectedArrivalAirport.active)
      newErrors.arrivalAirportId = "Sân bay đến không hoạt động";
    if (formData.departureAirportId === formData.arrivalAirportId)
      newErrors.arrivalAirportId = "Phải khác sân bay khởi hành";

    if (!isEditMode && !gates.find((g) => String(g.gateId) === formData.gateId))
      newErrors.gateId = "Cổng không tồn tại";

    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(
        ([_, value]) => value && value.trim() !== ""
      )
    );

    setErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return toast.error("Vui lòng kiểm tra lỗi");
    }

    const loadingToast = toast.loading(isEditMode ? "Cập nhật..." : "Tạo...");
    try {
      const processedData = {
        airlineId: parseInt(formData.airlineId),
        aircraftId: parseInt(formData.aircraftId),
        departureAirportId: parseInt(formData.departureAirportId),
        arrivalAirportId: parseInt(formData.arrivalAirportId),
        departureTime: new Date(
          `${formData.departureDate}T${formData.departureTime}:00`
        ).toISOString(),
        arrivalTime: new Date(
          `${formData.arrivalDate}T${formData.arrivalTime}:00`
        ).toISOString(),
        gateId: parseInt(formData.gateId) || null,
        type: formData.type,
        status: formData.status,
        businessId: formData.businessId ? parseInt(formData.businessId) : null,
        tripType: formData.tripType,
        basePrice: parseFloat(formData.basePrice) || 0,
        terminal: formData.terminal || null,
        checkInCounter: formData.checkInCounter || null,
        baggage: formData.baggage || null,
        mealService: formData.mealService || null,
        entertainment: formData.entertainment || null,
        wifiAvailable: formData.wifiAvailable,
        delayReason: formData.delayReason || null,
        remarks: formData.remarks || null,
        ...(isEditMode && { flightId: flight.flightId }),
      };

      const result = await onSave(processedData, isEditMode);
      toast.dismiss(loadingToast);

      if (result?.success === true) {
        onClose();
      } else {
        throw new Error("Save failed");
      }

      return result;
    } catch (error) {
      toast.dismiss(loadingToast);
      if (error.response?.errors) {
        const fieldErrors = Object.fromEntries(
          Object.entries(error.response.errors).filter(
            ([_, message]) => message
          )
        );
        setErrors(fieldErrors);
        toast.error("Vui lòng kiểm tra và sửa các lỗi trong form");
      } else {
        throw error;
      }
    }
  };

  /**
   * Reset form to initial state
   */
  const handleReset = () => {
    setFormData(
      isEditMode ? { ...flight, ...initialFormData } : initialFormData
    );
    setErrors({});
  };

  /**
   * Generate seat layout for selected aircraft
   * @param {Object} aircraft - Selected aircraft
   * @param {string[]} bookedSeats - Array of booked seat IDs
   * @returns {Array} Seat layout array
   */
  const generateSeatLayout = (aircraft, bookedSeats = []) => {
    if (!aircraft?.seatLayout || !aircraft.totalSeats) return null;

    const parts = aircraft.seatLayout.split("-").map(Number);
    let left,
      middle = 0,
      right;
    if (parts.length === 2) [left, right] = parts;
    else if (parts.length === 3) [left, middle, right] = parts;
    else return null;

    const aisles = middle > 0 ? 2 : 1;
    const seatsPerRow = left + middle + right;
    const rows = Math.ceil(aircraft.totalSeats / seatsPerRow);

    const seats = [];
    let seatNum = 1;

    for (let r = 1; r <= rows; r++) {
      const rowSeats = [];
      for (let s = 1; s <= left; s++) {
        const id = `${r}${String.fromCharCode(64 + s)}`;
        rowSeats.push({
          id,
          type: "seat",
          booked: bookedSeats.includes(id),
          seatNum: seatNum++,
        });
      }
      rowSeats.push({ id: "", type: "aisle" });
      if (middle > 0) {
        for (let s = 1; s <= middle; s++) {
          const id = `${r}${String.fromCharCode(64 + left + s)}`;
          rowSeats.push({
            id,
            type: "seat",
            booked: bookedSeats.includes(id),
            seatNum: seatNum++,
          });
        }
        rowSeats.push({ id: "", type: "aisle" });
      }
      for (let s = 1; s <= right; s++) {
        const id = `${r}${String.fromCharCode(64 + left + middle + s)}`;
        rowSeats.push({
          id,
          type: "seat",
          booked: bookedSeats.includes(id),
          seatNum: seatNum++,
        });
      }
      seats.push(rowSeats);
    }
    return seats;
  };

  const selectedAircraft = aircrafts.find(
    (a) => String(a.aircraftId) === formData.aircraftId
  );
  const seatLayout = generateSeatLayout(
    selectedAircraft,
    flight?.bookedSeats || []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border appraisal-b">
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <Edit className="h-5 w-5 text-blue-600" />
            ) : (
              <Plane className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                {isEditMode ? TEXT.editFlight : TEXT.addFlight}
              </h2>
              <p className="text-xs text-gray-500">
                {isEditMode ? TEXT.updateFlightInfo : TEXT.enterFlightDetails}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Hidden input for tripType - always ONE_WAY */}
          <input type="hidden" name="tripType" value="ONE_WAY" />
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Plane className="h-4 w-4 mr-2" />
                {TEXT.basicFlightInfo}
              </CardTitle>
              <CardDescription className="text-xs">
                {TEXT.essentialFlightDetails}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{TEXT.selectAirline} *</Label>
                <Select
                  value={formData.airlineId}
                  onValueChange={(v) => handleInputChange("airlineId", v)}
                  disabled={isEditMode}
                >
                  <SelectTrigger
                    className={errors.airlineId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectAirline} />
                  </SelectTrigger>
                  <SelectContent>
                    {airlines.map((a) => (
                      <SelectItem key={a.airlineId} value={String(a.airlineId)}>
                        {a.airlineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mặc định là Vietnam Airlines.
                  </p>
                )}
                {errors.airlineId && (
                  <p className="text-red-500 text-xs">{errors.airlineId}</p>
                )}
              </div>
              <div>
                <Label>{TEXT.selectAircraft} *</Label>
                <Select
                  value={formData.aircraftId}
                  onValueChange={(v) => handleInputChange("aircraftId", v)}
                >
                  <SelectTrigger
                    className={errors.aircraftId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectAircraft} />
                  </SelectTrigger>
                  <SelectContent>
                    {aircrafts.map((a) => (
                      <SelectItem
                        key={a.aircraftId}
                        value={String(a.aircraftId)}
                      >
                        {a.aircraftName} ({a.totalSeats} ghế)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.aircraftId && (
                  <p className="text-red-500 text-xs">{errors.aircraftId}</p>
                )}
              </div>
              <div>
                <Label>{TEXT.flightType} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => handleInputChange("type", v)}
                >
                  <SelectTrigger
                    className={errors.type ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectFlightType} />
                  </SelectTrigger>
                  <SelectContent>
                    {flightTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-red-500 text-xs">{errors.type}</p>
                )}
              </div>
              <div>
                <Label>{TEXT.businessName}</Label>
                <Input
                  type="number"
                  value={formData.businessId}
                  onChange={(e) =>
                    handleInputChange("businessId", e.target.value)
                  }
                  className={errors.businessId ? "border-red-500" : ""}
                />
                {errors.businessId && (
                  <p className="text-red-500 text-xs">{errors.businessId}</p>
                )}
              </div>
              {isEditMode && (
                <div>
                  <Label>{TEXT.flightStatus}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => handleInputChange("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {TEXT.routeInfo}
              </CardTitle>
              <CardDescription className="text-xs">
                {TEXT.departureArrivalDetails}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{TEXT.selectDepartureAirport} *</Label>
                <Select
                  value={formData.departureAirportId}
                  onValueChange={(v) =>
                    handleInputChange("departureAirportId", v)
                  }
                >
                  <SelectTrigger
                    className={
                      errors.departureAirportId ? "border-red-500" : ""
                    }
                  >
                    <SelectValue placeholder={TEXT.selectDepartureAirport} />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((a) => (
                      <SelectItem key={a.airportId} value={String(a.airportId)}>
                        {a.airportCode} - {a.airportName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departureAirportId && (
                  <p className="text-red-500 text-xs">
                    {errors.departureAirportId}
                  </p>
                )}
              </div>
              <div>
                <Label>{TEXT.selectArrivalAirport} *</Label>
                <Select
                  value={formData.arrivalAirportId}
                  onValueChange={(v) =>
                    handleInputChange("arrivalAirportId", v)
                  }
                >
                  <SelectTrigger
                    className={errors.arrivalAirportId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectArrivalAirport} />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((a) => (
                      <SelectItem key={a.airportId} value={String(a.airportId)}>
                        {a.airportCode} - {a.airportName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.arrivalAirportId && (
                  <p className="text-red-500 text-xs">
                    {errors.arrivalAirportId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {TEXT.scheduleInfo}
              </CardTitle>
              <CardDescription className="text-xs">
                {TEXT.flightTiming}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>{TEXT.departureDate} *</Label>
                <DateTimePicker
                  date={
                    formData.departureDate
                      ? new Date(formData.departureDate)
                      : undefined
                  }
                  onDateChange={(date) =>
                    handleInputChange(
                      "departureDate",
                      date ? format(date, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder="Chọn ngày khởi hành"
                  className={errors.departureDate ? "border-red-500" : ""}
                  minDate={today}
                />
                {errors.departureDate && (
                  <p className="text-red-500 text-xs">{errors.departureDate}</p>
                )}
              </div>
              <div>
                <Label>{TEXT.departureTime} *</Label>
                <TimePicker
                  value={formData.departureTime}
                  onChange={(value) =>
                    handleInputChange("departureTime", value)
                  }
                  placeholder="Chọn giờ khởi hành"
                  className={errors.departureTime ? "border-red-500" : ""}
                />
                {errors.departureTime && (
                  <p className="text-red-500 text-xs">{errors.departureTime}</p>
                )}
              </div>
              <div>
                <Label>{TEXT.arrivalDate} *</Label>
                <DateTimePicker
                  date={
                    formData.arrivalDate
                      ? new Date(formData.arrivalDate)
                      : undefined
                  }
                  onDateChange={(date) =>
                    handleInputChange(
                      "arrivalDate",
                      date ? format(date, "yyyy-MM-dd") : ""
                    )
                  }
                  placeholder="Chọn ngày đến"
                  className={errors.arrivalDate ? "border-red-500" : ""}
                  minDate={
                    formData.departureDate
                      ? new Date(formData.departureDate)
                      : today
                  }
                />
                {errors.arrivalDate && (
                  <p className="text-red-500 text-xs">{errors.arrivalDate}</p>
                )}
              </div>
              <div>
                <Label>{TEXT.arrivalTime} *</Label>
                <TimePicker
                  value={formData.arrivalTime}
                  onChange={(value) => handleInputChange("arrivalTime", value)}
                  placeholder="Chọn giờ đến"
                  className={errors.arrivalTime ? "border-red-500" : ""}
                />
                {errors.arrivalTime && (
                  <p className="text-red-500 text-xs">{errors.arrivalTime}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConflictModal(true)}
              disabled={
                !formData.departureDate ||
                !formData.departureTime ||
                !formData.arrivalDate ||
                !formData.arrivalTime
              }
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Kiểm tra xung đột lịch trình
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {TEXT.operationalInfo}
              </CardTitle>
              <CardDescription className="text-xs">
                {TEXT.gateTerminalCrew}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>
                  {TEXT.gateId} {!isEditMode && "*"}
                </Label>
                <Select
                  value={formData.gateId}
                  onValueChange={(v) => handleInputChange("gateId", v)}
                  disabled={!formData.departureAirportId}
                >
                  <SelectTrigger
                    className={errors.gateId ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={
                        formData.departureAirportId
                          ? TEXT.selectGate
                          : TEXT.selectDepartureAirportFirst
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {gates.map((g) => (
                      <SelectItem key={g.gateId} value={String(g.gateId)}>
                        {g.gateName} ({g.terminal})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gateId && (
                  <p className="text-red-500 text-xs">{errors.gateId}</p>
                )}
              </div>
              {isEditMode && (
                <>
                  <div>
                    <Label>{TEXT.terminal}</Label>
                    <Input
                      value={formData.terminal}
                      onChange={(e) =>
                        handleInputChange("terminal", e.target.value)
                      }
                    />
                  </div>

                  {formData.status === "DELAYED" && (
                    <div className="col-span-3">
                      <Label>{TEXT.delayReason}</Label>
                      <Input
                        value={formData.delayReason}
                        onChange={(e) =>
                          handleInputChange("delayReason", e.target.value)
                        }
                      />
                    </div>
                  )}
                  <div className="col-span-3">
                    <Label>{TEXT.remarks}</Label>
                    <Input
                      value={formData.remarks}
                      onChange={(e) =>
                        handleInputChange("remarks", e.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                {TEXT.pricingInfo}
              </CardTitle>
              <CardDescription className="text-xs">
                Giá cơ bản cho chuyến bay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Giá cơ bản (VNĐ) *</Label>
                <Input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    handleInputChange("basePrice", e.target.value)
                  }
                  placeholder="Nhập giá cơ bản"
                  className={errors.basePrice ? "border-red-500" : ""}
                  min="0"
                  step="1000"
                />
                {errors.basePrice && (
                  <p className="text-red-500 text-xs">{errors.basePrice}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Đây là giá cơ bản cho chuyến bay. Các hạng vé sẽ được tính
                  toán dựa trên giá này.
                </p>
              </div>
            </CardContent>
          </Card>

          {seatLayout && selectedAircraft && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Bố trí ghế - {selectedAircraft.aircraftName}
                </CardTitle>
                <CardDescription className="text-xs">
                  Tổng: {selectedAircraft.totalSeats} | Đã đặt:{" "}
                  {flight?.bookedSeats?.length || 0}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="min-w-max">
                  {seatLayout.map((row, rIdx) => (
                    <div key={rIdx} className="flex mb-1">
                      <span className="w-6 text-xs mr-2">{rIdx + 1}</span>
                      {row.map((seat, sIdx) => (
                        <div
                          key={sIdx}
                          className={`w-6 h-6 mx-1 text-[8px] flex items-center justify-center rounded border ${
                            seat.type === "aisle"
                              ? "bg-gray-200 border-gray-300"
                              : seat.booked
                              ? "bg-red-100 border-red-400"
                              : "bg-green-100 border-green-400"
                          }`}
                        >
                          {seat.id}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex space-x-4 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border border-green-400 mr-1"></div>
                    Còn trống
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border border-red-400 mr-1"></div>
                    Đã đặt
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-200 border border-gray-300 mr-1"></div>
                    Lối đi
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleReset}>
              {TEXT.reset}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {TEXT.cancel}
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" /> {TEXT.save}
            </Button>
          </div>
        </form>
      </div>

      <ConflictModal
        open={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        departureDate={formData.departureDate}
        departureTime={formData.departureTime}
        arrivalDate={formData.arrivalDate}
        arrivalTime={formData.arrivalTime}
        departureAirportId={formData.departureAirportId}
        arrivalAirportId={formData.arrivalAirportId}
        aircraftId={formData.aircraftId}
        gateId={formData.gateId}
        airports={airports}
        aircrafts={aircrafts}
      />
    </div>
  );
};

export default FlightFormModal;
