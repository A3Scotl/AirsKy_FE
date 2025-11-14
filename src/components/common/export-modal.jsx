import { useState } from "react";
import { Download, X, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportApi } from "@/apis/export-api";
import { toast } from "sonner";
import { filterTechnicalFields } from "@/utils/export-config";

/**
 * Modal export dữ liệu
 * @param {Object} props
 * @param {boolean} props.isOpen - Trạng thái mở modal
 * @param {Function} props.onClose - Hàm đóng modal
 * @param {string} props.entity - Tên entity (blogs, users, etc.)
 * @param {Array} props.availableFields - Danh sách các trường có thể export (mảng object với field và displayName)
 * @param {string} props.entityDisplayName - Tên hiển thị của entity
 */
const ExportModal = ({
  isOpen,
  onClose,
  entity,
  availableFields = [],
  entityDisplayName = entity,
}) => {
  const [format, setFormat] = useState("xlsx");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);
  const [exportAll, setExportAll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // availableFields đã được lọc từ export-config, không cần lọc lại
  const filteredFields = availableFields;

  const handleFieldChange = (fieldName, checked) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldName]);
    } else {
      setSelectedFields(selectedFields.filter((f) => f !== fieldName));
    }
  };

  const handleSelectAll = (checked) => {
    setExportAll(checked);
    if (checked) {
      setSelectedFields([]);
    }
  };

  const handleExport = async () => {
    // Validation
    if (!entity) {
      toast.error("Thiếu thông tin entity");
      return;
    }

    if (!format) {
      toast.error("Vui lòng chọn định dạng file");
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }

    if (!exportAll && selectedFields.length === 0) {
      toast.error("Vui lòng chọn ít nhất một trường để xuất");
      return;
    }

    setIsExporting(true);
    try {
      const params = {};

      if (startDate) {
        params.startDate = new Date(startDate);
      }
      if (endDate) {
        params.endDate = new Date(endDate);
      }

      if (!exportAll && selectedFields.length > 0) {
        // availableFields đã được lọc từ export-config, không cần lọc lại
        params.fields = selectedFields;
      }

      const blob = await exportApi.exportData(entity, format, params);

      // Tạo tên file
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `${entity}_${timestamp}.${format}`;

      // Download file
      exportApi.downloadFile(blob, filename);

      toast.success(`Xuất file ${entityDisplayName} thành công!`);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      const errorMessage =
        error.message || "Xuất file thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const resetForm = () => {
    setFormat("xlsx");
    setStartDate("");
    setEndDate("");
    setSelectedFields([]);
    setExportAll(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Xuất dữ liệu {entityDisplayName}
          </DialogTitle>
          <DialogDescription>
            Chọn định dạng file và các trường muốn xuất
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Định dạng file */}
          <div className="space-y-2">
            <Label htmlFor="format">Định dạng file</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn định dạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Khoảng thời gian */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Từ ngày
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Đến ngày
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Chọn trường */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exportAll"
                checked={exportAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="exportAll" className="font-medium">
                Xuất tất cả trường
              </Label>
            </div>

            {!exportAll && filteredFields.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Chọn trường muốn xuất
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {filteredFields.map((fieldObj) => (
                    <div
                      key={fieldObj.field}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={fieldObj.field}
                        checked={selectedFields.includes(fieldObj.field)}
                        onCheckedChange={(checked) =>
                          handleFieldChange(fieldObj.field, checked)
                        }
                      />
                      <Label htmlFor={fieldObj.field} className="text-sm">
                        {fieldObj.displayName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xuất...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Xuất file
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
