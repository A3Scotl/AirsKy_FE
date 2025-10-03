import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle,
  XCircle,
  Eye,
  Star,
  MoreHorizontal,
  RefreshCw,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Pagination from "@/components/ui/pagination";
import { reviewApi } from "@/apis/review-api";
import { toast } from "sonner";
import { formatDateVN } from "@/utils/currency-utils";

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

const ReviewTable = ({
  reviews = [],
  loading = false,
  onViewDetails,
  onApprove,
  onReject,
  onDelete,
}) => {
  // Modal states
  const [selectedReview, setSelectedReview] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // TanStack Table states
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Create column helper
  const columnHelper = createColumnHelper();

  // Handle reject review
  const handleRejectReview = useCallback(async () => {
    if (!selectedReview || !rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      await onReject(selectedReview.reviewId);
      setShowRejectDialog(false);
      setSelectedReview(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting review:", error);
      toast.error("Lỗi khi từ chối đánh giá");
    }
  }, [selectedReview, rejectReason, onReject]);

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
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã duyệt
        </Badge>
      );
    } else if (isApproved === false) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Đã từ chối
        </Badge>
      );
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
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
        cell: (info) => {
          const review = info.row.original;
          return (
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.userAvatar} alt={review.userName} />
                <AvatarFallback>
                  {review.userName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">
                  {info.getValue() || "N/A"}
                </div>
              </div>
            </div>
          );
        },
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
      }),

      // Created At column
      columnHelper.accessor("createdAt", {
        header: "Ngày tạo",
        cell: (info) => (
          <div className="text-sm">{formatDateVN(info.getValue())}</div>
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
              <DropdownMenuItem
                onClick={() => onViewDetails(row.original)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Xem chi tiết</span>
              </DropdownMenuItem>
              {row.original.isApproved !== true && (
                <DropdownMenuItem
                  onClick={() => onApprove(row.original.reviewId)}
                  className="flex items-center space-x-2 text-green-600"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Duyệt</span>
                </DropdownMenuItem>
              )}
              {row.original.isApproved !== false && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedReview(row.original);
                    setShowRejectDialog(true);
                  }}
                  className="flex items-center space-x-2 text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Từ chối</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(row.original.reviewId)}
                className="flex items-center space-x-2 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [renderStars, getStatusBadge, onViewDetails, onApprove, onReject, onDelete]
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
        .map((review) => onApprove(review.reviewId));

      await Promise.all(approvePromises);
      setRowSelection({});
      toast.success(`Đã duyệt ${selectedReviews.length} đánh giá thành công!`);
    } catch (error) {
      console.error("Error bulk approving reviews:", error);
      toast.error("Có lỗi xảy ra khi duyệt đánh giá");
    }
  }, [selectedReviews, onApprove]);

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
        .map((review) => onReject(review.reviewId));

      await Promise.all(rejectPromises);
      setRowSelection({});
      toast.success(
        `Đã từ chối ${selectedReviews.length} đánh giá thành công!`
      );
    } catch (error) {
      console.error("Error bulk rejecting reviews:", error);
      toast.error("Có lỗi xảy ra khi từ chối đánh giá");
    }
  }, [selectedReviews, onReject]);

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
        onDelete(review.reviewId)
      );

      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success(`Đã xóa ${selectedReviews.length} đánh giá thành công!`);
    } catch (error) {
      console.error("Error bulk deleting reviews:", error);
      toast.error("Có lỗi xảy ra khi xóa đánh giá");
    }
  }, [selectedReviews, onDelete]);

  // Reset page to 0 on filter/sort changes to avoid empty pages
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, columnFilters, sorting]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
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
              columnFilters.find((f) => f.id === "isApproved")?.value ?? "all"
            }
            onValueChange={(value) => {
              setColumnFilters((prev) => {
                const newFilters = prev.filter((f) => f.id !== "isApproved");
                if (value !== "all") {
                  newFilters.push({
                    id: "isApproved",
                    value:
                      value === "approved"
                        ? true
                        : value === "rejected"
                        ? false
                        : null,
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
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="rejected">Đã từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedReviews.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
              Duyệt ({selectedReviews.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkReject}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Từ chối ({selectedReviews.length})
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa ({selectedReviews.length})
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50">
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang tải...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  className="text-center py-8 text-gray-500"
                >
                  Không có đánh giá nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Từ chối đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn từ chối đánh giá này? Vui lòng nhập lý do từ
              chối.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Nhập lý do từ chối..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedReview(null);
                setRejectReason("");
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectReview}
              className="bg-red-600 hover:bg-red-700"
            >
              Từ chối
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReviewTable;
