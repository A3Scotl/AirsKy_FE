import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";


// Mock data cho blog posts
const blogPosts = [
  {
    id: "travel-tips-vietnam",
    title: "10 Mẹo Du Lịch Việt Nam Tiết Kiệm Chi Phí",
    excerpt:
      "Khám phá những bí quyết giúp bạn du lịch Việt Nam với chi phí tối ưu mà vẫn có những trải nghiệm tuyệt vời...",
    content: "Nội dung chi tiết bài viết...",
    author: "Nguyễn Văn A",
    publishDate: "2025-08-15",
    readTime: "5 phút đọc",
    category: "Du lịch",
    tags: ["du lịch", "tiết kiệm", "việt nam"],
    image:
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200",
    views: 1250,
    likes: 89,
    featured: true,
  },
  {
    id: "best-airlines-asia",
    title: "Top 5 Hãng Hàng Không Tốt Nhất Châu Á 2025",
    excerpt:
      "Danh sách những hãng hàng không được đánh giá cao nhất về chất lượng dịch vụ và giá cả...",
    content: "Nội dung chi tiết bài viết...",
    author: "Trần Thị B",
    publishDate: "2025-08-12",
    readTime: "7 phút đọc",
    category: "Hàng không",
    tags: ["hàng không", "châu á", "đánh giá"],
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200",
    views: 2100,
    likes: 156,
    featured: true,
  },
  {
    id: "flight-booking-tips",
    title: "Cách Đặt Vé Máy Bay Giá Rẻ: Bí Quyết Từ Chuyên Gia",
    excerpt:
      "Những mẹo hay giúp bạn tìm được vé máy bay với giá tốt nhất từ các chuyên gia trong ngành...",
    content: "Nội dung chi tiết bài viết...",
    author: "Lê Văn C",
    publishDate: "2025-08-10",
    readTime: "6 phút đọc",
    category: "Mẹo hay",
    tags: ["đặt vé", "giá rẻ", "mẹo hay"],
    image:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200",
    views: 1890,
    likes: 134,
    featured: false,
  },
  {
    id: "airport-guide-noi-bai",
    title: "Hướng Dẫn Chi Tiết Sân Bay Nội Bài",
    excerpt:
      "Tất cả thông tin cần thiết về sân bay Nội Bài từ check-in đến các dịch vụ tiện ích...",
    content: "Nội dung chi tiết bài viết...",
    author: "Phạm Thị D",
    publishDate: "2025-08-08",
    readTime: "8 phút đọc",
    category: "Sân bay",
    tags: ["sân bay", "nội bài", "hướng dẫn"],
    image:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200",
    views: 980,
    likes: 67,
    featured: false,
  },
  {
    id: "travel-insurance-guide",
    title: "Bảo Hiểm Du Lịch: Những Điều Cần Biết",
    excerpt:
      "Hướng dẫn chi tiết về bảo hiểm du lịch và cách chọn gói bảo hiểm phù hợp...",
    content: "Nội dung chi tiết bài viết...",
    author: "Hoàng Văn E",
    publishDate: "2025-08-05",
    readTime: "4 phút đọc",
    category: "Bảo hiểm",
    tags: ["bảo hiểm", "du lịch", "hướng dẫn"],
    image:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1200",
    views: 1456,
    likes: 92,
    featured: false,
  },
  {
    id: "luxury-travel-tips",
    title: "Du Lịch Sang Trọng Với Ngân Sách Hạn Chế",
    excerpt:
      "Làm thế nào để trải nghiệm du lịch đẳng cấp mà không cần chi quá nhiều tiền...",
    content: "Nội dung chi tiết bài viết...",
    author: "Vũ Thị F",
    publishDate: "2025-08-03",
    readTime: "6 phút đọc",
    category: "Du lịch",
    tags: ["sang trọng", "tiết kiệm", "du lịch"],
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
    views: 2340,
    likes: 187,
    featured: false,
  },
  {
    id: "family-travel-guide",
    title: "Du Lịch Gia Đình: Lời Khuyên Từ A-Z",
    excerpt:
      "Hướng dẫn toàn diện cho chuyến du lịch gia đình hoàn hảo và an toàn...",
    content: "Nội dung chi tiết bài viết...",
    author: "Đỗ Văn G",
    publishDate: "2025-08-01",
    readTime: "9 phút đọc",
    category: "Gia đình",
    tags: ["gia đình", "du lịch", "an toàn"],
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=1200",
    views: 1678,
    likes: 123,
    featured: false,
  },
  {
    id: "business-travel-hacks",
    title: "Bí Quyết Du Lịch Công Tác Hiệu Quả",
    excerpt:
      "Những mẹo giúp chuyến công tác của bạn trở nên thuận lợi và hiệu quả hơn...",
    content: "Nội dung chi tiết bài viết...",
    author: "Ngô Thị H",
    publishDate: "2025-07-30",
    readTime: "5 phút đọc",
    category: "Công tác",
    tags: ["công tác", "hiệu quả", "mẹo hay"],
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200",
    views: 897,
    likes: 54,
    featured: false,
  },
];

const categories = [
  "Tất cả",
  "Du lịch",
  "Hàng không",
  "Mẹo hay",
  "Sân bay",
  "Bảo hiểm",
  "Gia đình",
  "Công tác",
];

const BlogPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  const postsPerPage = 6;

  // Filter posts
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "Tất cả" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + postsPerPage
  );
  //   const featuredPosts = blogPosts.filter((post) => post.featured);
  const featuredPosts = blogPosts;

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
    return views.toString();
  };

  return (
    <>
      <SEO
        title="Bài đăng"
        description="Tìm hiểu thông tin về các bài viết trước khi bay."
        keywords="tìm kiếm chuyến bay, so sánh vé máy bay, đặt vé máy bay"
      />
      <div className="min-h-screen mx-auto pt-16 xl:px-24 lg:px-16 sm:px-0 dark:bg-gray-700">
        <div className="container mx-auto px-4 py-12">
          {/* Featured Posts Swiper */}
          <section className="mb-16">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">
                  Bài Viết Nổi Bật
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Những bài viết được quan tâm nhiều nhất
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="w-xl relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-sm text-black bg-gray-300 placeholder-white/70 focus:ring-4 focus:ring-white/20"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                </div>
              </div>
            </div>

            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                nextEl: ".blog-next-btn",
                prevEl: ".blog-prev-btn",
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="!pb-12"
            >
              {featuredPosts.map((post) => (
                <SwiperSlide key={post.id}>
                  <Link to={`/blog/${post.id}`}>
                    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                      <div className="relative overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-red-500 text-white">
                            Nổi bật
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                          <div className="flex items-center space-x-2 text-white text-sm">
                            <Eye className="w-4 h-4" />
                            <span>{formatViews(post.views)}</span>
                            <Heart className="w-4 h-4" />
                            <span>{post.likes}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                          <Badge variant="outline">{post.category}</Badge>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(post.publishDate)}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {post.author}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {post.readTime}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* Category Filter */}
          <section className="mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  className="mb-2"
                >
                  {category}
                </Button>
              ))}
            </div>
          </section>

          {/* Blog Posts Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.id}`}>
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                    <div className="relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                        <div className="flex items-center space-x-2 text-white text-sm">
                          <Eye className="w-4 h-4" />
                          <span>{formatViews(post.views)}</span>
                          <Heart className="w-4 h-4" />
                          <span>{post.likes}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-3 text-sm text-gray-500">
                        <Badge variant="outline">{post.category}</Badge>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(post.publishDate)}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 dark:text-white">
                        {post.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {post.author}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Trước
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10 h-10 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogPage;
