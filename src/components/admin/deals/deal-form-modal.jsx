import { useState, useEffect } from "react";
import {
  X,
  Save,
  Plus,
  Edit,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Plane,
  MapPin,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { airportApi } from "@/apis/airport-api";

const DealFormModal = ({
  open,
  onClose,
  onSave,
  deal = null,
  mode = "add",
}) => {
  const isEditMode = mode === "edit" && deal;

  const initialFormData = {
    dealCode: "",
    title: "",
    description: "",
    thumbnail: "",
    thumbnailFile: null,
    discountPercentage: "",
    minimumOrderAmount: "",
    maxDiscountAmount: "",
    validFrom: "",
    validTo: "",
    totalUsageLimit: "",
    usagePerUser: "",
    isActive: true,
    departureAirportId: "all",
    arrivalAirportId: "all",
    isGuestOnly: false,
    requiredLoyaltyTier: "",
    isLoyaltyExclusive: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Airports state
  const [airports, setAirports] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(true);
  const [airportsError, setAirportsError] = useState(null);

  // Fetch airports when component mounts
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setAirportsLoading(true);
        setAirportsError(null);
        const response = await airportApi.getAllAirports({ size: 1000 });
        if (response.success && response.data) {
          const airportsData = response.data.content || response.data;

          setAirports(airportsData);
        } else {
          setAirportsError("Không thể tải danh sách sân bay");
        }
      } catch (error) {
        setAirportsError("Lỗi khi tải danh sách sân bay");
      } finally {
        setAirportsLoading(false);
      }
    };

    fetchAirports();
  }, []);

  // Populate form data when in edit mode
  useEffect(() => {
    // Helper: format yyyy-MM-dd from ISO string
    const toDateInput = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      return format(d, "yyyy-MM-dd");
    };
    if (isEditMode && deal) {
      setFormData({
        ...initialFormData,
        ...deal,
        dealCode: deal.dealCode || "",
        title: deal.title || "",
        description: deal.description || "",
        thumbnail: deal.thumbnail || "",
        thumbnailFile: null,
        discountPercentage: deal.discountPercentage?.toString() || "",
        minimumOrderAmount: deal.minimumOrderAmount?.toString() || "",
        maxDiscountAmount: deal.maxDiscountAmount?.toString() || "",
        validFrom: deal.validFrom ? toDateInput(deal.validFrom) : "",
        validTo: deal.validTo ? toDateInput(deal.validTo) : "",
        totalUsageLimit: deal.totalUsageLimit?.toString() || "",
        usagePerUser: deal.usagePerUser?.toString() || "",
        isActive: typeof deal.isActive === "boolean" ? deal.isActive : true,
        departureAirportId: deal.departureAirportId?.toString() || "all",
        arrivalAirportId: deal.arrivalAirportId?.toString() || "all",
        isGuestOnly:
          typeof deal.isGuestOnly === "boolean" ? deal.isGuestOnly : false,
        requiredLoyaltyTier: deal.requiredLoyaltyTier || "",
        isLoyaltyExclusive:
          typeof deal.isLoyaltyExclusive === "boolean"
            ? deal.isLoyaltyExclusive
            : false,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [isEditMode, deal]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const generateDealCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange("dealCode", result);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.dealCode.trim()) {
      newErrors.dealCode = "Mã deal là bắt buộc";
    } else if (formData.dealCode.length < 3) {
      newErrors.dealCode = "Mã deal phải có ít nhất 3 ký tự";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    } else if (formData.title.length < 5) {
      newErrors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả là bắt buộc";
    }

    if (!formData.discountPercentage) {
      newErrors.discountPercentage = "Phần trăm giảm giá là bắt buộc";
    } else {
      const discount = parseFloat(formData.discountPercentage);
      if (isNaN(discount) || discount <= 0 || discount > 100) {
        newErrors.discountPercentage = "Phần trăm giảm giá phải từ 1-100";
      }
    }

    if (!formData.minimumOrderAmount) {
      newErrors.minimumOrderAmount = "Số tiền đơn hàng tối thiểu là bắt buộc";
    } else {
      const amount = parseFloat(formData.minimumOrderAmount);
      if (isNaN(amount) || amount < 0) {
        newErrors.minimumOrderAmount = "Số tiền phải lớn hơn hoặc bằng 0";
      }
    }

    if (formData.maxDiscountAmount) {
      const maxAmount = parseFloat(formData.maxDiscountAmount);
      if (isNaN(maxAmount) || maxAmount < 0) {
        newErrors.maxDiscountAmount =
          "Số tiền giảm tối đa phải lớn hơn hoặc bằng 0";
      }
    }

    if (!formData.validFrom) {
      newErrors.validFrom = "Ngày bắt đầu là bắt buộc";
    }

    if (!formData.validTo) {
      newErrors.validTo = "Ngày kết thúc là bắt buộc";
    }

    if (formData.validFrom && formData.validTo) {
      const startDate = new Date(formData.validFrom);
      const endDate = new Date(formData.validTo);
      if (endDate <= startDate) {
        newErrors.validTo = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    if (formData.totalUsageLimit) {
      const limit = parseInt(formData.totalUsageLimit);
      if (isNaN(limit) || limit <= 0) {
        newErrors.totalUsageLimit = "Giới hạn sử dụng phải là số nguyên dương";
      }
    }

    if (formData.usagePerUser) {
      const userLimit = parseInt(formData.usagePerUser);
      if (isNaN(userLimit) || userLimit <= 0) {
        newErrors.usagePerUser =
          "Giới hạn mỗi người dùng phải là số nguyên dương";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format ngày về yyyy-MM-ddTHH:mm:ss
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    // Lấy yyyy-MM-dd
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    // Lấy HH:mm:ss (mặc định 00:00:00 nếu không có giờ)
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");
    const SS = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Chỉ gửi thumbnail là file nếu có file, nếu không thì gửi url string
    const dealData = {
      ...formData,
      discountPercentage: parseFloat(formData.discountPercentage),
      minimumOrderAmount: parseFloat(formData.minimumOrderAmount),
      maxDiscountAmount: formData.maxDiscountAmount
        ? parseFloat(formData.maxDiscountAmount)
        : null,
      totalUsageLimit: formData.totalUsageLimit
        ? parseInt(formData.totalUsageLimit)
        : null,
      usagePerUser: formData.usagePerUser
        ? parseInt(formData.usagePerUser)
        : null,
      departureAirportId:
        formData.departureAirportId && formData.departureAirportId !== "all"
          ? parseInt(formData.departureAirportId)
          : null,
      arrivalAirportId:
        formData.arrivalAirportId && formData.arrivalAirportId !== "all"
          ? parseInt(formData.arrivalAirportId)
          : null,
      validFrom: formatDateTime(formData.validFrom),
      validTo: formatDateTime(formData.validTo),
    };
    // Xử lý thumbnail: chỉ gửi 1 loại
    if (formData.thumbnailFile instanceof File) {
      dealData.thumbnailFile = formData.thumbnailFile;
      dealData.thumbnail = undefined; // Không gửi url nếu có file
    } else {
      dealData.thumbnailFile = undefined;
      dealData.thumbnail = formData.thumbnail;
    }
    onSave(dealData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            {isEditMode ? (
              <>
                <Edit className="h-5 w-5" />
                Chỉnh sửa Deal
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Thêm Deal Mới
              </>
            )}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-300">
            {isEditMode
              ? "Cập nhật thông tin deal khuyến mại"
              : "Tạo deal khuyến mại mới cho trang web đặt vé máy bay"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <FileText className="h-4 w-4" />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 dark:bg-gray-800">
                  <div className="space-y-2">
                    <Label htmlFor="dealCode" className="dark:text-gray-300">
                      Mã deal <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="dealCode"
                        placeholder="VD: SUMMER2024"
                        value={formData.dealCode}
                        onChange={(e) =>
                          handleInputChange(
                            "dealCode",
                            e.target.value.toUpperCase()
                          )
                        }
                        className={`text-black ${
                          errors.dealCode ? "border-destructive" : ""
                        }`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateDealCode}
                        className="flex-shrink-0 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Tạo mã
                      </Button>
                    </div>
                    {errors.dealCode && (
                      <p className="text-sm text-destructive">
                        {errors.dealCode}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title" className="dark:text-gray-300">
                      Tiêu đề <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Nhập tiêu đề deal..."
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={`text-black ${
                        errors.title ? "border-destructive" : ""
                      }`}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="dark:text-gray-300">
                      Mô tả <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Nhập mô tả deal..."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={3}
                      className={`text-black ${
                        errors.description ? "border-destructive" : ""
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="dark:text-gray-300">Hình ảnh Deal</Label>
                    <ImageUpload
                      value={formData.thumbnail}
                      onChange={(url, file) => {
                        handleInputChange("thumbnail", url);
                        handleInputChange("thumbnailFile", file);
                      }}
                      placeholder="Chọn ảnh đại diện cho deal khuyến mại"
                      error={errors.thumbnail}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader className="dark:bg-gray-800 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Percent className="h-4 w-4" />
                    Thông tin giảm giá
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 dark:bg-gray-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="discountPercentage"
                        className="dark:text-gray-300"
                      >
                        Phần trăm giảm{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="discountPercentage"
                          type="number"
                          placeholder="15"
                          min="1"
                          max="100"
                          value={formData.discountPercentage}
                          onChange={(e) =>
                            handleInputChange(
                              "discountPercentage",
                              e.target.value
                            )
                          }
                          className={`text-black ${
                            errors.discountPercentage
                              ? "border-destructive pr-8"
                              : "pr-8"
                          }`}
                        />
                        <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                      </div>
                      {errors.discountPercentage && (
                        <p className="text-sm text-destructive">
                          {errors.discountPercentage}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="maxDiscountAmount"
                        className="dark:text-gray-300"
                      >
                        Giảm tối đa (VND)
                      </Label>
                      <Input
                        id="maxDiscountAmount"
                        type="number"
                        placeholder="500000"
                        min="0"
                        value={formData.maxDiscountAmount}
                        onChange={(e) =>
                          handleInputChange("maxDiscountAmount", e.target.value)
                        }
                        className={`text-black ${
                          errors.maxDiscountAmount ? "border-destructive" : ""
                        }`}
                      />
                      {errors.maxDiscountAmount && (
                        <p className="text-sm text-destructive">
                          {errors.maxDiscountAmount}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="minimumOrderAmount"
                      className="dark:text-gray-300"
                    >
                      Đơn hàng tối thiểu (VND){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="minimumOrderAmount"
                      type="number"
                      placeholder="1000000"
                      min="0"
                      value={formData.minimumOrderAmount}
                      onChange={(e) =>
                        handleInputChange("minimumOrderAmount", e.target.value)
                      }
                      className={`text-black ${
                        errors.minimumOrderAmount ? "border-destructive" : ""
                      }`}
                    />
                    {errors.minimumOrderAmount && (
                      <p className="text-sm text-destructive">
                        {errors.minimumOrderAmount}
                      </p>
                    )}
                    {formData.minimumOrderAmount && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(formData.minimumOrderAmount)} VND
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Thời hạn sử dụng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validFrom">
                        Ngày bắt đầu <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="validFrom"
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) =>
                          handleInputChange("validFrom", e.target.value)
                        }
                        className={errors.validFrom ? "border-destructive" : ""}
                      />
                      {errors.validFrom && (
                        <p className="text-sm text-destructive">
                          {errors.validFrom}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validTo">
                        Ngày kết thúc{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="validTo"
                        type="date"
                        value={formData.validTo}
                        onChange={(e) =>
                          handleInputChange("validTo", e.target.value)
                        }
                        className={errors.validTo ? "border-destructive" : ""}
                      />
                      {errors.validTo && (
                        <p className="text-sm text-destructive">
                          {errors.validTo}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Giới hạn sử dụng
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalUsageLimit">Tổng lượt sử dụng</Label>
                      <Input
                        id="totalUsageLimit"
                        type="number"
                        placeholder="1000"
                        min="1"
                        value={formData.totalUsageLimit}
                        onChange={(e) =>
                          handleInputChange("totalUsageLimit", e.target.value)
                        }
                        className={
                          errors.totalUsageLimit ? "border-destructive" : ""
                        }
                      />
                      {errors.totalUsageLimit && (
                        <p className="text-sm text-destructive">
                          {errors.totalUsageLimit}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Để trống nếu không giới hạn
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usagePerUser">Lượt/người dùng</Label>
                      <Input
                        id="usagePerUser"
                        type="number"
                        placeholder="1"
                        min="1"
                        value={formData.usagePerUser}
                        onChange={(e) =>
                          handleInputChange("usagePerUser", e.target.value)
                        }
                        className={
                          errors.usagePerUser ? "border-destructive" : ""
                        }
                      />
                      {errors.usagePerUser && (
                        <p className="text-sm text-destructive">
                          {errors.usagePerUser}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Để trống nếu không giới hạn
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Áp dụng cho tuyến bay
                  </CardTitle>
                  <CardDescription>
                    Để trống nếu áp dụng cho tất cả tuyến bay
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="departureAirportId">Sân bay đi</Label>
                      <Select
                        value={formData.departureAirportId}
                        onValueChange={(value) =>
                          handleInputChange("departureAirportId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sân bay đi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả sân bay</SelectItem>
                          {airportsLoading ? (
                            <SelectItem value="loading" disabled>
                              Đang tải danh sách sân bay...
                            </SelectItem>
                          ) : airportsError ? (
                            <SelectItem value="error" disabled>
                              {airportsError}
                            </SelectItem>
                          ) : (
                            airports.map((airport) => (
                              <SelectItem
                                key={airport.airportId || airport.id}
                                value={
                                  (
                                    airport.airportId || airport.id
                                  )?.toString() || ""
                                }
                              >
                                {airport.airportCode} - {airport.airportName},{" "}
                                {airport.cityNames?.[0] || "N/A"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="arrivalAirportId">Sân bay đến</Label>
                      <Select
                        value={formData.arrivalAirportId}
                        onValueChange={(value) =>
                          handleInputChange("arrivalAirportId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn sân bay đến" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả sân bay</SelectItem>
                          {airportsLoading ? (
                            <SelectItem value="loading" disabled>
                              Đang tải danh sách sân bay...
                            </SelectItem>
                          ) : airportsError ? (
                            <SelectItem value="error" disabled>
                              {airportsError}
                            </SelectItem>
                          ) : (
                            airports.map((airport) => (
                              <SelectItem
                                key={airport.airportId || airport.id}
                                value={
                                  (
                                    airport.airportId || airport.id
                                  )?.toString() || ""
                                }
                              >
                                {airport.airportCode} - {airport.airportName},{" "}
                                {airport.cityNames?.[0] || "N/A"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Cài đặt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Kích hoạt deal</Label>
                      <p className="text-sm text-muted-foreground">
                        Deal sẽ có thể sử dụng khi được kích hoạt
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        handleInputChange("isActive", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isGuestOnly">
                        Chỉ dành cho khách vãng lai
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Deal chỉ áp dụng cho khách hàng chưa đăng ký tài khoản
                      </p>
                    </div>
                    <Switch
                      id="isGuestOnly"
                      checked={formData.isGuestOnly}
                      onCheckedChange={(checked) =>
                        handleInputChange("isGuestOnly", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isLoyaltyExclusive">
                        Độc quyền loyalty
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Deal chỉ dành riêng cho thành viên loyalty
                      </p>
                    </div>
                    <Switch
                      id="isLoyaltyExclusive"
                      checked={formData.isLoyaltyExclusive}
                      onCheckedChange={(checked) =>
                        handleInputChange("isLoyaltyExclusive", checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requiredLoyaltyTier">
                      Hạng thành viên yêu cầu
                    </Label>
                    <Select
                      value={formData.requiredLoyaltyTier}
                      onValueChange={(value) =>
                        handleInputChange("requiredLoyaltyTier", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn hạng thành viên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Không yêu cầu</SelectItem>
                        <SelectItem value="SILVER">Silver</SelectItem>
                        <SelectItem value="GOLD">Gold</SelectItem>
                        <SelectItem value="PLATINUM">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Chỉ thành viên từ hạng này trở lên mới có thể sử dụng deal
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditMode ? "Cập nhật" : "Tạo deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealFormModal;
