import { useState, useMemo } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  ThumbsUp,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import BlogFormModal from "./blog-form-modal";
import BlogDetailModal from "./blog-detail-modal";
import BlogTableSkeleton from "./blog-table-skeleton";
import { blogApi } from "@/apis/blog-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Pagination from "@/components/ui/pagination";

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

const BlogTable = ({
  blogs,
  searchQuery,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onAdd,
  onEdit,
  onDelete,
  loading,
  onRefresh,
}) => {
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formMode, setFormMode] = useState("add");

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

      // Title column
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Tiêu đề
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <div className="space-y-1">
            <div className="font-medium truncate max-w-xs">
              {info.getValue()}
            </div>
            <div className="text-sm text-muted-foreground truncate max-w-xs">
              {info.row.original.excerpt}
            </div>
          </div>
        ),
      }),

      // Categories column
      columnHelper.accessor("categories", {
        header: "Danh mục",
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {info.getValue()?.map((category) => (
              <Badge key={category.categoryId} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
        ),
      }),

      // Status column
      columnHelper.accessor("isPublished", {
        header: "Trạng thái",
        cell: (info) => (
          <Badge
            variant={info.getValue() ? "success" : "secondary"}
            className="flex items-center gap-1 w-fit"
          >
            {info.getValue() ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {info.getValue() ? "Đã xuất bản" : "Bản nháp"}
          </Badge>
        ),
      }),

      // View count column
      columnHelper.accessor("viewCount", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Lượt xem
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            {info.getValue() || 0}
          </div>
        ),
      }),

      // Like count column
      columnHelper.accessor("likeCount", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Lượt thích
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            {info.getValue() || 0}
          </div>
        ),
      }),

      // Created date column
      columnHelper.accessor("createdAt", {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Ngày tạo
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: (info) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  {formatDate(info.getValue())}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatDateTime(info.getValue())}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleViewBlog(info.row.original)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditBlog(info.row.original)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleTogglePublish(info.row.original)}
                className="flex items-center gap-2"
              >
                {info.row.original.isPublished ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {info.row.original.isPublished ? "Hủy đăng" : "Xuất bản"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteBlog(info.row.original)}
                className="flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
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
    data: blogs || [],
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
    pageCount: Math.ceil(totalItems / itemsPerPage),
    manualPagination: true,
    manualSorting: true,
  });

  // Bulk actions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedBlogs = selectedRows.map((row) => row.original);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) return;

    const confirmMessage = `Bạn có chắc chắn muốn xóa ${selectedBlogs.length} bài viết đã chọn?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedBlogs.map((blog) =>
        blogApi.deleteBlog(blog.blogId)
      );

      await Promise.all(deletePromises);

      // Update local state
      setRowSelection({});
      toast.success(`Đã xóa ${selectedBlogs.length} bài viết thành công!`);
      onRefresh?.();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa bài viết");
    }
  };

  // Handle bulk publish
  const handleBulkPublish = async (publish = true) => {
    if (selectedBlogs.length === 0) return;

    const actionText = publish ? "xuất bản" : "hủy đăng";
    const confirmMessage = `Bạn có chắc chắn muốn ${actionText} ${selectedBlogs.length} bài viết đã chọn?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const updatePromises = selectedBlogs.map((blog) =>
        publish
          ? blogApi.publishBlog(blog.blogId)
          : blogApi.unpublishBlog(blog.blogId)
      );

      await Promise.all(updatePromises);

      // Update local state immediately
      const updatedBlogs = blogs.map((blog) => {
        const isSelected = selectedBlogs.some(
          (selected) => selected.blogId === blog.blogId
        );
        if (isSelected) {
          return { ...blog, isPublished: publish };
        }
        return blog;
      });

      // Update parent component's blogs state
      onEdit?.(null, { bulkUpdate: true, updatedBlogs });

      // Clear selection and show success
      setRowSelection({});
      toast.success(
        `Đã ${actionText} ${selectedBlogs.length} bài viết thành công!`
      );

      // Refresh data from server
      onRefresh?.();
    } catch (error) {
      toast.error(`Có lỗi xảy ra khi ${actionText} bài viết`);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    // Reset to page 1 when changing items per page to avoid showing empty data
    onPageChange(1);
    onItemsPerPageChange(newItemsPerPage);
  };

  const handleAddBlog = () => {
    setSelectedBlog(null);
    setFormMode("add");
    setShowFormModal(true);
  };

  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);
    setFormMode("edit");
    setShowFormModal(true);
  };

  const handleViewBlog = (blog) => {
    setSelectedBlog(blog);
    setShowDetailModal(true);
  };

  // Nhận thêm isFormData để phân biệt loại dữ liệu
  const handleSaveBlog = async (blogData, isFormData = false) => {
    try {
      if (formMode === "add") {
        // Call API to create blog
        const response = await blogApi.createBlog(blogData);
        if (response.success) {
          onAdd?.(response.data);
          setShowFormModal(false);
          toast.success("Tạo bài viết thành công!");
        } else {
          toast.error("Lỗi tạo bài viết: " + response.message);
        }
      } else {
        // Call API to update blog
        const response = await blogApi.updateBlog(
          selectedBlog.blogId,
          blogData
        );
        if (response.success) {
          onEdit?.(selectedBlog.blogId, response.data);
          setShowFormModal(false);
          toast.success("Cập nhật bài viết thành công!");
        } else {
          toast.error("Lỗi cập nhật bài viết: " + response.message);
        }
      }
      // Don't close modal here, let success case handle it
    } catch (error) {
      toast.error("Lỗi kết nối API: " + error.message);
    }
  };

  const handleDeleteBlog = async (blogOrId) => {
    let blogId;

    if (typeof blogOrId === "object" && blogOrId.blogId) {
      blogId = blogOrId.blogId;
    } else {
      blogId = blogOrId;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        const response = await blogApi.deleteBlog(blogId);
        if (response.success) {
          onDelete?.(blogId);
          toast.success("Xóa bài viết thành công!");
        } else {
          toast.error("Lỗi xóa bài viết: " + response.message);
        }
      } catch (error) {
        toast.error("Lỗi kết nối API: " + error.message);
      }
    }
  };

  const handleTogglePublish = async (blogOrId, isPublished) => {
    let blogId, currentIsPublished;

    if (typeof blogOrId === "object" && blogOrId.blogId) {
      // If it's a blog object
      blogId = blogOrId.blogId;
      currentIsPublished = blogOrId.isPublished;
    } else {
      // If it's just an ID
      blogId = blogOrId;
      currentIsPublished = isPublished;
    }

    try {
      const response = currentIsPublished
        ? await blogApi.unpublishBlog(blogId)
        : await blogApi.publishBlog(blogId);

      if (response.success) {
        onEdit?.(blogId, { isPublished: !currentIsPublished });
        toast.success(
          `Bài viết đã ${currentIsPublished ? "hủy đăng" : "đăng"} thành công!`
        );
      } else {
        toast.error(
          `Lỗi ${currentIsPublished ? "hủy đăng" : "đăng"} bài viết: ` +
            response.message
        );
      }
    } catch (error) {
      toast.error("Lỗi kết nối API: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quản lý Blog ({totalItems} bài viết)
          </CardTitle>
          <Button onClick={handleAddBlog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Thêm Blog
          </Button>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Bar */}
          {selectedRows.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-900">
                    Đã chọn {selectedRows.length} bài viết
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
                    onClick={() => handleBulkPublish(true)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xuất bản ({selectedRows.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkPublish(false)}
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Hủy đăng ({selectedRows.length})
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

          <div className="rounded-md border">
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
                {loading ? (
                  <BlogTableSkeleton />
                ) : table.getRowModel().rows?.length ? (
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
                      Không có blog nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {Math.ceil(totalItems / itemsPerPage) > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={onPageChange}
                onPageSizeChange={handleItemsPerPageChange}
                showPageSizeSelector={true}
                showInfo={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <BlogFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedBlog(null);
        }}
        onSave={handleSaveBlog}
        blog={selectedBlog}
        mode={formMode}
      />

      <BlogDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBlog(null);
        }}
        blog={selectedBlog}
      />
    </div>
  );
};

export default BlogTable;
