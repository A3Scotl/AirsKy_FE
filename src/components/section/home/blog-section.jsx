import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { blogApi } from "@/apis/blog-api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const BlogCardSkeleton = () => (
  <div className="rounded-xl overflow-hidden bg-white shadow-sm border p-4">
    <Skeleton className="w-full h-48 rounded-lg mb-4" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <Skeleton className="h-4 w-24" />
  </div>
);

const fetchRecentBlogs = async () => {
  try {
    const result = await blogApi.getAllPublishedBlogs({
      page: 0,
      size: 8,
      sort: "viewCount,desc",
    });

    if (result.success && result.data) {
      return (
        result.data.content?.map((blog) => ({
          id: blog.blogId,
          title: blog.title,
          slug: blog.slug,
          excerpt: blog.excerpt,
          featuredImage: blog.featuredImage,
          publishedAt: blog.publishedAt || blog.createdAt,
          category: blog.categories?.[0]?.categoryName || "Du lịch",
        })) || []
      );
    }
    throw new Error("Không thể tải danh sách bài viết.");
  } catch (err) {
    throw new Error(err.message || "Có lỗi xảy ra khi tải bài viết.");
  }
};

const BlogSection = () => {
  const navigate = useNavigate();
  const swiperRef = useRef(null);

  const {
    data: blogs = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recentBlogs"],
    queryFn: fetchRecentBlogs,
    staleTime: 1000 * 60 * 5, // 5 phut
  });

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return "N/A";
    }
  };

  const handlePrev = () => swiperRef.current?.swiper?.slidePrev();
  const handleNext = () => swiperRef.current?.swiper?.slideNext();

  if (isLoading)
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Bài viết mới nhất</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );

  if (isError)
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-red-600">
          {error.message}
        </div>
      </section>
    );

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Bài viết mới nhất</h2>

          <button
            onClick={() => navigate("/blog")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Xem tất cả
          </button>
        </div>

      

        {/* Slider */}
        <Swiper
          ref={swiperRef}
          modules={[Autoplay, Pagination]}
          slidesPerView={1}
          spaceBetween={20}
          autoplay={{ delay: 3500 }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {blogs.map((blog) => (
            <SwiperSlide key={blog.id}>
              <div
                className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/blog/${blog.slug}`)}
              >
                <img
                  src={blog.featuredImage || "/placeholder-blog.svg"}
                  alt={blog.title}
                  className="h-48 w-full object-cover"
                />

                <div className="p-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">
                    {blog.category}
                  </p>

                  <h3 className="font-semibold text-lg text-gray-800 line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-2">
                    {formatDate(blog.publishedAt)}
                  </p>

                  <button className="mt-3 text-blue-600 font-medium cursor-pointer text-sm hover:underline">
                    Đọc thêm →
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
          {/* Slider Controls */}
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handlePrev}
            className="p-2 border rounded-md cursor-pointer hover:bg-gray-100"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="p-2 border rounded-md cursor-pointer hover:bg-gray-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
