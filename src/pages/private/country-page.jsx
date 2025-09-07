import React, { useState, useMemo } from "react";
import CountryModal from "@/components/admin/countries/country-modal";
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
import { countryApi } from "@/apis/country-api";
import { useCountry } from "@/hooks/use-country";
import { toast } from "sonner";

const CountryPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("countryName");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { countries, loading, refresh } = useCountry();

  // Thêm thông báo khi refresh dữ liệu
  const handleRefresh = () => {
    toast.promise(refresh(), {
      loading: "Đang tải lại danh sách...",
      success: "Đã cập nhật danh sách quốc gia!",
      error: "Lỗi khi tải lại danh sách",
    });
  };

  // Filtered and sorted data
  const filteredAndSortedCountries = useMemo(() => {
    let filtered = countries;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (country) =>
          country.countryName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          country.countryCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((country) =>
        statusFilter === "active" ? country.active : !country.active
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "countryCode":
          aValue = a.countryCode || "";
          bValue = b.countryCode || "";
          break;
        case "countryName":
          aValue = a.countryName || "";
          bValue = b.countryName || "";
          break;
        default:
          aValue = a.countryName || "";
          bValue = b.countryName || "";
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [countries, searchTerm, statusFilter, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = filteredAndSortedCountries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCountries = filteredAndSortedCountries.slice(
    startIndex,
    endIndex
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  // Thông báo kết quả tìm kiếm
  React.useEffect(() => {
    if (searchTerm.trim()) {
      const resultCount = filteredAndSortedCountries.length;
      if (resultCount === 0) {
        toast.warning(`Không tìm thấy quốc gia nào cho "${searchTerm}"`);
      } else {
        toast.success(`Tìm thấy ${resultCount} quốc gia cho "${searchTerm}"`);
      }
    }
  }, [searchTerm, filteredAndSortedCountries.length]);

  // Thông báo khi thay đổi bộ lọc trạng thái
  React.useEffect(() => {
    if (statusFilter !== "all") {
      const statusText =
        statusFilter === "active" ? "đang hoạt động" : "ngừng hoạt động";
      const resultCount = filteredAndSortedCountries.length;
      toast.info(`Hiển thị ${resultCount} quốc gia ${statusText}`);
    }
  }, [statusFilter, filteredAndSortedCountries.length]);

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
        countryCode: "mã quốc gia",
        countryName: "tên quốc gia",
      }[field] || field;

    const orderText = sortOrder === "asc" ? "tăng dần" : "giảm dần";
    toast.info(`Sắp xếp theo ${fieldName} ${orderText}`);
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
    toast.info("Mở form thêm quốc gia mới");
  };

  const handleEdit = (country) => {
    setEditData(country);
    setModalOpen(true);
    toast.info(`Chỉnh sửa quốc gia: ${country.countryName}`);
  };

  const handleDelete = async (country) => {
    if (
      window.confirm(`Bạn có chắc muốn xóa quốc gia ${country.countryName}?`)
    ) {
      toast.promise(countryApi.deleteCountry(country.id), {
        loading: "Đang xóa quốc gia...",
        success: (response) => {
          if (response.success) {
            refresh();
            return `Đã xóa quốc gia ${country.countryName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi xóa country:", error);
          return "Lỗi khi xóa quốc gia. Vui lòng thử lại!";
        },
      });
    }
  };

  const handleSubmit = async (formData) => {
    const isUpdate = !!editData;
    const countryName = formData.countryName;

    toast.promise(
      isUpdate
        ? countryApi.updateCountryWithImage(editData.id, formData)
        : countryApi.createCountryWithImage(formData),
      {
        loading: isUpdate
          ? "Đang cập nhật quốc gia..."
          : "Đang thêm quốc gia...",
        success: (response) => {
          if (response.success) {
            setModalOpen(false);
            refresh();
            return isUpdate
              ? `Đã cập nhật quốc gia ${countryName} thành công!`
              : `Đã thêm quốc gia ${countryName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi submit:", error);
          return "Lỗi khi lưu quốc gia. Vui lòng thử lại!";
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Quốc gia</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {totalItems} quốc gia
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
          <Button onClick={handleAdd}>Thêm quốc gia</Button>
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
                placeholder="Tìm kiếm theo tên hoặc mã quốc gia..."
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
                <SelectItem value="countryName-asc">Tên A-Z</SelectItem>
                <SelectItem value="countryName-desc">Tên Z-A</SelectItem>
                <SelectItem value="countryCode-asc">Mã A-Z</SelectItem>
                <SelectItem value="countryCode-desc">Mã Z-A</SelectItem>
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
                  onClick={() => handleSort("countryCode")}
                >
                  <div className="flex items-center gap-2">
                    Mã
                    {sortBy === "countryCode" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("countryName")}
                >
                  <div className="flex items-center gap-2">
                    Tên quốc gia
                    {sortBy === "countryName" && (
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
              {currentCountries.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.countryCode}</TableCell>
                  <TableCell>{c.countryName}</TableCell>
                  <TableCell>
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt={c.countryName}
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
                      className={c.active ? "text-green-600" : "text-gray-400"}
                    >
                      {c.active ? "Hoạt động" : "Ẩn"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(c)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(c)}
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

      <CountryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
          toast.info("Đã đóng form quốc gia");
        }}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
};

export default CountryPage;
