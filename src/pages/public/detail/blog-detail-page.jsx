import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { blogApi } from "@/apis/blog-api";
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
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const user = useAuth();
  const isAuthenticated = !!user;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert("Vui lòng đăng nhập để thích bài viết");
      return;
    }
    console.log("post.blogId:", post?.blogId);
    if (!post?.blogId || isLiking) {
      console.warn(
        "Cannot toggle like: blogId is missing or request in progress",
        { blogId: post?.blogId, isLiking }
      );
      return;
    }
    setIsLiking(true);
    try {
      const result = await blogLikeApi.toggleLike(post.blogId);
      console.log("toggleLike API result:", result);
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
      console.error("handleLike error:", error);
      alert("Có lỗi xảy ra khi thực hiện thao tác");
    } finally {
      setIsLiking(false);
    }
  };

  // In useEffect
  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await blogApi.getBlogBySlug(slug);
        console.log("getBlogBySlug response:", res);
        if (res.success && res.data) {
          console.log("res.data.likeCount:", res.data.likeCount);
          setPost(res.data);
          setLikeCount(
            typeof res.data.likeCount === "number"
              ? res.data.likeCount
              : (res.data.likeCount && res.data.likeCount.count) || 0
          );
          if (isAuthenticated && res.data.blogId) {
            console.log("Checking like status for blogId:", res.data.blogId);
            const likeRes = await blogLikeApi.checkIfLiked(res.data.blogId);
            console.log("checkIfLiked result:", likeRes, "user:", user);
            if (likeRes.success) {
              // Ensure Boolean conversion is explicit
              const isLiked = likeRes.data === true;
              console.log("Setting isLiked:", isLiked); // Log to confirm
              setIsLiked(isLiked);
            } else {
              console.log("checkIfLiked failed:", likeRes.message);
              setIsLiked(false);
            }
          } else {
            console.log(
              "Not authenticated or no blogId, setting isLiked: false"
            );
            setIsLiked(false);
          }
        } else {
          setError(res.message || "Không tìm thấy bài viết");
        }
      } catch (err) {
        console.error("fetchBlog error:", err);
        setError("Có lỗi xảy ra khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug, isAuthenticated]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
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
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <img
          src={
            post.thumbnail || post.featuredImage || "/api/placeholder/800/400"
          }
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
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center space-x-6 text-white/90">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                {post.authorName || "Ẩn danh"}
              </div>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {formatDate(post.createdAt || post.publishDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}

        <div className="max-w-7xl mx-auto">
          {/* Article Meta & Share */}
          <div className="flex justify-between items-center mb-8 p-6 rounded-xl shadow-sm ">
            <div className="">
              <nav className="text-sm text-gray-500 flex items-center gap-2 max-w-6xl mx-auto">
                <Link
                  to="/blog"
                  className="hover:underline text-blue-600 font-medium"
                >
                  Blog
                </Link>
                <span className="mx-1">/</span>
                <span className="text-gray-700 font-semibold">
                  {post?.title || slug}
                </span>
              </nav>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-4">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    disabled={isLiking}
                    className="flex items-center space-x-2"
                  >
                    <Heart
                      className={`w-4 h-4 dark:text-gray-600 ${
                        isLiked ? "fill-current" : ""
                      }`}
                    />

                    <span className="dark:text-gray-600">
                      {typeof likeCount === "number" ? likeCount : 0}
                    </span>
                    {isLiking && (
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare("facebook")}
                >
                  <Album className="w-4 h-4 dark:text-gray-600" />
                </Button>

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
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
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
      </div>
    </div>
  );
};

export default BlogDetailPage;
