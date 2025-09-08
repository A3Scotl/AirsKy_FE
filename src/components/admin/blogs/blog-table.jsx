import { useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  ThumbsUp,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import BlogFormModal from "./blog-form-modal";
import BlogDetailModal from "./blog-detail-modal";
import { blogApi } from "@/apis/blog-api";
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
import Pagination from "@/components/ui/pagination";

const BlogTable = ({
  blogs,
  searchQuery,
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onAdd,
  onEdit,
  onDelete,
  loading,
}) => {
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formMode, setFormMode] = useState("add");

  // No client-side filtering since data is already filtered by backend
  const displayBlogs = blogs || [];

  const handleItemsPerPageChange = (newItemsPerPage) => {
    // Reset to page 1 when changing items per page to avoid showing empty data
    onPageChange(1);
    onItemsPerPageChange(newItemsPerPage);
  };

  const handleAddBlog = () => {
    setSelectedBlog(null);
    setFormMode("add");
    setShowFormModal(true);
  };

  const handleEditBlog = (blog) => {
    setSelectedBlog(blog);
    setFormMode("edit");
    setShowFormModal(true);
  };

  const handleViewBlog = (blog) => {
    setSelectedBlog(blog);
    setShowDetailModal(true);
  };

  // Nhận thêm isFormData để phân biệt loại dữ liệu
  const handleSaveBlog = async (blogData, isFormData = false) => {
    try {
      if (formMode === "add") {
        // Call API to create blog
        const response = await blogApi.createBlog(blogData);
        if (response.success) {
          console.log("Blog created successfully:", response.data);
          onAdd?.(response.data);
          setShowFormModal(false);
          toast.success("Tạo bài viết thành công!");
        } else {
          console.error("Failed to create blog:", response.message);
          toast.error("Lỗi tạo bài viết: " + response.message);
        }
      } else {
        // Call API to update blog
        const response = await blogApi.updateBlog(
          selectedBlog.blogId,
          blogData
        );
        if (response.success) {
          console.log("Blog updated successfully:", response.data);
          onEdit?.(selectedBlog.blogId, response.data);
          setShowFormModal(false);
          toast.success("Cập nhật bài viết thành công!");
        } else {
          console.error("Failed to update blog:", response.message);
          toast.error("Lỗi cập nhật bài viết: " + response.message);
        }
      }
      // Don't close modal here, let success case handle it
    } catch (error) {
      console.error("Error saving blog:", error);
      toast.error("Lỗi kết nối API: " + error.message);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        const response = await blogApi.deleteBlog(blogId);
        if (response.success) {
          console.log("Blog deleted successfully");
          onDelete?.(blogId);
          toast.success("Xóa bài viết thành công!");
        } else {
          console.error("Failed to delete blog:", response.message);
          toast.error("Lỗi xóa bài viết: " + response.message);
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        toast.error("Lỗi kết nối API: " + error.message);
      }
    }
  };

  const handleTogglePublish = async (blogId, isPublished) => {
    try {
      const response = isPublished
        ? await blogApi.unpublishBlog(blogId)
        : await blogApi.publishBlog(blogId);

      if (response.success) {
        console.log(
          `Blog ${isPublished ? "unpublished" : "published"} successfully`
        );
        onEdit?.(blogId, { isPublished: !isPublished });
        toast.success(
          `Bài viết đã ${isPublished ? "hủy đăng" : "đăng"} thành công!`
        );
      } else {
        console.error(
          `Failed to ${isPublished ? "unpublish" : "publish"} blog:`,
          response.message
        );
        toast.error(
          `Lỗi ${isPublished ? "hủy đăng" : "đăng"} bài viết: ` +
            response.message
        );
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Lỗi kết nối API: " + error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quản lý Blog
          </CardTitle>
          <Button onClick={handleAddBlog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Thêm Blog
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>

                  <TableHead>Danh mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead>Lượt thích</TableHead>
                  <TableHead>Ngày tạo</TableHead>
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
                ) : displayBlogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Không có blog nào
                    </TableCell>
                  </TableRow>
                ) : (
                  displayBlogs.map((blog) => (
                    <TableRow key={blog.blogId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium truncate max-w-xs">
                            {blog.title}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {blog.excerpt}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {blog.categories?.map((category) => (
                            <Badge
                              key={category.categoryId}
                              variant="secondary"
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={blog.isPublished ? "success" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {blog.isPublished ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {blog.isPublished ? "Đã xuất bản" : "Bản nháp"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {blog.viewCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                          {blog.likeCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4" />
                                {formatDate(blog.createdAt)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatDateTime(blog.createdAt)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
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
                              onClick={() => handleViewBlog(blog)}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditBlog(blog)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleTogglePublish(
                                  blog.blogId,
                                  blog.isPublished
                                )
                              }
                              className="flex items-center gap-2"
                            >
                              {blog.isPublished ? (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  Hủy đăng
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Đăng bài
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteBlog(blog.blogId)}
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

      <BlogFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedBlog(null);
        }}
        onSave={handleSaveBlog}
        blog={selectedBlog}
        mode={formMode}
      />

      <BlogDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBlog(null);
        }}
        blog={selectedBlog}
      />
    </div>
  );
};

export default BlogTable;
