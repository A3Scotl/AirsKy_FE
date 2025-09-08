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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { airportApi } from "@/apis/airport-api";
import { airlineApi } from "@/apis/airline-api";
import { aircraftApi } from "@/apis/aircraft-api";
import { classesApi } from "@/apis/classes-api";
import { toast } from "sonner";

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
  travelClasses: "Hạng vé",
  addClass: "Thêm hang vé",
  removeClass: "Xóa hạng vé",
  selectClass: "Chọn hạng vé",
  customPrice: "Giá Tùy Chỉnh",
  classAvailableSeats: "Ghế Còn Trống",
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
};

const flightTypes = ["DOMESTIC", "INTERNATIONAL"];
const tripTypes = ["ONE_WAY", "ROUND_TRIP"];
const statusOptions = [
  { value: "SCHEDULED", label: TEXT.scheduled },
  { value: "BOARDING", label: TEXT.boarding },
  { value: "DEPARTED", label: TEXT.departed },
  { value: "DELAYED", label: TEXT.delayed },
  { value: "CANCELLED", label: TEXT.cancelled },
  { value: "COMPLETED", label: TEXT.completed },
];

const FlightFormModal = ({
  open,
  onClose,
  onSave,
  aircraftTypes = [],
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
    totalSeats: "",
    gateId: "",
    basePrice: "",
    type: "",
    status: "ON_TIME",
    businessId: "",
    tripType: "ONE_WAY",
    stops: "NON_STOP",
    stopsList: [],
    flightTravelClasses: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [aircrafts, setAircrafts] = useState([]);
  const [travelClasses, setTravelClasses] = useState([]);
  const [gates, setGates] = useState([]);

  useEffect(() => {
    if (open) {
      // Load data from APIs
      const loadData = async () => {
        try {
          const [airportsRes, airlinesRes, aircraftsRes, classesRes] =
            await Promise.all([
              airportApi.getAllAirports(),
              airlineApi.getAllAirlines(),
              aircraftApi.getAllAircrafts(),
              classesApi.getAllClasses(),
            ]);

          // Helper function to ensure array
          const ensureArray = (data) => {
            if (Array.isArray(data)) return data;
            if (data && typeof data === "object") return [data];
            return [];
          };

          setAirports(
            ensureArray(
              airportsRes?.data?.content || airportsRes?.data || airportsRes
            )
          );
          setAirlines(
            ensureArray(
              airlinesRes?.data?.content || airlinesRes?.data || airlinesRes
            )
          );
          setAircrafts(
            ensureArray(
              aircraftsRes?.data?.content || aircraftsRes?.data || aircraftsRes
            )
          );
          setTravelClasses(
            ensureArray(
              classesRes?.data?.content || classesRes?.data || classesRes
            )
          );
        } catch (error) {
          console.error("Failed to load data:", error);
        }
      };
      loadData();
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
          const airportData = airportRes?.data;

          if (airportData && airportData.gates) {
            setGates(Array.isArray(airportData.gates) ? airportData.gates : []);
          } else {
            setGates([]);
          }
        } catch (error) {
          console.error("Failed to load gates:", error);
          setGates([]);
        }
      };
      loadGates();
    } else {
      setGates([]);
    }
  }, [formData.departureAirportId, open]);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        airlineId: flight.airline?.airlineId || flight.airlineId || "",
        aircraftId: flight.aircraftId || "",
        departureAirportId:
          flight.departureAirport?.airportId || flight.departureAirportId || "",
        arrivalAirportId:
          flight.arrivalAirport?.airportId || flight.arrivalAirportId || "",
        departureDate: flight.departureTime
          ? new Date(flight.departureTime).toISOString().split("T")[0]
          : "",
        departureTime: flight.departureTime
          ? new Date(flight.departureTime).toISOString().slice(11, 16)
          : "",
        arrivalDate: flight.arrivalTime
          ? new Date(flight.arrivalTime).toISOString().split("T")[0]
          : "",
        arrivalTime: flight.arrivalTime
          ? new Date(flight.arrivalTime).toISOString().slice(11, 16)
          : "",
        totalSeats: flight.totalSeats || "",
        gateId: flight.gateId || "",
        basePrice: flight.basePrice || "",
        type: flight.type || "",
        status: flight.status || "ON_TIME",
        businessId: flight.businessId || "",
        tripType: flight.tripType || "ONE_WAY",
        stops: flight.stops || "NON_STOP",
        stopsList: flight.stopsList || [],
        flightTravelClasses: flight.flightTravelClasses || [],
      });

      // Load gates for the departure airport if available
      if (flight.departureAirport?.airportId || flight.departureAirportId) {
        const departureAirportId =
          flight.departureAirport?.airportId || flight.departureAirportId;
        const loadGatesForEdit = async () => {
          try {
            const airportRes = await airportApi.getAirportById(
              departureAirportId
            );
            const airportData = airportRes?.data;

            if (airportData && airportData.gates) {
              setGates(
                Array.isArray(airportData.gates) ? airportData.gates : []
              );
            }
          } catch (error) {
            console.error("Failed to load gates for edit:", error);
          }
        };
        loadGatesForEdit();
      }
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

  const handleAddStop = () => {
    setFormData((prev) => ({
      ...prev,
      stopsList: [...prev.stopsList, { airportId: "", duration: "" }],
    }));
  };

  const handleRemoveStop = (index) => {
    setFormData((prev) => ({
      ...prev,
      stopsList: prev.stopsList.filter((_, i) => i !== index),
    }));
  };

  const handleStopChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stopsList: prev.stopsList.map((stop, i) =>
        i === index ? { ...stop, [field]: value } : stop
      ),
    }));
  };

  const handleAddClass = () => {
    setFormData((prev) => ({
      ...prev,
      flightTravelClasses: [
        ...prev.flightTravelClasses,
        { classId: "", customPrice: "", availableSeats: "" },
      ],
    }));
  };

  const handleRemoveClass = (index) => {
    setFormData((prev) => ({
      ...prev,
      flightTravelClasses: prev.flightTravelClasses.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleClassChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      flightTravelClasses: prev.flightTravelClasses.map((cls, i) =>
        i === index ? { ...cls, [field]: value } : cls
      ),
    }));
  };

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
      // "totalSeats",
      "basePrice",
      "businessId",
    ];
    if (!isEditMode) requiredFields.push("gateId");

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = TEXT.requiredField;
    });

    // Validate departure time must be before arrival time
    if (
      formData.departureDate &&
      formData.arrivalDate &&
      formData.departureTime &&
      formData.arrivalTime
    ) {
      const depDateTime = new Date(
        `${formData.departureDate}T${formData.departureTime}`
      );
      const arrDateTime = new Date(
        `${formData.arrivalDate}T${formData.arrivalTime}`
      );

      // if (depDateTime >= arrDateTime) {
      //   newErrors.arrivalTime = "Thời gian khởi hành phải trước thời gian đến";
      // }
    }

    // Validate total seats
    // if (formData.totalSeats) {
    //   const seats = parseInt(formData.totalSeats);
    //   if (seats <= 0) {
    //     newErrors.totalSeats = TEXT.capacityGreaterZero;
    //   } else if (seats > 1000) {
    //     newErrors.totalSeats = "Sức chứa không được vượt quá 1000 ghế";
    //   }
    // }

    // Validate base price
    if (formData.basePrice) {
      const price = parseFloat(formData.basePrice);
      if (price <= 0) {
        newErrors.basePrice = TEXT.priceGreaterZero;
      } else if (price > 50000000) {
        newErrors.basePrice = "Giá vé không được vượt quá 50,000,000 VND";
      }
    }

    // Validate business ID format
    if (formData.businessId && !/^\d+$/.test(formData.businessId)) {
      newErrors.businessId = "ID doanh nghiệp phải là số dương";
    }

    // Validate stop duration (minimum 20 minutes, maximum 24 hours)
    if (formData.stopsList && formData.stopsList.length > 0) {
      formData.stopsList.forEach((stop, index) => {
        if (stop.duration) {
          const duration = parseInt(stop.duration);
          if (duration < 20) {
            newErrors[`stopDuration_${index}`] =
              "Thời gian dừng tối thiểu là 20 phút";
          } else if (duration > 1440) {
            newErrors[`stopDuration_${index}`] =
              "Thời gian dừng không được vượt quá 24 giờ";
          }
        }
        // Validate stop airport exists
        if (stop.airportId && airports.length > 0) {
          const stopAirport = airports.find(
            (airport) => String(airport.airportId) === stop.airportId
          );
          if (!stopAirport) {
            newErrors[`stopAirport_${index}`] = "Sân bay dừng không tồn tại";
          }
        }
      });
    }

    // Validate airline exists
    if (formData.airlineId && airlines.length > 0) {
      const selectedAirline = airlines.find(
        (airline) => String(airline.airlineId) === formData.airlineId
      );
      if (!selectedAirline) {
        newErrors.airlineId = "Hãng hàng không không tồn tại";
      }
    }

    // Validate aircraft exists
    if (formData.aircraftId && aircrafts.length > 0) {
      const selectedAircraft = aircrafts.find(
        (aircraft) => String(aircraft.aircraftId) === formData.aircraftId
      );
      if (!selectedAircraft) {
        newErrors.aircraftId = "Máy bay không tồn tại";
      }
    }

    // Validate departure airport exists
    if (formData.departureAirportId && airports.length > 0) {
      const selectedDepartureAirport = airports.find(
        (airport) => String(airport.airportId) === formData.departureAirportId
      );
      if (!selectedDepartureAirport) {
        newErrors.departureAirportId = "Sân bay khởi hành không tồn tại";
      }
    }

    // Validate arrival airport exists
    if (formData.arrivalAirportId && airports.length > 0) {
      const selectedArrivalAirport = airports.find(
        (airport) => String(airport.airportId) === formData.arrivalAirportId
      );
      if (!selectedArrivalAirport) {
        newErrors.arrivalAirportId = "Sân bay đến không tồn tại";
      }
    }

    // Validate gate exists (only for new flights)
    if (!isEditMode && formData.gateId && gates.length > 0) {
      const selectedGate = gates.find(
        (gate) => String(gate.gateId) === formData.gateId
      );
      if (!selectedGate) {
        newErrors.gateId = "Cổng không tồn tại";
      }
    }

    // Validate departure and arrival airports are different
    if (
      formData.departureAirportId &&
      formData.arrivalAirportId &&
      formData.departureAirportId === formData.arrivalAirportId
    ) {
      newErrors.arrivalAirportId = "Sân bay đến phải khác sân bay khởi hành";
    }

    // Validate flight travel classes
    if (
      formData.flightTravelClasses &&
      formData.flightTravelClasses.length > 0
    ) {
      formData.flightTravelClasses.forEach((travelClass, index) => {
        if (!travelClass.classId) {
          newErrors[`classId_${index}`] = "Vui lòng chọn hạng vé";
        }
        if (
          travelClass.customPrice &&
          parseFloat(travelClass.customPrice) <= 0
        ) {
          newErrors[`customPrice_${index}`] = "Giá tùy chỉnh phải lớn hơn 0";
        }
        if (
          travelClass.availableSeats &&
          parseInt(travelClass.availableSeats) < 0
        ) {
          newErrors[`availableSeats_${index}`] =
            "Số ghế còn trống không được âm";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(
      isEditMode ? "Đang cập nhật chuyến bay..." : "Đang tạo chuyến bay..."
    );

    try {
      // Validate and process flight travel classes
      const processedFlightClasses = formData.flightTravelClasses
        .filter((cls) => cls.classId && cls.classId.trim() !== "")
        .map((cls) => ({
          classId: parseInt(cls.classId),
          customPrice: cls.customPrice ? parseFloat(cls.customPrice) : 0,
          availableSeats: cls.availableSeats ? parseInt(cls.availableSeats) : 0,
        }));

      // Validate processed data
      if (processedFlightClasses.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("Vui lòng thêm ít nhất một hạng vé");
        return;
      }

      const processedData = {
        airlineId: parseInt(formData.airlineId),
        departureAirportId: parseInt(formData.departureAirportId),
        arrivalAirportId: parseInt(formData.arrivalAirportId),
        aircraftId: parseInt(formData.aircraftId),
        departureTime: new Date(
          `${formData.departureDate}T${formData.departureTime}:00Z`
        ).toISOString(),
        arrivalTime: new Date(
          `${formData.arrivalDate}T${formData.arrivalTime}:00Z`
        ).toISOString(),
        gateId: parseInt(formData.gateId),
        stops: formData.stops,
        basePrice: parseFloat(formData.basePrice),
        status: formData.status || "ON_TIME",
        type: formData.type || "DOMESTIC",
        businessId: parseInt(formData.businessId),
        tripType: formData.tripType || "ONE_WAY",
        flightTravelClasses: processedFlightClasses,
        // Thêm các trường mặc định nếu cần
        totalSeats:
          selectedAircraft?.totalSeats || parseInt(formData.totalSeats) || 0,
        ...(formData.stops !== "NON_STOP" && {
          stopsList: formData.stopsList.map((stop) => ({
            airportId: parseInt(stop.airportId),
            duration: parseInt(stop.duration),
          })),
        }),
        ...(isEditMode && { flightId: flight.flightId }),
      };

      // Additional validation for processed data
      if (isNaN(processedData.airlineId) || processedData.airlineId <= 0) {
        throw new Error("ID hãng hàng không không hợp lệ");
      }
      if (isNaN(processedData.aircraftId) || processedData.aircraftId <= 0) {
        throw new Error("ID máy bay không hợp lệ");
      }
      if (
        isNaN(processedData.departureAirportId) ||
        processedData.departureAirportId <= 0
      ) {
        throw new Error("ID sân bay khởi hành không hợp lệ");
      }
      if (
        isNaN(processedData.arrivalAirportId) ||
        processedData.arrivalAirportId <= 0
      ) {
        throw new Error("ID sân bay đến không hợp lệ");
      }
      if (
        !isEditMode &&
        (isNaN(processedData.gateId) || processedData.gateId <= 0)
      ) {
        throw new Error("ID cổng không hợp lệ");
      }
      if (isNaN(processedData.businessId) || processedData.businessId <= 0) {
        throw new Error("ID doanh nghiệp không hợp lệ");
      }

      console.log("=== FORM SUBMIT DEBUG ===");
      console.log("Raw formData:", JSON.stringify(formData, null, 2));
      console.log("Selected aircraft:", selectedAircraft);
      console.log("Processed flight classes:", processedFlightClasses);
      console.log(
        "Final processedData:",
        JSON.stringify(processedData, null, 2)
      );

      await onSave(processedData, isEditMode);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success(
        isEditMode
          ? "Cập nhật chuyến bay thành công!"
          : "Tạo chuyến bay thành công!"
      );

      onClose();
    } catch (error) {
      // Dismiss loading toast and show error
      toast.dismiss(loadingToast);

      if (error.response?.data?.message) {
        toast.error(`Lỗi: ${error.response.data.message}`);
      } else if (error.message) {
        toast.error(`Lỗi: ${error.message}`);
      } else {
        toast.error("Có lỗi xảy ra khi lưu chuyến bay");
      }

      console.error("Submit error:", error);
    }
  };

  const handleReset = () => {
    setFormData(
      isEditMode
        ? {
            airlineId: flight.airline?.airlineId || flight.airlineId || "",
            aircraftId: flight.aircraftId || "",
            departureAirportId:
              flight.departureAirport?.airportId ||
              flight.departureAirportId ||
              "",
            arrivalAirportId:
              flight.arrivalAirport?.airportId || flight.arrivalAirportId || "",
            departureDate: flight.departureTime
              ? new Date(flight.departureTime).toISOString().split("T")[0]
              : "",
            departureTime: flight.departureTime
              ? new Date(flight.departureTime).toISOString().slice(11, 16)
              : "",
            arrivalDate: flight.arrivalTime
              ? new Date(flight.arrivalTime).toISOString().split("T")[0]
              : "",
            arrivalTime: flight.arrivalTime
              ? new Date(flight.arrivalTime).toISOString().slice(11, 16)
              : "",
            totalSeats: flight.totalSeats || "",
            gateId: flight.gateId || "",
            basePrice: flight.basePrice || "",
            type: flight.type || "",
            status: flight.status || "ON_TIME",
            businessId: flight.businessId || "",
            tripType: flight.tripType || "ONE_WAY",
            stops: flight.stops || "NON_STOP",
            stopsList: flight.stopsList || [],
            flightTravelClasses: flight.flightTravelClasses || [],
          }
        : initialFormData
    );
    setErrors({});
  };

  // Generate seat layout preview with booking status
  const generateSeatLayout = (aircraft, bookedSeats = []) => {
    if (!aircraft || !aircraft.seatLayout || !aircraft.totalSeats) return null;

    const layout = aircraft.seatLayout; // e.g., "3-3", "3-4-3", "2-3-2"
    const layoutParts = layout.split("-").map(Number);

    let left, middle, right;
    let totalSeatsPerRow;

    if (layoutParts.length === 2) {
      // Format: left-right (e.g., "3-3")
      [left, right] = layoutParts;
      middle = 0;
      totalSeatsPerRow = left + right + 1; // +1 for aisle
    } else if (layoutParts.length === 3) {
      // Format: left-middle-right (e.g., "3-4-3", "2-3-2")
      [left, middle, right] = layoutParts;
      totalSeatsPerRow = left + middle + right + 2; // +2 for aisles
    } else {
      // Fallback for unsupported formats
      console.warn(`Unsupported seat layout format: ${layout}`);
      return null;
    }

    const rows = Math.ceil(aircraft.totalSeats / totalSeatsPerRow);

    const seats = [];
    let seatCounter = 1;

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];

      // Left side seats
      for (let seat = 1; seat <= left; seat++) {
        const seatId = `${row}${String.fromCharCode(64 + seat)}`;
        const isBooked = bookedSeats.includes(seatId);
        rowSeats.push({
          id: seatId,
          type: "seat",
          booked: isBooked,
          seatNumber: seatCounter++,
        });
      }

      // First aisle
      rowSeats.push({ id: "", type: "aisle" });

      // Middle seats (if any)
      if (middle > 0) {
        for (let seat = 1; seat <= middle; seat++) {
          const seatId = `${row}${String.fromCharCode(64 + left + seat)}`;
          const isBooked = bookedSeats.includes(seatId);
          rowSeats.push({
            id: seatId,
            type: "seat",
            booked: isBooked,
            seatNumber: seatCounter++,
          });
        }

        // Second aisle (only for 3-section layouts)
        rowSeats.push({ id: "", type: "aisle" });
      }

      // Right side seats
      for (let seat = 1; seat <= right; seat++) {
        const seatId = `${row}${String.fromCharCode(
          64 + left + middle + seat
        )}`;
        const isBooked = bookedSeats.includes(seatId);
        rowSeats.push({
          id: seatId,
          type: "seat",
          booked: isBooked,
          seatNumber: seatCounter++,
        });
      }

      seats.push(rowSeats);
    }

    return seats;
  };

  const selectedAircraft = aircrafts.find(
    (aircraft) => String(aircraft.aircraftId) === formData.aircraftId
  );
  const seatLayout = selectedAircraft
    ? generateSeatLayout(selectedAircraft, flight?.bookedSeats || [])
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isEditMode ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Plus className="h-6 w-6 text-blue-600" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? TEXT.editFlight : TEXT.addFlight}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditMode
                  ? `${TEXT.updateFlightInfo} ${flight?.flightNumber || ""}`
                  : TEXT.enterFlightDetails}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
                <Label htmlFor="airlineId">{TEXT.airlineId} *</Label>
                <Select
                  value={formData.airlineId}
                  onValueChange={(value) =>
                    handleInputChange("airlineId", value)
                  }
                >
                  <SelectTrigger
                    className={errors.airlineId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectAirline} />
                  </SelectTrigger>
                  <SelectContent>
                    {airlines.map((airline) => (
                      <SelectItem
                        key={airline.airlineId}
                        value={String(airline.airlineId)}
                      >
                        {airline.airlineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.airlineId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.airlineId}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="aircraftId">{TEXT.aircraftId} *</Label>
                <Select
                  value={formData.aircraftId}
                  onValueChange={(value) =>
                    handleInputChange("aircraftId", value)
                  }
                >
                  <SelectTrigger
                    className={errors.aircraftId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectAircraft} />
                  </SelectTrigger>
                  <SelectContent>
                    {aircrafts.map((aircraft) => (
                      <SelectItem
                        key={aircraft.aircraftId}
                        value={String(aircraft.aircraftId)}
                      >
                        {aircraft.aircraftName} ({aircraft.totalSeats} ghế -
                        Layout: {aircraft.seatLayout})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.aircraftId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.aircraftId}
                  </p>
                )}
              </div>
              {/* <div>
                <Label htmlFor="totalSeats">{TEXT.capacity} *</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  value={formData.totalSeats}
                  onChange={(e) =>
                    handleInputChange("totalSeats", e.target.value)
                  }
                  placeholder="180"
                  className={errors.totalSeats ? "border-red-500" : ""}
                  readOnly={!!formData.aircraftId} // Read-only when aircraft is selected
                />
                {formData.aircraftId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Tổng ghế được cập nhật tự động từ máy bay đã chọn
                  </p>
                )}
                {errors.totalSeats && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.totalSeats}
                  </p>
                )}
              </div> */}
              <div>
                <Label htmlFor="type">{TEXT.flightType} *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger
                    className={errors.type ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectFlightType} />
                  </SelectTrigger>
                  <SelectContent>
                    {flightTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                )}
              </div>
              <div>
                <Label htmlFor="tripType">{TEXT.tripType} *</Label>
                <Select
                  value={formData.tripType}
                  onValueChange={(value) =>
                    handleInputChange("tripType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tripTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="businessId">{TEXT.businessId} *</Label>
                <Input
                  id="businessId"
                  type="number"
                  value={formData.businessId}
                  onChange={(e) =>
                    handleInputChange("businessId", e.target.value)
                  }
                  placeholder="1"
                  className={errors.businessId ? "border-red-500" : ""}
                />
                {errors.businessId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.businessId}
                  </p>
                )}
              </div>
              {isEditMode && (
                <div>
                  <Label htmlFor="status">{TEXT.flightStatus}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <Badge
                            variant={
                              status.value === "COMPLETED"
                                ? "default"
                                : status.value === "CANCELLED"
                                ? "destructive"
                                : status.value === "DELAYED"
                                ? "secondary"
                                : "outline"
                            }
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
                <Label htmlFor="departureAirportId">
                  {TEXT.departureAirportId} *
                </Label>
                <Select
                  value={formData.departureAirportId}
                  onValueChange={(value) =>
                    handleInputChange("departureAirportId", value)
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
                    {airports.map((airport) => (
                      <SelectItem
                        key={airport.airportId}
                        value={String(airport.airportId)}
                      >
                        {airport.airportCode} - {airport.airportName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departureAirportId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departureAirportId}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="arrivalAirportId">
                  {TEXT.arrivalAirportId} *
                </Label>
                <Select
                  value={formData.arrivalAirportId}
                  onValueChange={(value) =>
                    handleInputChange("arrivalAirportId", value)
                  }
                >
                  <SelectTrigger
                    className={errors.arrivalAirportId ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={TEXT.selectArrivalAirport} />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((airport) => (
                      <SelectItem
                        key={airport.airportId}
                        value={String(airport.airportId)}
                      >
                        {airport.airportCode} - {airport.airportName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.arrivalAirportId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.arrivalAirportId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Seat Layout Preview */}
          {selectedAircraft && seatLayout && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Bố Trí Ghế Đầy Đủ - {selectedAircraft.aircraftName}
                </CardTitle>
                <CardDescription>
                  Layout: {selectedAircraft.seatLayout} | Tổng ghế:{" "}
                  {selectedAircraft.totalSeats} | Đã đặt:{" "}
                  {flight?.bookedSeats?.length || 0} | Còn trống:{" "}
                  {(selectedAircraft.totalSeats || 0) -
                    (flight?.bookedSeats?.length || 0)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {seatLayout.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex items-center mb-2">
                        <span className="w-8 text-xs font-mono text-gray-500 mr-2 text-right">
                          {rowIndex + 1}
                        </span>
                        {row.map((seat, seatIndex) => (
                          <div
                            key={seatIndex}
                            className={`w-8 h-8 mx-1 rounded text-xs flex items-center justify-center font-mono text-[10px] border-2 ${
                              seat.type === "aisle"
                                ? "bg-gray-200 border-gray-300"
                                : seat.booked
                                ? "bg-red-100 border-red-400 text-red-800"
                                : "bg-green-100 border-green-400 text-green-800"
                            }`}
                            title={
                              seat.type === "aisle"
                                ? "Lối đi"
                                : seat.booked
                                ? `Ghế ${seat.id} - Đã đặt`
                                : `Ghế ${seat.id} - Còn trống`
                            }
                          >
                            {seat.id}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded mr-2"></div>
                      <span>Còn trống</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 border-2 border-red-400 rounded mr-2"></div>
                      <span>Đã đặt</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded mr-2"></div>
                      <span>Lối đi</span>
                    </div>
                  </div>
                  <div className="text-gray-600">
                    Hiển thị tất cả {seatLayout.length} hàng ghế
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  onChange={(e) =>
                    handleInputChange("departureDate", e.target.value)
                  }
                  className={errors.departureDate ? "border-red-500" : ""}
                />
                {errors.departureDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departureDate}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="departureTime">{TEXT.departureTime} *</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) =>
                    handleInputChange("departureTime", e.target.value)
                  }
                  className={errors.departureTime ? "border-red-500" : ""}
                />
                {errors.departureTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departureTime}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="arrivalDate">{TEXT.arrivalDate} *</Label>
                <Input
                  id="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) =>
                    handleInputChange("arrivalDate", e.target.value)
                  }
                  className={errors.arrivalDate ? "border-red-500" : ""}
                />
                {errors.arrivalDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.arrivalDate}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="arrivalTime">{TEXT.arrivalTime} *</Label>
                <Input
                  id="arrivalTime"
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) =>
                    handleInputChange("arrivalTime", e.target.value)
                  }
                  className={errors.arrivalTime ? "border-red-500" : ""}
                />
                {errors.arrivalTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.arrivalTime}
                  </p>
                )}
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
                <Label htmlFor="gateId">
                  {TEXT.gateId} {!isEditMode && "*"}
                </Label>
                <Select
                  value={formData.gateId}
                  onValueChange={(value) => handleInputChange("gateId", value)}
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
                    {gates.map((gate) => (
                      <SelectItem key={gate.gateId} value={String(gate.gateId)}>
                        {gate.gateName}{" "}
                        {gate.terminal ? `(Terminal ${gate.terminal})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gateId && (
                  <p className="text-red-500 text-xs mt-1">{errors.gateId}</p>
                )}
              </div>
              {isEditMode && (
                <>
                  <div>
                    <Label htmlFor="terminal">{TEXT.terminal}</Label>
                    <Input
                      id="terminal"
                      value={formData.terminal}
                      onChange={(e) =>
                        handleInputChange("terminal", e.target.value)
                      }
                      placeholder="Terminal 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkInCounter">
                      {TEXT.checkInCounter}
                    </Label>
                    <Input
                      id="checkInCounter"
                      value={formData.checkInCounter}
                      onChange={(e) =>
                        handleInputChange("checkInCounter", e.target.value)
                      }
                      placeholder="Counter 12-15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="baggage">{TEXT.baggage}</Label>
                    <Input
                      id="baggage"
                      value={formData.baggage}
                      onChange={(e) =>
                        handleInputChange("baggage", e.target.value)
                      }
                      placeholder="20kg checked, 7kg carry-on"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mealService">{TEXT.mealService}</Label>
                    <Select
                      value={formData.mealService}
                      onValueChange={(value) =>
                        handleInputChange("mealService", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dịch vụ ăn uống" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Không có dịch vụ ăn uống
                        </SelectItem>
                        <SelectItem value="snack">Dịch vụ đồ ăn nhẹ</SelectItem>
                        <SelectItem value="meal">
                          Dịch vụ ăn uống đầy đủ
                        </SelectItem>
                        <SelectItem value="premium">Ăn uống cao cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entertainment">{TEXT.entertainment}</Label>
                    <Select
                      value={formData.entertainment}
                      onValueChange={(value) =>
                        handleInputChange("entertainment", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dịch vụ giải trí" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có giải trí</SelectItem>
                        <SelectItem value="basic">Giải trí cơ bản</SelectItem>
                        <SelectItem value="premium">
                          Giải trí cao cấp
                        </SelectItem>
                        <SelectItem value="live_tv">TV trực tiếp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="wifiAvailable"
                      checked={formData.wifiAvailable}
                      onChange={(e) =>
                        handleInputChange("wifiAvailable", e.target.checked)
                      }
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
                        onChange={(e) =>
                          handleInputChange("delayReason", e.target.value)
                        }
                        placeholder="Điều kiện thời tiết, sự cố kỹ thuật, v.v."
                      />
                    </div>
                  )}
                  <div className="col-span-full">
                    <Label htmlFor="remarks">{TEXT.remarks}</Label>
                    <textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) =>
                        handleInputChange("remarks", e.target.value)
                      }
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
                <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                {TEXT.stops}
              </CardTitle>
              <CardDescription>
                Quản lý điểm dừng của chuyến bay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasStops"
                  checked={formData.stops !== "NON_STOP"}
                  onChange={(e) =>
                    handleInputChange(
                      "stops",
                      e.target.checked ? "STOP" : "NON_STOP"
                    )
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="hasStops">Chuyến bay có điểm dừng</Label>
              </div>

              {formData.stops !== "NON_STOP" && (
                <div className="space-y-3">
                  {formData.stopsList.map((stop, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Label>{TEXT.stopAirport}</Label>
                        <Select
                          value={stop.airportId}
                          onValueChange={(value) =>
                            handleStopChange(index, "airportId", value)
                          }
                        >
                          <SelectTrigger
                            className={
                              errors[`stopAirport_${index}`]
                                ? "border-red-500"
                                : ""
                            }
                          >
                            <SelectValue placeholder="Chọn sân bay dừng" />
                          </SelectTrigger>
                          <SelectContent>
                            {airports.map((airport) => (
                              <SelectItem
                                key={airport.airportId}
                                value={String(airport.airportId)}
                              >
                                {airport.airportCode} - {airport.airportName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`stopAirport_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`stopAirport_${index}`]}
                          </p>
                        )}
                      </div>
                      <div className="w-32">
                        <Label>{TEXT.stopDuration}</Label>
                        <Input
                          type="number"
                          value={stop.duration}
                          onChange={(e) =>
                            handleStopChange(index, "duration", e.target.value)
                          }
                          placeholder="30"
                          className={
                            errors[`stopDuration_${index}`]
                              ? "border-red-500"
                              : ""
                          }
                        />
                        {errors[`stopDuration_${index}`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`stopDuration_${index}`]}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveStop(index)}
                        className="mt-6"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddStop}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {TEXT.addStop}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                {TEXT.travelClasses}
              </CardTitle>
              <CardDescription>Quản lý các hạng vé và giá vé</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.flightTravelClasses.map((travelClass, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Label>{TEXT.selectClass}</Label>
                    <Select
                      value={travelClass.classId}
                      onValueChange={(value) =>
                        handleClassChange(index, "classId", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          errors[`classId_${index}`] ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Chọn hạng vé" />
                      </SelectTrigger>
                      <SelectContent>
                        {travelClasses.map((cls) => (
                          <SelectItem
                            key={cls.classId}
                            value={String(cls.classId)}
                          >
                            {cls.className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`classId_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`classId_${index}`]}
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <Label>{TEXT.customPrice}</Label>
                    <Input
                      type="number"
                      value={travelClass.customPrice}
                      onChange={(e) =>
                        handleClassChange(index, "customPrice", e.target.value)
                      }
                      placeholder="180.00"
                      className={
                        errors[`customPrice_${index}`] ? "border-red-500" : ""
                      }
                    />
                    {errors[`customPrice_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`customPrice_${index}`]}
                      </p>
                    )}
                  </div>
                  <div className="w-32">
                    <Label>{TEXT.classAvailableSeats}</Label>
                    <Input
                      type="number"
                      value={travelClass.availableSeats}
                      onChange={(e) =>
                        handleClassChange(
                          index,
                          "availableSeats",
                          e.target.value
                        )
                      }
                      placeholder="100"
                      className={
                        errors[`availableSeats_${index}`]
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {errors[`availableSeats_${index}`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`availableSeats_${index}`]}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveClass(index)}
                    className="mt-6"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddClass}>
                <Plus className="h-4 w-4 mr-2" />
                {TEXT.addClass}
              </Button>
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
                <Label htmlFor="basePrice">{TEXT.basePrice} (VND) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    handleInputChange("basePrice", e.target.value)
                  }
                  placeholder="800000"
                  className={errors.basePrice ? "border-red-500" : ""}
                />
                {errors.basePrice && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.basePrice}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleReset}>
              {TEXT.reset}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {TEXT.cancel}
            </Button>
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
