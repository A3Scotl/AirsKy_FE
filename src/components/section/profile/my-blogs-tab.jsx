import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { blogApi } from "@/apis/blog-api";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Pagination from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const CARD_TITLE_HEIGHT = 48;
const CARD_IMAGE_HEIGHT = 160;
const PAGE_SIZE = 6;

const MyBlogsTab = () => {
  const [tab, setTab] = useState("liked");
  const [likedBlogs, setLikedBlogs] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [likedPage, setLikedPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const [likedTotal, setLikedTotal] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);
  const [sort, setSort] = useState("createdAt,desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLoadingLiked(true);
    blogApi
      .getLikedBlogs?.({ page: likedPage - 1, size: PAGE_SIZE, sort })
      .then((res) => {
        if (res?.success) {
          setLikedBlogs(res.data?.content || []);
          setLikedTotal(res.data?.totalElements || 0);
        }
        setLoadingLiked(false);
      });
  }, [likedPage, sort]);

  useEffect(() => {
    setLoadingSaved(true);
    blogApi
      .getSavedBlogs?.({ page: savedPage - 1, size: PAGE_SIZE, sort })
      .then((res) => {
        if (res?.success) {
          setSavedBlogs(res.data?.content || []);
          setSavedTotal(res.data?.totalElements || 0);
        }
        setLoadingSaved(false);
      });
  }, [savedPage, sort]);

  // Tính tổng số trang
  const likedTotalPages = Math.ceil(likedTotal / PAGE_SIZE);
  const savedTotalPages = Math.ceil(savedTotal / PAGE_SIZE);

  // Refresh blogs data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh both liked and saved blogs
      const [likedRes, savedRes] = await Promise.all([
        blogApi.getLikedBlogs?.({ page: likedPage - 1, size: PAGE_SIZE, sort }),
        blogApi.getSavedBlogs?.({ page: savedPage - 1, size: PAGE_SIZE, sort }),
      ]);

      if (likedRes?.success) {
        setLikedBlogs(likedRes.data?.content || []);
        setLikedTotal(likedRes.data?.totalElements || 0);
      }

      if (savedRes?.success) {
        setSavedBlogs(savedRes.data?.content || []);
        setSavedTotal(savedRes.data?.totalElements || 0);
      }

    } catch (error) {
      console.error("Error refreshing blogs data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Card layout helper
  const BlogCard = ({ blog }) => (
    <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
      {blog.featuredImage && (
        <img
          src={blog.featuredImage}
          alt={blog.title}
          className="w-full object-cover rounded-t-md"
          style={{
            height: CARD_IMAGE_HEIGHT,
            minHeight: CARD_IMAGE_HEIGHT,
            maxHeight: CARD_IMAGE_HEIGHT,
          }}
        />
      )}
      <CardHeader className="pb-2">
        <CardTitle
          className="text-base font-semibold mb-1"
          style={{
            minHeight: CARD_TITLE_HEIGHT,
            maxHeight: CARD_TITLE_HEIGHT,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          {blog.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="line-clamp-3 text-sm text-gray-600 mb-2">
          {blog.excerpt || blog.content}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {blog.publishedDate || blog.createdAt
              ? new Date(
                  blog.publishedDate || blog.createdAt
                ).toLocaleDateString()
              : ""}
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to={blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id}`}>
              Xem chi tiết
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bài viết của tôi</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
        <div className="flex gap-2 mt-2 items-center">
          <span className="text-sm text-gray-500">Sắp xếp:</span>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v);
              setLikedPage(1);
              setSavedPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="publishedDate,desc">Mới nhất</SelectItem>
              <SelectItem value="publishedDate,asc">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="liked">Bài viết yêu thích</TabsTrigger>
            <TabsTrigger value="saved">Bài viết đã lưu</TabsTrigger>
          </TabsList>
          <TabsContent value="liked">
            {loadingLiked ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedBlogs.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500">
                      Chưa có bài viết yêu thích nào.
                    </div>
                  ) : (
                    likedBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))
                  )}
                </div>
                <Pagination
                  currentPage={likedPage}
                  totalPages={likedTotalPages}
                  itemsPerPage={PAGE_SIZE}
                  totalItems={likedTotal}
                  onPageChange={setLikedPage}
                  showPageSizeSelector={false}
                />
              </>
            )}
          </TabsContent>
          <TabsContent value="saved">
            {loadingSaved ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedBlogs.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500">
                      Chưa có bài viết đã lưu nào.
                    </div>
                  ) : (
                    savedBlogs.map((blog) => (
                      <BlogCard key={blog.id} blog={blog} />
                    ))
                  )}
                </div>
                <Pagination
                  currentPage={savedPage}
                  totalPages={savedTotalPages}
                  itemsPerPage={PAGE_SIZE}
                  totalItems={savedTotal}
                  onPageChange={setSavedPage}
                  showPageSizeSelector={false}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MyBlogsTab;
