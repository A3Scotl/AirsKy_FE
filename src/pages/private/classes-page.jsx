import React, { useState, useMemo, useEffect } from "react";
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
import { Loader2, Trash2, Pencil, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { classesApi } from "@/apis/classes-api";
import { handleFetch } from "@/utils/fetch-helper.js";
import { toast } from "sonner";
// import TravelClassModal from "@/components/admin/travel-classes/travel-class-modal"; // Assuming a modal for travel classes

const ClassesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [travelClasses, setTravelClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search, Filter, Sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // For refundable/changeable status
  const [sortBy, setSortBy] = useState("className");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch travel classes on mount
  useEffect(() => {
    handleFetch({
      apiCall: classesApi.getAllClasses, // Adjust to your actual API method
      setData: (data)=> setTravelClasses(data?.content),
      setLoading,
      errorMessage: "Failed to fetch travel classes",
    });
  }, []);

  // Filtered and sorted data
  const filteredAndSortedTravelClasses = useMemo(() => {
    let filtered = travelClasses;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (travelClass) =>
          travelClass.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          travelClass.benefits?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter (e.g., refundable or changeable)
    if (statusFilter !== "all") {
      filtered = filtered.filter((travelClass) => {
        if (statusFilter === "refundable") return travelClass.refundable === true;
        if (statusFilter === "non_refundable") return travelClass.refundable === false;
        if (statusFilter === "changeable") return travelClass.changeable === true;
        if (statusFilter === "non_changeable") return travelClass.changeable === false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "className":
          aValue = a.className || "";
          bValue = b.className || "";
          break;
        case "priceMultiplier":
          aValue = a.priceMultiplier || 0;
          bValue = b.priceMultiplier || 0;
          break;
        default:
          aValue = a.className || "";
          bValue = b.className || "";
      }

      if (sortBy === "priceMultiplier") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });

    return filtered;
  }, [travelClasses, searchTerm, statusFilter, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = filteredAndSortedTravelClasses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTravelClasses = filteredAndSortedTravelClasses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

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
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const handleEdit = (travelClass) => {
    setEditData(travelClass);
    setModalOpen(true);
  };

  const handleDelete = async (travelClass) => {
    if (window.confirm(`Are you sure you want to delete travel class ${travelClass.className}?`)) {
      try {
        const response = await classesApi.deleteTravelClass(travelClass.classId);
        if (response.success) {
          toast.success(`Travel class ${travelClass.className} deleted successfully`);
          // Refresh the list
          handleFetch({
            apiCall: classesApi.getAllTravelClasses,
            setData: setTravelClasses,
            setLoading,
            errorMessage: "Failed to fetch travel classes",
          });
        } else {
          toast.error(`Error deleting travel class: ${response.message}`);
        }
      } catch (error) {
        console.error("Error deleting travel class:", error);
        toast.error("Error deleting travel class");
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (editData) {
        // Update
        response = await classesApi.updateTravelClass(editData.classId, formData);
      } else {
        // Create
        response = await classesApi.createTravelClass(formData);
      }

      if (response.success) {
        toast.success(`Travel class ${editData ? "updated" : "created"} successfully`);
        setModalOpen(false);
        // Refresh the list
        handleFetch({
          apiCall: classesApi.getAllTravelClasses,
          setData: setTravelClasses,
          setLoading,
          errorMessage: "Failed to fetch travel classes",
        });
      } else {
        toast.error(`Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Error submitting travel class:", error);
      toast.error("Error saving travel class");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Hạng vé</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {totalItems} hạng vé
          </p>
        </div>
        <Button onClick={handleAdd}>Thêm hạng vé</Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên , quyền lợi..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="refundable">Được hoàn trả</SelectItem>
                <SelectItem value="non_refundable">Không được hoàn trả</SelectItem>
                <SelectItem value="changeable">Có thể đổi vé</SelectItem>
                <SelectItem value="non_changeable">Không thể đổi vé</SelectItem>
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
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="className-asc">Tên A-Z</SelectItem>
                <SelectItem value="className-desc">Tên Z-A</SelectItem>
                <SelectItem value="priceMultiplier-asc">Nhân giá Low-High</SelectItem>
                <SelectItem value="priceMultiplier-desc">Nhân giá High-Low</SelectItem>
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
                  onClick={() => handleSort("className")}
                >
                  <div className="flex items-center gap-2">
                    Hạng vé
                    {sortBy === "className" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Quyền lợi</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort("priceMultiplier")}
                >
                  <div className="flex items-center gap-2">
                    Nhân giá
                    {sortBy === "priceMultiplier" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
                <TableHead>Hoàn trả</TableHead>
                <TableHead>Đổi vé</TableHead>
                <TableHead>Phí hủy</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentTravelClasses.map((tc) => (
                <TableRow key={tc.classId}>
                  <TableCell>{tc.className}</TableCell>
                  <TableCell>{tc.benefits || "N/A"}</TableCell>
                  <TableCell>{tc.priceMultiplier?.toFixed(2) || "N/A"}</TableCell>
                  <TableCell>
                    <span className={tc.refundable ? "text-green-600" : "text-gray-400"}>
                      {tc.refundable ? "Co" : "Không"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={tc.changeable ? "text-green-600" : "text-gray-400"}>
                      {tc.changeable ? "Có" : "Không"}
                    </span>
                  </TableCell>
                  <TableCell>{tc.cancellationFee ? `$${tc.cancellationFee.toFixed(2)}` : "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tc)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(tc)}
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

      {/* <TravelClassModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editData}
      /> */}
    </div>
  );
};

export default ClassesPage;