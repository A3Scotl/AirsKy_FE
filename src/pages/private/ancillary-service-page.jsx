import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import SEO from "@/components/common/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";

import AncillaryServiceTable from "../../components/admin/ancillary-services/ancillary-service-table";
import AncillaryServiceForm from "../../components/admin/ancillary-services/ancillary-service-form";
import {
  ancillaryServiceApi,
  getServiceTypeInfo,
} from "@/apis/ancillary-service-api";

const AncillaryServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [serviceTypes, setServiceTypes] = useState({});
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);

  // Fetch service types on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchServiceTypes = async () => {
      try {
        setLoadingServiceTypes(true);
        const response = await ancillaryServiceApi.getServiceTypes();
        if (response.success && isMounted) {
          // Convert array to object for easier access
          const typesObject = {};
          response.data.forEach((type) => {
            typesObject[type] = getServiceTypeInfo(type);
          });
          setServiceTypes(typesObject);
        } else if (isMounted) {
          console.error("Failed to fetch service types:", response.message);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching service types:", error);
        }
      } finally {
        if (isMounted) {
          setLoadingServiceTypes(false);
        }
      }
    };

    fetchServiceTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [editingService, setEditingService] = useState(null);

  // Load services
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: pageSize,
        serviceType:
          serviceTypeFilter !== "all" ? serviceTypeFilter : undefined,
      };

      const response = await ancillaryServiceApi.getAllServices(params);

      if (response.success) {
        setServices(response.data.content || []);
        setTotalElements(response.data.totalElements || 0);
      } else {
        toast.error("Không thể tải danh sách dịch vụ");
      }
    } catch (error) {
      toast.error("Lỗi khi tải danh sách dịch vụ");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, serviceTypeFilter]);

  // Load services on mount and when dependencies change
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Handle create service
  const handleCreateService = useCallback(
    async (serviceData) => {
      const response = await ancillaryServiceApi.createService(serviceData);
      if (response.success) {
        await loadServices();
        return response.data;
      } else {
        throw new Error(response.message || "Không thể tạo dịch vụ");
      }
    },
    [loadServices]
  );

  // Handle update service
  const handleUpdateService = useCallback(
    async (serviceData) => {
      if (!editingService) return;

      const response = await ancillaryServiceApi.updateService(
        editingService.serviceId,
        serviceData
      );
      if (response.success) {
        await loadServices();
        return response.data;
      } else {
        throw new Error(response.message || "Không thể cập nhật dịch vụ");
      }
    },
    [editingService, loadServices]
  );

  // Handle delete service
  const handleDeleteService = useCallback(
    async (serviceId) => {
      const response = await ancillaryServiceApi.deleteService(serviceId);
      if (response.success) {
        await loadServices();
        return response.data;
      } else {
        throw new Error(response.message || "Không thể xóa dịch vụ");
      }
    },
    [loadServices]
  );

  // Handle toggle status
  const handleToggleStatus = useCallback(
    async (serviceId) => {
      // Find the service to check its current status
      const service = services.find((s) => s.serviceId === serviceId);
      if (!service) {
        throw new Error("Không tìm thấy dịch vụ");
      }

      // Determine new status: null -> true, true -> false, false -> true
      const newStatus = service.isActive === null ? true : !service.isActive;

      const response = await ancillaryServiceApi.updateService(serviceId, {
        isActive: newStatus,
      });
      if (response.success) {
        await loadServices();
        return response.data;
      } else {
        throw new Error(
          response.message || "Không thể thay đổi trạng thái dịch vụ"
        );
      }
    },
    [services, loadServices]
  );

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (serviceData) => {
      if (editingService) {
        return await handleUpdateService(serviceData);
      } else {
        return await handleCreateService(serviceData);
      }
    },
    [editingService, handleCreateService, handleUpdateService]
  );

  // Handle view details
  const handleViewDetails = useCallback((service) => {
    setSelectedService(service);
    setShowDetails(true);
  }, []);

  // Handle edit service
  const handleEditService = useCallback((service) => {
    setEditingService(service);
    setShowForm(true);
  }, []);

  // Handle create new service
  const handleCreateNew = useCallback(() => {
    setEditingService(null);
    setShowForm(true);
  }, []);

  // Handle close form
  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingService(null);
  }, []);

  // Handle close details
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false);
    setSelectedService(null);
  }, []);

  // Get service statistics
  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    inactive: services.filter((s) => !s.isActive).length,
  };

  return (
    <>
      <SEO
        title="Quản lý dịch vụ đi kèm"
        description="Quản lý các dịch vụ đi kèm cho hệ thống đặt vé máy bay"
        keywords="quản lý dịch vụ, ancillary services, dịch vụ đi kèm"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dịch vụ đi kèm
            </h1>
            <p className="text-muted-foreground">
              Quản lý các dịch vụ bổ sung cho chuyến bay
            </p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm dịch vụ
          </Button>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader></CardHeader>
          <CardContent>
            <AncillaryServiceTable
              services={services}
              loading={loading}
              onViewDetails={handleViewDetails}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              onToggleStatus={handleToggleStatus}
              onCreate={handleCreateNew}
            />
          </CardContent>
        </Card>

        {/* Services Table */}
        {/* <AncillaryServiceTable
          services={services}
          loading={loading}
          onViewDetails={handleViewDetails}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          onToggleStatus={handleToggleStatus}
          onCreate={handleCreateNew}
        /> */}

        {/* Service Form Modal */}
        <AncillaryServiceForm
          open={showForm}
          onOpenChange={handleCloseForm}
          service={editingService}
          onSubmit={handleFormSubmit}
          loading={loading}
        />

        {/* Service Details Modal */}
        <Dialog open={showDetails} onOpenChange={handleCloseDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Chi tiết dịch vụ</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về dịch vụ đi kèm
              </DialogDescription>
            </DialogHeader>

            {selectedService && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">
                      {getServiceTypeInfo(selectedService.serviceType).icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedService.name}
                    </h3>
                    <Badge variant="outline">
                      {
                        getServiceTypeInfo(selectedService.serviceType)
                          .vietnameseName
                      }
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Giá</Label>
                    <p className="text-lg font-semibold text-blue-600">
                      {selectedService.price?.toLocaleString("vi-VN")} VND
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Trạng thái</Label>
                    <Badge
                      variant={
                        selectedService.isActive ? "default" : "secondary"
                      }
                    >
                      {selectedService.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Ngày tạo</Label>
                    <p className="text-sm">
                      {new Date(selectedService.createdAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>

                {selectedService.description && (
                  <div>
                    <Label className="text-sm font-medium">Mô tả</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedService.description}
                    </p>
                  </div>
                )}

                {selectedService.imageUrl && (
                  <div>
                    <Label className="text-sm font-medium">Hình ảnh</Label>
                    <img
                      src={selectedService.imageUrl}
                      alt={selectedService.name}
                      className="w-full max-w-sm h-32 object-cover rounded-lg mt-2"
                    />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AncillaryServicesPage;
