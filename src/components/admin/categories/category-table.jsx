import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { categoryApi } from "@/apis/category-api";
import CategoryFormModal from "./category-form-modal";
import CategoryDetailModal from "./category-detail-modal";

const CategoryTable = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch categories from API
  const fetchCategories = async (page = 1, size = 10, search = "") => {
    try {
      setLoading(true);
      setError(null);

      const result = await categoryApi.getAllCategories({
        page: page - 1, // Backend uses 0-based pagination
        size,
        sort: "createdAt,desc",
      });

      if (result.success && result.data) {
        let filteredData = result.data.content || [];

        // Debug: Log the first category to see the structure
        if (filteredData.length > 0) {
          console.log("Sample category data:", filteredData[0]);
        }

        // Client-side search if needed
        if (search.trim()) {
          filteredData = filteredData.filter(
            (category) =>
              category.name?.toLowerCase().includes(search.toLowerCase()) ||
              category.description
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
              category.slug?.toLowerCase().includes(search.toLowerCase())
          );
        }

        setCategories(filteredData);
        setTotalPages(result.data.totalPages || 1);
        setTotalElements(result.data.totalElements || filteredData.length);
      } else {
        setError(result.message || "Không thể tải danh sách category");
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Có lỗi xảy ra khi tải danh sách category");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(currentPage, itemsPerPage, searchTerm);
  }, [currentPage, itemsPerPage]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    fetchCategories(1, itemsPerPage, searchTerm);
  };

  // Handle search on Enter
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle create category
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  // Handle view category
  const handleViewCategory = (category) => {
    setSelectedCategory(category);
    setIsDetailModalOpen(true);
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa category này?")) {
      return;
    }

    try {
      const result = await categoryApi.deleteCategory(categoryId);
      if (result.success) {
        // Refresh data
        fetchCategories(currentPage, itemsPerPage, searchTerm);
      } else {
        alert(result.message || "Không thể xóa category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Có lỗi xảy ra khi xóa category");
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
    fetchCategories(currentPage, itemsPerPage, searchTerm);
  };

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Quản lý Category
          </h2>
          <p className="text-sm text-gray-600">
            Quản lý các thể loại blog ({totalElements} category)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Tìm kiếm category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full sm:w-64"
            />
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Create button */}
          <Button onClick={handleCreateCategory} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Thêm Category
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "Không tìm thấy category nào"
                      : "Chưa có category nào"}
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const categoryId = category.categoryId;
                  return (
                    <tr key={categoryId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {category.slug}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {category.description || "Chưa có mô tả"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewCategory(category)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditCategory(category)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const categoryId = category.categoryId;
                              handleDeleteCategory(categoryId);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Hiển thị</span>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-700">
                trên {totalElements} kết quả
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Trước
              </Button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      size="sm"
                      variant={
                        currentPage === pageNumber ? "default" : "outline"
                      }
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSuccess={handleFormSuccess}
      />

      <CategoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
};

export default CategoryTable;

