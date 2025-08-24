import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Tag,
  TrendingUp,
} from "lucide-react";
import DealTable from "@/components/admin/deals/deal-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminDealPage = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Mock data - trong thực tế sẽ fetch từ API
  const mockDeals = [
    {
      dealId: 1,
      dealCode: "SUMMER2024",
      title: "Ưu đãi mùa hè",
      discountPercentage: 20,
      minimumOrderAmount: 1000000,
      validFrom: "2025-06-01T00:00:00",
      validTo: "2025-08-31T23:59:59",
      description: "Giảm giá đặc biệt cho các chuyến bay mùa hè",
      maxDiscountAmount: 500000,
      totalUsageLimit: 1000,
      usedCount: 234,
      usagePerUser: 1,
      isActive: true,
      createdAt: "2025-05-15T08:00:00",
      updatedAt: "2025-05-15T08:00:00",
      departureAirportId: null,
      departureAirportName: null,
      departureAirportCode: null,
      arrivalAirportId: null,
      arrivalAirportName: null,
      arrivalAirportCode: null,
      remainingUsage: 766,
      isExpired: false,
      isAvailable: true,
    },
    {
      dealId: 2,
      dealCode: "WEEKEND15",
      title: "Weekend Getaway",
      discountPercentage: 15,
      minimumOrderAmount: 600000,
      validFrom: "2025-02-01T00:00:00",
      validTo: "2025-11-30T23:59:59",
      description: "Perfect for your weekend trips and short vacations.",
      maxDiscountAmount: 250000,
      totalUsageLimit: 300,
      usedCount: 78,
      usagePerUser: null,
      isActive: true,
      createdAt: "2025-08-23T08:15:44",
      updatedAt: "2025-08-23T08:15:44",
      departureAirportId: 1,
      departureAirportName: "Nội Bài",
      departureAirportCode: "HAN",
      arrivalAirportId: 2,
      arrivalAirportName: "Tân Sơn Nhất",
      arrivalAirportCode: "SGN",
      remainingUsage: 222,
      isExpired: false,
      isAvailable: true,
    },
    {
      dealId: 3,
      dealCode: "NEWYEAR25",
      title: "Ưu đãi Tết Nguyên Đán",
      discountPercentage: 25,
      minimumOrderAmount: 1500000,
      validFrom: "2025-01-15T00:00:00",
      validTo: "2025-02-28T23:59:59",
      description: "Giảm giá đặc biệt dịp Tết Nguyên Đán",
      maxDiscountAmount: 800000,
      totalUsageLimit: 500,
      usedCount: 500,
      usagePerUser: 2,
      isActive: true,
      createdAt: "2025-01-01T00:00:00",
      updatedAt: "2025-01-01T00:00:00",
      departureAirportId: null,
      departureAirportName: null,
      departureAirportCode: null,
      arrivalAirportId: null,
      arrivalAirportName: null,
      arrivalAirportCode: null,
      remainingUsage: 0,
      isExpired: false,
      isAvailable: false,
    },
    {
      dealId: 4,
      dealCode: "EARLYBIRD",
      title: "Early Bird Special",
      discountPercentage: 10,
      minimumOrderAmount: 800000,
      validFrom: "2024-12-01T00:00:00",
      validTo: "2024-12-31T23:59:59",
      description: "Đặt sớm để nhận ưu đãi",
      maxDiscountAmount: 200000,
      totalUsageLimit: 200,
      usedCount: 45,
      usagePerUser: 1,
      isActive: false,
      createdAt: "2024-11-15T10:00:00",
      updatedAt: "2024-11-15T10:00:00",
      departureAirportId: null,
      departureAirportName: null,
      departureAirportCode: null,
      arrivalAirportId: null,
      arrivalAirportName: null,
      arrivalAirportCode: null,
      remainingUsage: 155,
      isExpired: true,
      isAvailable: false,
    },
  ];

  useEffect(() => {
    fetchDeals();
  }, [currentPage, itemsPerPage, statusFilter]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let filteredDeals = mockDeals;

      if (statusFilter === "active") {
        filteredDeals = mockDeals.filter(
          (deal) => deal.isActive && !deal.isExpired
        );
      } else if (statusFilter === "inactive") {
        filteredDeals = mockDeals.filter((deal) => !deal.isActive);
      } else if (statusFilter === "expired") {
        filteredDeals = mockDeals.filter((deal) => deal.isExpired);
      }

      setDeals(filteredDeals);
      setTotalItems(filteredDeals.length);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDeal = (dealId, dealData) => {
    // API call to update deal
    console.log("Editing deal:", dealId, dealData);
    fetchDeals(); // Refresh data
  };

  const handleDeleteDeal = (dealId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      // API call to delete deal
      console.log("Deleting deal:", dealId);
      fetchDeals(); // Refresh data
    }
  };

  const handleRefresh = () => {
    fetchDeals();
  };

  const handleExport = () => {
    // Logic to export deals data
    console.log("Exporting deals data...");
  };

  const getStatsCards = () => {
    const totalDeals = deals.length;
    const activeDeals = deals.filter(
      (deal) => deal.isActive && !deal.isExpired
    ).length;
    const expiredDeals = deals.filter((deal) => deal.isExpired).length;
    const totalUsage = deals.reduce(
      (sum, deal) => sum + (deal.usedCount || 0),
      0
    );

    return [
      {
        title: "Tổng số Deal",
        value: totalDeals,
        icon: Tag,
        color: "text-blue-600",
      },
      {
        title: "Đang hoạt động",
        value: activeDeals,
        icon: Tag,
        color: "text-green-600",
      },
      {
        title: "Đã hết hạn",
        value: expiredDeals,
        icon: Tag,
        color: "text-red-600",
      },
      {
        title: "Lượt sử dụng",
        value: totalUsage.toLocaleString(),
        icon: TrendingUp,
        color: "text-purple-600",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Deal</h1>
          <p className="text-gray-600">
            Quản lý các ưu đãi và mã giảm giá cho trang web đặt vé máy bay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatsCards().map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm deal theo mã, tiêu đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="expired">Đã hết hạn</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / trang</SelectItem>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Table */}
      <DealTable
        deals={deals}
        searchQuery={searchQuery}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        onEdit={handleEditDeal}
        onDelete={handleDeleteDeal}
        loading={loading}
      />
    </div>
  );
};

export default AdminDealPage;
