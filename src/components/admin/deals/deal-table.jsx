import { useState } from "react";
import {
  Edit,
  Trash2,
  Calendar,
  Percent,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Tag,
  Plane,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import DealFormModal from "./deal-form-modal";
import DealDetailModal from "./deal-detail-modal";
import DealTableSkeleton from "./deal-table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "@/components/ui/pagination";

const DealTable = ({
  deals,
  searchQuery,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onEdit,
  onAdd,
  onDelete,
  loading,
}) => {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedDeals, setSelectedDeals] = useState([]);

  const handleAddDeal = () => {
    setSelectedDeal(null);
    setFormMode("add");
    setShowFormModal(true);
  };

  const handleEditDeal = (deal) => {
    setSelectedDeal(deal);
    setFormMode("edit");
    setShowFormModal(true);
  };

  const handleViewDeal = (deal) => {
    setSelectedDeal(deal);
    setShowDetailModal(true);
  };

  const handleSaveDeal = async (dealData) => {
    try {
      if (formMode === "add") {
        await onAdd?.(dealData);
      } else {
        await onEdit?.(selectedDeal.dealId, dealData);
      }
      setShowFormModal(false);
      setSelectedDeal(null);
    } catch (error) {
      console.error("Error saving deal:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Hàm xác định trạng thái deal giống backend

  const getStatusBadge = (deal) => {
    const status = getDealStatus(deal);
    switch (status) {
      case "SẮP HOẠT ĐỘNG":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Sắp hoạt động
          </Badge>
        );
      case "ĐÃ HẾT HẠN":
        return (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 text-white"
          >
            <Clock className="h-3 w-3" />
            Đã hết hạn
          </Badge>
        );
      case "HẾT LƯỢT SỬ DỤNG":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Hết lượt sử dụng
          </Badge>
        );
      case "ĐANG HOẠT ĐỘNG":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Đang hoạt động
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Không xác định
          </Badge>
        );
    }
  };

  const getUsageProgress = (deal) => {
    if (!deal.totalUsageLimit) return 0;
    return (deal.usedCount / deal.totalUsageLimit) * 100;
  };

  const handleSelectDeal = (deal, checked) => {
    if (deal.dealCode?.startsWith("POINTS")) return; // Không cho select deal POINTS

    if (checked) {
      setSelectedDeals((prev) => [...prev, deal]);
    } else {
      setSelectedDeals((prev) => prev.filter((d) => d.dealId !== deal.dealId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDeals(
        (deals || []).filter((deal) => !deal.dealCode?.startsWith("POINTS"))
      );
    } else {
      setSelectedDeals([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) return;

    // Lọc bỏ deal POINTS (mặc dù đã lọc ở handleSelectDeal)
    const deletableDeals = selectedDeals.filter(
      (deal) => !deal.dealCode?.startsWith("POINTS")
    );

    if (deletableDeals.length === 0) return;

    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa ${deletableDeals.length} deal đã chọn?`
    );

    if (!confirmDelete) return;

    try {
      for (const deal of deletableDeals) {
        await onDelete?.(deal.dealId);
      }
      setSelectedDeals([]);
    } catch (error) {
      console.error("Error bulk deleting deals:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Quản lý Deal
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedDeals.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Xóa ({selectedDeals.length})
              </Button>
            )}
            <Button onClick={handleAddDeal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm Deal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedDeals.length ===
                          (deals?.filter(
                            (d) => !d.dealCode?.startsWith("POINTS")
                          ).length || 0) &&
                        deals?.some((d) => !d.dealCode?.startsWith("POINTS"))
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Mã Deal</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Đơn tối thiểu</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-12">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <DealTableSkeleton />
                ) : deals && deals.length > 0 ? (
                  deals.map((deal) => (
                    <TableRow
                      key={deal.dealId}
                      className={
                        selectedDeals.some((d) => d.dealId === deal.dealId)
                          ? "bg-muted/50"
                          : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedDeals.some(
                            (d) => d.dealId === deal.dealId
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectDeal(deal, checked)
                          }
                          disabled={deal.dealCode?.startsWith("POINTS")}
                          aria-label="Select row"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-mono font-medium text-gray-900 dark:text-white">
                          {deal.dealCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {deal.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <Percent className="h-4 w-4" />
                          {deal.discountPercentage}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {formatCurrency(deal.minimumOrderAmount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {deal.usedCount}/{deal.totalUsageLimit || "∞"}
                          </div>
                          {deal.totalUsageLimit && (
                            <div className="w-full">
                              <Progress
                                value={getUsageProgress(deal)}
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {formatDate(deal.validFrom)} -
                          </div>
                          <div className="text-sm">
                            {formatDate(deal.validTo)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(deal)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDeal(deal)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditDeal(deal)}
                              className="flex items-center gap-2"
                              disabled={deal.dealCode?.startsWith("POINTS")}
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete?.(deal.dealId)}
                              className="flex items-center gap-2 text-destructive"
                              disabled={deal.dealCode?.startsWith("POINTS")}
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Không có deal nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onPageSizeChange={onItemsPerPageChange}
            showPageSizeSelector={true}
            showFirstLast={true}
            showInfo={true}
            maxVisiblePages={5}
          />
        </CardContent>
      </Card>

      <DealFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedDeal(null);
        }}
        onSave={handleSaveDeal}
        deal={selectedDeal}
        mode={formMode}
      />

      <DealDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDeal(null);
        }}
        deal={selectedDeal}
      />
    </div>
  );
};

export default DealTable;

export const getDealStatus = (deal) => {
  const now = new Date();
  const validFrom = deal.validFrom ? new Date(deal.validFrom) : null;
  const validTo = deal.validTo ? new Date(deal.validTo) : null;
  if (validFrom && validFrom > now) {
    return "SẮP HOẠT ĐỘNG";
  }
  if (validTo && validTo < now) {
    return "ĐÃ HẾT HẠN";
  }
  if (
    deal.totalUsageLimit != null &&
    deal.usedCount != null &&
    deal.usedCount >= deal.totalUsageLimit
  ) {
    return "HẾT LƯỢT SỬ DỤNG";
  }
  if (
    deal.isActive &&
    validFrom &&
    validFrom <= now &&
    validTo &&
    validTo >= now &&
    (deal.totalUsageLimit == null ||
      deal.usedCount == null ||
      deal.usedCount < deal.totalUsageLimit)
  ) {
    return "ĐANG HOẠT ĐỘNG";
  }
  return "KHÔNG XÁC ĐỊNH";
};
