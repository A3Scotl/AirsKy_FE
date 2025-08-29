import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Custom date formatting function to replace date-fns
const formatDate = (date, formatString) => {
  if (!date) return "";

  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  switch (formatString) {
    case "PPP":
      return d.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "dd/MM/yyyy":
      return `${day}/${month}/${year}`;
    default:
      return d.toLocaleDateString("vi-VN");
  }
};

const PassengerDetails = ({ formData, updateFormData, updatePassenger }) => (
  <div className="w-full">
    <h2 className="text-lg sm:text-xl font-bold mb-4">Thông tin hành khách</h2>
    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 dark:text-gray-300">
      Vui lòng cung cấp thông tin cần thiết cho tất cả hành khách
    </p>

    {/* Contact Person */}
    <div className="mb-6 sm:mb-8 border-2 border-gray-200 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-none">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-xs sm:text-sm">👤</span>
        </div>
        <h3 className="font-semibold text-sm sm:text-base">Người liên hệ</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="contact-fullname" className="text-xs sm:text-sm">
            Họ và tên *
          </Label>
          <Input
            id="contact-fullname"
            placeholder="Nhập họ và tên của bạn"
            className="text-sm dark:bg-[#171717]"
            value={formData.contact.fullName}
            onChange={(e) =>
              updateFormData("contact", "fullName", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="contact-phone" className="text-xs sm:text-sm">
            Số điện thoại *
          </Label>
          <Input
            id="contact-phone"
            placeholder="Nhập số điện thoại"
            className="text-sm dark:bg-[#171717]"
            value={formData.contact.phone}
            onChange={(e) => updateFormData("contact", "phone", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contact-email" className="text-xs sm:text-sm">
            Email *
          </Label>
          <Input
            id="contact-email"
            placeholder="Nhập địa chỉ email của bạn"
            className="text-sm dark:bg-[#171717]"
            value={formData.contact.email}
            onChange={(e) => updateFormData("contact", "email", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="contact-confirm-email" className="text-xs sm:text-sm">
            Xác nhận Email *
          </Label>
          <Input
            id="contact-confirm-email"
            placeholder="Xác nhận địa chỉ email của bạn"
            className="text-sm dark:bg-[#171717]"
            value={formData.contact.confirmEmail}
            onChange={(e) =>
              updateFormData("contact", "confirmEmail", e.target.value)
            }
          />
        </div>
      </div>
      
    </div>

    {/* Passenger 1: Adult */}
    <div className="mb-6 sm:mb-8 border-2 border-gray-200 p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-none">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-xs sm:text-sm">👤</span>
        </div>
        <h3 className="font-semibold text-sm sm:text-base">
          Hành khách 1: Người lớn
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <Label htmlFor="p1-fullname" className="text-xs sm:text-sm">
            Tên đầy đủ *
          </Label>
          <Input
            id="p1-fullname"
            placeholder="Nhập tên đầy đủ"
            className="text-sm dark:bg-[#171717]"
            value={formData.passengers[0].fullName}
            onChange={(e) => updatePassenger(0, "fullName", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="p1-gender" className="text-xs sm:text-sm">
            Giới tính *
          </Label>
          <Select
            value={formData.passengers[0].gender}
            onValueChange={(value) => updatePassenger(0, "gender", value)}
            
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Nam</SelectItem>
              <SelectItem value="Female">Nữ</SelectItem>
              <SelectItem value="Other">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label htmlFor="p1-dob" className="text-xs sm:text-sm">
            Ngày sinh *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-sm dark:bg-[#171717]",
                  !formData.passengers[0].dob && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {formData.passengers[0].dob ? (
                  formatDate(formData.passengers[0].dob, "dd/MM/yyyy")
                ) : (
                  <span>dd/mm/yyyy</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.passengers[0].dob}
                onSelect={(date) => updatePassenger(0, "dob", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <Label htmlFor="p1-passport" className="text-xs sm:text-sm">
            Số hộ chiếu (tùy chọn)
          </Label>
          <Input
            id="p1-passport"
            placeholder="Nhập số hộ chiếu"
            className="text-sm dark:bg-[#171717]"
            value={formData.passengers[0].passport}
            onChange={(e) => updatePassenger(0, "passport", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Label htmlFor="p1-ffn" className="text-xs sm:text-sm">
            Mã số khách hàng (tùy chọn)
          </Label>
          <Input
            id="p1-ffn"
            placeholder="Nhập mã số khách hàng"
            className="text-sm dark:bg-[#171717]"
            value={formData.passengers[0].frequentFlyer}
            onChange={(e) =>
              updatePassenger(0, "frequentFlyer", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  </div>
);

export default PassengerDetails;
