import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/ui/pagination";
import { categoryApi } from "@/apis/category-api";
import { blogApi } from "@/apis/blog-api";
import { toast } from "sonner";
import CategoryFormModal from "./category-form-modal";
import CategoryDetailModal from "./category-detail-modal";

// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

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

  // Blogs modal states
  const [isBlogsModalOpen, setIsBlogsModalOpen] = useState(false);
  const [blogsForCategory, setBlogsForCategory] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [selectedCategoryForBlogs, setSelectedCategoryForBlogs] =
    useState(null);

  // Row selection state
  const [rowSelection, setRowSelection] = useState({});

  // Create column helper
  const columnHelper = createColumnHelper();

  // Column definitions
  const columns = useMemo(
    () => [
      // Selection column
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
      }),

      // Name column
      columnHelper.accessor("name", {
        header: "Tên Category",
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
      }),

      // Slug column
      columnHelper.accessor("slug", {
        header: "Slug",
        cell: (info) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {info.getValue()}
          </Badge>
        ),
      }),

      // Description column
      columnHelper.accessor("description", {
        header: "Mô tả",
        cell: (info) => (
          <div className="text-sm text-gray-900 max-w-xs truncate">
            {info.getValue() || "Chưa có mô tả"}
          </div>
        ),
      }),

      // Blog count column
      columnHelper.accessor("blogCount", {
        header: "Số bài viết",
        cell: (info) => (
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
            onClick={() => handleViewBlogsForCategory(info.row.original)}
          >
            {info.getValue() || 0}
          </Button>
        ),
      }),

      // Status column
      columnHelper.accessor("active", {
        header: "Trạng thái",
        cell: (info) => (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              info.getValue()
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {info.getValue() ? "Hoạt động" : "Không hoạt động"}
          </span>
        ),
      }),

      // Created date column
      columnHelper.accessor("createdAt", {
        header: "Ngày tạo",
        cell: (info) => (
          <div className="text-sm text-gray-500">
            {info.getValue()
              ? new Date(info.getValue()).toLocaleDateString("vi-VN")
              : "N/A"}
          </div>
        ),
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Thao tác",
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewCategory(info.row.original)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditCategory(info.row.original)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleActive(info.row.original)}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                {info.row.original.active ? "Ẩn" : "Hiện"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const categoryId = info.row.original.categoryId;
                  handleDeleteCategory(categoryId);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    []
  );

  // Create table instance
  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    pageCount: totalPages,
    manualPagination: true,
  });

  // Bulk actions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCategories = selectedRows.map((row) => row.original);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;

    const confirmMessage = `Bạn có chắc chắn muốn xóa ${selectedCategories.length} category đã chọn?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedCategories.map((category) =>
        categoryApi.deleteCategory(category.categoryId)
      );

      await Promise.all(deletePromises);

      // Update local state
      setCategories((prevCategories) =>
        prevCategories.filter(
          (cat) =>
            !selectedCategories.some(
              (selected) => selected.categoryId === cat.categoryId
            )
        )
      );

      setRowSelection({});
      toast.success(`Đã xóa ${selectedCategories.length} category thành công!`);
    } catch (error) {
      console.error("Error bulk deleting categories:", error);
      toast.error("Có lỗi xảy ra khi xóa categories");
    }
  };

  // Handle bulk toggle active
  const handleBulkToggleActive = async (newActiveStatus) => {
    if (selectedCategories.length === 0) return;

    const actionText = newActiveStatus ? "hiện" : "ẩn";
    const confirmMessage = `Bạn có chắc chắn muốn ${actionText} ${selectedCategories.length} category đã chọn?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const updatePromises = selectedCategories.map((category) =>
        categoryApi.updateCategory(category.categoryId, {
          name: category.name,
          description: category.description,
          slug: category.slug,
          active: newActiveStatus,
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setCategories((prevCategories) =>
        prevCategories.map((cat) =>
          selectedCategories.some(
            (selected) => selected.categoryId === cat.categoryId
          )
            ? { ...cat, active: newActiveStatus }
            : cat
        )
      );

      setRowSelection({});
      toast.success(
        `Đã ${actionText} ${selectedCategories.length} category thành công!`
      );
    } catch (error) {
      console.error("Error bulk toggling categories:", error);
      toast.error(`Có lỗi xảy ra khi ${actionText} categories`);
    }
  };

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

  // Handle toggle active status
  const handleToggleActive = async (category) => {
    const newActiveStatus = !category.active;
    const actionText = newActiveStatus ? "hiện" : "ẩn";

    try {
      const result = await categoryApi.updateCategory(category.categoryId, {
        name: category.name,
        description: category.description,
        slug: category.slug,
        active: newActiveStatus,
      });

      if (result.success) {
        // Update local state
        setCategories((prevCategories) =>
          prevCategories.map((cat) =>
            cat.categoryId === category.categoryId
              ? { ...cat, active: newActiveStatus }
              : cat
          )
        );
        toast.success(`Đã ${actionText} category ${category.name} thành công!`);
      } else {
        toast.error(result.message || `Không thể ${actionText} category`);
      }
    } catch (error) {
      console.error("Error toggling category active status:", error);
      toast.error(`Có lỗi xảy ra khi ${actionText} category`);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa category này?")) {
      return;
    }

    try {
      const result = await categoryApi.deleteCategory(categoryId);

      if (result.success) {
        // Update local state
        setCategories((prevCategories) =>
          prevCategories.filter((cat) => cat.categoryId !== categoryId)
        );
        toast.success("Đã xóa category thành công!");
      } else {
        toast.error(result.message || "Không thể xóa category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Có lỗi xảy ra khi xóa category");
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingCategory(null);
    fetchCategories(currentPage, itemsPerPage, searchTerm);
  };

  // Handle view blogs for category
  const handleViewBlogsForCategory = async (category) => {
    setSelectedCategoryForBlogs(category);
    setIsBlogsModalOpen(true);
    setBlogsLoading(true);

    try {
      const result = await blogApi.getBlogsByCategory(category.slug, {
        page: 0,
        size: 20, // Show up to 20 blogs
        sort: "createdAt,desc",
      });

      if (result.success && result.data) {
        setBlogsForCategory(result.data.content || []);
      } else {
        setBlogsForCategory([]);
        toast.error("Không thể tải danh sách bài viết");
      }
    } catch (error) {
      console.error("Error fetching blogs for category:", error);
      setBlogsForCategory([]);
      toast.error("Có lỗi xảy ra khi tải danh sách bài viết");
    } finally {
      setBlogsLoading(false);
    }
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

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn {selectedRows.length} category
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRowSelection({})}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Bỏ chọn
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(true)}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <Eye className="h-4 w-4 mr-2" />
                Hiện ({selectedRows.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(false)}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Ẩn ({selectedRows.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa ({selectedRows.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {searchTerm
                    ? "Không tìm thấy category nào"
                    : "Chưa có category nào"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalElements}
              onPageChange={handlePageChange}
              onPageSizeChange={handleItemsPerPageChange}
              showPageSizeSelector={false}
              showInfo={false}
            />
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

      {/* Blogs Modal */}
      <Dialog open={isBlogsModalOpen} onOpenChange={setIsBlogsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bài viết trong category: {selectedCategoryForBlogs?.name}
            </DialogTitle>
            <DialogDescription>
              Danh sách tất cả bài viết thuộc category "
              {selectedCategoryForBlogs?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {blogsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">
                  Đang tải danh sách bài viết...
                </p>
              </div>
            ) : blogsForCategory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Không có bài viết nào trong category này</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blogsForCategory.map((blog) => (
                  <div
                    key={blog.blogId}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex space-x-2 items-center">
                      {blog.featuredImage && (
                        <div className="mt-3">
                          <img
                            src={blog.featuredImage}
                            alt={blog.title}
                            className="w-28 h-28 object-cover rounded-md"
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 mb-2">
                            {blog.title}
                          </h3>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Lượt xem: {blog.viewCount || 0}</span>
                            <span>Lượt thích: {blog.likeCount || 0}</span>
                            <span>
                              Ngày đăng:{" "}
                              {new Date(
                                blog.publishedDate || blog.createdAt
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Badge
                            variant={blog.isPublished ? "default" : "secondary"}
                          >
                            {blog.isPublished ? "Đã đăng" : "Chưa đăng"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryTable;
