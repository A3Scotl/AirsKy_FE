import { useState, useEffect } from "react";
import {
  X,
  Save,
  Plus,
  Edit,
  BookOpen,
  User,
  Tag,
  Eye,
  EyeOff,
  Calendar,
  ImageIcon,
  FileText,
  Globe,
} from "lucide-react";
import { blogApi } from "@/apis/blog-api";
import { categoryApi } from "@/apis/category-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/ui/rich-text-editor";
import ImageUpload from "@/components/ui/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const BlogFormModal = ({
  open,
  onClose,
  onSave,
  blog = null,
  mode = "add",
}) => {
  const isEditMode = mode === "edit" && blog;

  const initialFormData = {
    title: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    isPublished: false,
    categories: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await categoryApi.getAllCategoriesList();
      if (result.success && result.data) {
        setAvailableCategories(result.data);
      } else {
        console.error("Failed to fetch categories:", result.message);
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setAvailableCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch categories when modal opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Populate form data when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setFormData({
        title: blog.title || "",
        content: blog.content || "",
        excerpt: blog.excerpt || "",
        featuredImage: blog.featuredImage || "",
        isPublished: blog.isPublished || false,
        categories: blog.categories || [],
      });
      setSelectedCategories(
        blog.categories?.map((cat) => cat.categoryId) || []
      );
    } else {
      setFormData(initialFormData);
      setSelectedCategories([]);
    }
  }, [isEditMode, blog]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Image upload handler for CKEditor
  const handleImageUpload = async (file) => {
    try {
      const response = await blogApi.uploadImageForEditor(file);
      if (response.success) {
        return response.data; // Return image URL
      } else {
        console.error("Failed to upload image:", response.message);
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề là bắt buộc";
    } else if (formData.title.length < 5) {
      newErrors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Nội dung là bắt buộc";
    } else if (formData.content.length < 50) {
      newErrors.content = "Nội dung phải có ít nhất 50 ký tự";
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = "Mô tả ngắn là bắt buộc";
    } else if (formData.excerpt.length < 10) {
      newErrors.excerpt = "Mô tả ngắn phải có ít nhất 10 ký tự";
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = "Vui lòng chọn ít nhất một danh mục";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for API call
    const blogData = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt,
      featuredImage: formData.featuredImage,
      isPublished: formData.isPublished,
      categoryIds: selectedCategories, // Send array of category IDs
    };

    onSave(blogData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setSelectedCategories([]);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="h-5 w-5" />
                Chỉnh sửa Blog
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Thêm Blog Mới
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin blog"
              : "Tạo blog mới cho trang web đặt vé máy bay"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Tiêu đề <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Nhập tiêu đề blog..."
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={errors.title ? "border-destructive" : ""}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">
                      Mô tả ngắn <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="excerpt"
                      placeholder="Nhập mô tả ngắn về blog..."
                      value={formData.excerpt}
                      onChange={(e) =>
                        handleInputChange("excerpt", e.target.value)
                      }
                      rows={3}
                      className={errors.excerpt ? "border-destructive" : ""}
                    />
                    {errors.excerpt && (
                      <p className="text-sm text-destructive">
                        {errors.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <ImageUpload
                      label="Ảnh đại diện"
                      value={formData.featuredImage}
                      onChange={(url) =>
                        handleInputChange("featuredImage", url)
                      }
                      placeholder="Chọn ảnh đại diện cho blog"
                      error={errors.featuredImage}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Danh mục
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>
                      Chọn danh mục <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {loadingCategories ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Đang tải categories...
                          </span>
                        </div>
                      ) : availableCategories.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">
                            Chưa có category nào
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Hãy tạo category trước khi viết blog
                          </p>
                        </div>
                      ) : (
                        availableCategories.map((category) => (
                          <div
                            key={category.categoryId}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`category-${category.categoryId}`}
                              checked={selectedCategories.includes(
                                category.categoryId
                              )}
                              onCheckedChange={() =>
                                handleCategoryToggle(category.categoryId)
                              }
                            />
                            <Label
                              htmlFor={`category-${category.categoryId}`}
                              className="cursor-pointer text-sm"
                            >
                              {category.name}
                              {category.slug && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({category.slug})
                                </span>
                              )}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                    {errors.categories && (
                      <p className="text-sm text-destructive">
                        {errors.categories}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCategories.map((categoryId) => {
                        const category = availableCategories.find(
                          (cat) => cat.categoryId === categoryId
                        );
                        return (
                          <Badge key={categoryId} variant="secondary">
                            {category?.name || `Category ${categoryId}`}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Nội dung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    label="Nội dung blog"
                    value={formData.content}
                    onChange={(content) =>
                      handleInputChange("content", content)
                    }
                    onImageUpload={handleImageUpload}
                    placeholder="Nhập nội dung blog với định dạng phong phú..."
                    error={errors.content}
                    required
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Cài đặt xuất bản
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublished">Xuất bản ngay</Label>
                      <p className="text-sm text-muted-foreground">
                        Blog sẽ hiển thị công khai khi được xuất bản
                      </p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) =>
                        handleInputChange("isPublished", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditMode ? "Cập nhật" : "Tạo blog"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogFormModal;
