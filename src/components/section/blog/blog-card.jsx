import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Calendar, User, MessageCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogLikeApi } from "@/apis/blog-like-api";
import { useAuth } from "@/contexts/auth-context";

const BlogCard = ({ blog, showLikeButton = true }) => {
  const user = useAuth();
  const isAuthenticated = !!user;
  const [likeCount, setLikeCount] = useState(
    typeof blog.likeCount === "number"
      ? blog.likeCount
      : (blog.likeCount && blog.likeCount.count) || 0
  );
  const [isLiked, setIsLiked] = useState(blog.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", options);
  };

  // Function to extract and truncate text from HTML content (~10 words)
  const getTruncatedExcerpt = (htmlContent, wordLimit = 10) => {
    if (!htmlContent) return "";

    // Create a temporary DOM element to parse HTML safely
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    // Get text content (this automatically handles HTML entities)
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Split into words and truncate
    const words = textContent.trim().split(/\s+/);
    const truncatedWords = words.slice(0, wordLimit);

    // Join words back and add ellipsis if truncated
    const truncatedText = truncatedWords.join(" ");
    const isTruncated = words.length > wordLimit;

    return isTruncated ? truncatedText + "..." : truncatedText;
  };

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Featured Image */}
      {blog.featuredImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={blog.featuredImage}
            alt={blog.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {blog.isPublished === false && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary">Nháp</Badge>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Categories */}
        {blog.categories && blog.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {blog.categories.map((category) => (
              <Badge
                key={category.category_id || category.id}
                variant="outline"
                className="text-xs"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link
            to={`/blog/${blog.slug}`}
            className="hover:text-blue-600 transition-colors"
          >
            {blog.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {blog.content && (
          <div
            className="text-gray-600 mb-4 line-clamp-3"
            dangerouslySetInnerHTML={{
              __html: getTruncatedExcerpt(blog.content),
            }}
          />
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 border-t-1 pt-4">
          <div className="flex items-center gap-4">
            {/* Date */}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(blog.publishedDate)}</span>
            </div>
          </div>
          <Link
            to={`/blog/${blog.slug}`}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            Đọc thêm →
          </Link>
        </div>
      </div>
    </article>
  );
};

export default BlogCard;
