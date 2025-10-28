import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Building2,
  DollarSign,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// Mock data
const PAYMENT_METHODS = {
  CREDIT_CARD: {
    id: "CREDIT_CARD",
    name: "Thẻ tín dụng",
    icon: CreditCard,
    color: "bg-blue-100 text-blue-800",
    isActive: true,
    config: {
      merchantId: "MERCH_123456",
      apiKey: import.meta.env.VITE_STRIPE_TEST_API_KEY,
      supportedCards: ["Visa", "MasterCard", "American Express"],
      processingFee: 2.9,
      currency: "VND",
      testMode: true,
    },
  },
  BANK_TRANSFER: {
    id: "BANK_TRANSFER",
    name: "Chuyển khoản ngân hàng",
    icon: Building2,
    color: "bg-green-100 text-green-800",
    isActive: true,
    config: {
      bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
      accountNumber: "1234567890",
      accountHolder: "CONG TY TNHH AIRSKY",
      branch: "Chi nhánh Hà Nội",
      swiftCode: "BFTVVNVX",
      instructions: "Vui lòng ghi rõ mã đơn hàng khi chuyển khoản",
      processingTime: "1-3 ngày làm việc",
    },
  },
  PAYPAL: {
    id: "PAYPAL",
    name: "PayPal",
    icon: DollarSign,
    color: "bg-orange-100 text-orange-800",
    isActive: false,
    config: {
      clientId:
        import.meta.env.VITE_PAYPAL_TEST_API_KEY,
      merchantEmail: "merchant@airsky.com",
      currency: "USD",
      processingFee: 3.9,
      testMode: true,
    },
  },
};

const PaymentMethods = () => {
  const [methods, setMethods] = useState(PAYMENT_METHODS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  // Load payment methods từ API (mock)
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoading(true);
      try {
        // Trong thực tế sẽ gọi API
        // const response = await paymentApi.getPaymentMethods();
        // setMethods(response.data);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        
        toast.error("Không thể tải thông tin phương thức thanh toán");
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

  const handleToggleActive = async (methodId) => {
    const method = methods[methodId];
    const newActiveStatus = !method.isActive;

    try {
      // Trong thực tế sẽ gọi API để cập nhật
      // await paymentApi.updatePaymentMethod(methodId, { isActive: newActiveStatus });

      // Update local state
      setMethods((prev) => ({
        ...prev,
        [methodId]: {
          ...prev[methodId],
          isActive: newActiveStatus,
        },
      }));

      toast.success(
        `${method.name} đã được ${newActiveStatus ? "kích hoạt" : "tắt"}`
      );
    } catch (error) {
      
      toast.error("Không thể cập nhật trạng thái phương thức thanh toán");
    }
  };

  const handleSaveConfig = async (methodId, config) => {
    setSaving((prev) => ({ ...prev, [methodId]: true }));

    try {
      // Trong thực tế sẽ gọi API để lưu config
      // await paymentApi.updatePaymentMethodConfig(methodId, config);

      // Update local state
      setMethods((prev) => ({
        ...prev,
        [methodId]: {
          ...prev[methodId],
          config: { ...prev[methodId].config, ...config },
        },
      }));

      toast.success(`Cấu hình ${methods[methodId].name} đã được lưu`);
    } catch (error) {
      
      toast.error("Không thể lưu cấu hình phương thức thanh toán");
    } finally {
      setSaving((prev) => ({ ...prev, [methodId]: false }));
    }
  };

  const handleInputChange = (methodId, field, value) => {
    setMethods((prev) => ({
      ...prev,
      [methodId]: {
        ...prev[methodId],
        config: {
          ...prev[methodId].config,
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản lý phương thức thanh toán
          </h2>
          <p className="text-gray-600">
            Cấu hình và quản lý các phương thức thanh toán có sẵn
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.values(methods).map((method) => {
          const IconComponent = method.icon;

          return (
            <Card key={method.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${method.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <Badge
                        variant={method.isActive ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {method.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Tắt
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={method.isActive}
                    onCheckedChange={() => handleToggleActive(method.id)}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {method.id === "CREDIT_CARD" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`merchant-${method.id}`}>
                        Merchant ID
                      </Label>
                      <Input
                        id={`merchant-${method.id}`}
                        value={method.config.merchantId}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "merchantId",
                            e.target.value
                          )
                        }
                        placeholder="Nhập Merchant ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`api-key-${method.id}`}>API Key</Label>
                      <Input
                        id={`api-key-${method.id}`}
                        type="password"
                        value={method.config.apiKey}
                        onChange={(e) =>
                          handleInputChange(method.id, "apiKey", e.target.value)
                        }
                        placeholder="Nhập API Key"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`fee-${method.id}`}>Phí xử lý (%)</Label>
                      <Input
                        id={`fee-${method.id}`}
                        type="number"
                        step="0.1"
                        value={method.config.processingFee}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "processingFee",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`test-mode-${method.id}`}
                        checked={method.config.testMode}
                        onCheckedChange={(checked) =>
                          handleInputChange(method.id, "testMode", checked)
                        }
                      />
                      <Label htmlFor={`test-mode-${method.id}`}>
                        Chế độ test
                      </Label>
                    </div>
                  </div>
                )}

                {method.id === "BANK_TRANSFER" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`bank-${method.id}`}>Tên ngân hàng</Label>
                      <Input
                        id={`bank-${method.id}`}
                        value={method.config.bankName}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "bankName",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`account-${method.id}`}>
                        Số tài khoản
                      </Label>
                      <Input
                        id={`account-${method.id}`}
                        value={method.config.accountNumber}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "accountNumber",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`holder-${method.id}`}>
                        Chủ tài khoản
                      </Label>
                      <Input
                        id={`holder-${method.id}`}
                        value={method.config.accountHolder}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "accountHolder",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`instructions-${method.id}`}>
                        Hướng dẫn
                      </Label>
                      <Textarea
                        id={`instructions-${method.id}`}
                        value={method.config.instructions}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "instructions",
                            e.target.value
                          )
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {method.id === "PAYPAL" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`client-id-${method.id}`}>
                        Client ID
                      </Label>
                      <Input
                        id={`client-id-${method.id}`}
                        value={method.config.clientId}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "clientId",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${method.id}`}>
                        Email merchant
                      </Label>
                      <Input
                        id={`email-${method.id}`}
                        type="email"
                        value={method.config.merchantEmail}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "merchantEmail",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor={`paypal-fee-${method.id}`}>
                        Phí xử lý (%)
                      </Label>
                      <Input
                        id={`paypal-fee-${method.id}`}
                        type="number"
                        step="0.1"
                        value={method.config.processingFee}
                        onChange={(e) =>
                          handleInputChange(
                            method.id,
                            "processingFee",
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`paypal-test-${method.id}`}
                        checked={method.config.testMode}
                        onCheckedChange={(checked) =>
                          handleInputChange(method.id, "testMode", checked)
                        }
                      />
                      <Label htmlFor={`paypal-test-${method.id}`}>
                        Chế độ test
                      </Label>
                    </div>
                  </div>
                )}

                <Separator />

                <Button
                  onClick={() => handleSaveConfig(method.id, method.config)}
                  disabled={saving[method.id]}
                  className="w-full"
                >
                  {saving[method.id] ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu cấu hình
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethods;
