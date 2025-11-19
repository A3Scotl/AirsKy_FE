import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { blogApi } from "@/apis/blog-api";
import BlogCard from "@/components/section/blog/blog-card";
import { blogLikeApi } from "@/apis/blog-like-api";
import { useAuth } from "@/contexts/auth-context";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  BookOpen,
  Album,
  Heart,
  Facebook,
  Twitter,
  MessageCircle,
  Tag,
  Loader2,
  Linkedin,
  Send,
  MessageSquare,
  Copy,
  MoreHorizontal,
  Icon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  RedditShareButton,
  EmailShareButton,
} from "react-share";
import { Skeleton } from "@/components/ui/skeleton";

import "@/components/ui/ckeditor-theme.css";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeStatusLoading, setLikeStatusLoading] = useState(false);
  // Save/Unsave state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!(user && user.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Related blogs
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thích bài viết");
      return;
    }
    if (!post?.blogId || isLiking) return;

    setIsLiking(true);
    try {
      const result = await blogLikeApi.toggleLike(post.blogId);

      if (result.success) {
        setIsLiked(result.isLiked);
        setLikeCount((prev) =>
          result.isLiked ? prev + 1 : Math.max(0, prev - 1)
        );
      } else {
        if (result.status === 401) {
          alert("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else {
          alert(result.message || "Có lỗi xảy ra");
        }
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi thực hiện thao tác");
    } finally {
      setIsLiking(false);
    }
  };

  // In useEffect
  useEffect(() => {
    // Chỉ fetch khi auth đã initialize xong
    if (authLoading) return;

    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await blogApi.getBlogBySlug(slug);
        if (res.success && res.data) {
          setPost(res.data);
          setLikeCount(
            typeof res.data.likeCount === "number"
              ? res.data.likeCount
              : (res.data.likeCount && res.data.likeCount.count) || 0
          );

          // Set default like status to false - will be updated on first user interaction
          setIsLiked(false);
          setLikeStatusLoading(false);

          // Check save status if user is authenticated
          if (
            isAuthenticated &&
            res.data.blogId &&
            localStorage.getItem("token")
          ) {
            try {
              const savedRes = await blogApi.getSavedBlogs({
                page: 0,
                size: 100,
              });
              if (savedRes.success && Array.isArray(savedRes.data?.content)) {
                setIsSaved(
                  savedRes.data.content.some(
                    (b) => b.blogId === res.data.blogId
                  )
                );
              }
            } catch (saveError) {
              console.warn("Failed to check save status:", saveError);
              setIsSaved(false);
            }
          } else {
            setIsSaved(false);
          }

          // Fetch related blogs by category slug (first category)
          if (
            Array.isArray(res.data.categories) &&
            res.data.categories.length > 0
          ) {
            const cateSlug = res.data.categories[0].slug;
            setRelatedLoading(true);
            try {
              const relatedRes = await blogApi.getBlogsByCategory(cateSlug, {
                size: 12,
                sort: "createdAt,desc",
              });
              if (
                relatedRes.success &&
                Array.isArray(relatedRes.data?.content)
              ) {
                // Lọc bỏ bài hiện tại khỏi danh sách liên quan
                setRelatedBlogs(
                  relatedRes.data.content.filter(
                    (b) => b.blogId !== res.data.blogId
                  )
                );
              }
            } catch (relatedError) {
              console.warn("Failed to fetch related blogs:", relatedError);
              setRelatedBlogs([]);
            } finally {
              setRelatedLoading(false);
            }
          }
        } else {
          setError(res.message || "Không tìm thấy bài viết");
        }
      } catch (err) {
        console.error("Error fetching blog:", err);
        setError("Có lỗi xảy ra khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug, isAuthenticated, authLoading]);
  // Toggle save/unsave
  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để lưu bài viết");
      return;
    }
    if (!post?.blogId || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        const res = await blogApi.unsaveBlog(post.blogId);
        if (res.success) setIsSaved(false);
        else alert(res.message || "Có lỗi khi bỏ lưu bài viết");
      } else {
        const res = await blogApi.saveBlog(post.blogId);
        if (res.success) setIsSaved(true);
        else alert(res.message || "Có lỗi khi lưu bài viết");
      }
    } catch (e) {
      alert("Có lỗi xảy ra khi lưu/bỏ lưu bài viết");
    } finally {
      setIsSaving(false);
    }
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
    return views.toString();
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title;
    const description = post?.excerpt || post?.content?.substring(0, 200) || "";

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}&quote=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
          "_blank"
        );
        break;
      case "telegram":
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "reddit":
        window.open(
          `https://reddit.com/submit?url=${encodeURIComponent(
            url
          )}&title=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "email":
        window.open(
          `mailto:?subject=${encodeURIComponent(
            title
          )}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url).then(() => {
          // Có thể thêm toast notification ở đây
          alert("Đã sao chép liên kết!");
        });
        break;
      default:
        navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Skeleton */}
        <div className="relative h-96 w-full">
          <Skeleton className="h-full w-full rounded-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* Title */}
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-5 w-1/3 mb-6" />

          {/* Action buttons */}
          <div className="flex gap-3 mb-10">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>

          {/* Content skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
            <Skeleton className="h-6 w-2/3 mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-4/5 mb-4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || "Bài viết không tồn tại"}
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
      <div className="relative h-96 md:h-[500px] max-w-8xl overflow-hidden mx-auto">
        <img
          src={
            post.thumbnail || post.featuredImage || "/api/placeholder/800/400"
          }
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Hero Content */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="max-w-6xl mx-auto ">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center space-x-6 text-white/90">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {formatDate(post.createdAt || post.publishDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Article Meta & Share */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 p-4 md:p-6 rounded-xl shadow-sm">
          <div className="w-full">
            <nav className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
              <Link
                to="/blog"
                className="hover:underline text-blue-600 font-medium"
              >
                Blog
              </Link>
              <span className="mx-1">/</span>
              <span className="text-gray-700 font-medium">
                {post?.categories &&
                post.categories.length > 0 &&
                post.categories[0]?.name
                  ? post.categories[0].name
                  : "Chưa phân loại"}
              </span>
              <span className="mx-1">/</span>
              <span
                className="text-gray-700 font-semibold truncate"
                title={post?.title || slug}
              >
                {post?.title || slug}
              </span>
            </nav>
          </div>
          <div className="w-full md:w-auto">
            <div className="flex items-center space-x-2 justify-start md:justify-end">
              <div className="flex items-center space-x-4">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking || likeStatusLoading}
                  className="flex items-center space-x-2"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked
                        ? "text-red-500 fill-red-500"
                        : "dark:text-gray-600"
                    }`}
                  />
                  <span className="dark:text-gray-600">
                    {typeof likeCount === "number" ? likeCount : 0}
                  </span>
                  {(isLiking || likeStatusLoading) && (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                  )}
                </Button>
                <Button
                  variant={isSaved ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-2"
                >
                  <BookOpen
                    className={`w-4 h-4 ${
                      isSaved ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                  <span>{isSaved ? "Đã lưu" : "Lưu bài viết"}</span>
                  {isSaving && (
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                  )}
                </Button>
              </div>

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

              {/* Dropdown Menu for More Sharing Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4 dark:text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("telegram")}>
                    <Send className="w-4 h-4 mr-2" />
                    Telegram
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("reddit")}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Reddit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleShare("email")}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("copy")}>
                    <Copy className="w-4 h-4 mr-2" />
                    Sao chép liên kết
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Article Content */}
          <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Tags:</span>
                {Array.isArray(post.categories) &&
                  post.categories.map((cate) => (
                    <Badge
                      key={cate.categoryId || cate.slug || cate.name}
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      {cate.name}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Blogs Section */}
        <div className="max-w-7xl mx-auto mt-10 mb-14 px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Bài viết liên quan
          </h2>

          {relatedLoading ? (
            // Skeleton loading
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border p-4">
                  <Skeleton className="h-40 w-full mb-4 rounded-lg" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : relatedBlogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Không có bài viết liên quan
            </p>
          ) : (
            <>
              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                onSwiper={(swiper) => (window.blogSwiper = swiper)}
                breakpoints={{
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="related-blogs-swiper"
              >
                {relatedBlogs.map((blog) => (
                  <SwiperSlide key={blog.blogId}>
                    <BlogCard blog={blog} />
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Nút Next/Prev đơn giản đặt dưới */}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => window.blogSwiper.slidePrev()}
                  className="p-2 border rounded-md  cursor-pointer hover:bg-gray-100"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  onClick={() => window.blogSwiper.slideNext()}
                  className="p-2 border rounded-md cursor-pointer hover:bg-gray-100"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default BlogDetailPage;
