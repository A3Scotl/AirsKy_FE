import { X, Calendar, User, Tag, Eye, ThumbsUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import "@/components/ui/ckeditor-theme.css";

const BlogDetailModal = ({ open, onClose, blog }) => {
  if (!blog) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
            <Globe className="h-5 w-5" />
            Chi tiết Blog
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Xem thông tin chi tiết và nội dung đầy đủ của blog
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold dark:text-white">
                    {blog.title}
                  </h1>
                  <p className="text-muted-foreground dark:text-gray-400">
                    {blog.excerpt}
                  </p>
                </div>
                <Badge
                  variant={blog.isPublished ? "success" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {blog.isPublished ? "Đã xuất bản" : "Bản nháp"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Featured Image */}
              {blog.featuredImage && (
                <div className="w-full rounded-lg overflow-hidden">
                  <img
                    src={blog.featuredImage}
                    alt={blog.title}
                    className="w-full h-64 object-contain "
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Meta Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground dark:text-gray-500" />
                    <div>
                      <span className="font-medium dark:text-white">
                        {blog.authorName}
                      </span>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {blog.authorEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-500" />
                    <div>
                      <p className="text-sm dark:text-gray-300">
                        <span className="font-medium">Tạo:</span>{" "}
                        {formatDate(blog.createdAt)}
                      </p>
                      {blog.updatedAt !== blog.createdAt && (
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          <span className="font-medium">Cập nhật:</span>{" "}
                          {formatDate(blog.updatedAt)}
                        </p>
                      )}
                      {blog.publishedDate && (
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          <span className="font-medium">Xuất bản:</span>{" "}
                          {formatDate(blog.publishedDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground dark:text-gray-500" />
                      <span className="text-sm dark:text-gray-300">
                        {blog.viewCount || 0} lượt xem
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground dark:text-gray-500" />
                      <span className="text-sm dark:text-gray-300">
                        {blog.likeCount || 0} lượt thích
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground dark:text-gray-500" />
                      <span className="text-sm font-medium dark:text-white">
                        Danh mục:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {blog.categories?.map((category) => (
                        <Badge key={category.categoryId} variant="outline">
                          {category.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Blog Content */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Nội dung Blog</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Thông tin SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium dark:text-white">Slug: </span>
                <code className="bg-muted dark:bg-gray-700 px-2 py-1 rounded text-sm dark:text-gray-300">
                  {blog.slug}
                </code>
              </div>
              <div>
                <span className="font-medium dark:text-white">URL: </span>
                <code className="bg-muted dark:bg-gray-700 px-2 py-1 rounded text-sm dark:text-gray-300">
                  /blog/{blog.slug}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogDetailModal;
