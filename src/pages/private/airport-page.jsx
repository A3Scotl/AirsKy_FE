import React, { useState, useEffect, useMemo, useCallback } from "react";
import AirportModal from "@/components/admin/airport/airport-modal";
import AirportTableSkeleton from "@/components/admin/airport/airport-table-skeleton";
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
import { airportApi } from "@/apis/airport-api";
import { countryApi } from "@/apis/country-api";
import { toast } from "sonner";

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

const AirportPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [airports, setAirports] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter, Sort states (fully managed by TanStack now)
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "airportName", desc: false }]);
  const [rowSelection, setRowSelection] = useState({});

  // Pagination state managed by TanStack
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Create column helper
  const columnHelper = createColumnHelper();

  // Memoized handlers
  const handleEdit = useCallback((airport) => {
    setEditData(airport);
    setModalOpen(true);
    toast.info(`Chỉnh sửa sân bay: ${airport.airportName}`);
  }, []);

  const handleToggleActive = useCallback(
    async (airport) => {
      const newActiveStatus = !airport.active;
      const actionText = newActiveStatus ? "hiện" : "ẩn";

      toast.promise(
        (async () => {
          const country = countries.find(
            (c) =>
              c.countryName === airport.country || c.name === airport.country
          );
          const countryId = country
            ? country.countryId || country.id
            : airport.country;

          const response = await airportApi.updateAirport(airport.airportId, {
            airportCode: airport.airportCode,
            airportName: airport.airportName,
            countryId: countryId,
            cityNames: airport.cityNames,
            active: newActiveStatus,
          });

          if (response.success) {
            setAirports((prev) =>
              prev.map((a) =>
                a.airportId === airport.airportId
                  ? { ...a, active: newActiveStatus }
                  : a
              )
            );
            return response;
          } else {
            throw new Error(response.message);
          }
        })(),
        {
          loading: `Đang ${actionText} sân bay...`,
          success: `Đã ${actionText} sân bay ${airport.airportName} thành công!`,
          error: `Lỗi khi ${actionText} sân bay`,
        }
      );
    },
    [countries]
  );

  const handleDelete = useCallback(async (airport) => {
    if (
      window.confirm(`Bạn có chắc muốn xóa hẳn sân bay ${airport.airportName}?`)
    ) {
      toast.promise(airportApi.deleteAirport(airport.airportId), {
        loading: "Đang xóa sân bay...",
        success: (response) => {
          if (response.success) {
            setAirports((prev) =>
              prev.filter((a) => a.airportId !== airport.airportId)
            );
            return `Đã xóa hẳn sân bay ${airport.airportName} thành công!`;
          } else {
            throw new Error(response.message);
          }
        },
        error: (error) => {
          console.error("Lỗi xóa sân bay:", error);
          return "Lỗi khi xóa sân bay. Vui lòng thử lại!";
        },
      });
    }
  }, []);

  // Column definitions (memoized)
  const columns = useMemo(
    () => [
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
      columnHelper.accessor("airportCode", {
        header: "Mã sân bay",
        cell: (info) => (
          <div className="font-mono font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("airportName", {
        header: "Tên sân bay",
        cell: (info) => (
          <div className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("cityNames", {
        header: "Thành phố",
        cell: (info) => {
          const cityData =
            info.getValue() ||
            info.row.original.cityName ||
            info.row.original.city;

          if (typeof cityData === "string" && cityData) {
            const cities = cityData.split(",");
            return (
              <div className="flex flex-wrap gap-1">
                {cities.map((city, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {city.trim()}
                  </Badge>
                ))}
              </div>
            );
          }

          if (Array.isArray(cityData) && cityData.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {cityData.map((city, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {typeof city === "string" ? city.trim() : city}
                  </Badge>
                ))}
              </div>
            );
          }

          return <span className="text-gray-400">-</span>;
        },
      }),
      columnHelper.accessor("gates", {
        header: "Cổng/Terminal",
        cell: (info) => {
          const gates = info.getValue();
          if (Array.isArray(gates) && gates.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {gates.map((gate) => (
                  <Badge
                    key={gate.gateId}
                    variant="outline"
                    className="text-xs"
                  >
                    {gate.gateName}
                    {gate.terminal ? ` (${gate.terminal})` : ""}
                  </Badge>
                ))}
              </div>
            );
          }
          return <span className="text-gray-400">-</span>;
        },
      }),
      columnHelper.accessor("country", {
        header: "Quốc gia",
        cell: (info) => (
          <div className="text-sm text-gray-900 dark:text-gray-200">
            {info.getValue() || info.row.original.countryName || "N/A"}
          </div>
        ),
      }),
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countryResponse, airportResponse] = await Promise.all([
          countryApi.getAllCountries({ size: 1000 }),
          airportApi.getAllAirports({ size: 1000 }),
        ]);

        if (countryResponse.success) {
          setCountries(
            countryResponse.data.content || countryResponse.data || []
          );
        }

        if (airportResponse.success) {
          setAirports(
            airportResponse.data.content || airportResponse.data || []
          );
        }
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Unique countries memoized
  const uniqueCountries = useMemo(() => {
    return Array.from(
      new Set(
        airports
          .map((a) => a.country || a.countryName)
          .filter(Boolean)
          .map((c) => c.trim())
      )
    ).sort();
  }, [airports]);

  // Create table instance (fully using TanStack state)
  const table = useReactTable({
    data: airports,
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
  const selectedAirports = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedAirports.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedAirports.length} sân bay đã chọn?`
      )
    )
      return;

    try {
      await Promise.all(
        selectedAirports.map((airport) =>
          airportApi.deleteAirport(airport.airportId)
        )
      );
      setAirports((prev) =>
        prev.filter(
          (a) =>
            !selectedAirports.some(
              (selected) => selected.airportId === a.airportId
            )
        )
      );
      table.resetRowSelection();
      toast.success(`Đã xóa ${selectedAirports.length} sân bay thành công!`);
    } catch (error) {
      console.error("Error bulk deleting airports:", error);
      toast.error("Có lỗi xảy ra khi xóa sân bay");
    }
  }, [selectedAirports, table]);

  const handleBulkToggleActive = useCallback(
    async (newActiveStatus) => {
      if (selectedAirports.length === 0) return;

      const actionText = newActiveStatus ? "hiện" : "ẩn";
      if (
        !window.confirm(
          `Bạn có chắc chắn muốn ${actionText} ${selectedAirports.length} sân bay đã chọn?`
        )
      )
        return;

      try {
        await Promise.all(
          selectedAirports.map((airport) => {
            const country = countries.find(
              (c) =>
                c.countryName === airport.country || c.name === airport.country
            );
            const countryId = country
              ? country.countryId || country.id
              : airport.country;

            return airportApi.updateAirport(airport.airportId, {
              airportCode: airport.airportCode,
              airportName: airport.airportName,
              countryId: countryId,
              cityNames: airport.cityNames,
              active: newActiveStatus,
            });
          })
        );
        setAirports((prev) =>
          prev.map((a) =>
            selectedAirports.some(
              (selected) => selected.airportId === a.airportId
            )
              ? { ...a, active: newActiveStatus }
              : a
          )
        );
        table.resetRowSelection();
        toast.success(
          `Đã ${actionText} ${selectedAirports.length} sân bay thành công!`
        );
      } catch (error) {
        console.error("Error bulk toggling airports:", error);
        toast.error(`Có lỗi xảy ra khi ${actionText} sân bay`);
      }
    },
    [selectedAirports, countries, table]
  );

  // Handle refresh
  const handleRefresh = async () => {
    toast.promise(
      async () => {
        const airportResponse = await airportApi.getAllAirports({ size: 1000 });
        if (airportResponse.success) {
          setAirports(
            airportResponse.data.content || airportResponse.data || []
          );
        } else {
          throw new Error(airportResponse.message);
        }
      },
      {
        loading: "Đang tải lại danh sách...",
        success: "Đã cập nhật danh sách sân bay!",
        error: "Lỗi khi tải lại danh sách",
      }
    );
  };

  const handleAdd = () => {
    setEditData(null);
    setModalOpen(true);
    toast.info("Mở form thêm sân bay mới");
  };

  const handleSubmit = async (formData) => {
    const isUpdate = !!editData;
    const airportName = formData.airportName;

    toast.promise(
      async () => {

        const response = isUpdate
          ? await airportApi.updateAirport(editData.airportId, formData)
          : await airportApi.createAirport(formData);

        if (response.success) {
          setModalOpen(false);
          setEditData(null); // Reset edit data after successful submission
          const airportResponse = await airportApi.getAllAirports({
            size: 1000,
          });
          if (airportResponse.success) {
            setAirports(
              airportResponse.data.content || airportResponse.data || []
            );
          }
          return response;
        } else {
          console.error("API Error:", response);
          throw new Error(
            response.message || "API returned unsuccessful response"
          );
        }
      },
      {
        loading: isUpdate ? "Đang cập nhật sân bay..." : "Đang thêm sân bay...",
        success: isUpdate
          ? `Đã cập nhật sân bay ${airportName} thành công!`
          : `Đã thêm sân bay ${airportName} thành công!`,
        error: "Lỗi khi lưu sân bay. Vui lòng thử lại!",
      }
    );
  };

  // Reset page to 0 on filter/sort changes to avoid empty pages
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, columnFilters, sorting]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Sân bay</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tổng cộng: {table.getFilteredRowModel().rows.length} sân bay
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

          <Button onClick={handleAdd}>Thêm sân bay</Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên, mã hoặc thành phố..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 dark:text-black"
              />
            </div>
          </div>
          <div className="w-full lg:w-48">
            <Select
              value={
                columnFilters.find((f) => f.id === "country")?.value || "all"
              }
              onValueChange={(value) =>
                setColumnFilters((prev) =>
                  value === "all"
                    ? prev.filter((f) => f.id !== "country")
                    : [
                        ...prev.filter((f) => f.id !== "country"),
                        { id: "country", value },
                      ]
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo quốc gia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả quốc gia</SelectItem>
                {uniqueCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full lg:w-48">
            <Select
              value={
                columnFilters.find((f) => f.id === "active")?.value ===
                undefined
                  ? "all"
                  : columnFilters.find((f) => f.id === "active")?.value
                  ? "active"
                  : "inactive"
              }
              onValueChange={(value) =>
                setColumnFilters((prev) =>
                  value === "all"
                    ? prev.filter((f) => f.id !== "active")
                    : [
                        ...prev.filter((f) => f.id !== "active"),
                        { id: "active", value: value === "active" },
                      ]
                )
              }
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
          <div className="w-full lg:w-48">
            <Select
              value={`${sorting[0]?.id || "airportName"}-${
                sorting[0]?.desc ? "desc" : "asc"
              }`}
              onValueChange={(value) => {
                const [id, desc] = value.split("-");
                setSorting([{ id, desc: desc === "desc" }]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airportName-asc">Tên A-Z</SelectItem>
                <SelectItem value="airportName-desc">Tên Z-A</SelectItem>
                <SelectItem value="airportCode-asc">Mã A-Z</SelectItem>
                <SelectItem value="airportCode-desc">Mã Z-A</SelectItem>
                <SelectItem value="cityNames-asc">Thành phố A-Z</SelectItem>
                <SelectItem value="cityNames-desc">Thành phố Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn {selectedRows.length} sân bay
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.resetRowSelection()}
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
      <Card>
        {loading ? (
          <AirportTableSkeleton />
        ) : (
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
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50 dark:hover:bg-gray-500"
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
                    {globalFilter
                      ? "Không tìm thấy sân bay nào"
                      : "Chưa có sân bay nào"}
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

      <AirportModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditData(null);
          toast.info("Đã đóng form sân bay");
        }}
        onSubmit={handleSubmit}
        initialData={editData}
        countries={countries}
      />
    </div>
  );
};

export default AirportPage;
