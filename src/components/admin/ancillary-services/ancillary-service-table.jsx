import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Star,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Pagination from "@/components/ui/pagination";
import { formatCurrencyVND, formatDateVN } from "@/utils/currency-utils";
import {
  ancillaryServiceApi,
  getServiceTypeInfo,
} from "@/apis/ancillary-service-api";

const AncillaryServiceTable = ({
  services = [],
  loading = false,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
  serviceTypes: propServiceTypes = {},
}) => {
  // Modal states
  const [selectedService, setSelectedService] = useState(null);

  // TanStack Table states
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([{ id: "createdAt", desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [serviceTypes, setServiceTypes] = useState(propServiceTypes);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Update serviceTypes when prop changes
  useEffect(() => {
    setServiceTypes(propServiceTypes);
  }, [propServiceTypes]);

  // Fetch service types on component mount (fallback if not provided via props)
  useEffect(() => {
    if (Object.keys(propServiceTypes).length === 0) {
      const fetchServiceTypes = async () => {
        try {
          const response = await ancillaryServiceApi.getServiceTypes();
          if (response.success && response.data && isMountedRef.current) {
            // Convert array of strings to object for easier access
            const typesObject = {};
            response.data.forEach((typeKey) => {
              // Use getServiceTypeInfo to get display info for each type
              typesObject[typeKey] = getServiceTypeInfo(typeKey);
            });
            setServiceTypes(typesObject);
          } else if (isMountedRef.current) {
            toast.error("Không thể tải danh sách loại dịch vụ từ server");
          }
        } catch (error) {
          if (isMountedRef.current) {
            toast.error("Lỗi khi tải danh sách loại dịch vụ từ server");
          }
        }
      };

      fetchServiceTypes();
    }

    // Cleanup function to set mounted ref to false
    return () => {
      isMountedRef.current = false;
    };
  }, [propServiceTypes]);

  // Create column helper
  const columnHelper = createColumnHelper();

  // Handle delete service
  const handleDeleteService = useCallback(
    async (service) => {
      if (
        !window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"?`)
      ) {
        return;
      }

      try {
        await onDelete(service.serviceId);
        toast.success("Xóa dịch vụ thành công!");
      } catch (error) {
        toast.error("Lỗi khi xóa dịch vụ");
      }
    },
    [onDelete]
  );

  // Handle toggle status
  const handleToggleStatus = useCallback(
    async (service) => {
      try {
        await onToggleStatus(service.serviceId);
        const action =
          service.isActive === null
            ? "duyệt"
            : service.isActive
            ? "tắt"
            : "bật";
        toast.success(`Dịch vụ đã được ${action} thành công!`);
      } catch (error) {
        toast.error("Lỗi khi thay đổi trạng thái dịch vụ");
      }
    },
    [onToggleStatus]
  );

  // Render service type badge
  const renderServiceType = useCallback(
    (serviceType) => {
      // First try to get from fetched serviceTypes
      const typeInfo =
        serviceTypes[serviceType] || getServiceTypeInfo(serviceType);
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          {/* <span>{typeInfo.icon}</span> */}
          {typeInfo.vietnameseName}
        </Badge>
      );
    },
    [serviceTypes]
  );

  // Get status badge
  const getStatusBadge = useCallback((isActive) => {
    if (isActive === true) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Hoạt động
        </Badge>
      );
    } else if (isActive === false) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Tạm dừng
        </Badge>
      );
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
    }
  }, []);

  // Render star rating for priority
  const renderPriorityStars = useCallback((priority) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= priority
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{priority}/5</span>
      </div>
    );
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

      // Service Name column
      columnHelper.accessor("serviceName", {
        header: "Tên dịch vụ",
        cell: (info) => {
          const service = info.row.original;
          return (
            <div className="flex items-center space-x-3">
              {/* <Avatar className="h-8 w-8">
                <AvatarImage
                  src={service.thumbnail}
                  alt={service.serviceName}
                />
                <AvatarFallback>
                  {getServiceTypeInfo(service.serviceType).icon}
                </AvatarFallback>
              </Avatar> */}
              <div>
                <div className="font-medium text-sm">
                  {info.getValue() || "N/A"}
                </div>
                {/**
                 * 
<div className="text-xs text-gray-500">
                  ID: {service.serviceId}
                </div>
                 */}
              </div>
            </div>
          );
        },
      }),

      // Service Type column
      columnHelper.accessor("serviceType", {
        header: "Loại dịch vụ",
        cell: (info) => renderServiceType(info.getValue()),
        filterFn: (row, columnId, filterValue) => {
          if (filterValue === "all") return true;
          return row.getValue(columnId) === filterValue;
        },
      }),

      // Price column
      columnHelper.accessor("price", {
        header: "Giá",
        cell: (info) => (
          <div className="font-medium text-blue-600">
            {formatCurrencyVND(info.getValue())}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const price = row.getValue(columnId);
          const { min, max } = filterValue;

          if (min !== null && price < min) return false;
          if (max !== null && price > max) return false;
          return true;
        },
      }),

      // Status column
      columnHelper.accessor("isActive", {
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
              <DropdownMenuItem
                onClick={() => onEdit(row.original)}
                className="flex items-center space-x-2 text-blue-600"
              >
                <Edit className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleToggleStatus(row.original)}
                className={`flex items-center space-x-2 ${
                  row.original.isActive ? "text-orange-600" : "text-green-600"
                }`}
              >
                {row.original.isActive ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>Tắt dịch vụ</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Bật dịch vụ</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteService(row.original)}
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
    [
      renderServiceType,
      getStatusBadge,
      renderPriorityStars,
      onViewDetails,
      onEdit,
      onToggleStatus,
      handleDeleteService,
      handleToggleStatus,
    ]
  );

  // Table state
  const tableState = useMemo(
    () => ({
      globalFilter,
      columnFilters,
      sorting,
      rowSelection,
      pagination,
    }),
    [globalFilter, columnFilters, sorting, rowSelection, pagination]
  );

  // Create table instance
  const table = useReactTable({
    data: services || [],
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
    state: tableState,
    enableRowSelection: true,
  });

  // Bulk actions
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedServices = useMemo(() => {
    try {
      return selectedRows.map((row) => row.original);
    } catch (error) {
      console.warn("Error getting selected services:", error);
      return [];
    }
  }, [selectedRows]);

  const handleBulkActivate = useCallback(async () => {
    if (selectedServices.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn bật ${selectedServices.length} dịch vụ đã chọn?`
      )
    )
      return;

    try {
      const activatePromises = selectedServices
        .filter((service) => service.isActive !== true)
        .map((service) => onToggleStatus(service.serviceId));

      await Promise.all(activatePromises);
      setRowSelection({});
      toast.success(`Đã bật ${selectedServices.length} dịch vụ thành công!`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi bật dịch vụ");
    }
  }, [selectedServices, onToggleStatus]);

  const handleBulkDeactivate = useCallback(async () => {
    if (selectedServices.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn tắt ${selectedServices.length} dịch vụ đã chọn?`
      )
    )
      return;

    try {
      const deactivatePromises = selectedServices
        .filter((service) => service.isActive === true)
        .map((service) => onToggleStatus(service.serviceId));

      await Promise.all(deactivatePromises);
      setRowSelection({});
      toast.success(`Đã tắt ${selectedServices.length} dịch vụ thành công!`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tắt dịch vụ");
    }
  }, [selectedServices, onToggleStatus]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedServices.length === 0) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedServices.length} dịch vụ đã chọn?`
      )
    )
      return;

    try {
      const deletePromises = selectedServices.map((service) =>
        onDelete(service.serviceId)
      );

      await Promise.all(deletePromises);
      setRowSelection({});
      toast.success(`Đã xóa ${selectedServices.length} dịch vụ thành công!`);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa dịch vụ");
    }
  }, [selectedServices, onDelete]);

  // Reset page to 0 on filter/sort changes to avoid empty pages
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, columnFilters, sorting]);

  // Update column filters when serviceTypeFilter changes
  useEffect(() => {
    if (serviceTypeFilter === "all") {
      setColumnFilters((prev) =>
        prev.filter((filter) => filter.id !== "serviceType")
      );
    } else {
      setColumnFilters((prev) => {
        const newFilters = prev.filter((filter) => filter.id !== "serviceType");
        newFilters.push({ id: "serviceType", value: serviceTypeFilter });
        return newFilters;
      });
    }
  }, [serviceTypeFilter]);

  // Update column filters when priceRange changes
  useEffect(() => {
    setColumnFilters((prev) => {
      let newFilters = prev.filter((filter) => filter.id !== "price");

      const minPrice = parseFloat(priceRange.min);
      const maxPrice = parseFloat(priceRange.max);

      if (!isNaN(minPrice) || !isNaN(maxPrice)) {
        newFilters.push({
          id: "price",
          value: {
            min: isNaN(minPrice) ? null : minPrice,
            max: isNaN(maxPrice) ? null : maxPrice,
          },
        });
      }

      return newFilters;
    });
  }, [priceRange]);

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm dịch vụ..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10 w-64 dark:text-black"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={serviceTypeFilter}
              onValueChange={setServiceTypeFilter}
              disabled={Object.keys(serviceTypes).length === 0}
            >
              <SelectTrigger className="w-48">
                <SelectValue
                  placeholder={
                    Object.keys(serviceTypes).length === 0
                      ? "Đang tải..."
                      : "Lọc theo loại dịch vụ"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại dịch vụ</SelectItem>
                {Object.entries(serviceTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.vietnameseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Giá:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Từ"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                }
                className="w-24 h-8 text-sm dark:text-black"
              />
              <span className="text-sm text-gray-400">-</span>
              <Input
                type="number"
                placeholder="Đến"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                }
                className="w-24 h-8 text-sm dark:text-black"
              />
              <span className="text-sm text-gray-400">VND</span>
              {(priceRange.min || priceRange.max) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPriceRange({ min: "", max: "" })}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Bulk Actions */}
          {selectedServices.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkActivate}
                disabled={selectedServices.every((s) => s.isActive)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Bật ({selectedServices.filter((s) => !s.isActive).length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={selectedServices.every((s) => !s.isActive)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tắt ({selectedServices.filter((s) => s.isActive).length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa ({selectedServices.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer  select-none"
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
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Checkbox disabled />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : services && services.length > 0 ? (
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
                  Không có dịch vụ nào
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
          totalItems={services.length}
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

export default AncillaryServiceTable;
