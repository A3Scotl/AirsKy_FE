import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Eye,
  Heart,
  Filter,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { blogApi } from "@/apis/blog-api";
import { categoryApi } from "@/apis/category-api";
import { blogLikeApi } from "@/apis/blog-like-api";
import BlogCard from "@/components/section/blog/blog-card";

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [blogs, setBlogs] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters and pagination
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

  // Fetch categories
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

  // Fetch featured blogs (top like)
  const fetchFeaturedBlogs = async () => {
    try {
      // Lấy nhiều blog để lọc top like
      const result = await blogApi.getAllPublishedBlogs({
        page: 0,
        size: 30,
        sort: "createdAt,desc",
      });
      if (result.success && result.data) {
        let blogs = result.data.content || result.data;
        // Lấy số like cho từng blog song song
        const likeCounts = await Promise.all(
          blogs.map(async (blog) => {
            const likeRes = await blogLikeApi.getLikeCount(blog.blogId);
            return likeRes.success ? likeRes.data : 0;
          })
        );
        // Gắn số like vào blog
        blogs = blogs.map((blog, idx) => ({
          ...blog,
          likeCount: likeCounts[idx],
        }));
        // Sắp xếp giảm dần theo likeCount
        blogs.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        setFeaturedBlogs(blogs.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching featured blogs:", error);
    }
  };

  // Fetch blogs with filters
  const fetchBlogs = async (page = 1, search = "", category = "") => {
    try {
      setSearchLoading(true);
      setError(null);

      let result;

      if (search.trim()) {
        // Search blogs
        result = await blogApi.searchBlogs({
          keyword: search,
          page: page - 1,
          size: blogsPerPage,
          sort: "createdAt,desc",
        });
      } else if (category) {
        // Filter by category
        result = await blogApi.getBlogsByCategory(category, {
          page: page - 1,
          size: blogsPerPage,
          sort: "createdAt,desc",
        });
      } else {
        // Get all published blogs
        result = await blogApi.getAllPublishedBlogs({
          page: page - 1,
          size: blogsPerPage,
          sort: "createdAt,desc",
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

  // Load initial data
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

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory) params.set("category", selectedCategory);
    if (currentPage > 1) params.set("page", currentPage.toString());

    setSearchParams(params);
  }, [searchTerm, selectedCategory, currentPage, setSearchParams]);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchBlogs(1, searchTerm, selectedCategory);
  };

  // Handle category filter
  const handleCategoryChange = async (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    await fetchBlogs(1, searchTerm, categoryId);
  };

  // Handle pagination
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

  const formatViews = (views) => {
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + "k";
    }
    return views?.toString() || "0";
  };

  return (
    <>
      <SEO
        title="Bài đăng"
        description="Tìm hiểu thông tin về các bài viết trước khi bay."
        keywords="blog, bài viết, du lịch, máy bay, hàng không"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="container mx-auto px-4 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Blog Du Lịch
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Khám phá những câu chuyện thú vị và mẹo du lịch hữu ích
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-20 py-4 text-gray-600 text-lg rounded-full border-0 focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Featured Blogs Carousel */}
        {featuredBlogs.length > 0 && (
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
                Bài Viết Nổi Bật
              </h2>

              <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                spaceBetween={30}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="featured-blogs-swiper"
              >
                {featuredBlogs.map((blog) => (
                  <SwiperSlide key={blog.blogId}>
                    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="relative">
                        <img
                          src={blog.featuredImage || "/api/placeholder/400/250"}
                          alt={blog.title}
                          className="w-full h-48 object-cover"
                        />
                        <Badge className="absolute top-4 left-4 bg-blue-600">
                          Nổi bật
                        </Badge>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg mb-2 line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {blog.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(blog.publishedDate)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            {formatViews(blog.viewCount)}
                          </div>
                        </div>
                        <Link to={`/blog/${blog.slug}`}>
                          <Button className="w-full mt-4">
                            Đọc thêm
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <Card className="p-6 sticky top-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Danh mục
                </h3>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === "" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => handleCategoryChange("")}
                  >
                    Tất cả
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category.categoryId}
                      variant={
                        selectedCategory === category.categoryId
                          ? "default"
                          : "ghost"
                      }
                      className="w-full justify-start"
                      onClick={() => handleCategoryChange(category.categoryId)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Blog Grid */}
            <div className="lg:w-3/4">
              {/* Results Info */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  {searchTerm
                    ? `Kết quả tìm kiếm: "${searchTerm}"`
                    : "Tất cả bài viết"}
                </h2>
                {/* Sort by */}
                {/* <div>
                  <select>
                    <option value="newest">Mới nhất</option>
                    <option value="most_viewed">Lượt xem giảm dần</option>
                    <option value="most_liked">Lượt thích giảm dần</option>
                  </select>
                </div> */}
              </div>

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <p className="text-red-600 text-lg">{error}</p>
                  <Button
                    onClick={() =>
                      fetchBlogs(currentPage, searchTerm, selectedCategory)
                    }
                    className="mt-4"
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {/* Loading State */}

              {/* No Results */}
              {!searchLoading && !error && blogs.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Không tìm thấy bài viết
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedCategory
                      ? "Thử thay đổi từ khóa tìm kiếm hoặc danh mục"
                      : "Chưa có bài viết nào được đăng"}
                  </p>
                </div>
              )}

              {/* Blog Grid */}
              {!searchLoading && !error && blogs.length > 0 && (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {blogs.map((blog) => (
                      <BlogCard
                        key={blog.blogId}
                        blog={blog}
                        showLikeButton={true}
                      />
                    ))}
                  </div>

                  {/* Pagination (dưới danh sách bài viết, hoạt động cho cả lọc theo danh mục) */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Trước
                        </Button>

                        {/* Hiển thị các trang, có dấu ... nếu nhiều trang */}
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
                                <span key={page} className="px-2">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          }

                          return (
                            <Button
                              key={page}
                              variant={isCurrentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
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
