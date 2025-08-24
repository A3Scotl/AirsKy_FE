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

  // Mock data - trong thực tế sẽ fetch từ API
  const mockBlogs = [
    {
      blogId: 1,
      title: "10 Mẹo Đặt Vé Máy Bay Giá Rẻ",
      content: "Nội dung blog về cách đặt vé máy bay giá rẻ...",
      slug: "10-meo-dat-ve-may-bay-gia-re",
      excerpt: "Khám phá những bí quyết để có được vé máy bay với giá tốt nhất",
      featuredImage: "https://example.com/image1.jpg",
      publishedDate: "2025-08-20T10:00:00",
      isPublished: true,
      viewCount: 245,
      likeCount: 18,
      createdAt: "2025-08-20T10:00:00",
      updatedAt: "2025-08-20T10:00:00",
      authorId: 1,
      authorName: "Admin User",
      authorEmail: "admin@gmail.com",
      categories: [
        {
          categoryId: 1,
          name: "Travel Tips",
          slug: "travel-tips",
          description: "Helpful travel tips and guides",
        },
        {
          categoryId: 3,
          name: "Flight Deals",
          slug: "flight-deals",
          description: "Special flight offers and promotions",
        },
      ],
    },
    {
      blogId: 2,
      title: "Hướng Dẫn Check-in Online",
      content: "Nội dung blog về cách check-in online...",
      slug: "huong-dan-check-in-online",
      excerpt: "Tất cả những gì bạn cần biết về check-in online",
      featuredImage: "https://example.com/image2.jpg",
      publishedDate: null,
      isPublished: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: "2025-08-21T14:30:00",
      updatedAt: "2025-08-21T14:30:00",
      authorId: 1,
      authorName: "Admin User",
      authorEmail: "admin@gmail.com",
      categories: [
        {
          categoryId: 4,
          name: "Airport Guides",
          slug: "airport-guides",
          description: "Airport information and guides",
        },
      ],
    },
    {
      blogId: 3,
      title: "Top 5 Điểm Du Lịch Mùa Hè",
      content: "Nội dung blog về điểm du lịch mùa hè...",
      slug: "top-5-diem-du-lich-mua-he",
      excerpt: "Những điểm đến tuyệt vời cho kỳ nghỉ hè của bạn",
      featuredImage: "https://example.com/image3.jpg",
      publishedDate: "2025-08-19T08:15:00",
      isPublished: true,
      viewCount: 892,
      likeCount: 67,
      createdAt: "2025-08-19T08:15:00",
      updatedAt: "2025-08-19T08:15:00",
      authorId: 1,
      authorName: "Admin User",
      authorEmail: "admin@gmail.com",
      categories: [
        {
          categoryId: 2,
          name: "Destinations",
          slug: "destinations",
          description: "Popular travel destinations",
        },
      ],
    },
  ];

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, itemsPerPage, statusFilter]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let filteredBlogs = mockBlogs;

      if (statusFilter === "published") {
        filteredBlogs = mockBlogs.filter((blog) => blog.isPublished);
      } else if (statusFilter === "draft") {
        filteredBlogs = mockBlogs.filter((blog) => !blog.isPublished);
      }

      setBlogs(filteredBlogs);
      setTotalItems(filteredBlogs.length);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBlog = (blogId, blogData) => {
    // API call to update blog
    console.log("Editing blog:", blogId, blogData);
    fetchBlogs(); // Refresh data
  };

  const handleDeleteBlog = (blogId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa blog này?")) {
      // API call to delete blog
      console.log("Deleting blog:", blogId);
      fetchBlogs(); // Refresh data
    }
  };

  const handleRefresh = () => {
    fetchBlogs();
  };

  const handleExport = () => {
    // Logic to export blogs data
    console.log("Exporting blogs data...");
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Blog</h1>
          <p className="text-gray-600">
            Quản lý nội dung blog cho trang web đặt vé máy bay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
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
                  <p className="text-sm font-medium text-gray-600">
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
                  className="pl-10"
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
                onValueChange={(value) => setItemsPerPage(parseInt(value))}
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
        onItemsPerPageChange={setItemsPerPage}
        onEdit={handleEditBlog}
        onDelete={handleDeleteBlog}
        loading={loading}
      />
    </div>
  );
};

export default AdminBlogPage;
