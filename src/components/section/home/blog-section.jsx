import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  Navigation,
  EffectCoverflow,
} from "swiper/modules";
import { blogApi } from "@/apis/blog-api";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const BlogCardSkeleton = () => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl mx-4">
      {/* Image Skeleton */}
      <div className="relative h-64 overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

        {/* Category Badge Skeleton */}
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        {/* View Count Skeleton */}
        <div className="absolute top-4 right-4">
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2 mb-4" />

        {/* Meta Information Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Buttons Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

const BlogSection = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const result = await blogApi.getAllPublishedBlogs({
          page: 0,
          size: 8,
          sort: "viewCount,desc",
        });

        if (result.success && result.data) {
          const mappedBlogs =
            result.data.content?.map((blog) => ({
              id: blog.blogId,
              title: blog.title,
              slug: blog.slug,
              excerpt: blog.excerpt || blog.content?.substring(0, 120) + "...",
              featuredImage: blog.featuredImage,
              author: blog.author?.fullName || "Admin",
              publishedAt: blog.publishedAt || blog.createdAt,
              viewCount: blog.viewCount || 0,
              category: blog.categories?.[0]?.categoryName || "Du lịch",
              readTime: Math.ceil((blog.content?.length || 1000) / 500),
            })) || [];

          setBlogs(mappedBlogs);
        } else {
          setError(result.message || "Không thể tải blog");
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError("Có lỗi xảy ra khi tải blog");
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Custom navigation functions
  const handlePrev = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  if (loading) {
    return (
      <section className="py-16 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Blog Du Lịch & Kinh Nghiệm
            </h2>
          </div>

          {/* Skeleton Carousel */}
          <div className="mb-16 relative">
            <Swiper
              modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={1}
              coverflowEffect={{
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation={false}
              breakpoints={{
                640: {
                  slidesPerView: 1.2,
                },
                768: {
                  slidesPerView: 1.5,
                },
                1024: {
                  slidesPerView: 2,
                },
              }}
              className="blog-carousel"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <SwiperSlide key={index}>
                  <BlogCardSkeleton />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Blog Du Lịch & Kinh Nghiệm
            </h2>
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <svg
                  className="w-12 h-12 mx-auto mb-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden dark:bg-gray-500">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Featured Blog Carousel */}
        {blogs.length > 0 && (
          <div className="mb-12 sm:mb-16 relative">
            {/* Custom Navigation Buttons */}
            <div className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
              <button
                onClick={handlePrev}
                className="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-110"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
              </button>
            </div>

            <div className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
              <button
                onClick={handleNext}
                className="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-110"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200" />
              </button>
            </div>

            <Swiper
              ref={swiperRef}
              modules={[Autoplay, Pagination, Navigation, EffectCoverflow]}
              effect="coverflow"
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={1}
              coverflowEffect={{
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              navigation={false} // Disable default navigation
              breakpoints={{
                480: {
                  slidesPerView: 1,
                },
                640: {
                  slidesPerView: 1.2,
                },
                768: {
                  slidesPerView: 1.5,
                },
                1024: {
                  slidesPerView: 2,
                },
              }}
              className="blog-carousel"
            >
              {blogs.slice(0, 4).map((blog, index) => (
                <SwiperSlide key={blog.id}>
                  <div
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl hover:shadow-3xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 mx-4"
                    onClick={() => navigate(`/blog/${blog.slug}`)}
                  >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={blog.featuredImage || "/placeholder-blog.svg"}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) =>
                          (e.target.src = "/placeholder-blog.svg")
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium rounded-full shadow-md">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M17.293 13.293A8 8 0 0112 18c-4.411 0-8-3.589-8-8a8.001 8.001 0 014.708-7.208L9 6.5V12h1.5V8.5l2.793 2.793zM12 4a.5.5 0 01.5.5V6h1.5a.5.5 0 010 1H12a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {blog.category}
                        </span>
                      </div>

                      {/* View Count */}
                      <div className="absolute top-4 right-4">
                        <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {blog.viewCount}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                        {blog.title}
                      </h3>

                      {/* Meta Information */}
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{formatDate(blog.publishedAt)}</span>
                        </div>
                      </div>

                      {/* Read More Button */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium text-base hover:underline transition-all duration-200">
                          Đọc thêm
                          <svg
                            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </span>

                        <div className="flex gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                            </svg>
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* View All Button */}
        {blogs.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={() => navigate("/blog")}
              className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              Xem tất cả bài viết
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6 ml-2 sm:ml-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
