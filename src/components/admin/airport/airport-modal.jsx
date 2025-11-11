import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/ui/image-upload";
import { Plus, Trash2 } from "lucide-react";

/**
 * Modal thêm/cập nhật sân bay
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {function} props.onSubmit
 * @param {object} [props.initialData] - Nếu có là update, không có là create
 * @param {Array} props.countries - Danh sách quốc gia [{ countryId, countryName }]
 */
const AirportModal = ({ open, onClose, onSubmit, initialData, countries }) => {
  const [form, setForm] = useState({
    airport_code: "",
    airport_name: "",
    countryId: "",
    city_name: "",
    is_active: true,
    thumbnail: "",
    thumbnailFile: null,
    gates: [], // Array of {gateName: string, terminal: string}
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          airport_code:
            initialData.airportCode || initialData.airport_code || "",
          airport_name:
            initialData.airportName || initialData.airport_name || "",
          countryId: initialData.countryId ? String(initialData.countryId) : "",
          city_name: (() => {
            const cityData =
              initialData.cityNames || initialData.cityName || initialData.city;
            if (Array.isArray(cityData)) {
              return cityData.join(", ");
            }
            return cityData || "";
          })(),
          is_active: initialData.active ?? initialData.is_active ?? true,
          thumbnail: initialData.thumbnail || "",
          thumbnailFile: null,
          gates: initialData.gates || [], // Load existing gates
        });
      } else {
        setForm({
          airport_code: "",
          airport_name: "",
          countryId: "1", // Mặc định chọn Việt Nam (id = 1)
          city_name: "",
          is_active: true,
          thumbnail: "",
          thumbnailFile: null,
          gates: [],
        });
      }
      // Reset errors and submitting state when modal opens
      setErrors({});
      setIsSubmitting(false);
    }
  }, [initialData, open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Form validation functions
  const validateForm = () => {
    const newErrors = {};

    if (!form.airport_code.trim()) {
      newErrors.airport_code = "Mã sân bay là bắt buộc";
    } else if (form.airport_code.trim().length < 3) {
      newErrors.airport_code = "Mã sân bay phải có ít nhất 3 ký tự";
    } else if (form.airport_code.trim().length > 5) {
      newErrors.airport_code = "Mã sân bay không được quá 5 ký tự";
    } else if (!/^[A-Z0-9]+$/.test(form.airport_code.trim())) {
      newErrors.airport_code = "Mã sân bay chỉ được chứa chữ hoa và số";
    }

    if (!form.airport_name.trim()) {
      newErrors.airport_name = "Tên sân bay là bắt buộc";
    } else if (form.airport_name.trim().length < 2) {
      newErrors.airport_name = "Tên sân bay phải có ít nhất 2 ký tự";
    } else if (form.airport_name.trim().length > 100) {
      newErrors.airport_name = "Tên sân bay không được quá 100 ký tự";
    }

    if (!form.countryId) {
      newErrors.countryId = "Vui lòng chọn quốc gia";
    }

    if (form.city_name.trim() && form.city_name.trim().length > 200) {
      newErrors.city_name = "Tên thành phố không được quá 200 ký tự";
    }

    // Validate gates
    form.gates.forEach((gate, index) => {
      if (gate.gateName && !gate.terminal) {
        newErrors[`gate_${index}_terminal`] =
          "Vui lòng nhập terminal cho cổng này";
      }
      if (gate.terminal && !gate.gateName) {
        newErrors[`gate_${index}_gateName`] = "Vui lòng nhập tên cổng";
      }
    });

    return newErrors;
  };

  // Check if form is valid
  const isFormValid = () => {
    const errors = validateForm();
    return (
      Object.keys(errors).length === 0 &&
      form.airport_code.trim() &&
      form.airport_name.trim() &&
      form.countryId &&
      !isSubmitting
    );
  };

  // Check if data has changed (for edit mode)
  const hasDataChanged = () => {
    if (!initialData) return true; // For new entries, always allow submission

    const initialCityName = (() => {
      const cityData =
        initialData.cityNames || initialData.cityName || initialData.city;
      if (Array.isArray(cityData)) {
        return cityData.join(", ");
      }
      return cityData || "";
    })();

    return (
      form.airport_code !==
        (initialData.airportCode || initialData.airport_code || "") ||
      form.airport_name !==
        (initialData.airportName || initialData.airport_name || "") ||
      form.countryId !== String(initialData.countryId || "") ||
      form.city_name !== initialCityName ||
      form.is_active !==
        (initialData.active ?? initialData.is_active ?? true) ||
      form.thumbnailFile !== null ||
      form.thumbnail !== (initialData.thumbnail || "") ||
      JSON.stringify(form.gates) !== JSON.stringify(initialData.gates || [])
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleThumbnailChange = (url, file) => {
    setForm((prev) => ({
      ...prev,
      thumbnail: url,
      thumbnailFile: file,
    }));
  };

  // Gate management functions
  const addGate = () => {
    setForm((prev) => ({
      ...prev,
      gates: [...prev.gates, { gateName: "", terminal: "" }],
    }));
  };

  const removeGate = (index) => {
    // Khi xóa bất kỳ gate nào, xóa tất cả gates (theo yêu cầu: xóa 1 = xóa hết)
    setForm((prev) => ({
      ...prev,
      gates: prev.gates.map(() => ({ gateName: "", terminal: "" })),
    }));
  };

  const updateGate = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      gates: prev.gates.map((gate, i) =>
        i === index ? { ...gate, [field]: value } : gate
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Prevent double submission
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = {
        airportCode: form.airport_code.trim(),
        airportName: form.airport_name.trim(),
        countryId: parseInt(form.countryId), // Đảm bảo là number
        cityNames: form.city_name.trim(),
        active: form.is_active,
        gates: form.gates.filter((gate) => gate.gateName && gate.terminal), // Chỉ gửi gates có dữ liệu
      };

      // Xử lý thumbnail: chỉ gửi 1 loại
      if (form.thumbnailFile instanceof File) {
        formData.thumbnailFile = form.thumbnailFile;
      } else if (form.thumbnail) {
        formData.thumbnailUrl = form.thumbnail;
      } else {
        console.log("[AirportModal] No thumbnail to send");
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting airport form:", error);
    } finally {
      if (isMounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl mx-auto max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
        <DialogHeader className="dark:bg-gray-900">
          <DialogTitle className="dark:text-white">
            {initialData ? "Cập nhật sân bay" : "Thêm sân bay"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {initialData
              ? "Cập nhật thông tin sân bay. Các trường có dấu * là bắt buộc."
              : "Thêm sân bay mới vào hệ thống. Các trường có dấu * là bắt buộc."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mã sân bay"
            name="airport_code"
            value={form.airport_code}
            onChange={handleChange}
            maxLength={5}
            required
            placeholder="VD: SGN"
            className="text-black"
          />
          <Input
            label="Tên sân bay"
            name="airport_name"
            value={form.airport_name}
            onChange={handleChange}
            maxLength={100}
            required
            placeholder="VD: Sân bay Tân Sơn Nhất"
            className="text-black"
          />
          <Input
            label="Tên thành phố"
            name="city_name"
            value={form.city_name}
            onChange={handleChange}
            maxLength={200}
            placeholder="VD: Hồ Chí Minh, Hà Nội, Đà Nẵng (cách nhau bằng dấu phẩy)"
            className="text-black"
          />
          <p className="text-xs text-muted-foreground dark:text-gray-500">
            Nhập nhiều thành phố cách nhau bằng dấu phẩy. Ví dụ: "Hồ Chí Minh,
            Hà Nội"
          </p>
          {initialData && form.city_name && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                Thành phố hiện tại:
              </p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  if (typeof form.city_name === "string") {
                    return form.city_name.split(",").map((city, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {city.trim()}
                      </Badge>
                    ));
                  } else if (Array.isArray(form.city_name)) {
                    return form.city_name.map((city, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {typeof city === "string" ? city.trim() : city}
                      </Badge>
                    ));
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
          <Select
            value={form.countryId}
            onValueChange={(v) =>
              setForm((prev) => ({ ...prev, countryId: v }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn quốc gia" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem
                  key={c.countryId || c.id}
                  value={String(c.countryId || c.id)}
                >
                  {c.countryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">
              Ảnh thumbnail
            </label>
            <ImageUpload
              value={form.thumbnail}
              onChange={handleThumbnailChange}
              placeholder="Chọn ảnh sân bay"
            />
          </div>

          {/* Gates Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium dark:text-gray-300">
                Cửa ra máy bay (Gates)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGate}
                className="flex items-center gap-1 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Plus className="w-4 h-4" />
                Thêm gate
              </Button>
            </div>

            {form.gates.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-gray-500">
                Chưa có gate nào. Nhấn "Thêm gate" để thêm.
              </p>
            ) : (
              <div className="space-y-3">
                {form.gates.map((gate, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700"
                  >
                    <div className="flex-1">
                      <Input
                        placeholder="Tên gate (VD: T7, G11)"
                        value={gate.gateName}
                        onChange={(e) =>
                          updateGate(index, "gateName", e.target.value)
                        }
                        className="mb-2 text-black"
                      />
                      <Input
                        placeholder="Terminal (VD: T5, T11)"
                        value={gate.terminal}
                        onChange={(e) =>
                          updateGate(index, "terminal", e.target.value)
                        }
                        className="text-black"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGate(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:border-gray-600"
                      title="Xóa tất cả gates (gửi dữ liệu rỗng để backend xóa)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              id="is_active"
            />
            <label htmlFor="is_active" className="dark:text-gray-300">
              Đang hoạt động
            </label>
          </div>
          <DialogFooter className="dark:bg-gray-900">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Hủy
            </Button>
            <Button type="submit">
              {initialData ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AirportModal;
