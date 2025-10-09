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
  Plus,
  Edit,
  Minus,
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { airportApi } from "@/apis/airport-api";
import { airlineApi } from "@/apis/airline-api";
import { aircraftApi } from "@/apis/aircraft-api";
import { classesApi } from "@/apis/classes-api";
import { flightApi } from "@/apis/flight-api";
import { toast } from "sonner";
import { format } from "date-fns";
import ConflictModal from "./conflict-modal";

const TEXT = {
  addFlight: "Thêm Chuyến Bay Mới",
  editFlight: "Sửa Chuyến Bay",
  updateFlightInfo: "Cập nhật thông tin chuyến bay",
  enterFlightDetails: "Nhập chi tiết chuyến bay để tạo chuyến bay mới",
  basicFlightInfo: "Thông Tin Cơ Bản Chuyến Bay",
  essentialFlightDetails:
    "Chi tiết chuyến bay và thông tin nhận dạng cần thiết",
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
  selectGate: "Chọn cổng",
  selectDepartureAirportFirst: "Chọn sân bay khởi hành trước",
  save: "Lưu",
  reset: "Đặt Lại",
  cancel: "Hủy",
  scheduled: "Đã Lên Lịch",
  boarding: "Đang Lên Máy Bay",
  departed: "Đã Khởi Hành",
  delayed: "Hoãn",
  cancelled: "Đã Hủy",
  completed: "Hoàn Thành",
  stops: "Điểm Dừng",
  addStop: "Thêm Điểm Dừng",
  removeStop: "Xóa",
  stopAirport: "Sân Bay Dừng",
  stopDuration: "Thời Gian Dừng (phút)",
  onTime: "Đúng Giờ",

  businessId: "ID Doanh Nghiệp",
  tripType: "Loại Chuyến",
  gateId: "ID Cổng",
  airlineId: "ID Hãng Hàng Không",
  departureAirportId: "ID Sân Bay Đi",
  arrivalAirportId: "ID Sân Bay Đến",
  aircraftId: "ID Máy Bay",
  selectAirline: "Chọn Hãng Hàng Không",
  selectAircraft: "Chọn Máy Bay",
  selectFlightType: "Chọn Loại Chuyến Bay",
  selectDepartureAirport: "Chọn Sân Bay Đi",
  selectArrivalAirport: "Chọn Sân Bay Đến",
  roundTripFlight: "Chuyến Bay Khứ Hồi",
  roundTripGroupId: "Mã Nhóm Khứ Hồi",
  selectOutboundFlight: "Chọn Chuyến Bay Đi (Khứ Hồi)",
  outboundFlightInfo: "Thông Tin Chuyến Bay Đi",
  createReturnFlight: "Tạo Chuyến Bay Về",
  outboundFlight: "Chuyến Bay Đi",
  returnFlight: "Chuyến Bay Về",
  flightDirection: "Hướng Chuyến Bay",
};

const flightTypes = ["DOMESTIC", "INTERNATIONAL"];
const tripTypes = ["ONE_WAY", "ROUND_TRIP"];
const statusOptions = [
  { value: "ON_TIME", label: TEXT.onTime },
  { value: "DEPARTED", label: TEXT.departed },
  { value: "DELAYED", label: TEXT.delayed },
  { value: "CANCELLED", label: TEXT.cancelled },
];

const FlightFormModal = ({
  open,
  onClose,
  onSave,
  flight = null,
  mode = "add",
}) => {
  const isEditMode = mode === "edit" && flight;
  const initialFormData = {
    airlineId: "",
    aircraftId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    gateId: "",
    basePrice: "",
    type: "",
    status: "ON_TIME",
    businessId: "",
    tripType: "ONE_WAY",
    roundTripGroupId: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [gates, setGates] = useState([]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isReturnFlight, setIsReturnFlight] = useState(false);
  const [outboundFlight, setOutboundFlight] = useState(null);
  const [existingFlights, setExistingFlights] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const generateRoundTripGroupId = () => {
    const now = new Date();
    const timestamp = now.getTime(); // milliseconds since epoch
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const shortTimestamp = timestamp.toString().slice(-6); // last 6 digits
    return `RT${dateStr}${shortTimestamp}-${randomNum}`;
  };

  const checkGroupIdExists = async (groupId) => {
    try {
      const response = await flightApi.getAllFlights({ size: 1000 });
      const flights = response?.data?.content || [];
      return flights.some((flight) => flight.roundTripGroupId === groupId);
    } catch (error) {
      return false; // Nếu có lỗi, giả định không tồn tại để tránh block
    }
  };

  const generateUniqueRoundTripGroupId = async () => {
    let attempts = 0;
    const maxAttempts = 10; // Tránh infinite loop

    while (attempts < maxAttempts) {
      const groupId = generateRoundTripGroupId();
      const exists = await checkGroupIdExists(groupId);

      if (!exists) {
        return groupId;
      }

      attempts++;
      // Đợi một chút trước khi thử lại
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Nếu không thể tạo mã duy nhất sau maxAttempts lần thử
    // Sử dụng timestamp đầy đủ làm fallback
    const now = new Date();
    const fullTimestamp = now.getTime();
    return `RT${fullTimestamp}`;
  };

  const loadExistingFlights = async () => {
    try {
      const response = await flightApi.getAllFlights({ size: 100 });
      const flights = response?.data?.content || [];
      // Chỉ lọc các chuyến có roundTripGroupId và tripType là ROUND_TRIP
      const roundTripEligible = flights.filter(
        (f) => f.roundTripGroupId && f.tripType === "ROUND_TRIP"
      );

      // Nhóm các chuyến bay theo roundTripGroupId
      const groupMap = {};
      roundTripEligible.forEach((flight) => {
        if (!groupMap[flight.roundTripGroupId]) {
          groupMap[flight.roundTripGroupId] = [];
        }
        groupMap[flight.roundTripGroupId].push(flight);
      });

      // Chỉ lấy những nhóm có đúng 2 chuyến bay (khứ hồi)
      const validRoundTrips = [];
      Object.values(groupMap).forEach((group) => {
        if (group.length === 1) {
          validRoundTrips.push(...group);
        }
      });

      setExistingFlights(validRoundTrips);
    } catch (error) {
      setExistingFlights([]);
    }
  };

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
            // filter active airline
            ensureArray(airlinesRes?.data?.content || airlinesRes?.data).filter(
              (a) => a.active === true
            )
          );
          setAircrafts(
            ensureArray(aircraftsRes?.data?.content || aircraftsRes?.data)
          );
        } catch (error) {
          // Handle error silently
        }
      };
      loadData();
      if (!isEditMode) loadExistingFlights();
    } else {
      setFormData(initialFormData);
      setErrors({});
      setIsRoundTrip(false);
      setIsReturnFlight(false);
      setOutboundFlight(null);
    }
  }, [open, isEditMode]);

  useEffect(() => {
    if (formData.departureAirportId && open) {
      const loadGates = async () => {
        try {
          const airportRes = await airportApi.getAirportById(
            formData.departureAirportId
          );
          const gatesData = Array.isArray(airportRes?.data?.gates)
            ? airportRes?.data?.gates
            : [];

          setGates(gatesData);
        } catch (error) {
          setGates([]);
        }
      };
      loadGates();
    } else {
      setGates([]);
    }
  }, [formData.departureAirportId, open]);

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
        aircraftId: String(flight.aircraftId || ""),
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
        businessId: String(flight.businessId || ""),
        tripType: flight.tripType || "ONE_WAY",
        roundTripGroupId: flight.roundTripGroupId || "",
      });

      setIsRoundTrip(!!flight.roundTripGroupId);
    } else {
      setFormData(initialFormData);
      setIsRoundTrip(false);
      setIsReturnFlight(false);
      setOutboundFlight(null);
    }
  }, [isEditMode, flight, open]);

  useEffect(() => {
    if (!isEditMode) {
      if (isRoundTrip) {
        setIsReturnFlight(false);
        // Tạo mã khứ hồi duy nhất
        const createGroupId = async () => {
          const groupId =
            formData.roundTripGroupId ||
            (await generateUniqueRoundTripGroupId());
          setFormData((prev) => ({
            ...prev,
            tripType: "ROUND_TRIP",
            roundTripGroupId: groupId,
          }));
        };
        createGroupId();
      } else if (isReturnFlight) {
        setIsRoundTrip(false);
        setFormData((prev) => ({
          ...prev,
          tripType: "ROUND_TRIP",
          // roundTripGroupId sẽ được set khi chọn outboundFlight
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          tripType: "ONE_WAY",
          roundTripGroupId: "",
        }));
      }
    }
  }, [isRoundTrip, isReturnFlight, isEditMode]);

  const validateField = (field, value, currentFormData = formData) => {
    // Skip validation if field is empty (except for required fields)
    if (
      !value &&
      ![
        "airlineId",
        "aircraftId",
        "departureAirportId",
        "arrivalAirportId",
        "businessId",
      ].includes(field)
    ) {
      return "";
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
        // Use the current formData value for comparison
        const currentDepartureId = currentFormData.departureAirportId;
        if (value === currentDepartureId) return "Phải khác sân bay khởi hành";
        return "";

      case "businessId":
        if (!value) return TEXT.requiredField;
        return "";

      case "gateId":
        if (!isEditMode && !value) return TEXT.requiredField;
        if (!isEditMode && !gates.find((g) => String(g.gateId) === value)) {
          return "Cổng không tồn tại";
        }
        const selectedGate = gates.find((g) => String(g.gateId) === value);
        if (value && currentFormData.departureAirportId && !isEditMode) {
          // Only validate gate-airport relationship if gates are loaded
          if (gates.length > 0) {
            if (
              selectedGate &&
              String(selectedGate.airportId) !==
                String(currentFormData.departureAirportId)
            ) {
              return "Cổng phải thuộc về sân bay khởi hành";
            }
          }
        }
        return "";

      case "departureDate":
      case "departureTime":
      case "arrivalDate":
      case "arrivalTime":
        // Validate time logic when all time fields are filled
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

      case "totalSeats":
        if (value && value <= 0) return TEXT.capacityGreaterZero;
        return "";

      default:
        return "";
    }
  };

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Clear previous error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // Perform real-time validation for specific fields
    const fieldError = validateField(field, value, newFormData);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }

    // If changing departure airport, also validate arrival airport
    if (field === "departureAirportId" && newFormData.arrivalAirportId) {
      const arrivalError = validateField(
        "arrivalAirportId",
        newFormData.arrivalAirportId,
        newFormData
      );
      setErrors((prev) => ({ ...prev, arrivalAirportId: arrivalError }));
    }

    // If changing departure airport, clear gate selection and reload gates
    if (field === "departureAirportId") {
      setFormData((prev) => ({ ...prev, gateId: "" }));
      setErrors((prev) => ({ ...prev, gateId: "" }));
    }
  };

  const handleOutboundSelect = async (value) => {
    const selected = existingFlights.find((f) => String(f.flightId) === value);
    if (selected) {
      setOutboundFlight(selected);

      // Xử lý roundTripGroupId cho chuyến bay về
      let roundTripGroupId = selected.roundTripGroupId;

      // Nếu chuyến bay đi chưa có roundTripGroupId, tạo mới
      if (!roundTripGroupId) {
        roundTripGroupId = await generateUniqueRoundTripGroupId();
      }

      setFormData((prev) => ({
        ...prev,
        airlineId: String(selected.airline?.airlineId || selected.airlineId),
        aircraftId: String(selected.aircraftId),
        departureAirportId: String(
          selected.arrivalAirport?.airportId || selected.arrivalAirportId
        ),
        arrivalAirportId: String(
          selected.departureAirport?.airportId || selected.departureAirportId
        ),
        type: selected.type,
        businessId: String(selected.businessId),
        roundTripGroupId: roundTripGroupId,
      }));
    }
  };

  const handleRoundTripToggle = (checked) => {
    setIsRoundTrip(checked);
    if (checked) {
      setIsReturnFlight(false);
    }
  };

  const handleReturnFlightToggle = (checked) => {
    setIsReturnFlight(checked);
    if (checked) {
      setIsRoundTrip(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isReturnFlight && !isEditMode && !outboundFlight) {
      newErrors.outboundFlight = "Vui lòng chọn chuyến bay đi để tạo chuyến về";
    }

    // Validate round-trip flights
    if ((isRoundTrip || isReturnFlight) && !formData.roundTripGroupId) {
      newErrors.roundTripGroupId = "Chuyến bay khứ hồi phải có mã nhóm khứ hồi";
    }

    const requiredFields = [
      "airlineId",
      "aircraftId",
      "departureAirportId",
      "arrivalAirportId",
      "departureDate",
      "departureTime",
      "arrivalDate",
      "arrivalTime",
      "businessId",
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

    // Validate airline is active
    const selectedAirline = airlines.find(
      (a) => String(a.airlineId) === formData.airlineId
    );
    if (selectedAirline && !selectedAirline.active) {
      newErrors.airlineId = "Hãng hàng không không hoạt động";
    }

    if (
      !airports.find((a) => String(a.airportId) === formData.departureAirportId)
    )
      newErrors.departureAirportId = "Sân bay khởi hành không tồn tại";
    if (
      !airports.find((a) => String(a.airportId) === formData.arrivalAirportId)
    )
      newErrors.arrivalAirportId = "Sân bay đến không tồn tại";

    // Validate airports are active
    const selectedDepartureAirport = airports.find(
      (a) => String(a.airportId) === formData.departureAirportId
    );
    const selectedArrivalAirport = airports.find(
      (a) => String(a.airportId) === formData.arrivalAirportId
    );
    if (selectedDepartureAirport && !selectedDepartureAirport.active) {
      newErrors.departureAirportId = "Sân bay khởi hành không hoạt động";
    }
    if (selectedArrivalAirport && !selectedArrivalAirport.active) {
      newErrors.arrivalAirportId = "Sân bay đến không hoạt động";
    }

    if (formData.departureAirportId === formData.arrivalAirportId)
      newErrors.arrivalAirportId = "Phải khác sân bay khởi hành";

    if (!isEditMode && !gates.find((g) => String(g.gateId) === formData.gateId))
      newErrors.gateId = "Cổng không tồn tại";

    delete newErrors.totalSeats;

    // Filter out empty string errors
    const filteredErrors = {};
    Object.entries(newErrors).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        filteredErrors[key] = value;
      }
    });

    setErrors(filteredErrors);

    const isValid = Object.keys(filteredErrors).length === 0;

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const isValid = validateForm();
    if (!isValid) {
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
        gateId: parseInt(formData.gateId),
        type: formData.type,
        status: formData.status,
        businessId:
          parseInt(formData.businessId) > 0 ? parseInt(formData.businessId) : 1,
        tripType: formData.tripType,
        basePrice: parseFloat(formData.basePrice) || 0,
        // Only include roundTripGroupId if it's not empty
        ...(formData.roundTripGroupId &&
          formData.roundTripGroupId.trim() !== "" && {
            roundTripGroupId: formData.roundTripGroupId,
          }),
        // Only include flightId for edit mode
        ...(isEditMode && { flightId: flight.flightId }),
      };

      const result = await onSave(processedData, isEditMode);

      // Trả về result để parent component xử lý
      if (result && result.success === true) {
        toast.dismiss(loadingToast);
        onClose();
        return result;
      } else {
        toast.dismiss(loadingToast);
        return result;
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      // Handle field-level validation errors from backend
      if (error.response?.errors) {
        // Backend returns field-specific errors
        const fieldErrors = {};
        Object.entries(error.response.errors).forEach(([field, message]) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
        toast.error("Vui lòng kiểm tra và sửa các lỗi trong form");
      } else {
        // Re-throw error để parent component xử lý
        throw error;
      }

      // Form stays open for user to fix the error
      // Don't close the form on API errors
    }
  };

  const handleReset = () => {
    setFormData(
      isEditMode ? { ...flight, ...initialFormData } : initialFormData
    );
    setErrors({});
    setIsRoundTrip(false);
    setIsReturnFlight(false);
    setOutboundFlight(null);
  };

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
    const totalPerRow = seatsPerRow + aisles;
    const rows = Math.ceil(aircraft.totalSeats / seatsPerRow);

    const seats = [];
    let seatNum = 1;

    for (let r = 1; r <= rows; r++) {
      const rowSeats = [];
      // Left
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
      // Middle
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
      // Right
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
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <Edit className="h-5 w-5 text-blue-600" />
            ) : (
              <Plus className="h-5 w-5 text-blue-600" />
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
          {!isEditMode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Loại Chuyến Bay</CardTitle>
                <CardDescription className="text-xs">
                  Chọn loại chuyến bay phù hợp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle tạo chuyến bay khứ hồi */}
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="font-medium">
                      Tạo chuyến bay khứ hồi
                    </Label>
                    <p className="text-xs text-gray-500">
                      Tạo chuyến đi với mã nhóm khứ hồi
                    </p>
                  </div>
                  <Switch
                    checked={isRoundTrip}
                    onCheckedChange={handleRoundTripToggle}
                  />
                </div>
                {/* Checkbox đã có chuyến bay đi */}
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="font-medium">Đã có chuyến bay đi</Label>
                    <p className="text-xs text-gray-500">
                      Tạo chuyến về cho chuyến bay khứ hồi có sẵn
                    </p>
                  </div>
                  <Switch
                    checked={isReturnFlight}
                    onCheckedChange={handleReturnFlightToggle}
                  />
                </div>

                {/* Thông báo trạng thái */}
                {isRoundTrip && formData.roundTripGroupId && (
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      <strong>Chế độ tạo chuyến đi được bật</strong>
                      <br />
                      Mã nhóm:{" "}
                      <Badge variant="secondary">
                        {formData.roundTripGroupId}
                      </Badge>
                    </div>
                  </div>
                )}

                {isReturnFlight && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <div className="text-sm text-green-800">
                      <strong>Chế độ tạo chuyến về được bật</strong>
                      <br />
                      Chọn chuyến bay đi từ danh sách bên dưới
                    </div>
                  </div>
                )}

                {/* Select chuyến bay khứ hồi có sẵn - chỉ hiện khi tạo chuyến về */}
                {isReturnFlight && !isRoundTrip && (
                  <div className="space-y-2">
                    <Label>Chọn chuyến bay đi (khứ hồi)</Label>
                    <Select onValueChange={handleOutboundSelect}>
                      <SelectTrigger
                        className={
                          errors.outboundFlight ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Chọn chuyến bay đi để tạo chuyến về" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingFlights.map((f) => (
                          <SelectItem
                            key={f.flightId}
                            value={String(f.flightId)}
                          >
                            {f.flightNumber} - {f.departureAirport?.airportCode}{" "}
                            → {f.arrivalAirport?.airportCode} (
                            {f.roundTripGroupId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.outboundFlight && (
                      <p className="text-red-500 text-xs">
                        {errors.outboundFlight}
                      </p>
                    )}

                    {/* Hiển thị thông tin chuyến bay đã chọn */}
                    {outboundFlight && (
                      <Card className="mt-3">
                        <CardContent className="pt-4 text-xs">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Thông tin chuyến bay đi:
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <strong>Hãng:</strong>{" "}
                              {outboundFlight.airline?.airlineName}
                            </div>
                            <div>
                              <strong>Máy bay:</strong>{" "}
                              {outboundFlight.aircraft?.aircraftName}
                            </div>
                            <div>
                              <strong>Tuyến:</strong>{" "}
                              {outboundFlight.departureAirport?.airportCode} →{" "}
                              {outboundFlight.arrivalAirport?.airportCode}
                            </div>
                            <div>
                              <strong>Thời gian:</strong>{" "}
                              {new Date(
                                outboundFlight.departureTime
                              ).toLocaleString()}
                            </div>
                            <div className="col-span-2">
                              <strong>Mã nhóm:</strong>{" "}
                              <Badge variant="outline">
                                {outboundFlight.roundTripGroupId}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="route">Tuyến bay</TabsTrigger>
              <TabsTrigger value="stops">Điểm dừng</TabsTrigger>
              <TabsTrigger value="classes">Giá vé</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
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
                    >
                      <SelectTrigger
                        className={errors.airlineId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder={TEXT.selectAirline} />
                      </SelectTrigger>
                      <SelectContent>
                        {airlines.map((a) => (
                          <SelectItem
                            key={a.airlineId}
                            value={String(a.airlineId)}
                          >
                            {a.airlineName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <p className="text-red-500 text-xs">
                        {errors.aircraftId}
                      </p>
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
                    <Label>{TEXT.tripType}</Label>
                    <Select
                      value={formData.tripType}
                      onValueChange={(v) => handleInputChange("tripType", v)}
                      disabled={isEditMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tripTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{TEXT.businessId} *</Label>
                    <Input
                      type="number"
                      value={formData.businessId}
                      onChange={(e) =>
                        handleInputChange("businessId", e.target.value)
                      }
                      className={errors.businessId ? "border-red-500" : ""}
                    />
                    {errors.businessId && (
                      <p className="text-red-500 text-xs">
                        {errors.businessId}
                      </p>
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
            </TabsContent>

            <TabsContent value="route">
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
                        <SelectValue
                          placeholder={TEXT.selectDepartureAirport}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {airports.map((a) => (
                          <SelectItem
                            key={a.airportId}
                            value={String(a.airportId)}
                          >
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
                        className={
                          errors.arrivalAirportId ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder={TEXT.selectArrivalAirport} />
                      </SelectTrigger>
                      <SelectContent>
                        {airports.map((a) => (
                          <SelectItem
                            key={a.airportId}
                            value={String(a.airportId)}
                          >
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

              <Card className="mt-4">
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
                    />
                    {errors.departureDate && (
                      <p className="text-red-500 text-xs">
                        {errors.departureDate}
                      </p>
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
                      <p className="text-red-500 text-xs">
                        {errors.departureTime}
                      </p>
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
                    />
                    {errors.arrivalDate && (
                      <p className="text-red-500 text-xs">
                        {errors.arrivalDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>{TEXT.arrivalTime} *</Label>
                    <TimePicker
                      value={formData.arrivalTime}
                      onChange={(value) =>
                        handleInputChange("arrivalTime", value)
                      }
                      placeholder="Chọn giờ đến"
                      className={errors.arrivalTime ? "border-red-500" : ""}
                    />
                    {errors.arrivalTime && (
                      <p className="text-red-500 text-xs">
                        {errors.arrivalTime}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Button kiểm tra conflict */}
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

              <Card className="mt-4">
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
                      <div>
                        <Label>{TEXT.checkInCounter}</Label>
                        <Input
                          value={formData.checkInCounter}
                          onChange={(e) =>
                            handleInputChange("checkInCounter", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>{TEXT.baggage}</Label>
                        <Input
                          value={formData.baggage}
                          onChange={(e) =>
                            handleInputChange("baggage", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>{TEXT.mealService}</Label>
                        <Select
                          value={formData.mealService}
                          onValueChange={(v) =>
                            handleInputChange("mealService", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không</SelectItem>
                            <SelectItem value="snack">Đồ nhẹ</SelectItem>
                            <SelectItem value="meal">Đầy đủ</SelectItem>
                            <SelectItem value="premium">Cao cấp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{TEXT.entertainment}</Label>
                        <Select
                          value={formData.entertainment}
                          onValueChange={(v) =>
                            handleInputChange("entertainment", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không</SelectItem>
                            <SelectItem value="basic">Cơ bản</SelectItem>
                            <SelectItem value="premium">Cao cấp</SelectItem>
                            <SelectItem value="live_tv">
                              TV trực tiếp
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="wifi"
                          checked={formData.wifiAvailable}
                          onCheckedChange={(v) =>
                            handleInputChange("wifiAvailable", v)
                          }
                        />
                        <Label htmlFor="wifi">{TEXT.wifiAvailable}</Label>
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
            </TabsContent>

            <TabsContent value="stops">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Điểm dừng
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Hiện tại chỉ hỗ trợ chuyến bay thẳng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-md text-center">
                    <p className="text-sm text-gray-600">
                      Chức năng điểm dừng đang được phát triển
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classes">
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Giá chuyến bay
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
            </TabsContent>
          </Tabs>

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
                    <div className="w-3 h-3 bg-green-100 border border-green-400 mr-1"></div>{" "}
                    Còn trống
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-100 border border-red-400 mr-1"></div>{" "}
                    Đã đặt
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-200 border border-gray-300 mr-1"></div>{" "}
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

      {/* Conflict Modal */}
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
