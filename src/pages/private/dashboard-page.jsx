import {
  Calendar,
  Plane,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  // Dữ liệu thống kê
  const thongKe = [
    {
      tieuDe: "Tổng Đặt Vé",
      giaTri: "2,847",
      thayDoi: "+12.5%",
      duong: true,
      icon: Calendar,
      moTa: "so với tháng trước",
    },
    {
      tieuDe: "Chuyến Bay Hoạt Động",
      giaTri: "156",
      thayDoi: "+3.2%",
      duong: true,
      icon: Plane,
      moTa: "đang được lên lịch",
    },
    {
      tieuDe: "Tổng Người Dùng",
      giaTri: "8,429",
      thayDoi: "+8.1%",
      duong: true,
      icon: Users,
      moTa: "người dùng đã đăng ký",
    },
    {
      tieuDe: "Doanh Thu",
      giaTri: "8,572,250,000₫",
      thayDoi: "-2.4%",
      duong: false,
      icon: CreditCard,
      moTa: "tháng này",
    },
  ];

  const datVeGanDay = [
    {
      id: "BK001",
      khachHang: "Nguyễn Văn An",
      tuyen: "HAN → SGN",
      ngay: "15/01/2024",
      trangThai: "Đã Xác Nhận",
      soTien: "2,450,000₫",
    },
    {
      id: "BK002",
      khachHang: "Trần Thị Bình",
      tuyen: "DAD → HAN",
      ngay: "15/01/2024",
      trangThai: "Chờ Xử Lý",
      soTien: "1,820,000₫",
    },
    {
      id: "BK003",
      khachHang: "Lê Minh Cường",
      tuyen: "SGN → PQC",
      ngay: "14/01/2024",
      trangThai: "Đã Xác Nhận",
      soTien: "3,200,000₫",
    },
    {
      id: "BK004",
      khachHang: "Phạm Thu Dung",
      tuyen: "CXR → HAN",
      ngay: "14/01/2024",
      trangThai: "Đã Hủy",
      soTien: "1,950,000₫",
    },
    {
      id: "BK005",
      khachHang: "Hoàng Văn Em",
      tuyen: "HPH → SGN",
      ngay: "13/01/2024",
      trangThai: "Đã Xác Nhận",
      soTien: "2,100,000₫",
    },
  ];

  const tuyenHangDau = [
    { tuyen: "HAN → SGN", datVe: 234, doanhThu: "520,300,000₫" },
    { tuyen: "SGN → DAD", datVe: 189, doanhThu: "425,680,000₫" },
    { tuyen: "HAN → PQC", datVe: 156, doanhThu: "445,420,000₫" },
    { tuyen: "SGN → HAN", datVe: 145, doanhThu: "462,800,000₫" },
    { tuyen: "DAD → SGN", datVe: 132, doanhThu: "336,440,000₫" },
  ];

  const layBadgeTrangThai = (trangThai) => {
    const styles = {
      "Đã Xác Nhận": "bg-green-100 text-green-800",
      "Chờ Xử Lý": "bg-yellow-100 text-yellow-800",
      "Đã Hủy": "bg-red-100 text-red-800",
    };
    return styles[trangThai] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển</h1>
        <p className="text-gray-600">
          Chào mừng trở lại! Đây là tình hình hôm nay của hãng hàng không.
        </p>
      </div>

      {/* Lưới thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {thongKe.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.tieuDe}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.giaTri}
                </div>
                <div className="flex items-center text-xs text-gray-600 mt-1">
                  {stat.duong ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span
                    className={stat.duong ? "text-green-600" : "text-red-600"}
                  >
                    {stat.thayDoi}
                  </span>
                  <span className="ml-1">{stat.moTa}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Nội dung chính */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Đặt vé gần đây */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Đặt Vé Gần Đây
              <Badge variant="outline" className="ml-2">
                {datVeGanDay.length} mới
              </Badge>
            </CardTitle>
            <CardDescription>
              Hoạt động đặt vé mới nhất và cập nhật trạng thái
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {datVeGanDay.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {booking.khachHang}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${layBadgeTrangThai(
                          booking.trangThai
                        )}`}
                      >
                        {booking.trangThai}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {booking.tuyen}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {booking.ngay} • {booking.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {booking.soTien}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tuyến hàng đầu */}
        <Card>
          <CardHeader>
            <CardTitle>Tuyến Hàng Đầu</CardTitle>
            <CardDescription>
              Các tuyến bay phổ biến nhất theo số lượng đặt vé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tuyenHangDau.map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{route.tuyen}</div>
                      <div className="text-xs text-gray-500">
                        {route.datVe} đặt vé
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {route.doanhThu}
                    </div>
                    <div className="flex items-center text-xs text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +5.2%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
