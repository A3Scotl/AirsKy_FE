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
import { dealApi } from "@/apis/deal-api";
import DealTable, { getDealStatus } from "@/components/admin/deals/deal-table";
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

import { toast } from "sonner";

const AdminDealPage = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalDealsInSystem, setTotalDealsInSystem] = useState(0);

  useEffect(() => {
    fetchDeals();
    fetchTotalDealsCount();
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  const fetchTotalDealsCount = async () => {
    try {
      // Lấy tất cả deal không phân trang để có tổng số
      const params = {
        page: 0,
        size: 1, // Chỉ lấy 1 item để có thông tin tổng số
        sort: "createdAt,desc",
      };
      const res = await dealApi.getAllDeals(params);
      if (res.success && res.data) {
        setTotalDealsInSystem(res.data.totalElements || 0);
      }
    } catch (error) {
      console.error("Error fetching total deals count:", error);
      setTotalDealsInSystem(0);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage - 1,
        size: itemsPerPage,
        sort: "createdAt,desc",
      };
      const res = await dealApi.getAllDeals(params);
      if (res.success && res.data && res.data.content) {
        let apiDeals = res.data.content;
        let filteredDeals = apiDeals;

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filteredDeals = filteredDeals.filter(
            (deal) =>
              deal.dealCode?.toLowerCase().includes(query) ||
              deal.title?.toLowerCase().includes(query) ||
              deal.description?.toLowerCase().includes(query)
          );
        }

        // Filter by status
        if (statusFilter !== "all") {
          let statusMap = {
            active: "ĐANG HOẠT ĐỘNG",
            inactive: "KHÔNG XÁC ĐỊNH",
            expired: "ĐÃ HẾT HẠN",
            soon: "SẮP HOẠT ĐỘNG",
            usedup: "HẾT LƯỢT SỬ DỤNG",
          };
          filteredDeals = filteredDeals.filter(
            (deal) => getDealStatus(deal) === statusMap[statusFilter]
          );
        }
        setDeals(filteredDeals);
        setTotalItems(res.data.totalElements || filteredDeals.length);
        setTotalDealsInSystem(res.data.totalElements || filteredDeals.length);
      } else {
        setDeals([]);
        setTotalItems(0);
        toast.warning("Không có dữ liệu deal");
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Không thể tải danh sách deal");
      setDeals([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  // Thêm deal mới
  const handleAddDeal = async (dealData) => {
    try {
      const formData = new FormData();
      // Các trường bắt buộc
      formData.append("dealCode", dealData.dealCode);
      formData.append("title", dealData.title);
      formData.append("discountPercentage", dealData.discountPercentage);
      formData.append("minimumOrderAmount", dealData.minimumOrderAmount);
      formData.append("validFrom", dealData.validFrom);
      formData.append("validTo", dealData.validTo);
      // Các trường tuỳ chọn
      if (dealData.description)
        formData.append("description", dealData.description);
      if (
        dealData.maxDiscountAmount !== null &&
        dealData.maxDiscountAmount !== undefined
      )
        formData.append("maxDiscountAmount", dealData.maxDiscountAmount);
      if (
        dealData.totalUsageLimit !== null &&
        dealData.totalUsageLimit !== undefined
      )
        formData.append("totalUsageLimit", dealData.totalUsageLimit);
      if (dealData.usagePerUser !== null && dealData.usagePerUser !== undefined)
        formData.append("usagePerUser", dealData.usagePerUser);
      if (dealData.isActive !== undefined)
        formData.append("isActive", dealData.isActive);
      if (dealData.departureAirportId)
        formData.append("departureAirportId", dealData.departureAirportId);
      if (dealData.arrivalAirportId)
        formData.append("arrivalAirportId", dealData.arrivalAirportId);
      // Ảnh (nếu có)
      if (dealData.thumbnailFile instanceof File) {
        formData.append("thumbnail", dealData.thumbnailFile);
      } else if (
        dealData.thumbnail &&
        !dealData.thumbnail.startsWith("blob:")
      ) {
        // Nếu là nhập url thủ công (không phải blob preview)
        formData.append("thumbnail", dealData.thumbnail);
      }

      const res = await dealApi.createDeal(formData);

      if (res.success) {
        toast.success("Tạo deal thành công!");
        fetchDeals();
        fetchTotalDealsCount();
      } else {
        toast.error(res.message || "Tạo deal thất bại");
      }
    } catch (err) {
      console.error("Error creating deal:", err);
      toast.error("Có lỗi khi tạo deal");
    }
  };

  // Cập nhật deal
  const handleEditDeal = async (dealId, dealData) => {
    try {
      const formData = new FormData();
      formData.append("dealCode", dealData.dealCode);
      formData.append("title", dealData.title);
      formData.append("discountPercentage", dealData.discountPercentage);
      formData.append("minimumOrderAmount", dealData.minimumOrderAmount);
      formData.append("validFrom", dealData.validFrom);
      formData.append("validTo", dealData.validTo);
      if (dealData.description)
        formData.append("description", dealData.description);
      if (
        dealData.maxDiscountAmount !== null &&
        dealData.maxDiscountAmount !== undefined
      )
        formData.append("maxDiscountAmount", dealData.maxDiscountAmount);
      if (
        dealData.totalUsageLimit !== null &&
        dealData.totalUsageLimit !== undefined
      ) {
        formData.append("totalUsageLimit", dealData.totalUsageLimit);
      }

      if (dealData.usagePerUser !== null && dealData.usagePerUser !== undefined)
        formData.append("usagePerUser", dealData.usagePerUser);
      if (dealData.isActive !== undefined)
        formData.append("isActive", dealData.isActive);
      if (dealData.departureAirportId)
        formData.append("departureAirportId", dealData.departureAirportId);
      if (dealData.arrivalAirportId)
        formData.append("arrivalAirportId", dealData.arrivalAirportId);
      if (dealData.thumbnailFile instanceof File) {
        formData.append("thumbnail", dealData.thumbnailFile);
      } else if (
        dealData.thumbnail &&
        !dealData.thumbnail.startsWith("blob:")
      ) {
        formData.append("thumbnail", dealData.thumbnail);
      }

      const res = await dealApi.updateDeal(dealId, formData);
      if (res.success) {
        toast.success("Cập nhật deal thành công!");
        fetchDeals();
        fetchTotalDealsCount();
      } else {
        toast.error(res.message || "Cập nhật deal thất bại");
      }
    } catch (err) {
      console.error("Error updating deal:", err);
      toast.error("Có lỗi khi cập nhật deal");
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa deal này?")) {
      try {
        const res = await dealApi.deleteDeal(dealId);
        if (res.success) {
          toast.success("Xóa deal thành công!");
          fetchDeals();
          fetchTotalDealsCount();
        } else {
          toast.error(res.message || "Xóa deal thất bại");
        }
      } catch (err) {
        console.error("Error deleting deal:", err);
        toast.error("Có lỗi khi xóa deal");
      }
    }
  };

  const handleRefresh = () => {
    toast.info("Đang làm mới dữ liệu...");
    fetchDeals();
    fetchTotalDealsCount();
  };

  const getStatsCards = () => {
    const totalDeals = totalDealsInSystem;
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
      <div className="flex items-center flex-wrap gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Deal</h1>
          <p className="text-gray-600">
            Quản lý các ưu đãi và mã giảm giá cho trang web đặt vé máy bay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
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
                  <p className="text-sm font-medium text-gray-600 dark:text-white">
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
                  <SelectItem value="soon">Sắp hoạt động</SelectItem>
                  <SelectItem value="expired">Đã hết hạn</SelectItem>
                  <SelectItem value="usedup">Hết lượt sử dụng</SelectItem>
                  <SelectItem value="inactive">Không xác định</SelectItem>
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
        onAdd={handleAddDeal}
        onDelete={handleDeleteDeal}
        loading={loading}
      />
    </div>
  );
};

export default AdminDealPage;
