import React, { useState, useMemo, useCallback } from "react";
import AirlineModal from "@/components/admin/airlines/airline-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Filter,
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
import { airlineApi } from "@/apis/airline-api";
import { useAirline } from "@/hooks/use-airline";
import { toast } from "sonner";

import AirlineTableSkeleton from "@/components/admin/airlines/airline-table-skeleton";

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

const AirlinePage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // Search, Filter, Sort states (fully managed by TanStack now)
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "airlineName", desc: false }]);
  const [rowSelection, setRowSelection] = useState({});

  // Pagination state managed by TanStack
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { airlines, loading, refresh } = useAirline();

  // Create column helper
  const columnHelper = createColumnHelper();

  // Memoized handlers
  const handleEdit = useCallback((airline) => {
    setEditData(airline);
    setModalOpen(true);
    toast.info(`Chỉnh sửa hãng bay: ${airline.airlineName}`);
  }, []);

  const handleToggleActive = useCallback(
    async (airline) => {
      const newActiveStatus = !airline.active;
      const actionText = newActiveStatus ? "hiện" : "ẩn";

      toast.promise(
        (async () => {
          const response = await airlineApi.updateAirlineWithImage(
            airline.airlineId,
            {
              airlineCode: airline.airlineCode,
              airlineName: airline.airlineName,
              thumbnail: airline.thumbnail,
              contact: airline.contact,
              active: newActiveStatus,
            }
          );

          if (response.success) {
            refresh();
            return response;
          } else {
            throw new Error(response.message);
          }
        })(),
        {
          loading: `Đang ${actionText} hãng bay...`,
          success: `Đã ${actionText} hãng bay ${airline.airlineName} thành công!`,
          error: `Lỗi khi ${actionText} hãng bay`,
        }
      );
    },
    [refresh]
  );

  const handleDelete = useCallback(
    async (airline) => {
      if (
        window.confirm(
          `Bạn có chắc muốn xóa hẳn hãng bay ${airline.airlineName}?`
        )
      ) {
        toast.promise(airlineApi.deleteAirline(airline.airlineId), {
          loading: "Đang xóa hãng bay...",
          success: (response) => {
            if (response.success) {
              refresh();
              return `Đã xóa hẳn hãng bay ${airline.airlineName} thành công!`;
            } else {
              throw new Error(response.message);
            }
          },
          error: (error) => {
            console.error("Lỗi xóa airline:", error);
            return "Lỗi khi xóa hãng bay. Vui lòng thử lại!";
          },
        });
      }
    },
    [refresh]
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

      // Airline Code column
      columnHelper.accessor("airlineCode", {
        header: "Mã hãng bay",
        cell: (info) => (
          <div className="font-mono font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </div>
        ),
      }),

      // Airline Name column
      columnHelper.accessor("airlineName", {
        header: "Tên hãng bay",
        cell: (info) => (
          <div className="font-medium text-gray-900 dark:text-white">{info.getValue()}</div>
        ),
      }),

      // Contact column
      columnHelper.accessor("contact", {
        header: "Liên hệ",
        cell: (info) => (
          <div className="text-sm text-gray-900 dark:text-white">
            {info.getValue() || "N/A"}
          </div>
        ),
      }),

      // Thumbnail column
      columnHelper.accessor("thumbnail", {
        header: "Ảnh",
        cell: (info) => {
          const thumbnail = info.getValue();
          const airlineName = info.row.original.airlineName;
          return thumbnail ? (
            <img
              src={thumbnail}
              alt={airlineName}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              No Image
            </div>
          );
        },
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
                onClick={() => handleToggleActive(row.original)}
              >
                {row.original.active ? (
                  <EyeOff className="mr-2 h-4 w-4" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {row.original.active ? "Ẩn" : "Hiện"}
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
    [handleEdit, handleToggleActive, handleDelete]
  );

  // Create table instance (fully using TanStack state)
  const table = useReactTable({
    data: airlines,
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
  const selectedAirlines = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedAirlines.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedAirlines.length} hãng bay đã chọn?`
      )
    )
      return;

    try {
      const deletePromises = selectedAirlines.map((airline) =>
        airlineApi.deleteAirline(airline.airlineId)
      );

      await Promise.all(deletePromises);
      refresh();
      setRowSelection({});
      toast.success(`Đã xóa ${selectedAirlines.length} hãng bay thành công!`);
    } catch (error) {
      console.error("Error bulk deleting airlines:", error);
      toast.error("Có lỗi xảy ra khi xóa hãng bay");
    }
  }, [selectedAirlines, refresh]);

  const handleBulkToggleActive = useCallback(
    async (newActiveStatus) => {
      if (selectedAirlines.length === 0) return;

      const actionText = newActiveStatus ? "hiện" : "ẩn";
      if (
        !window.confirm(
          `Bạn có chắc chắn muốn ${actionText} ${selectedAirlines.length} hãng bay đã chọn?`
        )
      )
        return;

      try {
        const updatePromises = selectedAirlines.map((airline) =>
          airlineApi.updateAirlineWithImage(airline.airlineId, {
            airlineCode: airline.airlineCode,
            airlineName: airline.airlineName,
            thumbnail: airline.thumbnail,
            contact: airline.contact,
            active: newActiveStatus,
          })
        );

        await Promise.all(updatePromises);
        refresh();
        setRowSelection({});
        toast.success(
          `Đã ${actionText} ${selectedAirlines.length} hãng bay thành công!`
        );
      } catch (error) {
        console.error("Error bulk toggling airlines:", error);
        toast.error(`Có lỗi xảy ra khi ${actionText} hãng bay`);
      }
    },
    [selectedAirlines, refresh]
  );

  // Handle refresh
  const handleRefresh = () => {
    toast.promise(refresh(), {
      loading: "Đang tải lại danh sách...",
      success: "Đã cập nhật danh sách hãng bay!",
      error: "Lỗi khi tải lại danh sách",
    });
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
    toast.info("Mở form thêm hãng bay mới");
  };

  const handleSubmit = async (formData) => {
    const isUpdate = !!editData;
    const airlineName = formData.airlineName;

    toast.promise(
      isUpdate
        ? airlineApi.updateAirlineWithImage(editData.airlineId, formData)
        : airlineApi.createAirlineWithImage(formData),
      {
        loading: isUpdate
          ? "Đang cập nhật hãng bay..."
          : "Đang thêm hãng bay...",
        success: (response) => {
          if (response.success) {
            setModalOpen(false);
            refresh();
            return isUpdate
              ? `Đã cập nhật hãng bay ${airlineName} thành công!`
              : `Đã thêm hãng bay ${airlineName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi submit:", error);
          return "Lỗi khi lưu hãng bay. Vui lòng thử lại!";
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
          <h1 className="text-2xl font-bold">Quản lý Hãng bay</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {airlines.length} hãng bay
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
          
          <Button onClick={handleAdd}>Thêm hãng bay</Button>
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
                placeholder="Tìm kiếm theo tên, mã hoặc liên hệ..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-10 dark:text-black"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={
                columnFilters.find((f) => f.id === "active")?.value || "all"
              }
              onValueChange={(value) => {
                setColumnFilters((prev) => {
                  const newFilters = prev.filter((f) => f.id !== "active");
                  if (value !== "all") {
                    newFilters.push({
                      id: "active",
                      value: value === "active",
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
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedAirlines.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn {selectedAirlines.length} hãng bay
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(true)}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Hiện ({selectedAirlines.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleActive(false)}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Ẩn ({selectedAirlines.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa ({selectedAirlines.length})
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card>
        {loading ? (
          <AirlineTableSkeleton rows={10} />
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
                    Không có hãng bay nào.
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

      <AirlineModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
          toast.info("Đã đóng form hãng bay");
        }}
        onSubmit={handleSubmit}
        initialData={editData}
      />
    </div>
  );
};

export default AirlinePage;
