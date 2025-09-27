import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, FileText, AlertTriangle } from "lucide-react";

const CheckInTermsModal = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5 text-blue-600" />
            Điều Khoản và Quy Tắc Check-in Online
          </DialogTitle>
          <DialogDescription>
            Vui lòng đọc kỹ các điều khoản trước khi thực hiện check-in
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Lưu ý quan trọng
              </h3>
              <ul className="text-blue-700 space-y-1">
                <li>
                  • Check-in online chỉ áp dụng cho hành khách có vé điện tử hợp
                  lệ
                </li>
                <li>
                  • Thời gian check-in: từ 24 giờ đến 1 giờ trước giờ khởi hành
                </li>
                <li>
                  • Hành khách cần mang theo giấy tờ tùy thân khi đến sân bay
                </li>
                <li>
                  • Không được phép thay đổi thông tin sau khi check-in thành
                  công
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                1. Điều kiện check-in
              </h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Vé phải được thanh toán đầy đủ và xác nhận</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Hành khách không thuộc diện cấm bay</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Chuyến bay chưa khởi hành</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Trong thời gian cho phép check-in</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                2. Quy trình check-in
              </h3>
              <ol className="space-y-2 text-gray-600 ml-4">
                <li>1. Nhập mã đặt chỗ hoặc thông tin vé điện tử</li>
                <li>2. Xác nhận thông tin hành khách</li>
                <li>3. Chọn chỗ ngồi (nếu có)</li>
                <li>4. Xác nhận và hoàn tất check-in</li>
                <li>5. Nhận thẻ lên máy bay điện tử</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                3. Chính sách hủy/thay đổi
              </h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>
                  • Sau khi check-in online, không thể thay đổi thông tin chuyến
                  bay
                </li>
                <li>• Hủy vé sau check-in sẽ áp dụng phí theo quy định</li>
                <li>• Thay đổi chỗ ngồi có thể áp dụng phụ phí</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                4. Hành lý và quy định
              </h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>
                  • Hành lý xách tay: không quá 7kg, kích thước không quá 115cm
                </li>
                <li>• Hành lý ký gửi: theo quy định của từng hạng vé</li>
                <li>
                  • Vật phẩm cấm: chất lỏng &gt;100ml, vật sắc nhọn, chất nổ
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                5. Quyền và nghĩa vụ
              </h3>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>
                  • Hành khách có trách nhiệm cung cấp thông tin chính xác
                </li>
                <li>• Đến sân bay đúng giờ theo thông tin check-in</li>
                <li>• Tuân thủ các quy định an toàn và an ninh</li>
                <li>• Giữ gìn vệ sinh và trật tự trên máy bay</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Lưu ý sức khỏe
              </h3>
              <p className="text-yellow-700 text-sm">
                Trong thời gian dịch bệnh, hành khách cần tuân thủ các quy định
                phòng chống dịch, khai báo y tế và có thể được kiểm tra thân
                nhiệt tại sân bay.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInTermsModal;
