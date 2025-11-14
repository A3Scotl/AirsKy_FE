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

const PaymentTableSkeleton = ({ rows = 10 }) => (
  <Table>
    <TableHeader>
      <TableRow>
        {Array.from({ length: 7 }).map((_, i) => (
          <TableHead key={i}>
            <div className="h-5 w-full bg-gray-200 rounded animate-pulse" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}><div className="h-5 w-full bg-gray-200 rounded animate-pulse" /></TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

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
  const [data, setData] = useState([]);
  const [pageCount, setPageCount] = useState(0);
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
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
        sortBy: sorting[0]?.id || 'paymentDate',
        sortDir: sorting[0]?.desc ? 'desc' : 'asc',
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: methodFilter !== 'all' ? methodFilter : undefined,
        startDate: dateRange === 'custom' && startDate ? startDate.toISOString().split("T")[0] : undefined,
        endDate: dateRange === 'custom' && endDate ? endDate.toISOString().split("T")[0] : undefined,
      };

      const response = await paymentApi.getAllPayments(params);

      if (response.success) {
        setData(response.data.content || []);
        setPageCount(response.data.totalPages || 0);
      } else {
       
        setData([]);
        toast.error("Không thể tải danh sách thanh toán");
      }
    } catch (error) {
      
      setData([]);
      toast.error("Lỗi khi tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, sorting, searchTerm, statusFilter, methodFilter, dateRange, startDate, endDate, refreshKey]);

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

  // Create table instance with paginated data
  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    manualPagination: true,
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
        {loading ? (
          <PaymentTableSkeleton rows={pagination.pageSize} />
        ) : (
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
                    className="text-center py-8 text-gray-500"
                  >
                    Không có thanh toán nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!loading && data.length > 0 && (
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalPages={pageCount}
          itemsPerPage={pagination.pageSize}
          totalItems={pageCount * pagination.pageSize} // This is an approximation
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
