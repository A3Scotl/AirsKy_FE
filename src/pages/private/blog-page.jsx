import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import BlogTable from "@/components/admin/blogs/blog-table";
import { blogApi } from "@/apis/blog-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


const AdminBlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, itemsPerPage, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        fetchBlogs();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      // Prepare params for API call
      const params = {
        page: currentPage - 1, // Backend uses 0-based pagination
        size: itemsPerPage,
        sort: "createdAt,desc",
      };

      // Use different API endpoints based on status filter
      let response;
      if (statusFilter === "all") {
        response = await blogApi.getAllBlogs(params);
      } else {
        response = await blogApi.getAllBlogs(params);
      }

      if (response.success) {
        let blogsData = response.data.content || response.data || [];

        // Apply status filter on frontend if needed
        if (statusFilter === "published") {
          blogsData = blogsData.filter((blog) => blog.isPublished);
        } else if (statusFilter === "draft") {
          blogsData = blogsData.filter((blog) => !blog.isPublished);
        }

        setBlogs(blogsData);
        setTotalItems(response.data.totalElements || blogsData.length);
      } else {
        console.error("Failed to fetch blogs:", response.message);
        setBlogs([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlog = (blogData) => {
    fetchBlogs(); // Refresh data after successful add
  };

  const handleEditBlog = (blogId, blogData) => {
    if (blogData?.bulkUpdate && blogData?.updatedBlogs) {
      // Handle bulk update
      setBlogs(blogData.updatedBlogs);
    } else {
      // Handle single blog update
      fetchBlogs(); // Refresh data after successful edit
    }
  };

  const handleDeleteBlog = (blogId) => {
    fetchBlogs(); // Refresh data after successful delete
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setCurrentPage(1); // Reset to page 1 when changing items per page
    setItemsPerPage(newItemsPerPage);
  };

  const handleSearch = async (query) => {
    setCurrentPage(1); // Reset to first page when searching

    if (query.trim()) {
      setLoading(true);
      try {
        const response = await blogApi.searchBlogs({
          keyword: query,
          page: 0,
          size: itemsPerPage,
          sort: "createdAt,desc",
        });

        if (response.success) {
          const blogsData = response.data.content || response.data || [];
          setBlogs(blogsData);
          setTotalItems(response.data.totalElements || blogsData.length);
        } else {
          console.error("Failed to search blogs:", response.message);
          setBlogs([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error("Error searching blogs:", error);
        setBlogs([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    } else {
      fetchBlogs(); // Reset to normal fetch when search is cleared
    }
  };

  const handleRefresh = () => {
    fetchBlogs();
  };

  const getStatsCards = () => {
    const totalBlogs = blogs.length;
    const publishedBlogs = blogs.filter((blog) => blog.isPublished).length;
    const draftBlogs = blogs.filter((blog) => !blog.isPublished).length;
    const totalViews = blogs.reduce(
      (sum, blog) => sum + (blog.viewCount || 0),
      0
    );

    return [
      {
        title: "Tổng số Blog",
        value: totalBlogs,
        icon: BookOpen,
        color: "text-blue-600",
      },
      {
        title: "Đã xuất bản",
        value: publishedBlogs,
        icon: BookOpen,
        color: "text-green-600",
      },
      {
        title: "Bản nháp",
        value: draftBlogs,
        icon: BookOpen,
        color: "text-orange-600",
      },
      {
        title: "Tổng lượt xem",
        value: totalViews.toLocaleString(),
        icon: BookOpen,
        color: "text-purple-600",
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Blog</h1>
          <p className="text-gray-600">
            Quản lý nội dung blog cho trang web đặt vé máy bay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
   
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getStatsCards().map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-white">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm blog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 dark:text-black"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="published">Đã xuất bản</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setCurrentPage(1); // Reset to page 1 when changing items per page
                  setItemsPerPage(parseInt(value));
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / trang</SelectItem>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Blog Table */}
      <BlogTable
        blogs={blogs}
        searchQuery={searchQuery}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        onAdd={handleAddBlog}
        onEdit={handleEditBlog}
        onDelete={handleDeleteBlog}
        onRefresh={fetchBlogs}
        loading={loading}
      />
    </div>
  );
};

export default AdminBlogPage;
