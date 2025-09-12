import React, { useState, useMemo, useCallback } from "react";
import AircraftModal from "@/components/admin/aircrafts/aircraft-modal";
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
  EyeOff,
  Eye,
  MoreHorizontal,
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
import { aircraftApi } from "@/apis/aircraft-api";
import { useAircraft } from "@/hooks/use-aircraft";
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

const AircraftPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // TanStack Table states
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "aircraftName", desc: false }]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Aircraft data from hook
  const { aircrafts, loading, fetchAircrafts } = useAircraft();

  // Create column helper
  const columnHelper = createColumnHelper();

  // Memoized handlers
  const handleEdit = useCallback((aircraft) => {
    setEditData(aircraft);
    setModalOpen(true);
    toast.info(`Chỉnh sửa máy bay: ${aircraft.aircraftName}`);
  }, []);

  const handleDelete = useCallback(
    async (aircraft) => {
      if (
        window.confirm(
          `Bạn có chắc muốn xóa hẳn máy bay ${aircraft.aircraftName}?`
        )
      ) {
        toast.promise(aircraftApi.deleteAircraft(aircraft.aircraftId), {
          loading: "Đang xóa máy bay...",
          success: (response) => {
            if (response.success) {
              fetchAircrafts();
              return `Đã xóa hẳn máy bay ${aircraft.aircraftName} thành công!`;
            } else {
              throw new Error(response.message);
            }
          },
          error: (error) => {
            console.error("Lỗi xóa aircraft:", error);
            return "Lỗi khi xóa máy bay. Vui lòng thử lại!";
          },
        });
      }
    },
    [fetchAircrafts]
  );

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

      // Aircraft Code column
      columnHelper.accessor("aircraftCode", {
        header: "Mã máy bay",
        cell: (info) => (
          <div className="font-mono font-medium text-gray-900">
            {info.getValue()}
          </div>
        ),
      }),

      // Aircraft Name column
      columnHelper.accessor("aircraftName", {
        header: "Tên máy bay",
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
      }),

      // Total Seats column
      columnHelper.accessor("totalSeats", {
        header: "Tổng ghế",
        cell: (info) => (
          <div className="text-center font-medium">{info.getValue()}</div>
        ),
      }),

      // Seat Layout column
      columnHelper.accessor("seatLayout", {
        header: "Bố trí ghế",
        cell: (info) => (
          <div className="font-mono text-sm text-gray-700">
            {info.getValue() || "N/A"}
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
              <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(row.original)}
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
    [handleEdit, handleDelete]
  );

  // Create table instance
  const table = useReactTable({
    data: aircrafts,
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
  const selectedAircrafts = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedAircrafts.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedAircrafts.length} máy bay đã chọn?`
      )
    )
      return;

    try {
      const deletePromises = selectedAircrafts.map((aircraft) =>
        aircraftApi.deleteAircraft(aircraft.aircraftId)
      );
      await Promise.all(deletePromises);
      toast.success(`Đã xóa ${selectedAircrafts.length} máy bay thành công!`);
      fetchAircrafts();
      setRowSelection({});
    } catch (error) {
      console.error("Error bulk deleting aircrafts:", error);
      toast.error("Có lỗi xảy ra khi xóa máy bay");
    }
  }, [selectedAircrafts, fetchAircrafts]);

  // Handle refresh
  const handleRefresh = () => {
    toast.promise(fetchAircrafts(), {
      loading: "Đang tải lại danh sách...",
      success: "Đã cập nhật danh sách máy bay!",
      error: "Lỗi khi tải lại danh sách",
    });
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
    toast.info("Mở form thêm máy bay mới");
  };

  const handleSubmit = async (formData) => {
    const isUpdate = !!editData;
    const aircraftName = formData.aircraftName;

    toast.promise(
      isUpdate
        ? aircraftApi.updateAircraft(editData.aircraftId, formData)
        : aircraftApi.createAircraft(formData),
      {
        loading: isUpdate ? "Đang cập nhật máy bay..." : "Đang thêm máy bay...",
        success: (response) => {
          if (response.success) {
            setModalOpen(false);
            fetchAircrafts();
            return isUpdate
              ? `Đã cập nhật máy bay ${aircraftName} thành công!`
              : `Đã thêm máy bay ${aircraftName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi submit:", error);
          return "Lỗi khi lưu máy bay. Vui lòng thử lại!";
        },
      }
    );
  };

  // Reset page to 0 on filter/sort changes to avoid empty pages
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, columnFilters, sorting]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Máy bay</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {aircrafts.length} máy bay
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
          <ExportButton entity="aircrafts" />
          <Button onClick={handleAdd}>Thêm máy bay</Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Global Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã máy bay..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedAircrafts.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn {selectedAircrafts.length} máy bay
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa ({selectedAircrafts.length})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin" />
          </div>
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
                    Không có máy bay nào.
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

      <AircraftModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
          toast.info("Đã đóng form máy bay");
        }}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
};

export default AircraftPage;
