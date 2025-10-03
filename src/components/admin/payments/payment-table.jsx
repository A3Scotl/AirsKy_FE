import { useState, useMemo, useCallback, useEffect } from "react";
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/ui/pagination";
import { paymentApi } from "@/apis/payment-api";
import { toast } from "sonner";
import { formatDateVN, formatCurrencyVND } from "@/utils/currency-utils";

// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

const PaymentTable = ({
  searchTerm,
  statusFilter,
  methodFilter,
  dateRange,
  startDate,
  endDate,
  refreshKey,
  onViewDetails,
  onRefund,
  limit,
  showActions = true,
}) => {
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // TanStack Table states
  const [sorting, setSorting] = useState([{ id: "paymentDate", desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limit || 10,
  });

  // Create column helper
  const columnHelper = createColumnHelper();

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all payments for client-side filtering
      const params = {
        page: 0,
        size: 1000, // Fetch large amount for client-side filtering
      };

      const response = await paymentApi.getAllPayments(params);

      if (response.success) {
        setAllPayments(response.data.content || response.data || []);
      } else {
        console.error("Failed to fetch payments:", response.message);
        setAllPayments([]);
        toast.error("Không thể tải danh sách thanh toán");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      setAllPayments([]);
      toast.error("Lỗi khi tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  // Client-side filtering logic
  const filteredPayments = useMemo(() => {
    let filtered = [...allPayments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.paymentId?.toString().includes(searchTerm) ||
          payment.bookingId?.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter && methodFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.paymentMethod === methodFilter
      );
    }

    // Date filter
    if (dateRange !== "all") {
      const now = new Date();
      let startFilterDate, endFilterDate;

      if (dateRange === "custom" && startDate && endDate) {
        startFilterDate = startDate;
        endFilterDate = endDate;
      } else if (dateRange !== "custom") {
        const days = parseInt(dateRange);
        endFilterDate = new Date();
        startFilterDate = new Date();
        startFilterDate.setDate(endFilterDate.getDate() - days);
      }

      if (startFilterDate && endFilterDate) {
        filtered = filtered.filter((payment) => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate >= startFilterDate && paymentDate <= endFilterDate;
        });
      }
    }

    return filtered;
  }, [
    allPayments,
    searchTerm,
    statusFilter,
    methodFilter,
    dateRange,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Column definitions (memoized)
  const columns = useMemo(
    () => [
      // Checkbox column for row selection
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
        size: 50,
      }),

      // Booking ID column
      columnHelper.accessor("bookingId", {
        header: "Mã đặt chỗ",
        cell: (info) => (
          <div className="font-medium">{info.getValue() || "N/A"}</div>
        ),
      }),

      // Amount column
      columnHelper.accessor("amount", {
        header: "Số tiền",
        cell: (info) => (
          <div className="font-semibold text-green-600">
            {formatCurrencyVND(info.getValue() || 0)}
          </div>
        ),
      }),

      // Payment Method column
      columnHelper.accessor("paymentMethod", {
        header: "Phương thức",
        cell: (info) => {
          const method = info.getValue();
          return (
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getMethodIcon(method)}</span>
              <div>
                <div className="text-sm font-medium capitalize">
                  {(method || "unknown").replace("_", " ")}
                </div>
              </div>
            </div>
          );
        },
      }),

      // Status column
      columnHelper.accessor("status", {
        header: "Trạng thái",
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge className={getStatusColor(status)}>
              {(status || "unknown").charAt(0).toUpperCase() +
                (status || "unknown").slice(1).toLowerCase()}
            </Badge>
          );
        },
      }),

      // Payment Date column
      columnHelper.accessor("paymentDate", {
        header: "Ngày thanh toán",
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
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Tải biên lai
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === "SUCCESS" && (
                <DropdownMenuItem
                  onClick={() => onRefund(row.original)}
                  className="text-red-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Xử lý hoàn tiền
                </DropdownMenuItem>
              )}
              {row.original.status === "PENDING" && (
                <>
                  <DropdownMenuItem className="text-green-600">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Duyệt
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Từ chối
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [onViewDetails, onRefund]
  );

  // Reset page to 0 on filter changes to avoid empty pages
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [searchTerm, statusFilter, methodFilter, dateRange, startDate, endDate]);

  // Get paginated data manually
  const paginatedData = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, pagination.pageIndex, pagination.pageSize]);

  // Create table instance with paginated data
  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
  });

  const getStatusColor = (status) => {
    const colors = {
      SUCCESS: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      REFUNDED: "bg-purple-100 text-purple-800",
      FAILED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getMethodIcon = (method) => {
    const icons = {
      CREDIT_CARD: "💳",
      BANK_TRANSFER: "🏦",
      PAYPAL: "🅿️",
    };
    return icons[method] || "💳";
  };

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-900">
              Đã chọn {Object.keys(rowSelection).length} giao dịch
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const selectedRows = table.getSelectedRowModel().rows;
                const selectedPayments = selectedRows.map(
                  (row) => row.original
                );
                // Handle bulk export
                console.log("Bulk export:", selectedPayments);
                toast.success(`Đã xuất ${selectedPayments.length} giao dịch`);
              }}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Xuất dữ liệu ({Object.keys(rowSelection).length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const selectedRows = table.getSelectedRowModel().rows;
                const selectedPayments = selectedRows.map(
                  (row) => row.original
                );
                const refundablePayments = selectedPayments.filter(
                  (p) => p.status === "SUCCESS"
                );
                if (refundablePayments.length === 0) {
                  toast.error("Không có giao dịch nào có thể hoàn tiền");
                  return;
                }
                // Handle bulk refund
                console.log("Bulk refund:", refundablePayments);
                toast.success(
                  `Đã yêu cầu hoàn tiền ${refundablePayments.length} giao dịch`
                );
              }}
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Hoàn tiền (
              {
                table
                  .getSelectedRowModel()
                  .rows.filter((row) => row.original.status === "SUCCESS")
                  .length
              }
              )
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
              className="text-gray-600"
            >
              Bỏ chọn
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
                  Không có thanh toán nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredPayments.length > 0 && (
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalPages={Math.ceil(filteredPayments.length / pagination.pageSize)}
          itemsPerPage={pagination.pageSize}
          totalItems={filteredPayments.length}
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
    </div>
  );
};

export default PaymentTable;
