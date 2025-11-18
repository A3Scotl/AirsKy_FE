import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, ArrowRight, ChevronLeft, ChevronRight, Search, BookOpen, Eye, Heart, Filter, TrendingUp } from 'lucide-react';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { blogApi } from "@/apis/blog-api";
import { categoryApi } from "@/apis/category-api";
import { blogLikeApi } from "@/apis/blog-like-api";
import BlogCard from "@/components/section/blog/blog-card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const BlogCardSkeleton = () => {
  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-4" />

        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />

        <div className="flex items-center justify-between text-sm border-t pt-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </article>
  );
};

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const blogsPerPage = 9;
  const [sortOption, setSortOption] = useState(
    searchParams.get("sort") || "createdAt,desc"
  );

  const fetchCategories = async () => {
    try {
      const result = await categoryApi.getAllCategoriesList();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFeaturedBlogs = async () => {
    try {
      const result = await blogApi.getAllPublishedBlogs({
        page: 0,
        size: 50,
        sort: "createdAt,desc",
      });
      if (result.success && result.data) {
        let blogs = result.data.content || result.data;
        const likeCounts = await Promise.all(
          blogs.map(async (blog) => {
            const likeRes = await blogLikeApi.getLikeCount(blog.blogId);
            return likeRes.success ? likeRes.data : 0;
          })
        );
        blogs = blogs.map((blog, idx) => ({
          ...blog,
          likeCount: likeCounts[idx],
        }));
        blogs = blogs.filter(
          (b) => (b.viewCount || 0) > 200 || (b.likeCount || 0) > 10
        );
        blogs.sort(
          (a, b) =>
            (b.likeCount || 0) - (a.likeCount || 0) ||
            (b.viewCount || 0) - (a.viewCount || 0)
        );
        setFeaturedBlogs(blogs.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching featured blogs:", error);
    }
  };

  const fetchBlogs = async (
    page = 1,
    search = "",
    category = "",
    sort = sortOption
  ) => {
    try {
      setSearchLoading(true);
      setError(null);

      let result;

      if (search.trim()) {
        result = await blogApi.searchBlogs({
          keyword: search,
          category: category || undefined,
          page: page - 1,
          size: blogsPerPage,
          sort: sort,
        });
      } else if (category) {
        result = await blogApi.getBlogsByCategory(category, {
          page: page - 1,
          size: blogsPerPage,
          sort: sort,
        });
      } else {
        result = await blogApi.getAllPublishedBlogs({
          page: page - 1,
          size: blogsPerPage,
          sort: sort,
        });
      }

      if (result.success && result.data) {
        const data = result.data;
        setBlogs(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalBlogs(data.totalElements || 0);
      } else {
        setError(result.message || "Không thể tải danh sách bài viết");
        setBlogs([]);
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Có lỗi xảy ra khi tải bài viết");
      setBlogs([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchFeaturedBlogs(),
        fetchBlogs(currentPage, searchTerm, selectedCategory),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory) params.set("category", selectedCategory);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (sortOption && sortOption !== "createdAt,desc")
      params.set("sort", sortOption);

    setSearchParams(params);
  }, [searchTerm, selectedCategory, currentPage, sortOption, setSearchParams]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchBlogs(1, searchTerm, selectedCategory, sortOption);
  };

  const handleSortChange = async (value) => {
    setSortOption(value);
    setCurrentPage(1);
    await fetchBlogs(1, searchTerm, selectedCategory, value);
  };

  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    await fetchBlogs(1, searchTerm, categoryId);
  };

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    await fetchBlogs(page, searchTerm, selectedCategory);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <SEO
        title="Bài đăng"
        description="Tìm hiểu thông tin về các bài viết trước khi bay."
        keywords="blog, bài viết, du lịch, máy bay, hàng không"
      />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-700 text-white pt-20 pb-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="mb-8">
              
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Blog Du Lịch
            </h1>
            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Kinh nghiệm – Cảm hứng – Những câu chuyện đáng nhớ từ những hành trình của chúng tôi
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 h-5 w-5" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm bài viết..."
                  className="pl-14 pr-5 py-4 text-gray-700 bg-white rounded-lg focus:ring-2 focus:ring-blue-300 border-none shadow-lg"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 pl-1">Danh mục</h3>
                </div>
                
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start rounded-lg transition-all duration-200 ${
                      selectedCategory === ""
                        ? "bg-blue-700 text-white hover:bg-blue-800"
                        : "text-gray-700 hover:bg-blue-50"
                    }`}
                    onClick={() => handleCategoryChange("")}
                  >
                    Tất cả bài viết
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.slug}
                      variant="ghost"
                      className={`w-full justify-start rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCategory === category.slug
                          ? "bg-blue-700 text-white hover:bg-blue-800"
                          : "text-gray-700 hover:bg-blue-50"
                      }`}
                      onClick={() => handleCategoryChange(category.slug)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Blog Grid */}
            <div className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {searchTerm || selectedCategory ? "Kết quả tìm kiếm" : "Bài viết mới"}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{totalBlogs} bài viết</p>
                </div>
                
                <div className="w-full sm:w-48">
                  <Select value={sortOption} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sắp xếp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt,desc">Mới nhất</SelectItem>
                      <SelectItem value="viewCount,desc">Phổ biến nhất</SelectItem>
                      <SelectItem value="likeCount,desc">Yêu thích nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button
                    onClick={() =>
                      fetchBlogs(currentPage, searchTerm, selectedCategory)
                    }
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {/* Loading State */}
              {searchLoading && (
                <div className="grid md:grid-cols-2 gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <BlogCardSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!searchLoading && !error && blogs.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không tìm thấy bài viết
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedCategory
                      ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc danh mục"
                      : "Chưa có bài viết nào được đăng"}
                  </p>
                </div>
              )}

              {/* Blog Grid */}
              {!searchLoading && !error && blogs.length > 0 && (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {blogs.map((blog) => (
                      <BlogCard
                        key={blog.blogId}
                        blog={blog}
                        showLikeButton={true}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="rounded-lg"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Trước
                        </Button>

                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          const isCurrentPage = page === currentPage;
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 &&
                              page <= currentPage + 1);

                          if (!showPage) {
                            if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return (
                                <span key={page} className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <Button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`rounded-lg ${
                                isCurrentPage
                                  ? "bg-blue-700 hover:bg-blue-800 text-white"
                                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                              variant={isCurrentPage ? "default" : "outline"}
                            >
                              {page}
                            </Button>
                          );
                        })}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="rounded-lg"
                        >
                          Sau
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPage;
