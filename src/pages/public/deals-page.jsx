import { useState, useEffect, useContext } from "react";
import SEO from "@/components/common/seo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const DealCardSkeleton = ({ isLarge = false }) => {
  return (
    <Card
      className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
        isLarge ? "lg:col-span-2 lg:row-span-2" : ""
      }`}
    >
      {/* Background Image Skeleton */}
      <div
        className={`absolute inset-0 ${
          isLarge ? "min-h-[320px]" : "min-h-[200px]"
        }`}
      >
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
      </div>

      {/* Content Skeleton */}
      <div
        className={`relative z-10 p-6 h-full flex flex-col justify-between ${
          isLarge ? "min-h-[320px]" : "min-h-[200px]"
        }`}
      >
        <div>
          {/* Badges Skeleton */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 w-12 rounded-full" />
          </div>

          {/* Title Skeleton */}
          <Skeleton
            className={`h-6 w-3/4 mb-2 text-white ${
              isLarge ? "text-2xl" : "text-lg"
            }`}
          />
          <Skeleton
            className={`h-4 w-full mb-3 ${isLarge ? "text-base" : "text-sm"}`}
          />

          {/* Deal Code Skeleton */}
          <div className="flex items-center space-x-2 mb-3">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Bottom Actions Skeleton */}
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
      className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
      style={{ minHeight: 350 }}
    >
      <div className="absolute inset-0 bg-black/70 bg-opacity-40 z-9">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="absolute bottom-0 left-0 w-full z-99">
        <div className="p-4">
          {/* Route Skeleton */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <Skeleton className="h-6 w-12 mx-auto mb-1" />
            </div>
            <div className="flex-1 mx-3 relative">
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-4 w-4 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <Skeleton className="h-6 w-12 mx-auto mb-1" />
            </div>
          </div>
          <Skeleton className="h-4 w-32 mx-auto mb-3" />

          {/* Deal Info Skeleton */}
          <div className="bg-yellow-50/60 rounded-lg p-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-24 mt-1" />
          </div>

          <Skeleton className="h-8 w-full rounded" />
        </div>
      </div>
    </Card>
  );
};

const DealsPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("discount");
  const [currentPage, setCurrentPage] = useState(1);

  // States for "All Discount Codes" section
  const [allDealsSearchTerm, setAllDealsSearchTerm] = useState("");
  const [allDealsSortBy, setAllDealsSortBy] = useState("discount");
  const [allDealsCurrentPage, setAllDealsCurrentPage] = useState(1);
  const [allDealsFiltered, setAllDealsFiltered] = useState([]);
  const [allDealsDepartureAirport, setAllDealsDepartureAirport] =
    useState("all");
  const [allDealsArrivalAirport, setAllDealsArrivalAirport] = useState("all");

  // Airport data for filters
  const [airports, setAirports] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(false);

  // States for "Flash Sale Chuyến Bay" section
  const [flashSaleDeals, setFlashSaleDeals] = useState([]);
  const [flashSaleCurrentPage, setFlashSaleCurrentPage] = useState(1);

  const [flightDeals, setFlightDeals] = useState([]);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [filteredDeals, setFilteredDeals] = useState([]);
  const [flightLoading, setFlightLoading] = useState(true);

  // User loyalty information
  const [userLoyalty, setUserLoyalty] = useState(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);

  const itemsPerPage = 8;
  const allDealsItemsPerPage = 12; // More items per page for the modal

  // Fetch airports for filter dropdowns
  const fetchAirports = async () => {
    try {
      setAirportsLoading(true);
      const result = await airportApi.getAllAirports({
        size: 1000, // Get all airports
        sort: "airportName,asc",
      });
      if (result.success && result.data && result.data.content) {
        setAirports(result.data.content);
      }
    } catch (error) {
      console.error("Error fetching airports:", error);
    } finally {
      setAirportsLoading(false);
    }
  };

  useEffect(() => {
    const fetchFlightDeals = async () => {
      setFlightLoading(true);
      const res = await dealApi.getActiveDeals({
        page: 0,
        size: 100,
        sort: "createdAt,desc",
      });
      if (res.success && res.data && res.data.content) {
        const deals = res.data.content;
        setFlightDeals(deals);
      } else {
        setFlightDeals([]);
      }
      setFlightLoading(false);
    };
    fetchFlightDeals();
  }, []);

  // Fetch user loyalty information when user is logged in
  useEffect(() => {
    const fetchUserLoyalty = async () => {
      if (user) {
        setLoyaltyLoading(true);
        try {
          const loyaltyData = await loyaltyApi.getLoyaltyStats();
          setUserLoyalty(loyaltyData);
        } catch (error) {
          console.error("Error fetching user loyalty:", error);
          setUserLoyalty(null);
        } finally {
          setLoyaltyLoading(false);
        }
      } else {
        setUserLoyalty(null);
      }
    };

    fetchUserLoyalty();
  }, [user]);

  useEffect(() => {
    const searchLower = searchTerm.toLowerCase();
    let filtered = flightDeals.filter((deal) => {
      // Apply user-specific filtering
      if (!isDealApplicable(deal)) {
        return false;
      }

      return (
        deal.title.toLowerCase().includes(searchLower) ||
        deal.dealCode.toLowerCase().includes(searchLower) ||
        deal.description.toLowerCase().includes(searchLower)
      );
    });

    // Nếu có filterType khác "all", có thể mở rộng (giả sử API có category, hiện tại bỏ qua)
    if (filterType !== "all") {
      // filtered = filtered.filter(deal => deal.category === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "discount") {
        return b.discountPercentage - a.discountPercentage; // Giảm dần
      } else if (sortBy === "expiry") {
        return new Date(a.validTo) - new Date(b.validTo); // Gần hết hạn trước
      } else if (sortBy === "usage") {
        return a.remainingUsage - b.remainingUsage; // Remaining thấp trước (used nhiều)
      }
      return 0;
    });

    setFilteredDeals(filtered);
    setCurrentPage(1); // Reset page khi filter/sort thay đổi
  }, [flightDeals, searchTerm, filterType, sortBy, user, userLoyalty]);

  // Calculate featured deals from filtered deals - only show 3 deals with highest discount or closest to expiry
  useEffect(() => {
    if (filteredDeals.length > 0) {
      const sortedForFeatured = [...filteredDeals].sort((a, b) => {
        // First priority: highest discount percentage
        const discountDiff = b.discountPercentage - a.discountPercentage;
        if (discountDiff !== 0) return discountDiff;

        // Second priority: closest to expiry
        const dateDiff = new Date(a.validTo) - new Date(b.validTo);
        if (dateDiff !== 0) return dateDiff;

        // Third priority: lowest remaining usage (most used/popular)
        return a.remainingUsage - b.remainingUsage;
      });
      setFeaturedDeals(sortedForFeatured.slice(0, 3));
    } else {
      // If no deals match user's tier, show some deals anyway (public deals or deals for higher tiers)
      // This ensures featured deals section is not empty
      const fallbackDeals = flightDeals
        .filter((deal) => {
          // Filter out points deals
          if (
            deal.dealCode &&
            deal.dealCode.toUpperCase().startsWith("POINTS")
          ) {
            return false;
          }
          // Show public deals (treat null as false for boolean fields)
          const isGuestOnly = deal.isGuestOnly === true;
          const isLoyaltyExclusive = deal.isLoyaltyExclusive === true;
          return !isGuestOnly && !isLoyaltyExclusive;
        })
        .sort((a, b) => {
          // Sort by discount percentage descending
          return b.discountPercentage - a.discountPercentage;
        })
        .slice(0, 3);

      setFeaturedDeals(fallbackDeals);
    }
  }, [filteredDeals, flightDeals]);

  // Filter and sort for "All Discount Codes" section
  useEffect(() => {
    const searchLower = allDealsSearchTerm.toLowerCase();
    let filtered = flightDeals.filter((deal) => {
      // Filter out points redemption deals
      if (deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS")) {
        return false;
      }

      // Apply search filter
      const matchesSearch =
        deal.title.toLowerCase().includes(searchLower) ||
        deal.dealCode.toLowerCase().includes(searchLower) ||
        deal.description.toLowerCase().includes(searchLower);

      // Apply departure airport filter
      const matchesDeparture =
        allDealsDepartureAirport === "all" ||
        deal.departureAirportId === parseInt(allDealsDepartureAirport);

      // Apply arrival airport filter
      const matchesArrival =
        allDealsArrivalAirport === "all" ||
        deal.arrivalAirportId === parseInt(allDealsArrivalAirport);

      return matchesSearch && matchesDeparture && matchesArrival;
    });

    // Sort
    filtered.sort((a, b) => {
      if (allDealsSortBy === "discount") {
        return b.discountPercentage - a.discountPercentage; // Giảm dần
      } else if (allDealsSortBy === "expiry") {
        return new Date(a.validTo) - new Date(b.validTo); // Gần hết hạn trước
      } else if (allDealsSortBy === "usage") {
        return a.remainingUsage - b.remainingUsage; // Remaining thấp trước (used nhiều)
      }
      return 0;
    });

    setAllDealsFiltered(filtered);
    setAllDealsCurrentPage(1); // Reset page khi filter/sort thay đổi
  }, [
    flightDeals,
    allDealsSearchTerm,
    allDealsSortBy,
    allDealsDepartureAirport,
    allDealsArrivalAirport,
  ]);

  // Fetch airports on component mount
  useEffect(() => {
    fetchAirports();
  }, []);

  // Filter and sort for "Flash Sale Chuyến Bay" section - show deals with airport information
  useEffect(() => {
    let filtered = flightDeals.filter((deal) => {
      // Filter out points redemption deals
      if (deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS")) {
        return false;
      }

      // Show deals that have airport information (departure and arrival airports are not null/undefined)
      return (
        deal.departureAirportId !== null &&
        deal.departureAirportId !== undefined &&
        deal.departureAirportName &&
        deal.departureAirportCode &&
        deal.arrivalAirportId !== null &&
        deal.arrivalAirportId !== undefined &&
        deal.arrivalAirportName &&
        deal.arrivalAirportCode
      );
    });

    // Sort by discount percentage descending
    filtered.sort((a, b) => b.discountPercentage - a.discountPercentage);

    setFlashSaleDeals(filtered);
    setFlashSaleCurrentPage(1); // Reset page
  }, [flightDeals]);

  // Function to check if a deal is applicable for current user
  const isDealApplicable = (deal) => {
    // Filter out points redemption deals
    if (deal.dealCode && deal.dealCode.toUpperCase().startsWith("POINTS")) {
      return false;
    }

    // Helper function to treat null as false for boolean fields
    const isGuestOnly = deal.isGuestOnly === true;
    const isLoyaltyExclusive = deal.isLoyaltyExclusive === true;

    // If user is not logged in
    if (!user) {
      // Show guest-only deals or public deals (not loyalty exclusive)
      return isGuestOnly || (!isGuestOnly && !isLoyaltyExclusive);
    }

    // If user is logged in, show all applicable deals
    if (user) {
      // Don't show guest-only deals
      if (isGuestOnly) {
        return false;
      }

      // If deal is loyalty exclusive, check user's tier
      if (isLoyaltyExclusive && deal.requiredLoyaltyTier) {
        const userTier = userLoyalty?.currentTier || "STANDARD";
        const tierHierarchy = { STANDARD: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
        const userTierLevel = tierHierarchy[userTier] || 0;
        const requiredTierLevel = tierHierarchy[deal.requiredLoyaltyTier] || 0;

        // Allow user to see deals for their tier and lower tiers
        // For STANDARD users, show STANDARD deals
        // For SILVER users, show STANDARD and SILVER deals
        // etc.
        return userTierLevel >= requiredTierLevel;
      }

      // Show public deals (not guest-only and not loyalty exclusive)
      return !isGuestOnly && !isLoyaltyExclusive;
    }

    return false;
  };

  // Function to get deal type badge
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
        SILVER: "bg-gray-50 text-gray-700 border-gray-200",
        GOLD: "bg-yellow-50 text-yellow-700 border-yellow-200",
        PLATINUM: "bg-purple-50 text-purple-700 border-purple-200",
      };

      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1 ${
            tierColors[deal.requiredLoyaltyTier] ||
            "bg-green-50 text-green-700 border-green-200"
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
        className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
      >
        <Users className="h-3 w-3" />
        Tất cả
      </Badge>
    );
  };

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDeals = filteredDeals.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const allDealsTotalPages = Math.ceil(
    allDealsFiltered.length / allDealsItemsPerPage
  );
  const allDealsStartIndex = (allDealsCurrentPage - 1) * allDealsItemsPerPage;
  const allDealsPaginated = allDealsFiltered.slice(
    allDealsStartIndex,
    allDealsStartIndex + allDealsItemsPerPage
  );

  const flashSaleTotalPages = Math.ceil(flashSaleDeals.length / itemsPerPage);
  const flashSaleStartIndex = (flashSaleCurrentPage - 1) * itemsPerPage;
  const flashSalePaginated = flashSaleDeals.slice(
    flashSaleStartIndex,
    flashSaleStartIndex + itemsPerPage
  );

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    // You can add a toast notification here
  };

  const getDaysRemaining = (validUntil) => {
    const today = new Date();
    const endDate = new Date(validUntil);
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <>
      <SEO
        title="Ưu Đãi Bay"
        description="Tìm kiếm và lựa chọn các ưu đãi phù hợp cho từng chuyến bay của bạn."
        keywords="tìm kiếm chuyến bay, so sánh vé máy bay, đặt vé máy bay"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-500 dark:via-gray-600 dark:to-gray-700">
        {/* Hero Banner */}
        <section className="relative bg-gradient-to-b from-purple-200 via-blue-600 to-cyan-600 text-white py-24 pb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container flex px-16 justify-between flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-6">Khuyến Mãi & Ưu Đãi</h1>
              <p className="text-sm mb-8 max-w-3xl mx-auto">
                Khám phá những deal bay tuyệt vời với mã giảm giá độc quyền, ưu
                đãi flash sale và các chương trình khuyến mãi hấp dẫn
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 max-w-6xl py-16">
          {/* Featured Deals Section - Sử dụng featuredDeals (3 deals được ưu tiên) */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
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
                <div className="col-span-3 text-center py-12 text-gray-500">
                  Không có ưu đãi nào phù hợp với bạn
                </div>
              ) : (
                featuredDeals.map((deal, index) => (
                  <Card
                    key={deal.dealId}
                    className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-500 ${
                      index === 0 ? "lg:col-span-2 lg:row-span-2" : ""
                    }`}
                  >
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${deal.thumbnail})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                    </div>
                    {/* Content */}
                    <div
                      className={`relative z-10 p-6 h-full flex flex-col justify-between ${
                        index === 0 ? "min-h-[320px]" : "min-h-[200px]"
                      }`}
                    >
                      <div>
                        {/* Badges */}
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
                          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-bold text-lg">
                            -{deal.discountPercentage}%
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h3
                          className={`font-bold text-white mb-2 ${
                            index === 0 ? "text-2xl" : "text-lg"
                          }`}
                        >
                          {deal.title}
                        </h3>
                        <p
                          className={`text-white/90 mb-3 ${
                            index === 0 ? "text-base" : "text-sm"
                          }`}
                        >
                          {deal.description}
                        </p>

                        {/* Deal Code */}
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

                      {/* Bottom Actions */}
                      <div className="flex items-center justify-between">
                        <div className="text-white/80 text-sm">
                          Áp dụng đơn từ{" "}
                          {deal.minimumOrderAmount
                            ? formatCurrencyVND(deal.minimumOrderAmount)
                            : "-"}
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

          {/* All Discount Codes Modal Section - Sử dụng toàn bộ flightDeals */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
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
                  <Button variant="outline" className="font-semibold">
                    <Eye className="w-4 h-4 mr-2" />
                    Xem tất cả mã
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-full sm:w-[540px] md:w-[720px] lg:w-[900px] xl:w-[1000px] h-screen overflow-y-auto p-0 sm:max-w-none z-[9999]"
                  style={{ zIndex: 9999 }}
                >
                  <div className="p-6">
                    <SheetHeader className="mb-6">
                      <SheetTitle className="text-2xl font-bold">
                        Tất cả mã giảm giá
                      </SheetTitle>
                      <SheetDescription className="text-gray-600">
                        Danh sách đầy đủ các mã giảm giá hiện có
                      </SheetDescription>
                    </SheetHeader>

                    {/* Filter and Sort Controls */}
                    <div className="space-y-4 mb-6">
                      {/* Search and Sort Row */}
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Tìm kiếm mã giảm giá..."
                              value={allDealsSearchTerm}
                              onChange={(e) =>
                                setAllDealsSearchTerm(e.target.value)
                              }
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-gray-700 font-medium whitespace-nowrap">
                              Sắp xếp:
                            </label>
                            <Select
                              value={allDealsSortBy}
                              onValueChange={setAllDealsSortBy}
                            >
                              <SelectTrigger className="w-48 h-10">
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
                      </div>

                      {/* Airport Filters Row */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-gray-700 font-medium whitespace-nowrap">
                            Điểm đi:
                          </label>
                          <Select
                            value={allDealsDepartureAirport}
                            onValueChange={setAllDealsDepartureAirport}
                          >
                            <SelectTrigger className="w-48 h-10">
                              <SelectValue placeholder="Chọn điểm đi" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="all">Tất cả</SelectItem>
                              {airports.map((airport) => (
                                <SelectItem
                                  key={airport.airportId}
                                  value={airport.airportId.toString()}
                                >
                                  {airport.airportCode} - {airport.airportName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <label className="text-gray-700 font-medium whitespace-nowrap">
                            Điểm đến:
                          </label>
                          <Select
                            value={allDealsArrivalAirport}
                            onValueChange={setAllDealsArrivalAirport}
                          >
                            <SelectTrigger className="w-48 h-10">
                              <SelectValue placeholder="Chọn điểm đến" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="all">Tất cả</SelectItem>
                              {airports.map((airport) => (
                                <SelectItem
                                  key={airport.airportId}
                                  value={airport.airportId.toString()}
                                >
                                  {airport.airportCode} - {airport.airportName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clear Filters Button */}
                        {(allDealsSearchTerm ||
                          allDealsDepartureAirport !== "all" ||
                          allDealsArrivalAirport !== "all") && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAllDealsSearchTerm("");
                              setAllDealsDepartureAirport("all");
                              setAllDealsArrivalAirport("all");
                            }}
                            className="ml-auto"
                          >
                            Xóa bộ lọc
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Results Summary */}
                    <div className="mb-4 text-sm text-gray-600">
                      Hiển thị {allDealsPaginated.length} /{" "}
                      {allDealsFiltered.length} mã giảm giá
                      {(allDealsSearchTerm ||
                        allDealsDepartureAirport !== "all" ||
                        allDealsArrivalAirport !== "all") && (
                        <span className="ml-2">
                          (đã lọc theo:{" "}
                          {[
                            allDealsSearchTerm &&
                              `từ khóa "${allDealsSearchTerm}"`,
                            allDealsDepartureAirport !== "all" &&
                              `điểm đi: ${
                                airports.find(
                                  (a) =>
                                    a.airportId ===
                                    parseInt(allDealsDepartureAirport)
                                )?.airportCode
                              }`,
                            allDealsArrivalAirport !== "all" &&
                              `điểm đến: ${
                                airports.find(
                                  (a) =>
                                    a.airportId ===
                                    parseInt(allDealsArrivalAirport)
                                )?.airportCode
                              }`,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                          )
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {allDealsPaginated.map((deal) => (
                        <Card
                          key={deal.dealId}
                          className="p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                              {deal.dealCode}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              -{deal.discountPercentage}%
                            </Badge>
                          </div>

                          {/* Route Information */}
                          {deal.departureAirportCode &&
                            deal.arrivalAirportCode && (
                              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {deal.departureAirportCode} →{" "}
                                  {deal.arrivalAirportCode}
                                </span>
                              </div>
                            )}

                          <p className="text-gray-700 mb-2 text-sm">
                            {deal.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Hết hạn: {formatDateVN(deal.validTo)}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(deal.dealCode)}
                              className="text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Sao chép
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination for All Deals */}
                    {allDealsTotalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllDealsCurrentPage((prev) =>
                              Math.max(prev - 1, 1)
                            )
                          }
                          disabled={allDealsCurrentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Trước
                        </Button>

                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: allDealsTotalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <Button
                              key={page}
                              variant={
                                allDealsCurrentPage === page
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setAllDealsCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAllDealsCurrentPage((prev) =>
                              Math.min(prev + 1, allDealsTotalPages)
                            )
                          }
                          disabled={allDealsCurrentPage === allDealsTotalPages}
                        >
                          Sau
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Quick preview of discount codes - Sử dụng allDealsFiltered */}
            <Swiper
              modules={[Autoplay]}
              spaceBetween={30}
              slidesPerView={4}
              loop={true}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                320: { slidesPerView: 2 },
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 4 },
              }}
              className="deals-slider"
            >
              {allDealsFiltered.slice(0, 8).map((deal, index) => (
                <SwiperSlide
                  key={index}
                  className="p-4 hover:shadow-md transition-shadow border-1 border-gray-200 rounded-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono font-bold">
                      {deal.dealCode}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      -{deal.discountPercentage}%
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm">
                    {deal.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-300">
                      Hết hạn: {formatDateVN(deal.validTo)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(deal.dealCode)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Sao chép
                    </Button>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          {/* Flight Deals Section - Sử dụng paginated filteredDeals */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  ✈️ Flash Sale Chuyến Bay
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Giá vé ưu đãi có thời hạn - Đặt ngay kẻo lỡ!
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {/* Filter Controls - Bổ sung phần lọc */}
                <section className="mb-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <label className="text-gray-700 dark:text-gray-300 font-medium">
                        Sắp xếp theo:
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-48 h-10 bg-white dark:bg-gray-800">
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
                    {/* Nếu API có category, có thể thêm filterType select ở đây */}
                  </div>
                </section>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {flightLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <DealCardSkeletonGrid key={index} />
                ))
              ) : flashSalePaginated.length === 0 ? (
                <div className="col-span-4 text-center py-12 text-gray-500">
                  Không có ưu đãi chuyến bay nào
                </div>
              ) : (
                flashSalePaginated.map((deal) => (
                  <Card
                    key={deal.dealId}
                    className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                    style={{
                      backgroundImage: `url(${deal.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      minHeight: 350, // hoặc chiều cao bạn muốn
                    }}
                  >
                    <div className="absolute inset-0 bg-black/70 bg-opacity-40 z-9"></div>
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full font-bold text-xs z-10">
                      -{deal.discountPercentage}%
                    </div>
                    <div className="absolute bottom-0 left-0 w-full z-99">
                      {/* Discount Badge */}

                      <div className="p-4">
                        {/* Route */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">
                              {deal.departureAirportCode || "FRO"}
                            </div>
                          </div>
                          <div className="flex-1 mx-3 relative">
                            <div className="h-px bg-gray-300"></div>
                            <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 bg-white rounded-full dark:bg-gray-900" />
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">
                              {deal.arrivalAirportCode || "TO"}
                            </div>
                          </div>
                        </div>
                        <div className="text-center text-gray-600 mb-3 text-sm">
                          {deal.departureAirportName && deal.arrivalAirportName
                            ? `${deal.departureAirportName || "FRO"} → ${
                                deal.arrivalAirportName || "TO"
                              }`
                            : ""}
                        </div>

                        {/* Deal Info */}
                        <div className="bg-yellow-50/60 rounded-lg p-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-yellow-800">
                              Mã: {deal.dealCode}
                            </span>
                            <span className="text-yellow-600">
                              {deal.remainingUsage !== undefined
                                ? `Còn ${deal.remainingUsage} lượt`
                                : null}
                            </span>
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            Hết hạn:{" "}
                            {deal.validTo ? formatDateVN(deal.validTo) : "-"}
                          </div>
                        </div>

                        <div className="w-full ">
                          <Link
                            to="/flights"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 p-6 flex items-center justify-center"
                          >
                            Đặt ngay với giá ưu đãi
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {flashSaleTotalPages > 1 && (
              <div className="flex items-center justify-end space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFlashSaleCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={flashSaleCurrentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: flashSaleTotalPages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={
                        flashSaleCurrentPage === page ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setFlashSaleCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFlashSaleCurrentPage((prev) =>
                      Math.min(prev + 1, flashSaleTotalPages)
                    )
                  }
                  disabled={flashSaleCurrentPage === flashSaleTotalPages}
                >
                  Sau
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
