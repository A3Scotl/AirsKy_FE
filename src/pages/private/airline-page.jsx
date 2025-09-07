import React, { useState, useMemo } from "react";
import AirlineModal from "@/components/admin/airlines/airline-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Trash2,
  Pencil,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { airlineApi } from "@/apis/airline-api";
import { useAirline } from "@/hooks/use-airline";
import { toast } from "sonner";

const AirlinePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("airlineName");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { airlines, loading, refresh } = useAirline();

  // Thêm thông báo khi refresh dữ liệu
  const handleRefresh = () => {
    toast.promise(refresh(), {
      loading: "Đang tải lại danh sách...",
      success: "Đã cập nhật danh sách hãng bay!",
      error: "Lỗi khi tải lại danh sách",
    });
  };

  // Filtered and sorted data
  const filteredAndSortedAirlines = useMemo(() => {
    let filtered = airlines;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (airline) =>
          airline.airlineName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          airline.airlineCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          airline.contact.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((airline) =>
        statusFilter === "active" ? airline.active : !airline.active
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "airlineCode":
          aValue = a.airlineCode || "";
          bValue = b.airlineCode || "";
          break;
        case "airlineName":
          aValue = a.airlineName || "";
          bValue = b.airlineName || "";
          break;
        case "contact":
          aValue = a.contact || "";
          bValue = b.contact || "";
          break;
        default:
          aValue = a.airlineName || "";
          bValue = b.airlineName || "";
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [airlines, searchTerm, statusFilter, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = filteredAndSortedAirlines.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAirlines = filteredAndSortedAirlines.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  // Thông báo kết quả tìm kiếm
  React.useEffect(() => {
    if (searchTerm.trim()) {
      const resultCount = filteredAndSortedAirlines.length;
      if (resultCount === 0) {
        toast.warning(`Không tìm thấy hãng bay nào cho "${searchTerm}"`);
      } else {
        toast.success(`Tìm thấy ${resultCount} hãng bay cho "${searchTerm}"`);
      }
    }
  }, [searchTerm, filteredAndSortedAirlines.length]);

  // Thông báo khi thay đổi bộ lọc trạng thái
  React.useEffect(() => {
    if (statusFilter !== "all") {
      const statusText =
        statusFilter === "active" ? "đang hoạt động" : "ngừng hoạt động";
      const resultCount = filteredAndSortedAirlines.length;
      toast.info(`Hiển thị ${resultCount} hãng bay ${statusText}`);
    }
  }, [statusFilter, filteredAndSortedAirlines.length]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }

    // Thông báo sắp xếp
    const fieldName =
      {
        airlineCode: "mã hãng bay",
        airlineName: "tên hãng bay",
        contact: "liên hệ",
      }[field] || field;

    const orderText = sortOrder === "asc" ? "tăng dần" : "giảm dần";
    toast.info(`Sắp xếp theo ${fieldName} ${orderText}`);
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
    toast.info("Mở form thêm hãng bay mới");
  };
  const handleEdit = (airline) => {
    setEditData(airline);
    setModalOpen(true);
    toast.info(`Chỉnh sửa hãng bay: ${airline.airlineName}`);
  };
  const handleDelete = async (airline) => {
    if (
      window.confirm(`Bạn có chắc muốn xóa hãng bay ${airline.airlineName}?`)
    ) {
      toast.promise(airlineApi.deleteAirline(airline.airlineId), {
        loading: "Đang xóa hãng bay...",
        success: (response) => {
          if (response.success) {
            refresh();
            return `Đã xóa hãng bay ${airline.airlineName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi xóa airline:", error);
          return "Lỗi khi xóa hãng bay. Vui lòng thử lại!";
        },
      });
    }
  };
  const handleSubmit = async (formData) => {
    const isUpdate = !!editData;
    const airlineName = formData.airlineName;

    toast.promise(
      isUpdate
        ? airlineApi.updateAirlineWithImage(editData.airlineId, formData)
        : airlineApi.createAirlineWithImage(formData),
      {
        loading: isUpdate
          ? "Đang cập nhật hãng bay..."
          : "Đang thêm hãng bay...",
        success: (response) => {
          if (response.success) {
            setModalOpen(false);
            refresh();
            return isUpdate
              ? `Đã cập nhật hãng bay ${airlineName} thành công!`
              : `Đã thêm hãng bay ${airlineName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi submit:", error);
          return "Lỗi khi lưu hãng bay. Vui lòng thử lại!";
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Hãng bay</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {totalItems} hãng bay
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={handleAdd}>Thêm hãng bay</Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên, mã hoặc liên hệ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="w-full lg:w-48">
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airlineName-asc">Tên A-Z</SelectItem>
                <SelectItem value="airlineName-desc">Tên Z-A</SelectItem>
                <SelectItem value="airlineCode-asc">Mã A-Z</SelectItem>
                <SelectItem value="airlineCode-desc">Mã Z-A</SelectItem>
                <SelectItem value="contact-asc">Liên hệ A-Z</SelectItem>
                <SelectItem value="contact-desc">Liên hệ Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("airlineCode")}
                >
                  <div className="flex items-center gap-2">
                    Mã
                    {sortBy === "airlineCode" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("airlineName")}
                >
                  <div className="flex items-center gap-2">
                    Tên hãng bay
                    {sortBy === "airlineName" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("contact")}
                >
                  <div className="flex items-center gap-2">
                    Liên hệ
                    {sortBy === "contact" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Ảnh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAirlines.map((a) => (
                <TableRow key={a.airlineId}>
                  <TableCell className="font-mono">{a.airlineCode}</TableCell>
                  <TableCell>{a.airlineName}</TableCell>
                  <TableCell>{a.contact}</TableCell>
                  <TableCell>
                    {a.thumbnail ? (
                      <img
                        src={a.thumbnail}
                        alt={a.airlineName}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        No Image
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={a.active ? "text-green-600" : "text-gray-400"}
                    >
                      {a.active ? "Hoạt động" : "Ẩn"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(a)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(a)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showPageSizeSelector={true}
          showInfo={true}
        />
      )}

      <AirlineModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
          toast.info("Đã đóng form hãng bay");
        }}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
};

export default AirlinePage;
