import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

// Flight-related components
export const EmptyState = ({ type, onAction, actionText }) => {
  const states = {
    noSearch: {
      icon: <Plane className="w-12 h-12 mx-auto text-blue-400 mb-4" />,
      title: "Bắt đầu tìm chuyến bay của bạn",
      description:
        "Sử dụng form tìm kiếm ở trên hoặc chọn điểm đến từ trang chủ",
      buttonText: "Tìm chuyến bay",
    },
    noResults: {
      icon: <Plane className="w-12 h-12 mx-auto text-gray-400 mb-4" />,
      title: "Không tìm thấy chuyến bay",
      description:
        "Không có chuyến bay nào phù hợp với tiêu chí tìm kiếm của bạn",
      buttonText: actionText || "Tìm kiếm lại",
    },
    loading: {
      icon: (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      ),
      title: "Đang tải chuyến bay...",
      description: "Vui lòng đợi trong giây lát",
      buttonText: null,
    },
  };

  const state = states[type];

  return (
    <Card className="p-6 sm:p-8 text-center">
      {state.icon}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {state.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{state.description}</p>
      {state.buttonText && (
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onAction}
        >
          {state.buttonText}
        </Button>
      )}
    </Card>
  );
};
