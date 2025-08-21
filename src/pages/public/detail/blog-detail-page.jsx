import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  BookOpen,
  Eye,
  Heart,
  Facebook,
  Twitter,
  MessageCircle,
  Tag,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// Mock data (same as blog-page.jsx)
const blogPosts = [
  {
    id: "travel-tips-vietnam",
    title: "10 Mẹo Du Lịch Việt Nam Tiết Kiệm Chi Phí",
    excerpt:
      "Khám phá những bí quyết giúp bạn du lịch Việt Nam với chi phí tối ưu mà vẫn có những trải nghiệm tuyệt vời...",
    content: `
      <h2>1. Lựa chọn thời điểm du lịch phù hợp</h2>
      <p>Việc lựa chọn thời điểm du lịch đóng vai trò quan trọng trong việc tiết kiệm chi phí. Tránh các mùa cao điểm như Tết Nguyên đán, các ngày lễ lớn khi giá cả thường tăng cao.</p>
      
      <h2>2. Đặt vé máy bay sớm</h2>
      <p>Đặt vé máy bay trước 2-3 tháng thường sẽ có giá tốt hơn. Sử dụng các trang web so sánh giá để tìm được deal tốt nhất.</p>
      
      <h2>3. Lựa chọn chỗ ở phù hợp</h2>
      <p>Thay vì khách sạn đắt tiền, hãy cân nhắc homestay, hostel hoặc các nhà nghỉ dân dã để tiết kiệm chi phí lưu trú.</p>
      
      <h2>4. Sử dụng phương tiện công cộng</h2>
      <p>Xe buýt, xe khách địa phương thường rẻ hơn nhiều so với taxi hay xe thuê. Đây cũng là cách tốt để trải nghiệm văn hóa địa phương.</p>
      
      <h2>5. Ăn uống như người địa phương</h2>
      <p>Thử các quán ăn địa phương, đường phố thay vì nhà hàng cao cấp. Bạn sẽ vừa tiết kiệm tiền vừa có trải nghiệm ẩm thực đích thực.</p>
    `,
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
    content: `
      <h2>1. Singapore Airlines</h2>
      <p>Singapore Airlines luôn được đánh giá cao về chất lượng dịch vụ và độ thoải mái. Đây là lựa chọn hàng đầu cho những chuyến bay dài.</p>
      
      <h2>2. Qatar Airways</h2>
      <p>Với dịch vụ hạng nhất và mạng lưới bay rộng khắp, Qatar Airways là một trong những hãng hàng không tốt nhất thế giới.</p>
      
      <h2>3. ANA (All Nippon Airways)</h2>
      <p>Hãng hàng không Nhật Bản nổi tiếng với sự tỉ mỉ và chất lượng dịch vụ hoàn hảo theo phong cách Nhật Bản.</p>
    `,
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
  // Add more posts...
];

const BlogDetailPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Find the current post
    const currentPost = blogPosts.find((p) => p.id === id);
    setPost(currentPost);

    // Find related posts (same category, excluding current post)
    if (currentPost) {
      const related = blogPosts
        .filter((p) => p.id !== id && p.category === currentPost.category)
        .slice(0, 6);
      setRelatedPosts(related);
    }
  }, [id]);

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

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title;

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${url}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
          "_blank"
        );
        break;
      default:
        navigator.clipboard.writeText(url);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Bài viết không tồn tại
          </h2>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-500 dark:via-gray-700 dark:to-gray-900">
      {/* Hero Image */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Back Button */}
        <div className="absolute top-8 left-8 mt-16">
          <Link to="/blog">
            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="max-w-4xl">
            <Badge className="bg-blue-600 text-white mb-4">
              {post.category}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center space-x-6 text-white/90">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {formatDate(post.publishDate)}
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {post.readTime}
              </div>
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                {formatViews(post.views)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Article Meta & Share */}
          <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-xl shadow-sm">
            <div className="flex items-center space-x-4">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLiked(!isLiked)}
                className="flex items-center space-x-2"
              >
                <Heart className={`w-4 h-4 dark:text-gray-600 ${isLiked ? "fill-current" : ""}`} />
                <span className="dark:text-gray-600">{post.likes + (isLiked ? 1 : 0)}</span>
              </Button>

              <div className="flex items-center space-x-2 text-gray-500">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">{post.readTime}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 mr-2">Chia sẻ:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="w-4 h-4 dark:text-gray-600" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="w-4 h-4 dark:text-gray-600" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("copy")}
              >
                <Share2 className="w-4 h-4 dark:text-gray-600" />
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <div
              className="prose prose-lg max-w-none dark:text-gray-600"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Tags:</span>
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-blue-600 border-blue-600"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Author Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-12">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {post.author}
                </h3>
                <p className="text-gray-600">
                  Tác giả chuyên về du lịch và hàng không
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Button variant="outline" size="sm" className="dark:text-gray-600 dark:border-gray-600">
                    <MessageCircle className="w-4 h-4 mr-2 dark:text-gray-600" />
                    Liên hệ
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Bài viết liên quan
              </h2>

              <Swiper
                modules={[Autoplay, Navigation]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                breakpoints={{
                  640: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                {relatedPosts.map((relatedPost) => (
                  <SwiperSlide key={relatedPost.id}>
                    <Link to={`/blog/${relatedPost.id}`}>
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
                        <div className="relative overflow-hidden">
                          <img
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
                            <div className="flex items-center space-x-2 text-white text-sm">
                              <Eye className="w-4 h-4" />
                              <span>{formatViews(relatedPost.views)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <Badge variant="outline" className="mb-3">
                            {relatedPost.category}
                          </Badge>

                          <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {relatedPost.title}
                          </h3>

                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {relatedPost.excerpt}
                          </p>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {relatedPost.author}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {relatedPost.readTime}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage;
