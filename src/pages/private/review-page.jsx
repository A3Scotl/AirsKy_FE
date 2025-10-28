import React, { useState, useMemo, useCallback } from "react";
import ReviewDetailsModal from "@/components/admin/reviews/review-details-modal";
import ReviewTableSkeleton from "@/components/admin/reviews/review-table-skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  RotateCcw,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Pagination from "@/components/ui/pagination";
import { reviewApi } from "@/apis/review-api";
import { toast } from "sonner";
import ExportButton from "@/components/common/export-button";

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

const ReviewPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // TanStack Table states
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    approvedReviews: 0,
    rejectedReviews: 0,
    averageRating: 0,
  });

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: 0,
        size: 1000, // Fetch all reviews for client-side filtering
      };

      const response = await reviewApi.getAllReviews(params);

      if (response.success) {
        setReviews(response.data.content || []);
        setTotalElements(response.data.totalElements || 0);
      } else {
        console.error("Failed to fetch reviews:", response.message);
        setReviews([]);
        setTotalElements(0);
        toast.error("Không thể tải danh sách đánh giá");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
      setTotalElements(0);
      toast.error("Lỗi khi tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch review statistics
  const fetchReviewStats = useCallback(async () => {
    if (reviews.length > 0) {
      const totalReviews = reviews.length;
      const approvedReviews = reviews.filter(
        (review) => review.isApproved === true
      ).length;
      const rejectedReviews = reviews.filter(
        (review) => review.isApproved === false || review.isApproved === null
      ).length;
      const averageRating =
        totalReviews > 0
          ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
            totalReviews
          : 0;

      setReviewStats({
        totalReviews,
        approvedReviews,
        rejectedReviews,
        averageRating,
      });
    }
  }, [reviews]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  React.useEffect(() => {
    fetchReviewStats();
  }, [fetchReviewStats]);

  // Create column helper
  const columnHelper = createColumnHelper();

  // Memoized handlers
  const handleViewDetails = useCallback((review) => {
    setSelectedReview(review);
    setModalOpen(true);
  }, []);

  const handleApproveReview = useCallback(
    async (reviewId) => {
      toast.promise(
        (async () => {
          const response = await reviewApi.approveReview(reviewId);
          if (response.success) {
            fetchReviews();
            fetchReviewStats();
            return response;
          } else {
            throw new Error(response.message);
          }
        })(),
        {
          loading: "Đang duyệt đánh giá...",
          success: "Đã duyệt đánh giá thành công!",
          error: "Lỗi khi duyệt đánh giá",
        }
      );
    },
    [fetchReviews, fetchReviewStats]
  );

  const handleRejectReview = useCallback(
    async (reviewId) => {
      toast.promise(
        (async () => {
          const response = await reviewApi.rejectReview(reviewId);
          if (response.success) {
            fetchReviews();
            fetchReviewStats();
            return response;
          } else {
            throw new Error(response.message);
          }
        })(),
        {
          loading: "Đang từ chối đánh giá...",
          success: "Đã từ chối đánh giá thành công!",
          error: "Lỗi khi từ chối đánh giá",
        }
      );
    },
    [fetchReviews, fetchReviewStats]
  );

  const handleDeleteReview = useCallback(
    async (review) => {
      if (
        window.confirm(
          `Bạn có chắc muốn xóa hẳn đánh giá của ${review.userName}?`
        )
      ) {
        toast.promise(reviewApi.deleteReview(review.reviewId), {
          loading: "Đang xóa đánh giá...",
          success: (response) => {
            if (response.success) {
              fetchReviews();
              fetchReviewStats();
              return `Đã xóa hẳn đánh giá thành công!`;
            } else {
              throw new Error(response.message);
            }
          },
          error: (error) => {
            console.error("Lỗi xóa review:", error);
            return "Lỗi khi xóa đánh giá. Vui lòng thử lại!";
          },
        });
      }
    },
    [fetchReviews, fetchReviewStats]
  );

  // Render star rating
  const renderStars = useCallback((rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  }, []);

  // Get status badge
  const getStatusBadge = useCallback((isApproved) => {
    if (isApproved === true) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã duyệt
        </span>
      );
    } else if (isApproved === false) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Đã từ chối
        </span>
      );
    } else {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Đã từ chối
        </span>
      );
    }
  }, []);

  // Column definitions (memoized)
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

      // User column
      columnHelper.accessor("userName", {
        header: "Người dùng",
        cell: (info) => (
          <div className="font-medium text-gray-900">
            {info.getValue() || "N/A"}
          </div>
        ),
      }),

      // Flight column
      columnHelper.accessor("flightCode", {
        header: "Chuyến bay",
        cell: (info) => {
          const review = info.row.original;
          return (
            <div>
              <div className="font-medium">{info.getValue()}</div>
              <div className="text-sm text-gray-500">
                Booking #{review.bookingId}
              </div>
            </div>
          );
        },
      }),

      // Rating column
      columnHelper.accessor("rating", {
        header: "Đánh giá",
        cell: (info) => renderStars(info.getValue()),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue === "all") return true;
          return row.getValue(columnId) === parseInt(filterValue);
        },
      }),

      // Comment column
      columnHelper.accessor("comment", {
        header: "Nội dung",
        cell: (info) => (
          <div className="max-w-xs truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      }),

      // Status column
      columnHelper.accessor("isApproved", {
        header: "Trạng thái",
        cell: (info) => getStatusBadge(info.getValue()),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue === "all") return true;
          if (filterValue === "approved")
            return row.getValue(columnId) === true;
          if (filterValue === "rejected")
            return (
              row.getValue(columnId) === false ||
              row.getValue(columnId) === null
            );
          return true;
        },
      }),

      // Created At column
      columnHelper.accessor("createdAt", {
        header: "Ngày tạo",
        cell: (info) => (
          <div className="text-sm">
            {new Date(info.getValue()).toLocaleDateString("vi-VN")}
          </div>
        ),
      }),

      // Actions column
      columnHelper.display({
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              {row.original.isApproved !== true && (
                <DropdownMenuItem
                  onClick={() => handleApproveReview(row.original.reviewId)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Duyệt
                </DropdownMenuItem>
              )}
              {row.original.isApproved !== false && (
                <DropdownMenuItem
                  onClick={() => handleRejectReview(row.original.reviewId)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Từ chối
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleDeleteReview(row.original)}
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
    [
      handleViewDetails,
      handleApproveReview,
      handleRejectReview,
      handleDeleteReview,
      renderStars,
      getStatusBadge,
    ]
  );

  // Create table instance
  const table = useReactTable({
    data: reviews,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const userName = row.getValue("userName")?.toLowerCase() || "";
      const flightCode = row.getValue("flightCode")?.toLowerCase() || "";
      const comment = row.getValue("comment")?.toLowerCase() || "";
      return (
        userName.includes(searchValue) ||
        flightCode.includes(searchValue) ||
        comment.includes(searchValue)
      );
    },
  });

  // Bulk actions
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedReviews = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  );

  const handleBulkApprove = useCallback(async () => {
    if (selectedReviews.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn duyệt ${selectedReviews.length} đánh giá đã chọn?`
      )
    )
      return;

    try {
      const approvePromises = selectedReviews
        .filter((review) => review.isApproved !== true)
        .map((review) => reviewApi.approveReview(review.reviewId));

      await Promise.all(approvePromises);
      fetchReviews();
      fetchReviewStats();
      setRowSelection({});
      toast.success(`Đã duyệt ${selectedReviews.length} đánh giá thành công!`);
    } catch (error) {
      console.error("Error bulk approving reviews:", error);
      toast.error("Có lỗi xảy ra khi duyệt đánh giá");
    }
  }, [selectedReviews, fetchReviews, fetchReviewStats]);

  const handleBulkReject = useCallback(async () => {
    if (selectedReviews.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn từ chối ${selectedReviews.length} đánh giá đã chọn?`
      )
    )
      return;

    try {
      const rejectPromises = selectedReviews
        .filter((review) => review.isApproved !== false)
        .map((review) => reviewApi.rejectReview(review.reviewId));

      await Promise.all(rejectPromises);
      fetchReviews();
      fetchReviewStats();
      setRowSelection({});
      toast.success(
        `Đã từ chối ${selectedReviews.length} đánh giá thành công!`
      );
    } catch (error) {
      console.error("Error bulk rejecting reviews:", error);
      toast.error("Có lỗi xảy ra khi từ chối đánh giá");
    }
  }, [selectedReviews, fetchReviews, fetchReviewStats]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedReviews.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedReviews.length} đánh giá đã chọn?`
      )
    )
      return;

    try {
      const deletePromises = selectedReviews.map((review) =>
        reviewApi.deleteReview(review.reviewId)
      );

      await Promise.all(deletePromises);
      fetchReviews();
      fetchReviewStats();
      setRowSelection({});
      toast.success(`Đã xóa ${selectedReviews.length} đánh giá thành công!`);
    } catch (error) {
      console.error("Error bulk deleting reviews:", error);
      toast.error("Có lỗi xảy ra khi xóa đánh giá");
    }
  }, [selectedReviews, fetchReviews, fetchReviewStats]);

  // Handle refresh
  const handleRefresh = () => {
    toast.promise(fetchReviews(), {
      loading: "Đang tải lại danh sách...",
      success: "Đã cập nhật danh sách đánh giá!",
      error: "Lỗi khi tải lại danh sách",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đánh giá</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {table.getFilteredRowModel().rows.length} đánh giá
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
          <ExportButton entity="reviews" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng đánh giá</p>
              <p className="text-2xl font-bold">{reviewStats.totalReviews}</p>
            </div>
            <Star className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600">
                {reviewStats.approvedReviews}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đã từ chối</p>
              <p className="text-2xl font-bold text-red-600">
                {reviewStats.rejectedReviews}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đánh giá TB</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reviewStats.averageRating.toFixed(1)}
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-600 fill-current" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Global Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên người dùng, mã chuyến bay..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={
                columnFilters.find((f) => f.id === "isApproved")?.value || "all"
              }
              onValueChange={(value) => {
                setColumnFilters((prev) => {
                  const newFilters = prev.filter((f) => f.id !== "isApproved");
                  if (value !== "all") {
                    newFilters.push({
                      id: "isApproved",
                      value: value,
                    });
                  }
                  return newFilters;
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={
                columnFilters.find((f) => f.id === "rating")?.value || "all"
              }
              onValueChange={(value) => {
                setColumnFilters((prev) => {
                  const newFilters = prev.filter((f) => f.id !== "rating");
                  if (value !== "all") {
                    newFilters.push({
                      id: "rating",
                      value: value,
                    });
                  }
                  return newFilters;
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo sao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sao</SelectItem>
                <SelectItem value="5">5 sao</SelectItem>
                <SelectItem value="4">4 sao</SelectItem>
                <SelectItem value="3">3 sao</SelectItem>
                <SelectItem value="2">2 sao</SelectItem>
                <SelectItem value="1">1 sao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedReviews.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn {selectedReviews.length} đánh giá
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkApprove}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Duyệt (
                {selectedReviews.filter((r) => r.isApproved !== true).length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReject}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Từ chối (
                {selectedReviews.filter((r) => r.isApproved !== false).length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa ({selectedReviews.length})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <ReviewTableSkeleton />
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={
                        header.column.getCanSort()
                          ? "cursor-pointer hover:bg-gray-50 select-none"
                          : ""
                      }
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted()] ?? null}
                        </div>
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
                    Không có đánh giá nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          itemsPerPage={pagination.pageSize}
          totalItems={table.getFilteredRowModel().rows.length}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
          }
          onPageSizeChange={(size) =>
            setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))
          }
          showPageSizeSelector={true}
          showInfo={true}
        />
      )}

      <ReviewDetailsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedReview(null);
        }}
        reviewData={selectedReview}
        onApprove={handleApproveReview}
        onReject={handleRejectReview}
        onDelete={handleDeleteReview}
      />
    </div>
  );
};

export default ReviewPage;
