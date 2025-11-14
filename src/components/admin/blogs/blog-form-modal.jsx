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
    featuredImageFile: null, // Thêm trường file object
    isPublished: false,
    categories: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const [originalFormData, setOriginalFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [originalSelectedCategories, setOriginalSelectedCategories] = useState(
    []
  );
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const result = await categoryApi.getAllCategoriesList();
      if (result.success && result.data) {
        setAvailableCategories(result.data);
      } else {
        setAvailableCategories([]);
      }
    } catch (error) {
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
      const editFormData = {
        title: blog.title || "",
        content: blog.content || "",
        excerpt: blog.excerpt || "",
        featuredImage: blog.featuredImage || "",
        featuredImageFile: null,
        isPublished: blog.isPublished || false,
        categories: blog.categories || [],
      };
      const editSelectedCategories =
        blog.categories?.map((cat) => cat.categoryId) || [];

      setFormData(editFormData);
      setOriginalFormData(editFormData);
      setSelectedCategories(editSelectedCategories);
      setOriginalSelectedCategories(editSelectedCategories);
    } else {
      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
      setSelectedCategories([]);
      setOriginalSelectedCategories([]);
    }
    setErrors({});
  }, [isEditMode, blog]);

  // Cho phép truyền nhiều giá trị (ví dụ: { url, file })
  const handleInputChange = (field, value, extra) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(extra || {}),
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
        throw new Error(response.message);
      }
    } catch (error) {
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
    } else if (formData.title.length > 200) {
      newErrors.title = "Tiêu đề không được vượt quá 200 ký tự";
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
    } else if (formData.excerpt.length > 500) {
      newErrors.excerpt = "Mô tả ngắn không được vượt quá 500 ký tự";
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = "Vui lòng chọn ít nhất một danh mục";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.title.trim().length >= 5 &&
      formData.title.length <= 200 &&
      formData.content.trim().length >= 50 &&
      formData.excerpt.trim().length >= 10 &&
      formData.excerpt.length <= 500 &&
      selectedCategories.length > 0 &&
      !isSubmitting
    );
  };

  // Check if data has changed (for edit mode)
  const hasDataChanged = () => {
    if (!isEditMode) return true;

    const formDataChanged =
      formData.title !== originalFormData.title ||
      formData.content !== originalFormData.content ||
      formData.excerpt !== originalFormData.excerpt ||
      formData.featuredImage !== originalFormData.featuredImage ||
      formData.isPublished !== originalFormData.isPublished ||
      formData.featuredImageFile !== null;

    const categoriesChanged =
      JSON.stringify(selectedCategories.sort()) !==
      JSON.stringify(originalSelectedCategories.sort());

    return formDataChanged || categoriesChanged;
  };

  // Check if submit button should be enabled
  const isSubmitEnabled = () => {
    return isFormValid() && hasDataChanged();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSubmitEnabled()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!validateForm()) {
        return;
      }

      // Nếu có file object thì gửi FormData, ngược lại gửi JSON thường
      if (formData.featuredImageFile) {
        const data = new FormData();
        data.append("title", formData.title.trim());
        data.append("content", formData.content.trim());
        data.append("excerpt", formData.excerpt.trim());
        data.append("isPublished", formData.isPublished);
        data.append("featuredImageFile", formData.featuredImageFile);
        // Đảm bảo categoryIds là mảng join thành chuỗi
        data.append("categoryIds", selectedCategories.join(","));
        await onSave(data, true); // true: là FormData
      } else {
        // Nếu chỉ nhập URL ảnh
        const blogData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          excerpt: formData.excerpt.trim(),
          featuredImage: formData.featuredImage,
          isPublished: formData.isPublished,
          categoryIds: selectedCategories,
        };
        await onSave(blogData, false);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting

    setFormData(initialFormData);
    setOriginalFormData(initialFormData);
    setSelectedCategories([]);
    setOriginalSelectedCategories([]);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dark:text-white">
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
          <DialogDescription className="dark:text-gray-400">
            {isEditMode
              ? "Cập nhật thông tin blog"
              : "Tạo blog mới cho trang web đặt vé máy bay"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <Card className="dark:bg-gray-800 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <FileText className="h-4 w-4" />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="dark:text-gray-200">
                      Tiêu đề <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="Nhập tiêu đề blog..."
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className={`${
                        errors.title ? "border-destructive" : ""
                      } dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                      disabled={isSubmitting}
                      maxLength={200}
                    />
                    <div className="flex justify-between items-center">
                      {errors.title && (
                        <p className="text-sm text-destructive">
                          {errors.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {formData.title.length}/200
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="dark:text-gray-200">
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
                      className={`${
                        errors.excerpt ? "border-destructive" : ""
                      } dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`}
                      disabled={isSubmitting}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      {errors.excerpt && (
                        <p className="text-sm text-destructive">
                          {errors.excerpt}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {formData.excerpt.length}/500
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ImageUpload
                      label="Ảnh đại diện"
                      value={formData.featuredImage}
                      onChange={(url, file) =>
                        handleInputChange("featuredImage", url, {
                          featuredImageFile: file,
                        })
                      }
                      placeholder="Chọn ảnh đại diện cho blog"
                      error={errors.featuredImage}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Tag className="h-4 w-4" />
                    Danh mục
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="dark:text-gray-200">
                      Chọn danh mục <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {loadingCategories ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            Đang tải categories...
                          </span>
                        </div>
                      ) : availableCategories.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
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
                                !isSubmitting &&
                                handleCategoryToggle(category.categoryId)
                              }
                              disabled={isSubmitting}
                            />
                            <Label
                              htmlFor={`category-${category.categoryId}`}
                              className="cursor-pointer text-sm dark:text-gray-200"
                            >
                              {category.name}
                              {category.slug && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
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
              <Card className="dark:bg-gray-800 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <BookOpen className="h-4 w-4" />
                    Nội dung
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    label="Nội dung blog"
                    value={formData.content}
                    onChange={(content) =>
                      !isSubmitting && handleInputChange("content", content)
                    }
                    onImageUpload={handleImageUpload}
                    placeholder="Nhập nội dung blog với định dạng phong phú..."
                    error={errors.content}
                    className="dark:text-black"
                    required
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 dark:text-white">
                    <Globe className="h-4 w-4" />
                    Cài đặt xuất bản
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="isPublished"
                        className="dark:text-gray-200"
                      >
                        Xuất bản ngay
                      </Label>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Blog sẽ hiển thị công khai khi được xuất bản
                      </p>
                    </div>
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) =>
                        !isSubmitting &&
                        handleInputChange("isPublished", checked)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter className="dark:border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={!isSubmitEnabled()}
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {!isSubmitting && <Save className="h-4 w-4" />}
              {isSubmitting
                ? isEditMode
                  ? "Đang cập nhật..."
                  : "Đang tạo blog..."
                : isEditMode
                ? "Cập nhật"
                : "Tạo blog"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogFormModal;
