import { useState, useEffect, useMemo } from "react";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plane,
  Clock,
  Calendar,
  MapPin,
  Percent,
  Tag,
  Star,
  ArrowRight,
  Filter,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  User,
  Users,
  Crown,
  Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { dealApi } from "@/apis/deal-api";
import { loyaltyApi } from "@/apis/loyalty-api";
import { useAuth } from "@/contexts/auth-context";
import {
  formatCurrencyVND,
  formatDateVN,
  formatDateTimeVN,
} from "@/utils/currency-utils";

import { Autoplay } from "swiper/modules";
import "swiper/css";
import { Skeleton } from "@/components/ui/skeleton";
import { airportApi } from "@/apis/airport-api";
import { useQuery } from "@tanstack/react-query";

// 🚀 Đề xuất: Chuyển Skeletons sang file riêng (ví dụ: /components/common/DealSkeletons.jsx)
const DealCardSkeleton = ({ isLarge = false }) => {
  return (
    <Card
      className={`relative overflow-hidden group ${
        isLarge ? "lg:col-span-2 lg:row-span-2" : ""
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isLarge ? "min-h-[320px]" : "min-h-[200px]"
        }`}
      >
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div
        className={`relative z-10 p-6 h-full flex flex-col justify-between ${
          isLarge ? "min-h-[320px]" : "min-h-[200px]"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12 rounded-full" />
          </div>
          <Skeleton
            className={`h-6 w-3/4 mb-2 ${isLarge ? "text-2xl" : "text-lg"}`}
          />
          <Skeleton
            className={`h-4 w-full mb-3 ${isLarge ? "text-base" : "text-sm"}`}
          />
          <div className="flex items-center space-x-2 mb-3">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-20 rounded" />
        </div>
      </div>
    </Card>
  );
};

const DealCardSkeletonGrid = () => {
  return (
    <Card
      className="relative overflow-hidden group shadow-lg border-0"
      style={{ minHeight: 350 }}
    >
      <Skeleton className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      <div className="absolute bottom-0 left-0 w-full z-20 p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-6 w-12 mx-auto mb-1 bg-gray-400" />
          <div className="flex-1 mx-3 relative">
            <Skeleton className="h-px w-full bg-gray-400" />
            <Skeleton className="h-4 w-4 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-200" />
          </div>
          <Skeleton className="h-6 w-12 mx-auto mb-1 bg-gray-400" />
        </div>
        <Skeleton className="h-4 w-32 mx-auto mb-3 bg-gray-400" />
        <div className="bg-gray-50/60 rounded-lg p-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
        <Skeleton className="h-10 w-full rounded bg-gray-300" />
      </div>
    </Card>
  );
};

const fetchAirports = async () => {
  try {
    const result = await airportApi.getAllAirports({
      size: 1000,
      sort: "airportName,asc",
    });
    if (result.success && result.data && result.data.content) {
      return result.data.content;
    }
    return [];
  } catch (error) {
    console.error("Error fetching airports:", error);
    throw new Error("Không thể tải danh sách sân bay.");
  }
};

const fetchFlightDeals = async () => {
  try {
    const res = await dealApi.getActiveDeals({
      page: 0,
      size: 100,
      sort: "createdAt,desc",
    });
    if (res.success && res.data && res.data.content) {
      return res.data.content;
    }
    return [];
  } catch (error) {
    console.error("Error fetching flight deals:", error);
    throw new Error("Không thể tải danh sách ưu đãi.");
  }
};

const fetchUserLoyalty = async () => {
  try {
    const loyaltyData = await loyaltyApi.getLoyaltyStats();
    return loyaltyData;
  } catch (error) {
    console.error("Error fetching user loyalty:", error);
    // Trả về null thay vì ném lỗi để không làm hỏng giao diện nếu chỉ API này lỗi
    return null;
  }
};

const DealsPage = () => {
  const { user } = useAuth();

  // Filters for "Featured" and "Flash Sale"
  const [sortBy, setSortBy] = useState("discount");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filters for "All Discount Codes" (in Sheet)
  const [allDealsSearchTerm, setAllDealsSearchTerm] = useState("");
  const [allDealsSortBy, setAllDealsSortBy] = useState("discount");
  const [allDealsCurrentPage, setAllDealsCurrentPage] = useState(1);
  const [allDealsDepartureAirport, setAllDealsDepartureAirport] =
    useState("all");
  const [allDealsArrivalAirport, setAllDealsArrivalAirport] = useState("all");
  const allDealsItemsPerPage = 12;

  // Filters for "Flash Sale Chuyến Bay"
  const [flashSaleCurrentPage, setFlashSaleCurrentPage] = useState(1);
  const flashSaleItemsPerPage = 8;

  // --- React Query Data Fetching ---
  const { data: airports = [], isLoading: airportsLoading } = useQuery({
    queryKey: ["airports"],
    queryFn: fetchAirports,
  });

  const { data: flightDeals = [], isLoading: flightLoading } = useQuery({
    queryKey: ["flightDeals"],
    queryFn: fetchFlightDeals,
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  const { data: userLoyalty, isLoading: loyaltyLoading } = useQuery({
    // Query key phụ thuộc vào user.id để tự động fetch lại khi user thay đổi
    queryKey: ["userLoyalty", user?.id],
    queryFn: fetchUserLoyalty,
    // Chỉ chạy query này khi user đã đăng nhập
    enabled: !!user,
    // Giữ lại dữ liệu cũ khi user logout để tránh giật màn hình
    keepPreviousData: true,
  });

  // --- Helper Functions ---

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    // Cân nhắc thêm một toast notification ở đây
  };

  const getDaysRemaining = (validUntil) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Check if a deal is applicable for the current user
  const isDealApplicable = (deal) => {
    if (deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS")) {
      return false;
    }
    const isGuestOnly = deal.isGuestOnly === true;
    const isLoyaltyExclusive = deal.isLoyaltyExclusive === true;

    if (!user) {
      return isGuestOnly || (!isGuestOnly && !isLoyaltyExclusive);
    }

    if (isGuestOnly) {
      return false;
    }

    if (isLoyaltyExclusive && deal.requiredLoyaltyTier) {
      const userTier = userLoyalty?.currentTier || "STANDARD";
      const tierHierarchy = { STANDARD: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
      const userTierLevel = tierHierarchy[userTier] || 0;
      const requiredTierLevel = tierHierarchy[deal.requiredLoyaltyTier] || 0;
      return userTierLevel >= requiredTierLevel;
    }

    return !isGuestOnly && !isLoyaltyExclusive;
  };

  // Get semantic badge for deal type
  const getDealTypeBadge = (deal) => {
    if (deal.isGuestOnly) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
        >
          <User className="h-3 w-3" />
          Khách vãng lai
        </Badge>
      );
    }
    if (deal.isLoyaltyExclusive) {
      const tierColors = {
        SILVER: "bg-gray-100 text-gray-700 border-gray-200",
        GOLD: "bg-yellow-100 text-yellow-800 border-yellow-200",
        PLATINUM: "bg-blue-100 text-blue-800 border-blue-200",
      };
      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 ${
            tierColors[deal.requiredLoyaltyTier] ||
            "bg-blue-50 text-blue-700 border-blue-200"
          }`}
        >
          <Crown className="h-3 w-3" />
          {deal.requiredLoyaltyTier || "Thành viên"}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-200"
      >
        <Users className="h-3 w-3" />
        Tất cả
      </Badge>
    );
  };

  // --- Memoized Data Logic ---

  // 1. All deals filtered for "All Discount Codes" (in Sheet)
  const allDealsFiltered = useMemo(() => {
    const searchLower = allDealsSearchTerm.toLowerCase();
    let filtered = flightDeals.filter((deal) => {
      if (deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS")) {
        return false;
      }
      const matchesSearch =
        deal.title.toLowerCase().includes(searchLower) ||
        deal.dealCode.toLowerCase().includes(searchLower) ||
        deal.description.toLowerCase().includes(searchLower);
      const matchesDeparture =
        allDealsDepartureAirport === "all" ||
        deal.departureAirportId === parseInt(allDealsDepartureAirport);
      const matchesArrival =
        allDealsArrivalAirport === "all" ||
        deal.arrivalAirportId === parseInt(allDealsArrivalAirport);
      return matchesSearch && matchesDeparture && matchesArrival;
    });

    return filtered.sort((a, b) => {
      if (allDealsSortBy === "discount")
        return b.discountPercentage - a.discountPercentage;
      if (allDealsSortBy === "expiry")
        return new Date(a.validTo) - new Date(b.validTo);
      if (allDealsSortBy === "usage")
        return a.remainingUsage - b.remainingUsage;
      return 0;
    });
  }, [
    flightDeals,
    allDealsSearchTerm,
    allDealsSortBy,
    allDealsDepartureAirport,
    allDealsArrivalAirport,
  ]);

  // Reset page for "All Discount Codes" when filters change
  useEffect(() => {
    setAllDealsCurrentPage(1);
  }, [
    allDealsSearchTerm,
    allDealsSortBy,
    allDealsDepartureAirport,
    allDealsArrivalAirport,
  ]);

  // Paginated list for "All Discount Codes"
  const allDealsPaginated = useMemo(() => {
    const startIndex = (allDealsCurrentPage - 1) * allDealsItemsPerPage;
    return allDealsFiltered.slice(
      startIndex,
      startIndex + allDealsItemsPerPage
    );
  }, [allDealsFiltered, allDealsCurrentPage, allDealsItemsPerPage]);

  const allDealsTotalPages = Math.ceil(
    allDealsFiltered.length / allDealsItemsPerPage
  );

  // 2. Deals filtered for "Flash Sale Chuyến Bay"
  const flashSaleDeals = useMemo(() => {
    let filtered = flightDeals.filter((deal) => {
      if (deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS")) {
        return false;
      }
      // Lọc các deal có thông tin sân bay cụ thể
      return (
        deal.departureAirportId != null &&
        deal.departureAirportName &&
        deal.arrivalAirportId != null &&
        deal.arrivalAirportName
      );
    });

    // Sắp xếp theo sortBy (state chung)
    return filtered.sort((a, b) => {
      if (sortBy === "discount")
        return b.discountPercentage - a.discountPercentage;
      if (sortBy === "expiry") return new Date(a.validTo) - new Date(b.validTo);
      if (sortBy === "usage") return a.remainingUsage - b.remainingUsage;
      return 0;
    });
  }, [flightDeals, sortBy]);

  // Reset page for "Flash Sale" when filters change
  useEffect(() => {
    setFlashSaleCurrentPage(1);
  }, [sortBy]);

  // Paginated list for "Flash Sale"
  const flashSalePaginated = useMemo(() => {
    const startIndex = (flashSaleCurrentPage - 1) * flashSaleItemsPerPage;
    return flashSaleDeals.slice(startIndex, startIndex + flashSaleItemsPerPage);
  }, [flashSaleDeals, flashSaleCurrentPage, flashSaleItemsPerPage]);

  const flashSaleTotalPages = Math.ceil(
    flashSaleDeals.length / flashSaleItemsPerPage
  );

  // 3. Featured Deals (Lấy 3 deal tốt nhất từ `allDealsFiltered` hoặc `flightDeals` nếu không có)
  const featuredDeals = useMemo(() => {
    // Ưu tiên 1: Lấy từ `allDealsFiltered` (đã lọc theo user)
    const applicableDeals = allDealsFiltered.filter(isDealApplicable);

    let sortedForFeatured;

    if (applicableDeals.length > 0) {
      sortedForFeatured = [...applicableDeals].sort((a, b) => {
        const discountDiff = b.discountPercentage - a.discountPercentage;
        if (discountDiff !== 0) return discountDiff;
        const dateDiff = new Date(a.validTo) - new Date(b.validTo);
        if (dateDiff !== 0) return dateDiff;
        return a.remainingUsage - b.remainingUsage;
      });
    } else {
      // Fallback: Nếu không có deal nào phù hợp, hiển thị 3 deal public giảm giá cao nhất
      sortedForFeatured = flightDeals
        .filter(
          (deal) =>
            !deal.isGuestOnly &&
            !deal.isLoyaltyExclusive &&
            !(deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS"))
        )
        .sort((a, b) => b.discountPercentage - a.discountPercentage);
    }

    return sortedForFeatured.slice(0, 3);
  }, [allDealsFiltered, flightDeals, isDealApplicable]);

  return (
    <>
      <SEO
        title="Ưu Đãi Bay"
        description="Tìm kiếm và lựa chọn các ưu đãi phù hợp cho từng chuyến bay của bạn."
        keywords="tìm kiếm chuyến bay, so sánh vé máy bay, đặt vé máy bay"
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-r from-blue-600  max-w-8xl mx-auto to-blue-900 text-white pt-24 pb-16">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto py-12 px-6 lg:px-8 text-center md:text-left">
            <div className="md:w-2/3 lg:w-1/2">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Khuyến Mãi & Ưu Đãi
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
                Khám phá deal bay tuyệt vời, mã giảm giá độc quyền và khuyến mãi
                hấp dẫn.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-6 lg:px-8 max-w-7xl py-16">
          {/* Featured Deals Section */}
          <section className="mb-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🔥 Ưu Đãi Nổi Bật
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Những mã giảm giá hot nhất không thể bỏ lỡ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {flightLoading ? (
                <>
                  <DealCardSkeleton isLarge={true} />
                  <DealCardSkeleton />
                  <DealCardSkeleton />
                </>
              ) : featuredDeals.length === 0 ? (
                <div className="col-span-1 lg:col-span-3 text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow">
                  Không có ưu đãi nổi bật nào phù hợp với bạn.
                </div>
              ) : (
                featuredDeals.map((deal, index) => (
                  <Card
                    key={deal.dealId}
                    className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
                      index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${deal.thumbnail})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                    </div>
                    <div
                      className={`relative z-10 p-6 h-full flex flex-col justify-between ${
                        index === 0 ? "min-h-[320px]" : "min-h-[200px]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getDealTypeBadge(deal)}
                            <Badge
                              variant="outline"
                              className="bg-white/20 text-white border-white/30"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Còn {getDaysRemaining(deal.validTo)} ngày
                            </Badge>
                          </div>
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-lg">
                            -{deal.discountPercentage}%
                          </div>
                        </div>
                        <h3
                          className={`font-bold text-white mb-2 ${
                            index === 0 ? "text-2xl" : "text-lg"
                          }`}
                        >
                          {deal.title}
                        </h3>
                        <p
                          className={`text-white/90 mb-3 line-clamp-2 ${
                            index === 0 ? "text-base" : "text-sm"
                          }`}
                        >
                          {deal.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1 flex items-center space-x-2">
                            <Tag className="w-3 h-3 text-white" />
                            <span className="text-white font-mono font-bold text-sm">
                              {deal.dealCode}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(deal.dealCode)}
                            className="text-white/80 hover:text-white text-sm underline"
                          >
                            Sao chép
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-white/80 text-sm">
                          Đơn tối thiểu{" "}
                          <span className="font-bold">
                            {deal.minimumOrderAmount
                              ? formatCurrencyVND(deal.minimumOrderAmount)
                              : "0đ"}
                          </span>
                        </div>
                        <Link to={`/deals/${deal.dealId}`}>
                          <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                            Chi tiết
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* All Discount Codes Modal Section */}
          <section className="mb-16">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  🎫 Mã Giảm Giá
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Tổng hợp tất cả mã giảm giá hiện có
                </p>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="font-semibold mt-4 md:mt-0 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem tất cả ({allDealsFiltered.length}) mã
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl h-screen overflow-y-auto p-0 z-[9999] dark:bg-gray-900"
                >
                  <div className="p-6 h-full flex flex-col">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-2xl font-bold dark:text-white">
                        Tất cả mã giảm giá
                      </SheetTitle>
                      <SheetDescription className="text-gray-600 dark:text-gray-400">
                        Danh sách đầy đủ các mã giảm giá hiện có
                      </SheetDescription>
                    </SheetHeader>

                    {/* Filter and Sort Controls */}
                    <div className="space-y-4 mb-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Tìm kiếm mã..."
                            value={allDealsSearchTerm}
                            onChange={(e) =>
                              setAllDealsSearchTerm(e.target.value)
                            }
                            className="pl-10 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                            Sắp xếp:
                          </label>
                          <Select
                            value={allDealsSortBy}
                            onValueChange={setAllDealsSortBy}
                          >
                            <SelectTrigger className="w-48 h-10 dark:bg-gray-800 dark:text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="discount">
                                Giảm giá cao nhất
                              </SelectItem>
                              <SelectItem value="expiry">
                                Hết hạn sớm nhất
                              </SelectItem>
                              <SelectItem value="usage">
                                Sử dụng nhiều nhất
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Airport filters (Add similar Selects for departure/arrival) */}
                      </div>
                    </div>

                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      Hiển thị {allDealsPaginated.length} /{" "}
                      {allDealsFiltered.length} mã
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {allDealsPaginated.map((deal) => (
                          <Card
                            key={deal.dealId}
                            className="p-4 hover:shadow-md transition-shadow dark:bg-gray-800"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                                {deal.dealCode}
                              </div>
                              <Badge
                                variant="outline"
                                className="text-blue-600 border-blue-600"
                              >
                                -{deal.discountPercentage}%
                              </Badge>
                            </div>
                            {/* Route Info */}
                            {deal.departureAirportCode &&
                              deal.arrivalAirportCode && (
                                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPin className="h-4 w-4" />
                                  <span>
                                    {deal.departureAirportCode} →{" "}
                                    {deal.arrivalAirportCode}
                                  </span>
                                </div>
                              )}
                            <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm line-clamp-2">
                              {deal.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Hết hạn: {formatDateVN(deal.validTo)}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(deal.dealCode)}
                                className="text-xs dark:bg-gray-700 dark:text-white"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Sao chép
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Pagination for All Deals */}
                    {allDealsTotalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 pt-6 border-t dark:border-gray-700">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllDealsCurrentPage((prev) =>
                              Math.max(prev - 1, 1)
                            )
                          }
                          disabled={allDealsCurrentPage === 1}
                          className="dark:bg-gray-800 dark:text-white"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Trang {allDealsCurrentPage} / {allDealsTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllDealsCurrentPage((prev) =>
                              Math.min(prev + 1, allDealsTotalPages)
                            )
                          }
                          disabled={allDealsCurrentPage === allDealsTotalPages}
                          className="dark:bg-gray-800 dark:text-white"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Quick preview of discount codes */}
            <Swiper
              modules={[Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              loop={true}
              autoplay={{ delay: 2000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 3 },
                1024: { slidesPerView: 4 },
              }}
              className="deals-slider"
            >
              {allDealsFiltered.slice(0, 8).map((deal) => (
                <SwiperSlide key={deal.dealId}>
                  <Card className="p-4 h-full dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold text-sm">
                        {deal.dealCode}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600"
                      >
                        -{deal.discountPercentage}%
                      </Badge>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm line-clamp-2">
                      {deal.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateVN(deal.validTo)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(deal.dealCode)}
                        className="text-xs dark:bg-gray-700 dark:text-white"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Chép
                      </Button>
                    </div>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* Flash Sale Chuyến Bay Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  ✈️ Flash Sale Chuyến Bay
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Giá vé ưu đãi có thời hạn - Đặt ngay kẻo lỡ!
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <label className="text-gray-700 dark:text-gray-300 font-medium">
                  Sắp xếp:
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-10 bg-white dark:bg-gray-800 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="discount">Giảm giá cao nhất</SelectItem>
                    <SelectItem value="expiry">Hết hạn sớm nhất</SelectItem>
                    <SelectItem value="usage">Sử dụng nhiều nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {flightLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <DealCardSkeletonGrid key={index} />
                ))
              ) : flashSalePaginated.length === 0 ? (
                <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow">
                  Không có ưu đãi chuyến bay nào.
                </div>
              ) : (
                flashSalePaginated.map((deal) => (
                  <Card
                    key={deal.dealId}
                    className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white"
                    style={{
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: 200,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/40 z-10"></div>
                    <div className="absolute top-3 right-3 bg-blue-600 text-white px-2 py-1 rounded-full font-bold text-xs z-20">
                      -{deal.discountPercentage}%
                    </div>
                    <div className="absolute bottom-0 left-0 w-full z-20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {deal.departureAirportCode}
                          </div>
                        </div>
                        <div className="flex-1 mx-3 relative">
                          <div className="h-px bg-white/50"></div>
                          <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 bg-white rounded-full p-0.5" />
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">
                            {deal.arrivalAirportCode}
                          </div>
                        </div>
                      </div>
                      <div className="text-center text-white/90 mb-3 text-sm line-clamp-1">
                        {deal.departureAirportName} → {deal.arrivalAirportName}
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-white">
                            Mã: {deal.dealCode}
                          </span>
                          <span className="text-white/80">
                            Còn {deal.remainingUsage} lượt
                          </span>
                        </div>
                        <div className="text-xs text-white/80 mt-1">
                          Hết hạn: {formatDateVN(deal.validTo)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination for Flash Sale */}
            {flashSaleTotalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFlashSaleCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={flashSaleCurrentPage === 1}
                  className="dark:bg-gray-800 dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Trang {flashSaleCurrentPage} / {flashSaleTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFlashSaleCurrentPage((prev) =>
                      Math.min(prev + 1, flashSaleTotalPages)
                    )
                  }
                  disabled={flashSaleCurrentPage === flashSaleTotalPages}
                  className="dark:bg-gray-800 dark:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default DealsPage;
