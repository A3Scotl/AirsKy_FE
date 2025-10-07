import { useState, useMemo, useCallback, useEffect } from "react";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [serviceTypes, setServiceTypes] = useState({});
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);

  // Fetch service types on component mount
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        setLoadingServiceTypes(true);
        const response = await ancillaryServiceApi.getServiceTypes();
        if (response.success && response.data) {
          // Convert array of strings to object for easier access
          const typesObject = {};
          response.data.forEach((typeKey) => {
            // Use getServiceTypeInfo to get display info for each type
            typesObject[typeKey] = getServiceTypeInfo(typeKey);
          });
          setServiceTypes(typesObject);
        } else {
          console.error("Failed to fetch service types:", response.message);
          toast.error("Không thể tải danh sách loại dịch vụ từ server");
        }
      } catch (error) {
        console.error("Error fetching service types:", error);
        toast.error("Lỗi khi tải danh sách loại dịch vụ từ server");
      } finally {
        setLoadingServiceTypes(false);
      }
    };

    fetchServiceTypes();
  }, []);

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
        console.error("Error deleting service:", error);
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
        console.error("Error toggling service status:", error);
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
          <span>{typeInfo.icon}</span>
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

  // Create table instance
  const table = useReactTable({
    data: services,
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
  const selectedServices = useMemo(
    () => selectedRows.map((row) => row.original),
    [selectedRows]
  );

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
      console.error("Error bulk activating services:", error);
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
      console.error("Error bulk deactivating services:", error);
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
      console.error("Error bulk deleting services:", error);
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
              className="pl-10 w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={serviceTypeFilter}
              onValueChange={setServiceTypeFilter}
              disabled={loadingServiceTypes}
            >
              <SelectTrigger className="w-48">
                <SelectValue
                  placeholder={
                    loadingServiceTypes
                      ? "Đang tải..."
                      : "Lọc theo loại dịch vụ"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại dịch vụ</SelectItem>
                {Object.entries(serviceTypes).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.icon} {type.vietnameseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
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
