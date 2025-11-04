import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Trash2, X, Calendar, Hash, FileText } from "lucide-react";

const CategoryDetailModal = ({
  isOpen,
  onClose,
  category,
  onEdit,
  onDelete,
}) => {
  if (!category) return null;

  const handleEdit = () => {
    onClose();
    onEdit(category);
  };

  const handleDelete = () => {
    const categoryId = category.categoryId;
    onClose();
    onDelete(categoryId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between dark:text-white">
            Chi tiết Category
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tên Category
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white ml-6">
                {category.name}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug
                </span>
              </div>
              <div className="ml-6">
                <Badge
                  variant="secondary"
                  className="font-mono dark:bg-gray-700 dark:text-gray-300"
                >
                  {category.slug}
                </Badge>
              </div>
            </div>

            {category.description && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mô tả
                  </span>
                </div>
                <p className="text-gray-900 dark:text-white ml-6 whitespace-pre-wrap">
                  {category.description}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t dark:border-gray-700 pt-4 space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Thông tin hệ thống
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Ngày tạo
                  </span>
                </div>
                <p className="text-gray-900 dark:text-white ml-6">
                  {category.createdAt
                    ? new Date(category.createdAt).toLocaleString("vi-VN")
                    : "N/A"}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Cập nhật cuối
                  </span>
                </div>
                <p className="text-gray-900 dark:text-white ml-6">
                  {category.updatedAt
                    ? new Date(category.updatedAt).toLocaleString("vi-VN")
                    : "N/A"}
                </p>
              </div>

              {category.categoryId && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">ID</span>
                  </div>
                  <p className="text-gray-900 dark:text-white ml-6 font-mono text-sm">
                    #{category.categoryId}
                  </p>
                </div>
              )}

              {category.blogCount !== undefined && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Số bài viết sử dụng
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white ml-6">
                    {category.blogCount} bài viết
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* URL Preview */}
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              URL xem trước
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                /categories/{category.slug}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDetailModal;
