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
} from "lucide-react";
import DealFormModal from "./deal-form-modal";
import DealDetailModal from "./deal-detail-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const filteredDeals =
    deals?.filter((deal) => {
      const query = searchQuery.toLowerCase();
      return (
        deal.title?.toLowerCase().includes(query) ||
        deal.dealCode?.toLowerCase().includes(query) ||
        deal.description?.toLowerCase().includes(query)
      );
    }) || [];

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

  const getStatusBadge = (deal) => {
    if (!deal.isActive) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Không hoạt động
        </Badge>
      );
    }

    if (deal.isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Hết hạn
        </Badge>
      );
    }

    if (!deal.isAvailable) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Hết lượt sử dụng
        </Badge>
      );
    }

    return (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Đang hoạt động
      </Badge>
    );
  };

  const getUsageProgress = (deal) => {
    if (!deal.totalUsageLimit) return 0;
    return (deal.usedCount / deal.totalUsageLimit) * 100;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Quản lý Deal
          </CardTitle>
          <Button onClick={handleAddDeal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Thêm Deal
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Deal</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead>Đơn tối thiểu</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredDeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Không có deal nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeals.map((deal) => (
                    <TableRow key={deal.dealId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-mono font-medium">
                            {deal.dealCode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {deal.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-green-600 font-medium">
                            <Percent className="h-4 w-4" />
                            {deal.discountPercentage}%
                          </div>
                          {deal.maxDiscountAmount && (
                            <div className="text-sm text-muted-foreground">
                              Tối đa: {formatCurrency(deal.maxDiscountAmount)}
                            </div>
                          )}
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
                              <span className="sr-only">Mở menu</span>
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
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete?.(deal.dealId)}
                              className="flex items-center gap-2 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(totalItems / itemsPerPage))}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onPageSizeChange={onItemsPerPageChange}
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
