"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { bookingApi } from "@/apis/booking-api";
import { flightApi } from "@/apis/flight-api";
import { dealApi } from "@/apis/deal-api";
import { pointsApi } from "@/apis/points-api";
import { loyaltyApi } from "@/apis/loyalty-api";
import { handleFetch } from "@/utils/fetch-helper";
import { toast } from "sonner";
import PropTypes from "prop-types";
import { processExtrasDataForBooking } from "@/components/section/flight/extras-section";
import { formatCurrencyVND, formatDateTimeVN } from "@/utils/currency-utils";
import { getPassengerMultiplier } from "@/utils/flight-booking-utils";
import countries from "world-countries";

// Baggage packages definition (matching extras-section)
const BAGGAGE_PACKAGES = {
  NONE: { weight: 0, price: 0, label: "Không chọn" },
  KG_15: { weight: 15, price: 200000, label: "15kg" },
  KG_20: { weight: 20, price: 300000, label: "20kg" },
  KG_25: { weight: 25, price: 400000, label: "25kg" },
  KG_30: { weight: 30, price: 500000, label: "30kg" },
};

// Helper functions
const calculateDuration = (departureDateTime, arrivalDateTime) => {
  if (!departureDateTime || !arrivalDateTime) return "N/A";
  const departure = new Date(departureDateTime);
  const arrival = new Date(arrivalDateTime);
  const diffMs = arrival - departure;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMinutes}m`;
};

const formatDateTime = (dateTime) => {
  if (!dateTime) return { date: "N/A", time: "N/A" };
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString("vi-VN"),
    time: date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

// Helper function to get airport display name
const getAirportDisplayName = (airport, flight) => {
  if (!airport) {
    // Fallback to flight data if available
    if (flight?.departureAirport?.airportName)
      return flight.departureAirport.airportName;
    if (flight?.arrivalAirport?.airportName)
      return flight.arrivalAirport.airportName;
    return "N/A";
  }

  // Try multiple properties to get the best name
  return (
    airport.airportName ||
    airport.city ||
    airport.name ||
    airport.airport ||
    "Sân bay"
  );
};

// Helper function to get city name
const getCityDisplayName = (location, flight) => {
  if (!location) {
    // Fallback to flight data
    if (flight?.departureAirport?.city) return flight.departureAirport.city;
    if (flight?.arrivalAirport?.city) return flight.arrivalAirport.city;
    return "N/A";
  }

  return (
    location.city ||
    location.cityName ||
    location.airportName ||
    location.name ||
    "Thành phố"
  );
};

// Helper function to get aircraft name
const getAircraftDisplayName = (aircraft, flight) => {
  if (!aircraft) {
    // Fallback to flight data
    if (flight?.aircraft?.aircraftName) return flight.aircraft.aircraftName;
    if (flight?.aircraftName) return flight.aircraftName;
    return "N/A";
  }

  if (typeof aircraft === "string") return aircraft;

  return aircraft.aircraftName || aircraft.name || aircraft.model || "Máy bay";
};

// Helper function to get airline display name
const getAirlineDisplayName = (airline) => {
  if (!airline) return "N/A";
  if (typeof airline === "string") return airline;
  return airline.airlineName || airline.name || "Unknown Airline";
};

const Payment = ({ formData, extrasData, flight, fare }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get authenticated user

  // Determine if this is an international flight
  const isInternationalFlight =
    flight?.type === "INTERNATIONAL" ||
    flight?.flightType === "INTERNATIONAL" ||
    fare?.flightType === "INTERNATIONAL" ||
    false;

  // Helper function to convert time to ISO format for backend
  const formatTimeForBackend = (time, date = null) => {
    if (!time) return null;

    // If already in ISO format, return as is
    if (time.includes("T") && time.includes(":")) {
      return time;
    }

    // If just time (HH:MM), combine with date
    if (time.match(/^\d{2}:\d{2}$/)) {
      let isoDate = date;

      // Handle invalid dates or "N/A" values
      if (!date || date === "N/A" || date === "undefined") {
        isoDate = new Date().toISOString().split("T")[0];
      } else if (date && date.includes("/")) {
        // Convert date from DD/MM/YYYY to YYYY-MM-DD format if needed
        const [day, month, year] = date.split("/");
        isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      return `${isoDate}T${time}:00`;
    }

    return time;
  };

  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolderName: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "Vietnam",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("card");
  const [saveCard, setSaveCard] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("IMMEDIATE"); // IMMEDIATE or LATER
  const [showOutboundDetails, setShowOutboundDetails] = useState(true);
  const [showReturnDetails, setShowReturnDetails] = useState(true);
  const [allAvailableSeats, setAllAvailableSeats] = useState([]);
  const [autoAssignedSeats, setAutoAssignedSeats] = useState({});
  const [seatDetails, setSeatDetails] = useState({}); // Store seat details with price info

  // Deal code states
  const [dealCode, setDealCode] = useState("");
  const [dealDiscount, setDealDiscount] = useState(0);
  const [dealApplied, setDealApplied] = useState(false);
  const [dealError, setDealError] = useState("");
  const [applyingDeal, setApplyingDeal] = useState(false);
  const [appliedDealInfo, setAppliedDealInfo] = useState(null); // Store deal details

  // Points redemption states
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [pointsApplied, setPointsApplied] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [redeemingPoints, setRedeemingPoints] = useState(false);
  const [pointsRates, setPointsRates] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [canRedeem, setCanRedeem] = useState(false);
  const [membershipCodeForPoints, setMembershipCodeForPoints] = useState(0); // Number of points used from membership

  // Membership tier state
  const [userMembershipTier, setUserMembershipTier] = useState("STANDARD");

  // Load available seats on component mount
  useEffect(() => {
    const loadAvailableSeats = async () => {
      try {
        // Get flight data from localStorage if available
        const selectedFlight = JSON.parse(
          localStorage.getItem("selectedFlight") || "{}"
        );
        const flightData = selectedFlight.flight || flight;

        const flightId =
          flightData.id || flightData.flightId || flight.id || flight.flightId;
        const classId =
          flightData.selectedClass?.id || fare?.travelClass?.classId;

        if (!flightId || !classId) {
          console.warn("Missing flight ID or travel class ID for seat loading");
          return;
        }

        // Get available seats from API
        const seatsResponse =
          await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
            flightId,
            classId
          );

        if (seatsResponse.success) {
          // Filter only available seats
          const availableSeats = seatsResponse.data.filter(
            (seat) => seat.status === "AVAILABLE"
          );
          setAllAvailableSeats(availableSeats);
        }
      } catch (error) {
        console.error("Error loading available seats:", error);
      }
    };

    loadAvailableSeats();
  }, [flight, fare]);

  // Load points redemption rates and user points
  useEffect(() => {
    const loadPointsData = async () => {
      const hasMembershipPoints = formData.passengers.some(
        (p) => p.membershipData?.valid
      );

      // Load points rates if user is logged in OR has valid membership
      if (!user?.id && !hasMembershipPoints) return;

      try {
        // Load points rates
        const ratesResponse = await pointsApi.getPointsRedemptionRates();
        if (ratesResponse.success) {
          setPointsRates(ratesResponse.data);
          console.log("🎁 Points Rates Loaded:", ratesResponse.data);
        }

        // Calculate total points (user loyalty points + membership points)
        let totalUserPoints = user?.loyaltyPoints || 0;

        // Add membership points from valid membership codes
        const membershipPoints = formData.passengers
          .filter(
            (p) =>
              p.membershipData?.valid && p.membershipData?.currentPoints >= 0
          )
          .reduce((sum, p) => sum + (p.membershipData.currentPoints || 0), 0);

        totalUserPoints += membershipPoints;
        setUserPoints(totalUserPoints);

        console.log("🎁 Points Calculation:", {
          userLoyalty: user?.loyaltyPoints || 0,
          membershipPoints,
          totalUserPoints,
        });
      } catch (error) {
        console.error("Error loading points data:", error);
      }
    };

    loadPointsData();
  }, [user, formData.passengers]);

  // Load membership tier from user object or loyalty API
  useEffect(() => {
    const loadMembershipTier = async () => {
      if (!user?.id) {
        setUserMembershipTier("STANDARD");
        return;
      }

      // First try to get from user object (from auth API)
      const userTier = user?.loyaltyTier || user?.membershipTier || user?.tier;
      if (userTier) {
        console.log("🔍 Using membership tier from user object:", userTier);
        setUserMembershipTier(userTier);
        return;
      }

      // Fallback to loyalty API
      try {
        console.log(
          "🔍 Loading membership tier from loyalty API for user:",
          user.id
        );
        const loyaltyStats = await loyaltyApi.getLoyaltyStats();
        console.log("🔍 Loyalty stats response:", loyaltyStats);

        // Assuming the API returns tier information
        const tier =
          loyaltyStats.tier ||
          loyaltyStats.membershipTier ||
          loyaltyStats.level ||
          loyaltyStats.loyaltyTier ||
          "STANDARD";
        console.log("🔍 Extracted tier from loyalty stats:", {
          tier,
          loyaltyStatsTier: loyaltyStats.tier,
          loyaltyStatsMembershipTier: loyaltyStats.membershipTier,
          loyaltyStatsLevel: loyaltyStats.level,
          loyaltyStatsLoyaltyTier: loyaltyStats.loyaltyTier,
          fullResponse: loyaltyStats,
        });
        setUserMembershipTier(tier);
        console.log("🔍 Set membership tier to:", tier);
      } catch (error) {
        console.error("❌ Error loading membership tier:", error);
        setUserMembershipTier("STANDARD"); // Fallback to STANDARD
      }
    };

    loadMembershipTier();
  }, [user?.id, user?.loyaltyTier, user?.membershipTier, user?.tier]);

  // Calculate totals from real data - FIXED: Base price is adult price for the journey
  const calculatePassengerTotal = () => {
    // fare.price is the adult price for the entire journey (including all segments)
    const baseAdultPrice = fare?.price || fare?.basePrice || 0;

    return formData.passengers.reduce((total, p) => {
      const multiplier = getPassengerMultiplier(p.type);
      return total + baseAdultPrice * multiplier;
    }, 0);
  };

  // Calculate total amount by summing all components
  const totalAmount = () => {
    // Base passenger price - fare.price is adult price for entire journey
    const baseAdultPrice = fare?.price || fare?.basePrice || 0;

    const passengerTotal = formData.passengers.reduce((total, p) => {
      const multiplier = getPassengerMultiplier(p.type);
      return total + baseAdultPrice * multiplier;
    }, 0);

    // Add extras
    const seatTotal = extrasData?.seatTotal || 0;
    const returnSeatTotal =
      flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
        ? extrasData?.returnSeatTotal || 0
        : 0;
    const baggageTotal = extrasData?.baggageTotal || 0;
    const servicesTotal = extrasData?.servicesTotal || 0;
    const ancillaryServicesTotal = extrasData?.ancillaryServicesTotal || 0;

    return (
      passengerTotal +
      seatTotal +
      returnSeatTotal +
      baggageTotal +
      servicesTotal +
      ancillaryServicesTotal
    );
  };

  // Get the total amount (call as function since it's now a function)
  const currentTotalAmount = totalAmount();

  // Calculate membership discount based on user tier
  const calculateMembershipDiscount = () => {
    if (!user?.id) {
      console.log("🔍 Membership discount: User not logged in");
      return 0; // Only for logged-in users
    }

    console.log("🔍 Full user object:", user);
    console.log("🔍 User membership tier from state:", userMembershipTier);

    const membershipTier =
      user.loyaltyTier ||
      user.membershipTier ||
      user.tier ||
      userMembershipTier ||
      "STANDARD";
    console.log("🔍 Membership discount calculation:", {
      userId: user.id,
      membershipTier,
      userMembershipTier,
      userMembershipTierFromState: userMembershipTier,
      userMembershipTierFromUser: user?.membershipTier,
      userTier: user?.tier,
      userMembership: user?.membership,
      userLoyaltyTier: user?.loyaltyTier,
      currentTotalAmount,
    });

    const discountRates = {
      STANDARD: 0,
      SILVER: 0.02, // 2%
      GOLD: 0.03, // 3%
      PLATINUM: 0.05, // 5%
    };

    const rate = discountRates[membershipTier] || 0;
    const discount = Math.round(currentTotalAmount * rate);

    console.log("🔍 Membership discount result:", {
      tier: membershipTier,
      rate,
      discount,
      finalAmount: currentTotalAmount - discount,
    });

    return discount;
  };

  const membershipDiscount = calculateMembershipDiscount();

  const handleCardChange = (field, value) => {
    setCardDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBillingChange = (field, value) => {
    setBillingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Deal code handlers
  const handleApplyDeal = async () => {
    if (!dealCode.trim()) {
      setDealError("Vui lòng nhập mã giảm giá");
      return;
    }

    setApplyingDeal(true);
    setDealError("");

    try {
      console.log("🔍 Checking deal code:", dealCode);

      // First, get deal info by code
      const dealResponse = await dealApi.getDealByCode(dealCode.trim());

      if (!dealResponse.success) {
        setDealError("Mã giảm giá không tồn tại");
        setDealDiscount(0);
        setDealApplied(false);
        setAppliedDealInfo(null);
        return;
      }

      const dealData = dealResponse.data;
      console.log("📋 Deal data:", dealData);

      // Check if deal is active
      if (!dealData.isActive) {
        setDealError("Mã giảm giá đã ngừng hoạt động");
        setDealDiscount(0);
        setDealApplied(false);
        setAppliedDealInfo(null);
        return;
      }

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(dealData.validFrom);
      const validTo = new Date(dealData.validTo);

      if (now < validFrom || now > validTo) {
        setDealError("Mã giảm giá đã hết hạn hoặc chưa có hiệu lực");
        setDealDiscount(0);
        setDealApplied(false);
        setAppliedDealInfo(null);
        return;
      }

      // Check if deal has airport restrictions and if they match the current flight
      if (dealData.departureAirportCode && dealData.arrivalAirportCode) {
        // Deal has airport restrictions, check if they match the current flight
        const flightDepartureAirportCode =
          flight?.flight?.departureAirport?.code ||
          flight?.departureAirportCode;
        const flightArrivalAirportCode =
          flight?.flight?.arrivalAirport?.code || flight?.arrivalAirportCode;

        console.log("🔍 Deal airport check:", {
          dealDeparture: dealData.departureAirportCode,
          dealArrival: dealData.arrivalAirportCode,
          flightDeparture: flightDepartureAirportCode,
          flightArrival: flightArrivalAirportCode,
          flight: flight,
        });

        if (
          dealData.departureAirportCode !== flightDepartureAirportCode ||
          dealData.arrivalAirportCode !== flightArrivalAirportCode
        ) {
          setDealError(
            "Deal này hiện không khả dụng cho chuyến bay này hoặc không tồn tại"
          );
          setDealDiscount(0);
          setDealApplied(false);
          setAppliedDealInfo(null);
          return;
        }
      }

      // Check if user can use this deal (if logged in)
      if (user) {
        try {
          const canUseResponse = await dealApi.canUserUseDeal(dealCode.trim());
          if (!canUseResponse.success) {
            setDealError(
              canUseResponse.message || "Bạn không thể sử dụng mã giảm giá này"
            );
            setDealDiscount(0);
            setDealApplied(false);
            setAppliedDealInfo(null);
            return;
          }

          // Check if user has already used this deal code
          const usageHistoryResponse = await dealApi.getMyDealUsageHistory();
          if (usageHistoryResponse.success && usageHistoryResponse.data) {
            const hasUsedDeal = usageHistoryResponse.data.content?.some(
              (usage) => usage.dealCode === dealCode.trim()
            );

            if (hasUsedDeal) {
              setDealError(
                "Bạn đã sử dụng mã giảm giá này rồi. Mỗi mã chỉ được sử dụng 1 lần."
              );
              setDealDiscount(0);
              setDealApplied(false);
              setAppliedDealInfo(null);
              return;
            }
          }
        } catch (error) {
          console.warn("Could not check user eligibility for deal:", error);
          // Continue if API call fails (maybe user not logged in)
        }
      }

      // Calculate discount
      const baseAmount = extrasData?.total || calculatePassengerTotal();

      // Check minimum order amount
      if (
        dealData.minimumOrderAmount &&
        baseAmount < dealData.minimumOrderAmount
      ) {
        setDealError(
          `Đơn hàng phải tối thiểu ${formatCurrencyVND(
            dealData.minimumOrderAmount
          )} để sử dụng mã này`
        );
        setDealDiscount(0);
        setDealApplied(false);
        setAppliedDealInfo(null);
        return;
      }

      // Calculate discount amount
      let discountAmount = (baseAmount * dealData.discountPercentage) / 100;

      // Apply maximum discount limit if set
      if (dealData.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, dealData.maxDiscountAmount);
      }

      // Ensure discount doesn't exceed base amount
      discountAmount = Math.min(discountAmount, baseAmount);

      console.log("💰 Discount calculation:", {
        baseAmount,
        discountPercentage: dealData.discountPercentage,
        calculatedDiscount: discountAmount,
        maxDiscountAmount: dealData.maxDiscountAmount,
      });

      setDealDiscount(discountAmount);
      setDealApplied(true);
      setDealError("");
      setAppliedDealInfo(dealData);

      // Allow both deal and points to be used together
      // Removed: Reset points when applying deal

      toast.success(
        `Đã áp dụng mã giảm giá ${dealCode} - Giảm ${formatCurrencyVND(
          discountAmount
        )}`
      );
    } catch (error) {
      console.error("Error applying deal:", error);
      setDealError("Có lỗi xảy ra khi kiểm tra mã giảm giá");
      setDealDiscount(0);
      setDealApplied(false);
      setAppliedDealInfo(null);
    } finally {
      setApplyingDeal(false);
    }
  };

  const handleRemoveDeal = () => {
    setDealCode("");
    setDealDiscount(0);
    setDealApplied(false);
    setDealError("");
    setAppliedDealInfo(null);
    toast.info("Đã hủy áp dụng mã giảm giá");
  };

  // Points redemption handlers
  const handlePointsChange = async (value) => {
    const points = parseInt(value) || 0;
    setPointsToRedeem(value);

    // Reset states
    setCanRedeem(false);
    setPointsDiscount(0);
    setPointsError("");

    if (points < 500 && points > 0) {
      setPointsError(
        `Cần tối thiểu 500 điểm để đổi (hiện tại: ${points} điểm)`
      );
      return;
    }

    if (points >= 500) {
      try {
        let canRedeemResult = false;
        let discountAmount = 0;
        let availablePoints = 0;

        // Check if we have membership code to use
        const membershipPassenger = formData.passengers.find(
          (p) => p.membershipCode && p.membershipData?.valid
        );

        if (membershipPassenger && !user) {
          // Use membership-based points
          availablePoints =
            membershipPassenger.membershipData?.currentPoints || 0;

          // Kiểm tra điểm có đủ không
          if (points > availablePoints) {
            setPointsError(
              `Số điểm không đủ. Bạn chỉ có ${availablePoints.toLocaleString()} điểm từ hội viên ${
                membershipPassenger.membershipCode
              }`
            );
            return;
          }

          const discountResponse =
            await pointsApi.calculateDiscountFromPointsByMembership(
              membershipPassenger.membershipCode,
              points
            );

          if (discountResponse.success) {
            canRedeemResult = true;
            discountAmount = discountResponse.data;
          }
        } else if (user) {
          // Use user account points
          availablePoints = userPoints;

          // Kiểm tra điểm có đủ không
          if (points > availablePoints) {
            setPointsError(
              `Số điểm không đủ. Bạn chỉ có ${availablePoints.toLocaleString()} điểm trong tài khoản`
            );
            return;
          }

          // Check if user can redeem
          const canRedeemResponse = await pointsApi.canRedeemPoints(
            user.id,
            points
          );
          canRedeemResult = canRedeemResponse.success && canRedeemResponse.data;

          // Calculate discount
          const discountResponse = await pointsApi.calculateDiscountFromPoints(
            points
          );
          if (discountResponse.success) {
            discountAmount = discountResponse.data;
          }
        } else {
          setPointsError(
            "Vui lòng đăng nhập hoặc nhập mã hội viên để sử dụng điểm"
          );
          return;
        }

        // Kiểm tra để tránh giảm giá vượt quá tổng tiền
        const maxDiscount = currentTotalAmount - dealDiscount;
        if (discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
          const maxPoints = Math.floor(
            maxDiscount * (pointsRates?.pointsPerVND || 100)
          );
          setPointsError(
            `Số điểm tối đa có thể đổi cho đơn hàng này là ${maxPoints.toLocaleString()} điểm (${formatCurrencyVND(
              maxDiscount
            )})`
          );
          canRedeemResult = false;
        }

        setCanRedeem(canRedeemResult);
        setPointsDiscount(discountAmount);
      } catch (error) {
        console.error("Error calculating points discount:", error);
        setCanRedeem(false);
        setPointsDiscount(0);
        setPointsError("Lỗi khi tính toán điểm");
      }
    }
  };

  const handleRedeemPoints = async () => {
    if (!pointsToRedeem || !canRedeem) return;

    setRedeemingPoints(true);
    try {
      let discountResponse;

      // Check if we have membership code to use for points calculation
      const membershipPassenger = formData.passengers.find(
        (p) =>
          p.membershipCode &&
          p.membershipData?.valid &&
          p.membershipData?.currentPoints >= parseInt(pointsToRedeem)
      );

      if (membershipPassenger && !user) {
        // Use membership-based calculation for guest users
        discountResponse =
          await pointsApi.calculateDiscountFromPointsByMembership(
            membershipPassenger.membershipCode,
            parseInt(pointsToRedeem)
          );

        // Store membership points used for backend
        setMembershipCodeForPoints(parseInt(pointsToRedeem));
      } else {
        // Use regular points calculation for logged-in users
        discountResponse = await pointsApi.calculateDiscountFromPoints(
          parseInt(pointsToRedeem)
        );

        setMembershipCodeForPoints(0);
      }

      if (discountResponse.success) {
        let discountAmount = discountResponse.data;

        // Kiểm tra để đảm bảo không vượt quá tổng tiền
        const maxAllowedDiscount = currentTotalAmount - dealDiscount;
        if (discountAmount > maxAllowedDiscount) {
          discountAmount = Math.max(0, maxAllowedDiscount);
          setPointsError(
            `Giảm giá đã được điều chỉnh xuống ${formatCurrencyVND(
              discountAmount
            )} để không vượt quá tổng tiền đơn hàng`
          );
        } else {
          setPointsError("");
        }

        setPointsDiscount(discountAmount);
        setPointsApplied(true);

        // Allow both deal and points to be used together
        // Removed: Reset deal when applying points

        // Update user points (simulate deduction)
        setUserPoints((prev) => prev - parseInt(pointsToRedeem));

        const sourceText =
          membershipPassenger && !user
            ? `từ mã hội viên ${membershipPassenger.membershipCode}`
            : "từ tài khoản";

        toast.success(
          `Đã đổi ${pointsToRedeem} điểm ${sourceText} thành ${formatCurrencyVND(
            discountAmount
          )} giảm giá`
        );
      } else {
        setPointsError(
          discountResponse.message || "Không thể tính giảm giá từ điểm"
        );
      }
    } catch (error) {
      console.error("Error redeeming points:", error);
      setPointsError("Có lỗi xảy ra khi đổi điểm");
    } finally {
      setRedeemingPoints(false);
    }
  };

  const handleRemovePoints = () => {
    const redeemedPoints = parseInt(pointsToRedeem) || 0;
    setPointsToRedeem("");
    setPointsDiscount(0);
    setPointsApplied(false);
    setPointsError("");
    setCanRedeem(false);
    setMembershipCodeForPoints(0); // Reset membership points count
    // Restore user points
    setUserPoints((prev) => prev + redeemedPoints);
    toast.info("Đã hủy đổi điểm");
  };

  // Calculate final amount with deal discount, points discount, and membership discount - ensure no negative values
  const calculateFinalAmount = () => {
    const totalDiscount = dealDiscount + pointsDiscount + membershipDiscount;
    const finalAmount = Math.max(0, currentTotalAmount - totalDiscount);

    // If total discount exceeds the current amount, adjust discounts
    if (totalDiscount > currentTotalAmount) {
      console.warn("Total discounts exceed current amount, adjusting...");
      // Prioritize: membership discount, then deal discount, then points
      const adjustedMembershipDiscount = Math.min(
        membershipDiscount,
        currentTotalAmount
      );
      const remainingAfterMembership =
        currentTotalAmount - adjustedMembershipDiscount;
      const adjustedDealDiscount = Math.min(
        dealDiscount,
        remainingAfterMembership
      );
      const remainingAfterDeal =
        remainingAfterMembership - adjustedDealDiscount;
      const adjustedPointsDiscount = Math.min(
        pointsDiscount,
        remainingAfterDeal
      );

      // Update state if adjustments were made
      if (adjustedMembershipDiscount !== membershipDiscount) {
        // Note: membership discount is calculated, not state-based, so no update needed
      }
      if (adjustedDealDiscount !== dealDiscount) {
        setDealDiscount(adjustedDealDiscount);
      }
      if (adjustedPointsDiscount !== pointsDiscount) {
        setPointsDiscount(adjustedPointsDiscount);
      }

      return Math.max(
        0,
        currentTotalAmount -
          adjustedMembershipDiscount -
          adjustedDealDiscount -
          adjustedPointsDiscount
      );
    }

    return finalAmount;
  };

  const finalAmount = calculateFinalAmount();

  // Auto-assignment is now handled in extras-section automatically
  const autoAssignSeats = async () => {
    console.log("🎲 Starting auto-assignment process");
    try {
      // Get flight data from localStorage if available
      const selectedFlight = JSON.parse(
        localStorage.getItem("selectedFlight") || "{}"
      );

      // Check if this is round-trip or multi-city
      const isRoundTripFlight =
        selectedFlight.returnFlight !== undefined ||
        selectedFlight.return !== undefined ||
        selectedFlight.type === "ROUND_TRIP";
      const isMultiCityFlight = selectedFlight.type === "MULTI_CITY";

      console.log("🛩️ Flight type detection:", {
        isRoundTripFlight,
        isMultiCityFlight,
        selectedFlightType: selectedFlight.type,
        hasReturnProperty: !!selectedFlight.return,
        hasReturnFlightProperty: !!selectedFlight.returnFlight,
        selectedFlight: selectedFlight,
      });

      // For round-trip, we need to handle multiple flights
      if (isRoundTripFlight) {
        return await autoAssignSeatsForRoundTrip(selectedFlight);
      }

      // Original logic for one-way flights
      const flightData = selectedFlight.flight || flight;

      const flightId =
        flightData.id || flightData.flightId || flight.id || flight.flightId;

      // ✅ FIX: Use travelClassId instead of classId for seat fetching
      const travelClassId =
        flightData.selectedClass?.travelClass?.id ||
        fare?.travelClass?.id ||
        fare?.travelClass?.classId ||
        1;

      if (!flightId || !travelClassId) {
        console.warn(
          "Missing flight ID or travel class ID for seat assignment"
        );
        return {
          seats: {},
          seatMapping: {},
          availableSeatsData: [],
          flightId,
          travelClassId,
        };
      }

      // Get available seats from API using travelClassId
      const seatsResponse =
        await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
          flightId,
          travelClassId
        );

      if (!seatsResponse.success) {
        console.error("Failed to fetch seats:", seatsResponse.message);
        return {
          seats: {},
          seatMapping: {},
          availableSeatsData: [],
          flightId,
          travelClassId,
        };
      }

      // Debug seats API response
      console.log("🛩️ Seats API Response:", {
        success: seatsResponse.success,
        totalSeats: seatsResponse.data?.length || 0,
        flightId,
        travelClassId,
        sampleSeats: seatsResponse.data?.slice(0, 3) || [],
        allStatuses: [
          ...new Set((seatsResponse.data || []).map((s) => s.status)),
        ],
        allSeatTypes: [
          ...new Set((seatsResponse.data || []).map((s) => s.seatType)),
        ],
        allClassIds: [
          ...new Set((seatsResponse.data || []).map((s) => s.classId)),
        ],
      });

      // Filter only available seats
      const availableSeats = seatsResponse.data.filter(
        (seat) => seat.status === "AVAILABLE"
      );

      console.log("✅ Available seats after filtering:", {
        availableCount: availableSeats.length,
        totalFromAPI: seatsResponse.data?.length || 0,
        sampleAvailable: availableSeats.slice(0, 3),
      });

      if (availableSeats.length === 0) {
        console.warn("⚠️ No available seats found");
        toast.warning("Không có ghế trống. Vui lòng chọn ghế thủ công.");
        return {
          seats: {},
          seatMapping: {},
          availableSeatsData: [],
          flightId,
          travelClassId,
        };
      }

      const assignedSeats = {};
      const seatMapping = {}; // Map seatNumber to seatId from API
      const usedSeats = [...availableSeats]; // Copy to avoid modifying original

      // Create mapping for all available seats
      availableSeats.forEach((seat) => {
        seatMapping[seat.seatNumber] = seat.seatId;
      });

      formData.passengers.forEach((passenger, index) => {
        // Skip INFANT passengers - they don't need seats
        if (passenger.type === "INFANT") {
          return;
        }

        if (
          !extrasData?.selectedSeats?.[`passenger${index + 1}`] &&
          usedSeats.length > 0
        ) {
          // Random pick a seat from available seats
          const randomIndex = Math.floor(Math.random() * usedSeats.length);
          const selectedSeat = usedSeats[randomIndex];

          assignedSeats[`passenger${index + 1}`] = selectedSeat.seatNumber;

          // Remove used seat from available list
          usedSeats.splice(randomIndex, 1);
        }
      });

      if (Object.keys(assignedSeats).length > 0) {
        // Cập nhật state để hiển thị ghế đã gán
        setAutoAssignedSeats(assignedSeats);
      }

      return {
        seats: assignedSeats,
        seatMapping,
        availableSeatsData: availableSeats,
        flightId,
        travelClassId,
      };
    } catch (error) {
      console.error("Error auto-assigning seats:", error);
      toast.error("Lỗi khi tự động gán ghế");
      return {
        seats: {},
        seatMapping: {},
        availableSeatsData: [],
        flightId: null,
        travelClassId: null,
      };
    }
  };

  const autoAssignSeatsForRoundTrip = async (selectedFlight) => {
    console.log("🔄 Auto-assigning seats for round-trip flights");
    console.log("🔍 Debug selectedFlight structure:", {
      selectedFlight,
      keys: Object.keys(selectedFlight),
      hasFlight: !!selectedFlight.flight,
      hasReturn: !!selectedFlight.return,
      hasOutbound: !!selectedFlight.outbound,
      hasReturnFlight: !!selectedFlight.returnFlight,
      hasOutboundFlight: !!selectedFlight.outboundFlight,
      type: selectedFlight.type,
    });

    try {
      // Handle different selectedFlight structures - prioritize outboundFlight/returnFlight
      const outboundFlight =
        selectedFlight.outboundFlight ||
        selectedFlight.flight ||
        selectedFlight.outbound;
      const returnFlight = selectedFlight.returnFlight || selectedFlight.return;

      console.log("✈️ Flight objects extracted:", {
        outboundFlight,
        returnFlight,
        outboundExists: !!outboundFlight,
        returnExists: !!returnFlight,
      });

      // Try alternative ways to get return flight data
      if (!returnFlight) {
        console.log(
          "🔍 Searching for return flight in alternative locations..."
        );

        // Check if flights are stored differently in localStorage
        const localStorageKeys = [
          "outboundFlight",
          "returnFlight",
          "selectedFlights",
          "searchResults",
        ];
        for (const key of localStorageKeys) {
          const stored = JSON.parse(localStorage.getItem(key) || "null");
          if (stored) {
            console.log(`📂 Found data in localStorage.${key}:`, stored);
          }
        }

        // Try to extract flights from flightObject structure
        // From debug logs: flightObject has outboundData/returnData
        if (flight && flight.outboundData && flight.returnData) {
          console.log(
            "✅ Found round-trip flights in flight.outboundData/returnData"
          );
          return await processRoundTripSeats(
            flight.outboundData,
            flight.returnData,
            flight.outboundData.id || flight.outboundData.flightId,
            flight.returnData.id || flight.returnData.flightId
          );
        }

        // Check if return flight is in selectedFlight.returnFlight
        const altReturnFlight = selectedFlight.returnFlight;
        if (altReturnFlight) {
          console.log(
            "✅ Found return flight in selectedFlight.returnFlight:",
            altReturnFlight
          );
          return await processRoundTripSeats(
            outboundFlight,
            altReturnFlight,
            null,
            null
          );
        }
      }

      if (!outboundFlight || !returnFlight) {
        console.warn(
          "⚠️ Missing outbound or return flight data for round-trip auto-assignment"
        );
        return {
          seats: {},
          seatMapping: {},
          availableSeatsData: [],
          flightId: null,
          travelClassId: null,
          isRoundTrip: true,
        };
      }

      // Process the round-trip seats with available flight data
      return await processRoundTripSeats(
        outboundFlight,
        returnFlight,
        null,
        null
      );
    } catch (error) {
      console.error("❌ Error auto-assigning round-trip seats:", error);
      return {
        seats: {},
        seatMapping: {},
        availableSeatsData: [],
        flightId: null,
        travelClassId: null,
        isRoundTrip: true,
      };
    }
  };

  const processRoundTripSeats = async (
    outboundFlight,
    returnFlight,
    overrideOutboundId,
    overrideReturnId
  ) => {
    try {
      const outboundFlightId =
        overrideOutboundId || outboundFlight.id || outboundFlight.flightId;
      const returnFlightId =
        overrideReturnId || returnFlight.id || returnFlight.flightId;

      const outboundTravelClassId =
        outboundFlight.selectedClass?.travelClass?.id ||
        fare?.travelClass?.id ||
        1;
      const returnTravelClassId =
        returnFlight.selectedClass?.travelClass?.id ||
        fare?.travelClass?.id ||
        1;

      console.log("🛩️ Round-trip flight IDs:", {
        outboundFlightId,
        returnFlightId,
        outboundTravelClassId,
        returnTravelClassId,
      });

      // Fetch seats for both flights
      const [outboundSeatsResponse, returnSeatsResponse] = await Promise.all([
        flightApi.getSeatsFlightByFlightIdAndTravelClassId(
          outboundFlightId,
          outboundTravelClassId
        ),
        flightApi.getSeatsFlightByFlightIdAndTravelClassId(
          returnFlightId,
          returnTravelClassId
        ),
      ]);

      console.log("🎫 Round-trip seats API responses:", {
        outbound: {
          success: outboundSeatsResponse.success,
          totalSeats: outboundSeatsResponse.data?.length || 0,
        },
        return: {
          success: returnSeatsResponse.success,
          totalSeats: returnSeatsResponse.data?.length || 0,
        },
      });

      // Process available seats for both flights
      const outboundAvailableSeats = outboundSeatsResponse.success
        ? outboundSeatsResponse.data.filter(
            (seat) => seat.status === "AVAILABLE"
          )
        : [];
      const returnAvailableSeats = returnSeatsResponse.success
        ? returnSeatsResponse.data.filter((seat) => seat.status === "AVAILABLE")
        : [];

      console.log("✈️ Available seats for round-trip:", {
        outboundAvailable: outboundAvailableSeats.length,
        returnAvailable: returnAvailableSeats.length,
      });

      // Create seat mapping for both flights
      const seatMapping = {};
      const combinedAvailableSeats = [];

      // Add outbound seats with segment info
      outboundAvailableSeats.forEach((seat) => {
        seatMapping[`${seat.seatNumber}_segment1`] = seat.seatId;
        combinedAvailableSeats.push({
          ...seat,
          segmentOrder: 1,
          flightId: outboundFlightId,
        });
      });

      // Add return seats with segment info
      returnAvailableSeats.forEach((seat) => {
        seatMapping[`${seat.seatNumber}_segment2`] = seat.seatId;
        combinedAvailableSeats.push({
          ...seat,
          segmentOrder: 2,
          flightId: returnFlightId,
        });
      });

      // Auto-assign seats for passengers (both segments)
      const assignedSeats = {};

      formData.passengers.forEach((passenger, passengerIndex) => {
        const passengerKey = `passenger${passengerIndex + 1}`;

        // Skip INFANT passengers - they don't need seats
        if (passenger.type === "INFANT") {
          return;
        }

        // Don't auto-assign if manual selection exists
        if (extrasData?.selectedSeats?.[passengerKey]) {
          return;
        }

        // Try to assign outbound seat - ONLY STANDARD seats for auto-assignment
        const outboundStandardSeats = outboundAvailableSeats.filter(
          (seat) => seat.seatType === "STANDARD" && seat.status === "AVAILABLE"
        );

        // Try to assign return seat - ONLY STANDARD seats for auto-assignment
        const returnStandardSeats = returnAvailableSeats.filter(
          (seat) => seat.seatType === "STANDARD" && seat.status === "AVAILABLE"
        );

        console.log(`🎯 Auto-assignment filtering for ${passengerKey}:`, {
          outboundTotal: outboundAvailableSeats.length,
          outboundStandard: outboundStandardSeats.length,
          returnTotal: returnAvailableSeats.length,
          returnStandard: returnStandardSeats.length,
          outboundSeatTypes: [
            ...new Set(outboundAvailableSeats.map((s) => s.seatType)),
          ],
          returnSeatTypes: [
            ...new Set(returnAvailableSeats.map((s) => s.seatType)),
          ],
        });

        if (
          outboundStandardSeats.length > 0 &&
          returnStandardSeats.length > 0
        ) {
          const outboundSeat =
            outboundStandardSeats[
              Math.floor(Math.random() * outboundStandardSeats.length)
            ];
          const returnSeat =
            returnStandardSeats[
              Math.floor(Math.random() * returnStandardSeats.length)
            ];

          assignedSeats[`${passengerKey}_segment1`] = outboundSeat.seatNumber;
          assignedSeats[`${passengerKey}_segment2`] = returnSeat.seatNumber;
        }
      });

      console.log("🎲 Round-trip auto-assigned seats:", assignedSeats);

      return {
        seats: assignedSeats,
        seatMapping: seatMapping,
        availableSeatsData: combinedAvailableSeats,
        flightId: outboundFlightId, // Primary flight ID
        travelClassId: outboundTravelClassId,
        isRoundTrip: true,
      };
    } catch (error) {
      console.error("❌ Error auto-assigning round-trip seats:", error);
      return {
        seats: {},
        seatMapping: {},
        availableSeatsData: [],
        flightId: null,
        travelClassId: null,
        isRoundTrip: true,
      };
    }
  };

  const handleSubmit = async (e, payLater = false) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản và điều kiện");
      return;
    }

    setIsProcessing(true);

    try {
      // Debug: Check extrasData at start of handleSubmit
      // console.log("🚀 HANDLE SUBMIT START - extrasData:", {
      //   selectedSeats: extrasData?.selectedSeats,
      //   selectedReturnSeats: extrasData?.selectedReturnSeats,
      //   multiCitySeats: extrasData?.multiCitySeats,
      //   baggage: extrasData?.baggage,
      //   hasSelectedSeats: !!(
      //     extrasData?.selectedSeats &&
      //     Object.keys(extrasData.selectedSeats).length > 0
      //   ),
      //   flightObject: flight,
      //   fareObject: fare,
      // });

      // Set payment method for pay later
      const currentPaymentMethod = payLater ? "PAYPAL" : paymentMethod;
      // Auto assign seats from API only if no seats are selected from extras
      let autoAssignResult = {
        seats: {},
        seatMapping: {},
        availableSeatsData: [],
      };
      const hasSelectedSeats =
        extrasData?.selectedSeats &&
        Object.keys(extrasData.selectedSeats).length > 0;

      console.log("🔍 Payment Section Debug - Extras Data:", {
        selectedSeats: extrasData?.selectedSeats,
        hasSelectedSeats,
        selectedSeatsCount: Object.keys(extrasData?.selectedSeats || {}).length,
        passengersCount: formData.passengers?.length || 0,
      });

      // Process extras data to ensure seat assignments are in correct format
      const processedExtrasData = processExtrasDataForBooking(
        extrasData,
        flight,
        formData.passengers
      );
      console.log("📋 Processed Extras Data:", processedExtrasData);

      // Update hasSelectedSeats based on processed data
      const updatedHasSelectedSeats =
        processedExtrasData?.seatAssignments &&
        processedExtrasData.seatAssignments.length > 0;

      console.log("🔄 Updated seat selection status:", {
        originalHasSelectedSeats: hasSelectedSeats,
        updatedHasSelectedSeats,
        seatAssignmentsCount: processedExtrasData?.seatAssignments?.length || 0,
      });

      // Always get available seats data for mapping, but only auto-assign if no seats selected
      autoAssignResult = await autoAssignSeats();

      // Store the flightId and travelClassId used for seat fetching
      const seatFetchFlightId = autoAssignResult.flightId;
      const seatFetchTravelClassId = autoAssignResult.travelClassId;

      console.log("handleSubmit - seat fetch IDs:", {
        seatFetchFlightId,
        seatFetchTravelClassId,
        autoAssignResult,
      });

      // Always prioritize manual selections from extrasData, fallback to auto-assignment if needed
      const finalSelectedSeats = {
        ...autoAssignResult.seats, // Auto-assigned seats as base
        ...(extrasData?.selectedSeats || {}), // Manual selections override auto-assigned
      };

      console.log("🎯 Final Selected Seats for processing:", {
        hasManualSelections:
          Object.keys(extrasData?.selectedSeats || {}).length > 0,
        hasAutoAssigned: Object.keys(autoAssignResult.seats || {}).length > 0,
        finalSeats: finalSelectedSeats,
      });

      // Get seat mapping from API (seatNumber -> seatId)
      const seatMapping = autoAssignResult.seatMapping;
      const allAvailableSeats = autoAssignResult.availableSeatsData;

      console.log("=== FULL BOOKING DATA DEBUG ===");
      console.log("Selected seats from extrasData:", extrasData?.selectedSeats);
      console.log("Final selected seats object:", finalSelectedSeats);
      console.log(
        "Available seats data length:",
        allAvailableSeats?.length || 0
      );
      console.log("Seat mapping object:", seatMapping);

      if (!hasSelectedSeats) {
        // Only auto-assign if no seats were selected in extras
        // autoAssignResult is already set above
      }

      // Update state for seat price calculations
      setAllAvailableSeats(allAvailableSeats);

      // Helper function to get real seatId from API mapping or random assignment
      const getSeatIdFromMapping = async (
        selectedSeatData,
        flightId,
        travelClassId
      ) => {
        // Extract seat number from selectedSeatData (handle both object and string formats)
        const seatNumber =
          typeof selectedSeatData === "object" && selectedSeatData?.seatNumber
            ? selectedSeatData.seatNumber
            : selectedSeatData;

        console.log(`getSeatIdFromMapping called with:`, {
          selectedSeatData: selectedSeatData,
          extractedSeatNumber: seatNumber,
          flightId: flightId,
          travelClassId: travelClassId,
          flightIdType: typeof flightId,
          travelClassIdType: typeof travelClassId,
        });

        // Validate parameters first
        if (
          !flightId ||
          !travelClassId ||
          flightId === "undefined" ||
          travelClassId === "undefined"
        ) {
          console.error(`Invalid parameters for getSeatIdFromMapping:`, {
            selectedSeatData: selectedSeatData,
            extractedSeatNumber: seatNumber,
            flightId: flightId,
            travelClassId: travelClassId,
          });
          return null;
        }

        // If no seat selected, return null for auto-assignment
        if (!seatNumber) {
          console.log(
            `No seat selected, will auto-assign for flight ${flightId}, class ${travelClassId}`
          );
          return null;
        }

        // First try to find seat using direct API call (more reliable for round-trip)
        if (seatNumber) {
          console.log(
            `🔍 Direct API search for seat ${seatNumber} on flight ${flightId}, class ${travelClassId}`
          );
          try {
            const apiResponse =
              await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
                flightId,
                travelClassId
              );
            const apiSeats = apiResponse.success
              ? apiResponse.data
              : apiResponse;

            if (Array.isArray(apiSeats)) {
              const foundSeat = apiSeats.find(
                (seat) => seat.seatNumber === seatNumber
              );
              if (foundSeat) {
                console.log(
                  `✅ Found seat ${seatNumber} via direct API:`,
                  foundSeat
                );
                const seatInfo = {
                  seatId: foundSeat.seatId || foundSeat.id,
                  seatNumber: foundSeat.seatNumber,
                  seatType: foundSeat.seatType || "STANDARD",
                  priceVND: foundSeat.priceVND || 0,
                };

                // Store seat details for display
                setSeatDetails((prev) => ({
                  ...prev,
                  [seatNumber]: seatInfo,
                }));

                return seatInfo;
              } else {
                console.log(
                  `❌ Seat ${seatNumber} not found in API. Available seats:`,
                  apiSeats.map((s) => s.seatNumber).slice(0, 10)
                );
              }
            }
          } catch (error) {
            console.error(
              `❌ Direct API call failed for seat ${seatNumber}:`,
              error
            );
          }
        }

        // Fallback to mapping if direct API fails
        if (seatNumber && seatMapping && seatMapping[seatNumber]) {
          // Return mapped seat ID if available
          console.log(
            `Mapped seat ${seatNumber} to ID:`,
            seatMapping[seatNumber]
          );
          // Need to get seatType from the selected seat data
          const selectedSeatData = allAvailableSeats.find(
            (seat) => seat.seatNumber === seatNumber
          );
          const seatInfo = {
            seatId: seatMapping[seatNumber],
            seatNumber: seatNumber,
            seatType: selectedSeatData?.seatType || "STANDARD",
            priceVND: selectedSeatData?.priceVND || 0,
          };

          // Store seat details for display
          setSeatDetails((prev) => ({
            ...prev,
            [seatNumber]: seatInfo,
          }));

          return seatInfo;
        }

        // If seatNumber is from selectedSeats but not in mapping, try to find it in availableSeatsData
        if (seatNumber && allAvailableSeats && allAvailableSeats.length > 0) {
          console.log(
            `🔍 Searching for seat ${seatNumber} in available seats:`,
            {
              totalSeats: allAvailableSeats.length,
              sampleSeats: allAvailableSeats.slice(0, 5).map((s) => ({
                seatNumber: s.seatNumber,
                seatId: s.seatId,
                flightId: s.flightId,
                travelClassId: s.travelClassId,
                status: s.status,
              })),
              searchCriteria: {
                lookingFor: seatNumber,
                flightId: flightId,
                travelClassId: travelClassId,
              },
            }
          );

          const selectedSeatData = allAvailableSeats.find(
            (seat) => seat.seatNumber === seatNumber
          );

          if (selectedSeatData) {
            console.log(
              `✅ Found selected seat ${seatNumber} in available seats:`,
              selectedSeatData
            );
            const seatInfo = {
              seatId: selectedSeatData.seatId || selectedSeatData.id,
              seatNumber: selectedSeatData.seatNumber,
              seatType: selectedSeatData.seatType || "STANDARD",
              priceVND: selectedSeatData.priceVND || 0,
            };

            // Store seat details for display
            setSeatDetails((prev) => ({
              ...prev,
              [seatNumber]: seatInfo,
            }));

            return seatInfo;
          } else {
            console.log(
              `❌ Seat ${seatNumber} NOT found in available seats. Available seat numbers:`,
              allAvailableSeats.map((s) => s.seatNumber).slice(0, 20)
            );

            // Try alternative API call without classId filter (same as extras-section)
            console.log(
              `🔄 Trying alternative API call without classId filter...`
            );
            try {
              const alternativeSeatsResponse = await flightApi.getSeatsByFlight(
                flightId
              );
              const alternativeSeats = alternativeSeatsResponse.success
                ? alternativeSeatsResponse.data
                : alternativeSeatsResponse;

              console.log(`🔍 Alternative API response:`, {
                success: alternativeSeatsResponse.success,
                totalSeats: Array.isArray(alternativeSeats)
                  ? alternativeSeats.length
                  : 0,
                sampleSeats: Array.isArray(alternativeSeats)
                  ? alternativeSeats.slice(0, 5).map((s) => ({
                      seatNumber: s.seatNumber,
                      seatId: s.seatId,
                      flightId: s.flightId,
                      travelClassId: s.travelClassId,
                      status: s.status,
                    }))
                  : "Not an array",
              });

              if (
                Array.isArray(alternativeSeats) &&
                alternativeSeats.length > 0
              ) {
                const altSelectedSeatData = alternativeSeats.find(
                  (seat) => seat.seatNumber === seatNumber
                );

                if (altSelectedSeatData) {
                  console.log(
                    `✅ Found seat ${seatNumber} using alternative API:`,
                    altSelectedSeatData
                  );
                  return {
                    seatId:
                      altSelectedSeatData.seatId || altSelectedSeatData.id,
                    seatType: altSelectedSeatData.seatType || "STANDARD",
                    priceVND: altSelectedSeatData.priceVND || 0,
                  };
                } else {
                  console.log(
                    `❌ Seat ${seatNumber} still NOT found in alternative API. Available:`,
                    alternativeSeats.map((s) => s.seatNumber).slice(0, 20)
                  );
                }
              }
            } catch (altError) {
              console.error(`❌ Alternative API call failed:`, altError);
            }
          }
        }

        // If seat "26C" not found, let's check if it exists in a fresh API call
        if (seatNumber === "26C") {
          console.log(
            `🚀 Making fresh API call to check seat ${seatNumber} availability for flightId: ${flightId}, travelClassId: ${travelClassId}`
          );
          try {
            const freshSeatsResponse =
              await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
                flightId,
                travelClassId
              );
            const freshSeats = freshSeatsResponse.success
              ? freshSeatsResponse.data
              : freshSeatsResponse;
            console.log(`🔍 Fresh API response for seat search:`, {
              totalSeats: freshSeats?.length || 0,
              seatNumbers: freshSeats?.map((s) => s.seatNumber) || [],
              hasRequestedSeat:
                freshSeats?.some((s) => s.seatNumber === seatNumber) || false,
              sampleData: freshSeats?.slice(0, 3) || [],
            });
          } catch (error) {
            console.error("Error making fresh API call:", error);
          }
        }

        // CRITICAL: Selected seat not found - try to find ANY available seat with same type/preferences
        console.log(
          `🔄 SELECTED SEAT ${seatNumber} NOT FOUND - Attempting smart fallback for flight ${flightId}, travelClass ${travelClassId}`
        );

        try {
          // Try to get all available seats for this flight/class
          const availableSeatsResponse =
            await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              flightId,
              travelClassId
            );
          const availableSeats = availableSeatsResponse.success
            ? availableSeatsResponse.data
            : availableSeatsResponse;

          if (Array.isArray(availableSeats) && availableSeats.length > 0) {
            // Filter for available seats only
            const availableOnly = availableSeats.filter(
              (seat) => seat.status === "AVAILABLE" || !seat.status
            );

            console.log(`📊 Available seats for smart fallback:`, {
              totalAvailable: availableOnly.length,
              seatNumbers: availableOnly.map((s) => s.seatNumber),
              seatTypes: [...new Set(availableOnly.map((s) => s.seatType))],
            });

            // If we have seat type preference from selected seat data, try to find similar seat
            if (allAvailableSeats && allAvailableSeats.length > 0) {
              const originalSeatData = allAvailableSeats.find(
                (seat) => seat.seatNumber === seatNumber
              );

              if (originalSeatData && originalSeatData.seatType) {
                // Try to find an available seat with the same type
                const sameTypeSeat = availableOnly.find(
                  (seat) => seat.seatType === originalSeatData.seatType
                );

                if (sameTypeSeat) {
                  console.log(
                    `✅ Found alternative seat with same type (${originalSeatData.seatType}):`,
                    sameTypeSeat
                  );
                  return {
                    seatId: sameTypeSeat.seatId || sameTypeSeat.id,
                    seatNumber: sameTypeSeat.seatNumber,
                    seatType: sameTypeSeat.seatType || "STANDARD",
                    priceVND: sameTypeSeat.priceVND || 0,
                  };
                }
              }
            }

            // If no same-type seat found, take the first available seat
            if (availableOnly.length > 0) {
              const fallbackSeat = availableOnly[0];
              console.log(
                `⚠️ Using first available seat as fallback:`,
                fallbackSeat
              );
              return {
                seatId: fallbackSeat.seatId || fallbackSeat.id,
                seatNumber: fallbackSeat.seatNumber,
                seatType: fallbackSeat.seatType || "STANDARD",
                priceVND: fallbackSeat.priceVND || 0,
              };
            }
          }
        } catch (fallbackError) {
          console.error(`❌ Smart fallback failed:`, fallbackError);
        }

        // Final fallback to random assignment
        console.log(
          `🔄 FALLING BACK TO RANDOM ASSIGNMENT for flight ${flightId}, travelClass ${travelClassId}`
        );
        const randomSeat = await getRandomAvailableSeat(
          flightId,
          travelClassId
        );
        if (randomSeat) {
          console.log(`✅ Assigned random seat:`, randomSeat);
          return randomSeat;
        } else {
          console.error(
            `❌ No seats available for flight ${flightId}, class ${travelClassId}`
          );
          return null;
        }
      };

      // Prepare booking data for new API format
      // Get localStorage data first to check for flight structure
      const selectedFlight = JSON.parse(
        localStorage.getItem("selectedFlight") || "{}"
      );
      const localStorageFlight = selectedFlight.flight || {};

      const isMultiCity =
        flight?.type === "MULTI_CITY" ||
        flight?.isMultiCity ||
        localStorageFlight?.type === "MULTI_CITY" ||
        localStorageFlight?.isMultiCity;

      // Improved round-trip detection: check multiple sources
      const isRoundTrip =
        flight?.type === "ROUND_TRIP" ||
        flight?.isRoundTrip ||
        selectedFlight?.type === "ROUND_TRIP" ||
        localStorageFlight?.type === "ROUND_TRIP" ||
        localStorageFlight?.isRoundTrip ||
        (flight?.outboundFlight && flight?.returnFlight ? true : false) ||
        (localStorageFlight?.outboundFlight && localStorageFlight?.returnFlight
          ? true
          : false) ||
        (selectedFlight?.outboundFlight && selectedFlight?.returnFlight
          ? true
          : false) ||
        (selectedFlight?.outbound && selectedFlight?.return ? true : false);

      // Debug flight type detection
      console.log("Flight type detection:", {
        isMultiCity,
        isRoundTrip,
        flightType: flight?.type,
        isRoundTripFlag: flight?.isRoundTrip,
        hasOutboundFlight: !!flight?.outboundFlight,
        hasReturnFlight: !!flight?.returnFlight,
        outboundFlightId: flight?.outboundFlight?.id,
        returnFlightId: flight?.returnFlight?.id,
      });

      // Helper function to get random available seat
      const getRandomAvailableSeat = async (flightId, travelClassId) => {
        try {
          const response =
            await flightApi.getSeatsFlightByFlightIdAndTravelClassId(
              flightId,
              travelClassId
            );
          // Check if response has data property and is array
          const seatsData = response.success ? response.data : response;
          const availableSeats = Array.isArray(seatsData)
            ? seatsData.filter((seat) => seat.status === "AVAILABLE")
            : [];

          if (availableSeats.length > 0) {
            const randomSeat =
              availableSeats[Math.floor(Math.random() * availableSeats.length)];
            return {
              seatId: randomSeat.seatId || randomSeat.id,
              seatNumber: randomSeat.seatNumber,
              priceVND: randomSeat.priceVND || 0,
              seatType: randomSeat.seatType,
            };
          }
          return null;
        } catch (error) {
          console.error("Error getting random seat:", error);
          return null;
        }
      };

      // Helper function to determine baggage package
      const getBaggagePackage = (passenger, index) => {
        if (isMultiCity) {
          // For multi-city, baggage is stored per segment, but we'll use the first segment's selection
          // Or you could modify this logic based on your requirements
          const firstSegmentBaggage =
            extrasData?.multiCityBaggage?.segment0?.[`passenger_${index}`];
          return firstSegmentBaggage && firstSegmentBaggage !== "NONE"
            ? firstSegmentBaggage
            : null;
        } else {
          // For regular flights, baggage is now stored as package key per passenger
          const passengerBaggage = extrasData?.baggage?.[`passenger_${index}`];
          return passengerBaggage && passengerBaggage !== "NONE"
            ? passengerBaggage
            : null;
        }
      };

      // Get membership code if points are from membership
      const membershipCodeUsedForPoints = pointsApplied
        ? formData.passengers.find(
            (p) =>
              p.membershipCode &&
              p.membershipData?.valid &&
              membershipCodeForPoints > 0
          )?.membershipCode
        : null;

      const bookingData = {
        ...(dealApplied && dealCode && { dealCode: dealCode }),
        ...(pointsApplied &&
          pointsToRedeem && { pointsToRedeem: parseInt(pointsToRedeem) }),
        ...(pointsApplied &&
          membershipCodeUsedForPoints && {
            membershipCodeForPoints: membershipCodeUsedForPoints,
          }),
        ...(membershipDiscount > 0 && {
          membershipDiscount: membershipDiscount,
          membershipTier:
            user?.loyaltyTier ||
            user?.membershipTier ||
            user?.tier ||
            "STANDARD",
        }),
        userId: user?.id || null,
        totalAmount: finalAmount,
        passengers: [], // Will be populated with seatAssignments
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        flightSegments: [],
        ancillaryServices: [],
        paymentMethod: currentPaymentMethod,
        checkInType: "ONLINE",
      };

      // Build flight segments based on flight type
      if (isMultiCity && flight.legs) {
        // Multi-city flights
        bookingData.flightSegments = flight.legs.map((leg, index) => {
          const travelClassId = leg.selectedClass?.travelClass?.id || 1;
          return {
            segmentOrder: index + 1,
            flightId: leg.id || leg.flightId,
            classId: travelClassId, // Use travelClassId instead of selectedClass.id
            // travelClassId: travelClassId,
            departure: {
              code: leg.departureAirport?.airportCode || leg.from || "N/A",
              city:
                leg.departureAirport?.cityNames?.[0] ||
                leg.departureAirport?.city ||
                leg.departureCity ||
                leg.from ||
                "N/A",
              time: formatTimeForBackend(leg.departureTime, leg.departureDate),
              airport:
                leg.departureAirport?.airportName ||
                leg.departureAirportName ||
                leg.fromAirport ||
                "N/A",
              terminal:
                leg.departureAirport?.terminal ||
                leg.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                leg.departureAirport?.gate ||
                leg.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code: leg.arrivalAirport?.airportCode || leg.to || "N/A",
              city:
                leg.arrivalAirport?.cityNames?.[0] ||
                leg.arrivalAirport?.city ||
                leg.arrivalCity ||
                leg.to ||
                "N/A",
              time: formatTimeForBackend(leg.arrivalTime, leg.arrivalDate),
              airport:
                leg.arrivalAirport?.airportName ||
                leg.arrivalAirportName ||
                leg.toAirport ||
                "N/A",
              terminal:
                leg.arrivalAirport?.terminal ||
                leg.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                leg.arrivalAirport?.gate ||
                leg.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price:
              leg.selectedClass?.price ||
              leg.flightTravelClasses?.[0]?.price ||
              0,
            aircraft: leg.aircraft || leg.aircraftName || "Unknown Aircraft",
            duration: leg.duration
              ? `${Math.floor(leg.duration / 60)}h ${leg.duration % 60}m`
              : "2h 0m",
          };
        });
      } else if (
        isRoundTrip &&
        ((flight.outboundFlight && flight.returnFlight) ||
          (localStorageFlight.outboundFlight &&
            localStorageFlight.returnFlight) ||
          (selectedFlight.outboundFlight && selectedFlight.returnFlight) ||
          (selectedFlight.outbound && selectedFlight.return))
      ) {
        // Round-trip flights - use localStorage data if flight prop is incomplete
        const outboundData =
          flight.outboundFlight ||
          localStorageFlight.outboundFlight ||
          selectedFlight.outboundFlight ||
          selectedFlight.outbound;
        const returnData =
          flight.returnFlight ||
          localStorageFlight.returnFlight ||
          selectedFlight.returnFlight ||
          selectedFlight.return;

        console.log("Creating ROUND-TRIP segments with data:", {
          outboundData,
          returnData,
          outboundId: outboundData?.id || outboundData?.flightId,
          returnId: returnData?.id || returnData?.flightId,
          flightSource: flight.outboundFlight
            ? "flight prop"
            : localStorageFlight.outboundFlight
            ? "localStorage.flight"
            : "localStorage.outbound",
        });

        bookingData.flightSegments = [
          // Outbound segment
          {
            segmentOrder: 1,
            flightId: parseInt(outboundData?.id || outboundData?.flightId || 0),
            classId:
              flight.selectedOutboundFare?.travelClass?.id ||
              outboundData?.selectedClass?.travelClass?.id ||
              fare.travelClass?.id ||
              1,
            // travelClassId:
            //   flight.selectedOutboundFare?.travelClass?.id ||
            //   outboundData?.selectedClass?.travelClass?.id ||
            //   fare.travelClass?.id ||
            //   1,
            departure: {
              code:
                outboundData.departureAirport?.airportCode ||
                outboundData.departureAirport?.code ||
                outboundData.from ||
                "N/A",
              city:
                outboundData.departureAirport?.city ||
                outboundData.departureAirport?.cityName ||
                outboundData.departureAirport?.cityNames?.[0] ||
                outboundData.from ||
                "N/A",
              time: formatTimeForBackend(
                outboundData.departureTime,
                outboundData.departureDate
              ),
              airport:
                outboundData.departureAirport?.airportName ||
                outboundData.departureAirport?.name ||
                "N/A",
              terminal:
                outboundData.departureAirport?.terminal ||
                outboundData.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                outboundData.departureAirport?.gate ||
                outboundData.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code:
                outboundData.arrivalAirport?.airportCode ||
                outboundData.arrivalAirport?.code ||
                outboundData.to ||
                "N/A",
              city:
                outboundData.arrivalAirport?.city ||
                outboundData.arrivalAirport?.cityName ||
                outboundData.arrivalAirport?.cityNames?.[0] ||
                outboundData.to ||
                "N/A",
              time: formatTimeForBackend(
                outboundData.arrivalTime,
                outboundData.arrivalDate
              ),
              airport:
                outboundData.arrivalAirport?.airportName ||
                outboundData.arrivalAirport?.name ||
                "N/A",
              terminal:
                outboundData.arrivalAirport?.terminal ||
                outboundData.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                outboundData.arrivalAirport?.gate ||
                outboundData.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price:
              flight.selectedOutboundFare?.price ||
              outboundData.flightTravelClasses?.[0]?.price ||
              outboundData.price ||
              0,
            aircraft:
              outboundData.aircraft?.aircraftName ||
              outboundData.aircraft?.name ||
              outboundData.aircraftName ||
              outboundData.aircraft ||
              "N/A",
            duration: outboundData.duration
              ? `${Math.floor(outboundData.duration / 60)}h ${
                  outboundData.duration % 60
                }m`
              : "N/A",
          },
          // Return segment
          {
            segmentOrder: 2,
            flightId: parseInt(returnData?.id || returnData?.flightId || 0),
            classId:
              flight.selectedReturnFare?.travelClass?.id ||
              returnData?.selectedClass?.travelClass?.id ||
              fare.travelClass?.id ||
              1,
            // travelClassId:
            //   flight.selectedReturnFare?.travelClass?.id ||
            //   returnData?.selectedClass?.travelClass?.id ||
            //   fare.travelClass?.id ||
            //   1,
            departure: {
              code:
                returnData.departureAirport?.airportCode ||
                returnData.departureAirport?.code ||
                returnData.from ||
                "N/A",
              city:
                returnData.departureAirport?.city ||
                returnData.departureAirport?.cityName ||
                returnData.departureAirport?.cityNames?.[0] ||
                returnData.from ||
                "N/A",
              time: formatTimeForBackend(
                returnData.departureTime,
                returnData.departureDate
              ),
              airport:
                returnData.departureAirport?.airportName ||
                returnData.departureAirport?.name ||
                "N/A",
              terminal:
                returnData.departureAirport?.terminal ||
                returnData.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                returnData.departureAirport?.gate ||
                returnData.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code:
                returnData.arrivalAirport?.airportCode ||
                returnData.arrivalAirport?.code ||
                returnData.to ||
                "N/A",
              city:
                returnData.arrivalAirport?.city ||
                returnData.arrivalAirport?.cityName ||
                returnData.arrivalAirport?.cityNames?.[0] ||
                returnData.to ||
                "N/A",
              time: formatTimeForBackend(
                returnData.arrivalTime,
                returnData.arrivalDate
              ),
              airport:
                returnData.arrivalAirport?.airportName ||
                returnData.arrivalAirport?.name ||
                "N/A",
              terminal:
                returnData.arrivalAirport?.terminal ||
                returnData.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                returnData.arrivalAirport?.gate ||
                returnData.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price:
              flight.selectedReturnFare?.price ||
              returnData.flightTravelClasses?.[0]?.price ||
              returnData.price ||
              0,
            aircraft:
              returnData.aircraft?.aircraftName ||
              returnData.aircraft?.name ||
              returnData.aircraftName ||
              returnData.aircraft ||
              "N/A",
            duration: returnData.duration
              ? `${Math.floor(returnData.duration / 60)}h ${
                  returnData.duration % 60
                }m`
              : "N/A",
          },
        ];
      } else {
        // One-way flight - Use already fetched localStorage data
        const flightData = localStorageFlight || flight;

        // Debug localStorage data for one-way flight
        console.log(
          "One-way flight - selectedFlight from localStorage:",
          selectedFlight
        );
        console.log("One-way flight - flightData:", flightData);
        console.log(
          "One-way flight - flightData.departureAirport:",
          flightData.departureAirport
        );
        console.log(
          "One-way flight - flightData.arrivalAirport:",
          flightData.arrivalAirport
        );
        console.log("One-way flight - flight prop:", flight);

        bookingData.flightSegments = [
          {
            segmentOrder: 1,
            flightId: parseInt(
              flightData.id ||
                flightData.flightId ||
                flight.id ||
                flight.flightId ||
                selectedFlight.outboundFlight?.id ||
                selectedFlight.outbound?.id ||
                selectedFlight.outboundFlight?.flightId ||
                selectedFlight.outbound?.flightId ||
                0
            ),
            classId:
              flightData.selectedClass?.travelClass?.id ||
              fare.travelClass?.id ||
              1,
            // travelClassId:
            //   flightData.selectedClass?.travelClass?.id ||
            //   fare.travelClass?.id ||
            //   1,
            departure: {
              code:
                flightData.departureAirport?.code ||
                flightData.departureAirport?.airportCode ||
                flightData.from ||
                flight.departureAirport?.airportCode ||
                flight.from ||
                "N/A",
              city:
                flightData.departureAirport?.city === "N/A"
                  ? flightData.from
                  : flightData.departureAirport?.city ||
                    flight.departureAirport?.city ||
                    flight.departureCity ||
                    "N/A",
              time: formatTimeForBackend(
                flightData.departureTime || flight.departureTime,
                flightData.departureDate || flight.departureDate
              ),
              airport:
                flightData.departureAirport?.name ||
                flightData.departureAirport?.airportName ||
                flight.departureAirport?.airportName ||
                flight.departureAirport?.name ||
                "N/A",
              terminal:
                flightData.departureAirport?.terminal ||
                flightData.departureAirport?.gates?.[0]?.terminal ||
                flight.departureAirport?.terminal ||
                flight.departureAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                flightData.departureAirport?.gate ||
                flightData.departureAirport?.gates?.[0]?.gateName ||
                flight.departureAirport?.gate ||
                flight.departureAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            arrival: {
              code:
                flightData.arrivalAirport?.code ||
                flightData.arrivalAirport?.airportCode ||
                flightData.to ||
                flight.arrivalAirport?.airportCode ||
                flight.to ||
                "SGN",
              city:
                flightData.arrivalAirport?.city === "N/A"
                  ? flightData.to
                  : flightData.arrivalAirport?.city ||
                    flight.arrivalAirport?.city ||
                    flight.arrivalCity ||
                    "N/A",
              time: formatTimeForBackend(
                flightData.arrivalTime || flight.arrivalTime,
                flightData.arrivalDate || flight.arrivalDate
              ),
              airport:
                flightData.arrivalAirport?.name ||
                flightData.arrivalAirport?.airportName ||
                flight.arrivalAirport?.airportName ||
                flight.arrivalAirport?.name ||
                "N/A",
              terminal:
                flightData.arrivalAirport?.terminal ||
                flightData.arrivalAirport?.gates?.[0]?.terminal ||
                flight.arrivalAirport?.terminal ||
                flight.arrivalAirport?.gates?.[0]?.terminal ||
                "N/A",
              gate:
                flightData.arrivalAirport?.gate ||
                flightData.arrivalAirport?.gates?.[0]?.gateName ||
                flight.arrivalAirport?.gate ||
                flight.arrivalAirport?.gates?.[0]?.gateName ||
                "N/A",
            },
            price: fare.price || flightData.totalPrice || 0,
            aircraft:
              flightData.aircraft ||
              flightData.aircraftName ||
              flight.aircraft?.aircraftName ||
              flight.aircraft?.name ||
              flight.aircraftName ||
              flight.aircraft ||
              "N/A",
            duration: flightData.duration
              ? `${Math.floor(flightData.duration / 60)}h ${
                  flightData.duration % 60
                }m`
              : flight.duration
              ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`
              : calculateDuration(
                  flightData.departureTime || flight.departureTime,
                  flightData.arrivalTime || flight.arrivalTime
                ) || "2h 0m",
          },
        ];
      }

      // Create passengers with seat assignments according to new API format
      bookingData.passengers = formData.passengers.map((passenger, index) => ({
        firstName:
          passenger.firstName || passenger.fullName?.split(" ")[0] || "",
        lastName:
          passenger.lastName ||
          passenger.fullName?.split(" ").slice(1).join(" ") ||
          "",
        gender: passenger.gender || "MALE",
        dateOfBirth: passenger.dateOfBirth || passenger.dob || null,
        passportNumber: passenger.passportNumber || passenger.passport || "",
        type: passenger.type || "ADULT",
        // frequentFlyer: passenger.frequentFlyer || "",
        phone: (() => {
          let phone =
            passenger.phone ||
            passenger.phoneNumber ||
            formData.contact?.phone ||
            "";

          // Convert international format to local format if needed
          // If phone starts with +84, convert to 0xxx format for Vietnam
          if (phone.startsWith("+84")) {
            phone = "0" + phone.slice(3);
          }

          return phone;
        })(),
        email: passenger.email || formData.contact?.email || "",
        // Add new fields for backend
        nationality: passenger.country || "Vietnam", // Quốc gia/quốc tịch
        currentResidence: passenger.currentAddress || "", // Nơi ở hiện tại
        membershipCode: passenger.membershipCode || null, // Mã hội viên
        baggagePackage: getBaggagePackage(passenger, index),
        seatAssignments: [], // Will be populated below for each flight segment
      }));

      console.log(
        "🔍 Debug passengers phone data:",
        formData.passengers.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          rawPhone: p.phone,
          phoneNumber: p.phoneNumber,
          contactPhone: formData.contact?.phone,
          finalPhone: p.phone || p.phoneNumber || formData.contact?.phone || "",
        }))
      );

      console.log(
        "Created passengers array with seatAssignments structure:",
        bookingData.passengers
      );

      // Assign seats for all passengers and segments
      for (
        let segmentIndex = 0;
        segmentIndex < bookingData.flightSegments.length;
        segmentIndex++
      ) {
        const segment = bookingData.flightSegments[segmentIndex];

        // Validate segment data
        if (!segment.flightId || !segment.classId) {
          console.error(`Invalid segment data at index ${segmentIndex}`);
          toast.error(`Lỗi dữ liệu chuyến bay tại segment ${segmentIndex + 1}`);
          continue;
        }

        // Process seat assignments for each passenger in this segment
        for (
          let passengerIndex = 0;
          passengerIndex < formData.passengers.length;
          passengerIndex++
        ) {
          const passenger = formData.passengers[passengerIndex];

          // Skip INFANT passengers - they don't need seats
          if (passenger.type === "INFANT") {
            console.log(
              `⏭️ Skipping seat assignment for INFANT passenger ${
                passengerIndex + 1
              }`
            );
            continue;
          }

          const passengerKey = `passenger${passengerIndex + 1}`;
          let selectedSeat;

          // Prioritize manual selections from extrasData first
          if (isMultiCity) {
            selectedSeat =
              extrasData.multiCitySeats?.[`segment${segmentIndex}`]?.[
                passengerKey
              ];
          } else if (isRoundTrip && segmentIndex === 1) {
            // For return flights, try both passengerKey and return_passengerKey formats
            selectedSeat =
              extrasData.selectedReturnSeats?.[`return_${passengerKey}`] ||
              extrasData.selectedReturnSeats?.[passengerKey];
          } else {
            selectedSeat = extrasData.selectedSeats?.[passengerKey];
          }

          // If no manual selection, check auto-assigned seats for round-trip
          if (!selectedSeat && autoAssignResult?.isRoundTrip) {
            const autoSeatKey = `${passengerKey}_segment${segmentIndex + 1}`;
            const autoSeatNumber = finalSelectedSeats[autoSeatKey];

            if (autoSeatNumber) {
              // Get seatId from seat mapping
              const roundTripSeatKey = `${autoSeatNumber}_segment${
                segmentIndex + 1
              }`;
              const mappedSeatId =
                autoAssignResult.seatMapping[roundTripSeatKey];

              // Mark this as auto-assigned with STANDARD type and seatId
              selectedSeat = {
                seatId: mappedSeatId,
                seatNumber: autoSeatNumber,
                seatType: "STANDARD", // Force STANDARD for auto-assigned seats
                autoAssigned: true,
                priceVND: 0,
              };

              console.log(
                `🎲 Using auto-assigned STANDARD seat for ${passengerKey} segment ${
                  segmentIndex + 1
                }:`,
                {
                  autoSeatNumber,
                  roundTripSeatKey,
                  mappedSeatId,
                  selectedSeat,
                }
              );
            }
          }

          // If no manual selection, check processed seat assignments
          if (!selectedSeat) {
            const segmentAssignment =
              processedExtrasData?.seatAssignments?.find(
                (assignment) =>
                  assignment.passengerIndex === passengerIndex &&
                  assignment.flightId === segment.flightId
              );

            if (segmentAssignment) {
              selectedSeat = {
                seatId: segmentAssignment.seatId,
                seatNumber: segmentAssignment.seatNumber,
                seatType: "STANDARD", // Default for processed assignments
                autoAssigned: true,
              };
              console.log(
                `✅ Using processed seat assignment for ${passengerKey}:`,
                selectedSeat
              );
            } else {
              console.log(
                `🔄 No seat found for ${passengerKey}, will attempt auto-assignment`
              );
            }
          } else {
            console.log(
              `✅ Using manual seat selection for ${passengerKey}:`,
              selectedSeat
            );
          }

          console.log(
            `Seat selection debug for ${passengerKey} segment ${segmentIndex}:`,
            {
              isMultiCity,
              isRoundTrip,
              segmentIndex,
              selectedSeat,
              availableOutboundSeats: extrasData.selectedSeats,
              availableReturnSeats: extrasData.selectedReturnSeats,
            }
          );

          // Use segment's own flightId and travelClassId for accurate seat lookup
          const actualFlightId = segment.flightId;
          const actualTravelClassId = segment.travelClassId;

          // Get available seats for this segment (for seatId lookup)
          const availableSeatsResult =
            autoAssignResult?.availableSeatsData || [];
          const segmentSpecificSeats = autoAssignResult?.isRoundTrip
            ? availableSeatsResult.filter(
                (seat) => seat.segmentOrder === segmentIndex + 1
              )
            : availableSeatsResult;

          let seatId, seatType, seatNumber, seatPriceVND;

          // Check if selectedSeat already has complete data (from extras section)
          if (
            selectedSeat &&
            typeof selectedSeat === "object" &&
            selectedSeat.seatNumber
          ) {
            // Use data directly from extras section (manual selection or auto-assignment)
            seatId = selectedSeat.seatId;
            // For auto-assigned seats, force STANDARD type regardless of actual seat type
            seatType = selectedSeat.autoAssigned
              ? "STANDARD"
              : selectedSeat.seatType || "STANDARD";
            seatNumber = selectedSeat.seatNumber;
            seatPriceVND = selectedSeat.priceVND || 0;

            console.log(
              `✅ Using direct seat data from extras for ${passengerKey}:`,
              {
                seatId,
                seatType,
                seatNumber,
                seatPriceVND,
                originalSelectedSeat: selectedSeat,
              }
            );
          } else if (selectedSeat && typeof selectedSeat === "string") {
            // Handle legacy string format (seatNumber only)
            const seatResult = await getSeatIdFromMapping(
              selectedSeat,
              actualFlightId,
              actualTravelClassId
            );

            console.log(
              `Legacy seat format for ${passengerKey} in segment ${segment.segmentOrder}:`,
              {
                selectedSeat,
                seatResult,
              }
            );

            seatId = seatResult?.seatId || seatResult; // Handle both object and primitive return
            // For auto-assigned seats (string format), always force STANDARD type
            seatType = "STANDARD"; // Auto-assigned seats are always STANDARD
            seatNumber = seatResult?.seatNumber || selectedSeat;
            seatPriceVND = 0; // Auto-assigned seats are free

            // For round-trip auto-assigned seats, try to get seatId from mapping with segment key
            if (
              !seatId &&
              autoAssignResult?.isRoundTrip &&
              autoAssignResult?.seatMapping
            ) {
              const roundTripSeatKey = `${selectedSeat}_segment${
                segmentIndex + 1
              }`;
              seatId =
                autoAssignResult.seatMapping[roundTripSeatKey] ||
                autoAssignResult.seatMapping[selectedSeat];

              console.log(`🔄 Round-trip seat mapping for ${selectedSeat}:`, {
                roundTripSeatKey,
                mappedSeatId: seatId,
                availableMappingKeys: Object.keys(
                  autoAssignResult.seatMapping
                ).slice(0, 5),
              });
            }

            // If still no seatId, try to find it in segmentSpecificSeats for this flight
            if (
              !seatId &&
              segmentSpecificSeats &&
              segmentSpecificSeats.length > 0
            ) {
              const foundSeat = segmentSpecificSeats.find(
                (seat) =>
                  seat.seatNumber === selectedSeat &&
                  seat.seatType === "STANDARD" &&
                  seat.status === "AVAILABLE"
              );

              if (foundSeat) {
                seatId = foundSeat.seatId || foundSeat.id;
                console.log(
                  `🎯 Found seatId in segmentSpecificSeats for ${selectedSeat}:`,
                  {
                    foundSeat,
                    seatId,
                  }
                );
              }
            }
          } else {
            // No seat selected - try to auto-assign from available seats
            console.log(
              `⚡ No seat selected for ${passengerKey}, attempting auto-assignment`
            );

            // segmentSpecificSeats already defined above

            console.log("🔍 Available seats for auto-assignment:", {
              totalAvailable: availableSeatsResult.length,
              segmentSpecificCount: segmentSpecificSeats.length,
              isRoundTrip: autoAssignResult?.isRoundTrip,
              currentSegment: segmentIndex + 1,
              actualTravelClassId,
              availableSeats: segmentSpecificSeats.slice(0, 3), // Show first 3 for debugging
              seatTypes: [
                ...new Set(segmentSpecificSeats.map((s) => s.seatType)),
              ],
              statuses: [...new Set(segmentSpecificSeats.map((s) => s.status))],
              classIds: [
                ...new Set(segmentSpecificSeats.map((s) => s.classId)),
              ],
            });

            const standardSeats = segmentSpecificSeats.filter(
              (seat) =>
                seat.seatType === "STANDARD" &&
                seat.status === "AVAILABLE" &&
                (seat.travelClassId === actualTravelClassId ||
                  seat.classId === actualTravelClassId)
            );

            console.log("🎯 Filtered STANDARD seats:", {
              filteredCount: standardSeats.length,
              filter: {
                seatType: "STANDARD",
                status: "AVAILABLE",
                classId: actualTravelClassId,
              },
              sampleSeats: standardSeats.slice(0, 2),
              availableStandardSeatsOnly: availableSeatsResult
                .filter((s) => s.seatType === "STANDARD")
                .slice(0, 3),
              allSeatTypesInResult: [
                ...new Set(availableSeatsResult.map((s) => s.seatType)),
              ],
            });

            if (standardSeats.length > 0) {
              // Pick a random available STANDARD seat
              const randomSeat =
                standardSeats[Math.floor(Math.random() * standardSeats.length)];
              seatId = randomSeat.seatId || randomSeat.id;
              seatType = "STANDARD";
              seatNumber = randomSeat.seatNumber;
              seatPriceVND = 0; // STANDARD seats are free

              console.log(
                `🎲 Auto-assigned STANDARD seat for ${passengerKey}:`,
                {
                  seatId,
                  seatType,
                  seatNumber,
                  randomSeat,
                  randomSeatStructure: {
                    seatId: randomSeat.seatId,
                    id: randomSeat.id,
                    seatNumber: randomSeat.seatNumber,
                    seatType: randomSeat.seatType,
                    status: randomSeat.status,
                  },
                }
              );
            } else {
              console.warn(
                `⚠️ No STANDARD seats available for auto-assignment for ${passengerKey}`
              );
              seatId = null;
              seatType = null;
              seatNumber = null;
              seatPriceVND = 0;
            }
          }

          // Add seat assignment to passenger's seatAssignments array (NEW API FORMAT)
          // Backend only needs segmentOrder, seatId, and seatType
          console.log(`🔍 Pre-assignment validation for ${passengerKey}:`, {
            seatId,
            seatNumber,
            seatType,
            hasValidSeatId: !!seatId,
            hasValidSeatNumber: !!seatNumber,
            willAddAssignment: !!(seatId && seatNumber),
          });

          if (seatId && seatNumber) {
            const seatAssignment = {
              segmentOrder: segment.segmentOrder,
              seatId: seatId,
              seatType: seatType,
            };

            bookingData.passengers[passengerIndex].seatAssignments.push(
              seatAssignment
            );

            console.log(`✅ Added seat assignment for ${passengerKey}:`, {
              passengerName: `${formData.passengers[passengerIndex]?.firstName} ${formData.passengers[passengerIndex]?.lastName}`,
              seatNumber,
              seatType,
              seatId,
              segmentOrder: segment.segmentOrder,
              seatAssignment,
            });
          } else {
            console.error(
              `❌ Failed to assign seat for passenger ${
                passengerIndex + 1
              } in segment ${segment.segmentOrder}:`,
              { seatId, seatNumber, seatType, selectedSeat }
            );
          }
        }
      }

      // Build ancillary services from extrasData
      if (extrasData?.selectedAncillaryServices) {
        bookingData.ancillaryServices = Object.values(
          extrasData.selectedAncillaryServices
        ).map((serviceSelection) => ({
          serviceId: serviceSelection.serviceId,
          passengerId:
            serviceSelection.passengerId !== null
              ? serviceSelection.passengerId - 1
              : null, // Convert to 0-based indexing
          quantity: serviceSelection.quantity || 1,
          notes: serviceSelection.notes || "",
        }));
      }

      // Show debug info if enabled
      if (showDebug) {
        console.log("=== BOOKING DATA DEBUG (NEW API FORMAT) ===");
        console.log("User ID:", user?.id || "Not logged in");
        console.log(
          "Flight Type:",
          flight?.type ||
            (isMultiCity
              ? "MULTI_CITY"
              : isRoundTrip
              ? "ROUND_TRIP"
              : "ONE_WAY")
        );
        console.log(
          "Flight Segments Count:",
          bookingData.flightSegments.length
        );
        console.log(
          "Deal Applied:",
          dealApplied,
          "Deal Code:",
          dealCode,
          "Discount:",
          dealDiscount
        );
        console.log(
          "Points Applied:",
          pointsApplied,
          "Points Redeemed:",
          pointsToRedeem,
          "Points Discount:",
          pointsDiscount
        );
        console.log(
          "Original Amount:",
          currentTotalAmount,
          "Final Amount:",
          finalAmount
        );
        console.log("Selected Seats:", {
          regular: extrasData.selectedSeats || {},
          return: extrasData.selectedReturnSeats || {},
          multiCity: extrasData.multiCitySeats || {},
        });
        console.log(
          "Seat Assignment Results (NEW API FORMAT):",
          bookingData.passengers.map((p) => ({
            passenger: p.firstName + " " + p.lastName,
            seatAssignments: p.seatAssignments,
            baggagePackage: p.baggagePackage,
          }))
        );
        console.log(
          "Final Seat Assignments per Passenger:",
          bookingData.passengers.map((passenger, index) => ({
            passengerName: passenger.firstName + " " + passenger.lastName,
            totalSegments: bookingData.flightSegments.length,
            assignedSegments: passenger.seatAssignments.length,
            seatAssignments: passenger.seatAssignments.map((assignment) => ({
              segmentOrder: assignment.segmentOrder,
              seatId: assignment.seatId,
              seatType: assignment.seatType,
            })),
          }))
        );

        // Add full booking data log before API call
        console.log("=== FULL BOOKING DATA BEFORE API CALL ===");
        console.log("Full Booking Data:", JSON.stringify(bookingData, null, 2));
        console.log(
          "Flight Segments Details:",
          bookingData.flightSegments.map((segment) => ({
            segmentOrder: segment.segmentOrder,
            flightId: segment.flightId,
            classId: segment.classId,
            from: `${segment.departure.code} (${segment.departure.city})`,
            to: `${segment.arrival.code} (${segment.arrival.city})`,
            price: segment.price,
          }))
        );
        console.log(
          "🪑 Seat Assignments Summary:",
          bookingData.passengers.map((passenger, index) => ({
            passengerIndex: index,
            name: `${passenger.firstName} ${passenger.lastName}`,
            seatAssignmentsCount: passenger.seatAssignments.length,
            seats: passenger.seatAssignments.map((assignment) => ({
              segmentOrder: assignment.segmentOrder,
              seatId: assignment.seatId,
              seatType: assignment.seatType,
            })),
          }))
        );
        console.log(
          "Passenger Details (NEW API FORMAT):",
          bookingData.passengers.map((p) => ({
            name: `${p.firstName} ${p.lastName}`,
            type: p.type,
            passport: p.passportNumber,
            seatAssignments: p.seatAssignments,
            baggage: p.baggagePackage,
          }))
        );
        console.log(
          "Ancillary Services:",
          bookingData.ancillaryServices.length > 0
            ? bookingData.ancillaryServices
            : "No ancillary services selected"
        );
        console.log("Full Booking Data:", JSON.stringify(bookingData, null, 2));
        toast.info(
          "Check console for detailed booking data with new API format"
        );
      }

      // Debug: Log booking data being sent to backend
      console.log("=== BOOKING DATA SENT TO BACKEND ===");
      console.log("Payment Method:", currentPaymentMethod);
      console.log("Pay Later:", payLater);
      console.log("Full Booking Data:", JSON.stringify(bookingData, null, 2));

      const result = await bookingApi.createBooking(bookingData);

      if (result.success) {
        const bookingResponse = result.data;
        const bookingId = bookingResponse.bookingId;
        const bookingCode = bookingResponse.bookingCode;
        const checkoutUrl = bookingResponse.payment?.checkoutUrl;
        const method = result.data?.payment?.paymentMethod;

        // Clear localStorage after successful booking
        localStorage.removeItem("selectedFlight");
        localStorage.removeItem("extrasData");
        localStorage.removeItem("searchCriteria");

        // Store booking payment info for redirect handling
        const bookingPaymentInfo = {
          isBookingPayment: true,
          bookingCode: bookingCode,
          bookingId: bookingId,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          "booking_payment_info",
          JSON.stringify(bookingPaymentInfo)
        );
        localStorage.setItem(
          "booking_payment_info_backup",
          JSON.stringify(bookingPaymentInfo)
        );

        // Store booking confirmation (simplified)
        localStorage.setItem(
          "bookingConfirmation",
          JSON.stringify({
            ...bookingResponse,
            // Override discountAmount to prevent duplicate with pointsDiscountAmount
            discountAmount: pointsApplied
              ? 0
              : bookingResponse.discountAmount || 0,
            // Override appliedDealCode to prevent showing points voucher code
            appliedDealCode: pointsApplied
              ? ""
              : dealApplied
              ? dealCode
              : bookingResponse.appliedDealCode || "",
            flightType:
              flight?.type ||
              (isMultiCity
                ? "MULTI_CITY"
                : isRoundTrip
                ? "ROUND_TRIP"
                : "ONE_WAY"),
            isMultiCity,
            isRoundTrip,
            flight,
            fare,
            formData,
            extrasData: { ...extrasData, selectedSeats: finalSelectedSeats },
            assignedSeats: finalSelectedSeats,
            appliedDeal: dealApplied
              ? {
                  code: dealCode,
                  discount: dealDiscount,
                  originalAmount: currentTotalAmount,
                  finalAmount: finalAmount,
                }
              : null,
            pointsRedeemed: pointsApplied ? parseInt(pointsToRedeem) : 0,
            pointsDiscountAmount: pointsApplied ? pointsDiscount : 0,
            membershipDiscount: membershipDiscount,
            membershipTier:
              user?.loyaltyTier ||
              user?.membershipTier ||
              user?.tier ||
              "STANDARD",
          })
        );

        // Handle different payment flows
        if (payLater) {
          toast.success(
            `🎉 Đặt chỗ thành công! Mã đặt chỗ: ${bookingCode}. Bạn có 1 giờ để hoàn tất thanh toán.`
          );
          navigate("/confirm-booking");
        } else if (method === "PAYPAL") {
          if (checkoutUrl) {
            toast.success(
              "Bạn sẽ được chuyển hướng sang trang thanh toán PayPal."
            );
            window.location.href = checkoutUrl;
          } else {
            toast.error("Không thể tạo liên kết thanh toán PayPal");
          }
        } else {
          toast.success("Bạn sẽ được chuyển hướng sang trang QR thanh toán.");
          navigate("/qr-pay", {
            state: { checkoutUrl, bookingCode },
          });
        }
      } else {
        console.error("Booking API Error:", result);
        toast.error(result.message || "Có lỗi xảy ra khi đặt vé");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Có lỗi xảy ra khi đặt vé. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const priceBreakdown = {
    baseFare: calculatePassengerTotal(),
    seatSelection: extrasData?.seatTotal || 0,
    extraBaggage: extrasData?.baggageTotal || 0,
    services: extrasData?.servicesTotal || 0,
    total: currentTotalAmount,
  };

  // Optimized payment handler
  const handlePayment = () => {
    if (!agreeTerms) {
      alert("Vui lòng chấp nhận Điều khoản và Điều kiện.");
      return;
    }
    alert(
      `Thanh toán thành công! Tổng cộng: ${formatCurrencyVND(
        priceBreakdown.total
      )}`
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 sm:py-8">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 dark:text-white">
          Xem Lại & Thanh Toán
        </h2>
        <p className="text-gray-600 text-sm sm:text-base dark:text-gray-300">
          Vui lòng xem lại thông tin đặt vé và hoàn tất thanh toán
        </p>
      </div>

      {/* Booking Summary Info - Responsive Grid */}
      <div className="mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-gray-900 rounded-lg">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-sm sm:text-base">
          📋 Tóm tắt đặt vé
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="space-y-1">
            <span className="text-gray-600 dark:text-gray-300 block">
              Chuyến bay:
            </span>
            <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
              {flight?.type === "MULTI_CITY"
                ? flight?.flightNumber ||
                  `Multi-City (${flight?.legs?.length || 0} chặng)`
                : flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? `${flight.outboundFlight?.flightNumber} / ${flight.returnFlight?.flightNumber}`
                : flight?.flightNumber || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-gray-600 dark:text-gray-300 block">
              Loại vé:
            </span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {flight?.type === "MULTI_CITY"
                ? `Đa thành phố (${flight?.legs?.length || 0} chặng)`
                : flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                ? "Khứ hồi"
                : "Một chiều"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-gray-600 dark:text-gray-300 block">
              Hành khách:
            </span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formData.passengers.length} người
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-gray-600 dark:text-gray-300 block">
              Ghế đã chọn:
            </span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {(() => {
                const selectedSeatsCount =
                  Object.keys(extrasData?.selectedSeats || {}).length +
                  Object.keys(extrasData?.selectedReturnSeats || {}).length;
                const totalSeatsNeeded =
                  formData.passengers.length *
                  (flight?.type === "MULTI_CITY"
                    ? flight?.legs?.length || 1
                    : flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                    ? 2
                    : 1);
                return `${selectedSeatsCount}/${totalSeatsNeeded}`;
              })()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
        {/* Left Section: Flight and Passenger Details */}
        <div className="w-full xl:w-2/3 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl dark:text-white">
                Chi Tiết Chuyến Bay
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-sm sm:text-base">
              {/* Multi-City Flight */}
              {flight?.type === "MULTI_CITY" && flight?.legs ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">
                      🗺️ Chuyến bay đa thành phố ({flight.legs.length} chặng)
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowOutboundDetails(!showOutboundDetails)
                      }
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {showOutboundDetails ? "Thu gọn" : "Mở rộng"}
                    </Button>
                  </div>
                  {showOutboundDetails && (
                    <div className="space-y-4">
                      {flight.legs.map((leg, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-purple-700">
                              Chặng {index + 1}: {leg.departureAirport?.code} →{" "}
                              {leg.arrivalAirport?.code}
                            </h5>
                            <span className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">
                              {leg.flightNumber}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 items-center">
                            <div>
                              <p className="font-semibold">
                                {leg.departureTime}
                              </p>
                              <p className="text-sm">
                                {leg.departureAirport?.airportName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {leg.departureDate}
                              </p>
                            </div>
                            <div className="text-center">
                              <div className="w-full h-0.5 bg-purple-300 mb-1"></div>
                              <p className="text-xs text-gray-500">
                                {leg.duration} phút
                              </p>
                              <p className="text-xs text-purple-600">
                                {leg.airline || leg.airlineName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{leg.arrivalTime}</p>
                              <p className="text-sm">
                                {leg.arrivalAirport?.airportName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {leg.arrivalDate}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>Máy bay: {leg.aircraft || leg.aircraftName}</p>
                            <p>
                              Hạng vé:{" "}
                              {leg.selectedClass?.travelClass?.className ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="bg-purple-100 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-purple-800">
                            Tổng thời gian hành trình:
                          </span>
                          <span className="font-bold text-purple-600">
                            {flight.totalDuration
                              ? `${flight.totalDuration} phút`
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Outbound Flight - Original Logic */
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-blue-800">
                      ✈️ Chuyến bay{" "}
                      {flight.type === "ROUND_TRIP" ? "chiều đi" : ""}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowOutboundDetails(!showOutboundDetails)
                      }
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {showOutboundDetails ? "Thu gọn" : "Mở rộng"}
                    </Button>
                  </div>
                  {showOutboundDetails && (
                    <>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div>
                          <p className="font-semibold">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.departureTime
                              : flight?.flight.departureTime}
                          </p>
                          <p className="text-sm">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.departureAirport
                                  ?.airportName || flight.outboundFlight?.from
                              : flight?.flight.departureAirport?.airportName ||
                                "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.departureDate
                              : flight?.flight.departureDate}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-full h-0.5 bg-gray-300 mb-1"></div>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? `${flight.outboundFlight?.duration} phút`
                              : `${flight?.flight.duration} phút`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.flightNumber
                              : flight?.flight.flightNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.arrivalTime
                              : flight?.flight.arrivalTime}
                          </p>
                          <p className="text-sm">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.arrivalAirport
                                  ?.airportName || flight.outboundFlight?.to
                              : flight?.flight.arrivalAirport?.airportName ||
                                "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {flight?.isRoundTrip ||
                            flight?.type === "ROUND_TRIP"
                              ? flight.outboundFlight?.arrivalDate
                              : flight?.flight.arrivalDate}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          Hãng bay:{" "}
                          {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? getAirlineDisplayName(
                                flight.outboundFlight?.airline ||
                                  flight.outbound
                              )
                            : getAirlineDisplayName(flight?.airline || flight)}
                        </p>
                        <p>
                          Máy bay:{" "}
                          {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? getAircraftDisplayName(
                                flight.outboundFlight?.aircraft?.aircraftName,
                                flight
                              )
                            : getAircraftDisplayName(
                                flight?.flight?.aircraft || flight?.aircraft,
                                flight
                              )}
                        </p>
                        <p>
                          Hạng vé:{" "}
                          {flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? flight.outboundFlight?.selectedClass.travelClass
                                ?.className
                            : fare?.travelClass?.className}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Return Flight */}
              {(flight?.isRoundTrip || flight?.type === "ROUND_TRIP") &&
                flight.returnFlight && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-800">
                        ✈️ Chuyến bay chiều về
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReturnDetails(!showReturnDetails)}
                        className="text-green-600 hover:text-green-800"
                      >
                        {showReturnDetails ? "Thu gọn" : "Mở rộng"}
                      </Button>
                    </div>
                    {showReturnDetails && (
                      <>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div>
                            <p className="font-semibold">
                              {flight.returnFlight?.departureTime}
                            </p>
                            <p className="text-sm">
                              {
                                flight.returnFlight?.departureAirport
                                  .airportName
                              }
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.returnFlight?.departureDate}
                            </p>
                          </div>
                          <div className="text-center">
                            <div className="w-full h-0.5 bg-gray-300 mb-1"></div>
                            <p className="text-xs text-gray-500">
                              {flight.returnFlight?.duration} phút
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.returnFlight?.flightNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {flight.returnFlight?.arrivalTime}
                            </p>
                            <p className="text-sm">
                              {flight.returnFlight?.arrivalAirport?.airportName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {flight.returnFlight?.arrivalDate}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            Hãng bay:{" "}
                            {getAirlineDisplayName(
                              flight.returnFlight?.airline || flight.return
                            )}
                          </p>
                          <p>
                            Máy bay:{" "}
                            {flight.returnFlight?.aircraft?.aircraftName ||
                              "N/A"}
                          </p>
                          <p>
                            Hạng vé:{" "}
                            {
                              flight.returnFlight?.selectedClass.travelClass
                                ?.className
                            }
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Hành Khách</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.passengers.map((passenger, index) => (
                <p key={index} className="mb-2">
                  {passenger.firstName || passenger.lastName
                    ? `${passenger.firstName || ""} ${
                        passenger.lastName || ""
                      }`.trim()
                    : `Hành khách ${index + 1}`}{" "}
                  <span className="text-gray-500">
                    (
                    {passenger.type === "ADULT"
                      ? "Người lớn"
                      : passenger.type === "CHILD"
                      ? "Trẻ em"
                      : "Em bé"}
                    )
                  </span>
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Chi Tiết Giá Bao Gồm Hành lý, Dịch Vụ Đã Chọn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Flight Info */}
              <div className="text-sm mb-4">
                {flight?.isRoundTrip || flight?.type === "ROUND_TRIP" ? (
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-blue-700">
                        Chuyến bay chiều đi
                      </p>
                      <p className="text-gray-600">
                        {flight.outboundFlight?.departureAirport?.code} →{" "}
                        {flight.outboundFlight?.arrivalAirport?.code}
                      </p>
                      <p className="text-gray-600">
                        {flight.selectedOutboundFare?.travelClass?.className}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">
                        Chuyến bay chiều về
                      </p>
                      <p className="text-gray-600">
                        {flight.returnFlight?.departureAirport?.code} →{" "}
                        {flight.returnFlight?.arrivalAirport?.code}
                      </p>
                      <p className="text-gray-600">
                        {flight.selectedReturnFare?.travelClass?.className}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600">
                      Hạng vé:{" "}
                      {flight?.legs && flight.legs.length > 0
                        ? flight.legs
                            .map((leg) => leg.segmentFare?.className)

                            .filter((name) => name)
                            .join(" + ")
                        : fare?.travelClass?.className ||
                          flight?.legs?.[0]?.segmentFare?.className}
                    </p>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Passenger Names */}
              <div className="space-y-2 mb-4">
                <h5 className="font-semibold text-gray-700">Hành Khách:</h5>
                {formData.passengers.map((passenger, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {passenger.firstName} {passenger.lastName} (
                      {passenger.type === "ADULT"
                        ? "Người lớn"
                        : passenger.type === "CHILD"
                        ? "Trẻ em"
                        : "Em bé"}
                      )
                    </span>
                    <div className="text-right">
                      <div className="space-y-1">
                        {/* Outbound Seat */}
                        <span className="text-gray-500 text-xs block">
                          Ghế đi:{" "}
                          {(() => {
                            const selectedSeat =
                              extrasData?.selectedSeats?.[
                                `passenger${index + 1}`
                              ];
                            const autoSeat =
                              autoAssignedSeats?.[`passenger${index + 1}`];

                            if (selectedSeat) {
                              return typeof selectedSeat === "object"
                                ? selectedSeat.seatNumber
                                : selectedSeat;
                            }
                            if (autoSeat) {
                              return typeof autoSeat === "object"
                                ? autoSeat.seatNumber
                                : autoSeat;
                            }
                            return "Tự động";
                          })()}
                        </span>

                        {/* Return Seat for Round Trip */}
                        {(flight?.isRoundTrip ||
                          flight?.type === "ROUND_TRIP") && (
                          <span className="text-gray-500 text-xs block">
                            Ghế về:{" "}
                            {(() => {
                              const selectedReturnSeat =
                                extrasData?.selectedReturnSeats?.[
                                  `return_passenger${index + 1}`
                                ] ||
                                extrasData?.selectedReturnSeats?.[
                                  `passenger${index + 1}`
                                ];

                              if (selectedReturnSeat) {
                                return typeof selectedReturnSeat === "object"
                                  ? selectedReturnSeat.seatNumber
                                  : selectedReturnSeat;
                              }
                              return "Tự động";
                            })()}
                          </span>
                        )}
                      </div>

                      {/* Aircraft and Seat Layout Info */}
                      {(extrasData?.selectedSeats?.[`passenger${index + 1}`] ||
                        autoAssignedSeats?.[`passenger${index + 1}`] ||
                        extrasData?.selectedReturnSeats?.[
                          `return_passenger${index + 1}`
                        ] ||
                        extrasData?.selectedReturnSeats?.[
                          `passenger${index + 1}`
                        ]) && (
                        <span className="text-xs text-blue-500">
                          {flight?.aircraft ||
                            flight?.outboundFlight?.aircraft?.aircraftName ||
                            flight?.flight?.aircraft ||
                            "N/A"}{" "}
                          |{" "}
                          {flight?.seatLayout ||
                            flight?.outboundFlight?.seatLayout ||
                            flight?.flight?.seatLayout ||
                            "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Membership Information */}
              {(() => {
                const membersWithValidCodes = formData.passengers.filter(
                  (passenger, index) =>
                    passenger.membershipCode && passenger.membershipData?.valid
                );

                if (membersWithValidCodes.length > 0) {
                  const totalMembershipPoints = membersWithValidCodes.reduce(
                    (sum, p) => sum + (p.membershipData.currentPoints || 0),
                    0
                  );
                  const minPointsRequired =
                    pointsRates?.minPointsRedemption || 1000; // Default to 1000 if not loaded
                  const canUseMembershipPoints =
                    totalMembershipPoints >= minPointsRequired;

                  return (
                    <div className="space-y-2 mb-4">
                      <h5 className="font-semibold text-gray-700">
                        Thông Tin Hội Viên:
                      </h5>
                      {membersWithValidCodes.map((passenger, passengerIdx) => (
                        <div
                          key={passengerIdx}
                          className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-800">
                                {passenger.firstName} {passenger.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Mã hội viên:{" "}
                                <span className="font-mono font-semibold text-orange-600">
                                  {passenger.membershipCode}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                {passenger.membershipData.tier}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Điểm hiện tại:
                            </span>
                            <span className="font-semibold text-orange-600">
                              {passenger.membershipData.currentPoints?.toLocaleString() ||
                                0}{" "}
                              điểm
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {canUseMembershipPoints
                              ? `🎁 Có thể sử dụng điểm này để giảm giá đơn hàng`
                              : `✈️ Tích điểm từ chuyến bay này và sử dụng để giảm giá lần sau`}
                          </div>
                        </div>
                      ))}

                      {/* Membership Points Summary */}
                      {totalMembershipPoints > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-sm font-medium text-blue-800">
                                Tổng điểm hội viên có thể sử dụng:
                              </span>
                              <p className="text-xs text-blue-600 mt-1">
                                {canUseMembershipPoints
                                  ? `✅ Đủ điều kiện đổi điểm (tối thiểu ${minPointsRequired} điểm)`
                                  : `⚠️ Cần thêm ${
                                      minPointsRequired - totalMembershipPoints
                                    } điểm để đổi (tối thiểu ${minPointsRequired} điểm)`}
                              </p>
                            </div>
                            <span className="text-lg font-bold text-blue-800">
                              {totalMembershipPoints.toLocaleString()} điểm
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Baggage Info */}
              {extrasData?.baggage &&
                Object.values(extrasData.baggage).some(
                  (pkg) => pkg !== "NONE"
                ) && (
                  <div className="space-y-2 mb-4">
                    <h5 className="font-semibold text-gray-700">
                      Hành Lý Ký Gửi:
                    </h5>
                    {formData.passengers
                      .map((passenger, index) => {
                        const baggagePackage =
                          extrasData.baggage[`passenger${index + 1}`];
                        if (baggagePackage && baggagePackage !== "NONE") {
                          const packageInfo = BAGGAGE_PACKAGES[baggagePackage];
                          return (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm py-1"
                            >
                              <div className="flex-1">
                                <span className="text-gray-600">
                                  {passenger.firstName || passenger.lastName
                                    ? `${passenger.firstName || ""} ${
                                        passenger.lastName || ""
                                      }`.trim()
                                    : `Hành khách ${index + 1}`}
                                  :
                                </span>
                                <span className="text-green-600 font-medium ml-1">
                                  Gói {packageInfo.label}
                                </span>
                              </div>
                              <span className="text-blue-600 font-medium">
                                {formatCurrencyVND(packageInfo.price)}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })
                      .filter(Boolean)}
                    <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
                      <span>Tổng hành lý:</span>
                      <span className="text-blue-600">
                        {formatCurrencyVND(extrasData.baggageTotal || 0)}
                      </span>
                    </div>
                  </div>
                )}

              <Separator className="my-4" />

              {/* Passengers */}
              {(() => {
                // Calculate passenger pricing for both one-way and round-trip
                const passengerCounts = formData.passengers.reduce(
                  (counts, passenger) => {
                    counts[passenger.type] = (counts[passenger.type] || 0) + 1;
                    return counts;
                  },
                  {}
                );

                const baseAdultPrice = fare?.price || fare?.basePrice || 0;
                const isRoundTrip =
                  flight?.isRoundTrip || flight?.type === "ROUND_TRIP";

                return (
                  <div className="space-y-1 mb-2">
                    {Object.entries(passengerCounts).map(([type, count]) => {
                      const multiplier = getPassengerMultiplier(type);
                      const pricePerPassenger = baseAdultPrice * multiplier;
                      const totalPricePerType = pricePerPassenger * count;

                      const typeLabel =
                        type === "ADULT"
                          ? "Người lớn"
                          : type === "CHILD"
                          ? "Trẻ em"
                          : "Em bé";

                      const segmentText = isRoundTrip ? " (khứ hồi)" : "";
                      const multiplierText =
                        multiplier === 1
                          ? "100%"
                          : multiplier === 0.75
                          ? "75%"
                          : "10%";

                      return (
                        <div
                          key={type}
                          className="flex justify-between text-sm mb-2"
                        >
                          <span>
                            {count} {typeLabel} ({multiplierText}){segmentText}
                          </span>
                          <span>
                            {formatCurrencyVND(pricePerPassenger)} × {count} ={" "}
                            {formatCurrencyVND(totalPricePerType)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Extras */}
              {extrasData?.selectedSeats &&
                Object.keys(extrasData.selectedSeats).length > 0 && (
                  <div className="flex justify-between text-sm mb-2">
                    <span>Chỗ ngồi</span>
                    <span>
                      {formatCurrencyVND(
                        (extrasData.seatTotal || 0) +
                          (flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? extrasData?.returnSeatTotal || 0
                            : 0)
                      )}
                    </span>
                  </div>
                )}

              {extrasData?.baggage &&
                Object.values(extrasData.baggage).some(
                  (bag) => bag.firstBag > 0 || bag.secondBag > 0
                ) && (
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">🧳 Hành lý</span>
                      <span className="font-medium">
                        {formatCurrencyVND(extrasData.baggageTotal || 0)}
                      </span>
                    </div>
                    {/* Baggage breakdown by passenger */}
                    <div className="ml-4 space-y-1">
                      {Object.entries(extrasData.baggage).map(
                        ([passengerKey, baggageInfo], index) => {
                          if (!baggageInfo.firstBag && !baggageInfo.secondBag)
                            return null;

                          const passengerIndex = parseInt(
                            passengerKey.replace("passenger_", "")
                          );
                          const passenger = formData.passengers[passengerIndex];
                          const passengerName = passenger
                            ? `${passenger.firstName} ${passenger.lastName}`.trim()
                            : `Hành khách ${passengerIndex + 1}`;

                          const segmentCount =
                            flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                              ? 2
                              : 1;

                          let baggageItems = [];
                          if (baggageInfo.firstBag > 0) {
                            const totalPrice =
                              baggageInfo.firstBag * segmentCount;
                            baggageItems.push(
                              `${
                                baggageInfo.firstBagWeight
                              }kg (${formatCurrencyVND(totalPrice)})`
                            );
                          }
                          if (baggageInfo.secondBag > 0) {
                            const totalPrice =
                              baggageInfo.secondBag * segmentCount;
                            baggageItems.push(
                              `${
                                baggageInfo.secondBagWeight
                              }kg (${formatCurrencyVND(totalPrice)})`
                            );
                          }

                          return (
                            <div
                              key={passengerKey}
                              className="text-xs text-gray-600"
                            >
                              <span className="font-medium">
                                {passengerName}:
                              </span>{" "}
                              {baggageItems.join(" + ")}
                              {segmentCount > 1 && (
                                <span className="text-orange-600 ml-1">
                                  (× {segmentCount} chặng)
                                </span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {extrasData?.selectedAncillaryServices &&
                Object.keys(extrasData.selectedAncillaryServices).length >
                  0 && (
                  <div className="space-y-1 mb-2">
                    <span className="text-sm font-medium">
                      🛎️ Dịch vụ đi kèm:
                    </span>
                    {Object.values(extrasData.selectedAncillaryServices).map(
                      (service, index) => {
                        const serviceInfo =
                          extrasData.availableAncillaryServices?.find(
                            (s) => s.serviceId === service.serviceId
                          );
                        const passengerName = service.passengerId
                          ? `${
                              formData.passengers[service.passengerId - 1]
                                ?.firstName || ""
                            } ${
                              formData.passengers[service.passengerId - 1]
                                ?.lastName || ""
                            }`.trim()
                          : "Toàn booking";

                        // Calculate total price considering segments and passengers correctly
                        const segmentCount =
                          flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? 2
                            : 1;
                        const isPerSegment = serviceInfo?.isPerSegment;
                        const isPerPassenger = serviceInfo?.isPerPassenger;
                        const basePrice = serviceInfo?.price || 0;
                        const quantity = service.quantity || 1;
                        const hasSpecificPassenger =
                          service.passengerId !== null &&
                          service.passengerId !== undefined;

                        let totalPrice = basePrice * quantity;

                        if (hasSpecificPassenger) {
                          // Dịch vụ cho 1 hành khách cụ thể - chỉ nhân với segment nếu isPerSegment = true
                          if (isPerSegment) {
                            totalPrice *= segmentCount;
                          }
                        } else {
                          // Dịch vụ cho toàn booking
                          // Nhân với số hành khách nếu isPerPassenger = true
                          if (isPerPassenger) {
                            totalPrice *= formData.passengers.length;
                          }

                          // Nhân với số chặng nếu isPerSegment = true
                          if (isPerSegment) {
                            totalPrice *= segmentCount;
                          }
                        }

                        return (
                          <div key={index} className="ml-4 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {serviceInfo?.serviceName ||
                                  `Dịch vụ ${service.serviceId}`}
                                {quantity > 1 && ` (×${quantity})`}
                                {hasSpecificPassenger &&
                                  isPerSegment &&
                                  segmentCount > 1 && (
                                    <span className="text-orange-600">
                                      {" "}
                                      (×{segmentCount} chặng)
                                    </span>
                                  )}
                                {!hasSpecificPassenger && isPerPassenger && (
                                  <span className="text-blue-600">
                                    {" "}
                                    (×{formData.passengers.length} người)
                                  </span>
                                )}
                                {!hasSpecificPassenger &&
                                  isPerSegment &&
                                  segmentCount > 1 && (
                                    <span className="text-orange-600">
                                      {" "}
                                      (×{segmentCount} chặng)
                                    </span>
                                  )}
                              </span>
                              <span className="font-medium">
                                {formatCurrencyVND(totalPrice)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 ml-2">
                              {passengerName}
                              {hasSpecificPassenger
                                ? isPerSegment
                                  ? " - Tính theo chặng cho hành khách này"
                                  : " - Dịch vụ cho hành khách này"
                                : isPerPassenger && isPerSegment
                                ? " - Tính theo hành khách và chặng"
                                : isPerPassenger
                                ? " - Tính theo số hành khách"
                                : isPerSegment
                                ? " - Tính theo chặng"
                                : " - Giá cố định cho booking"}
                              {service.notes && ` - ${service.notes}`}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

              <Separator className="my-4" />

              {/* Seat Charges */}
              {(extrasData?.seatTotal || 0) +
                (flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                  ? extrasData?.returnSeatTotal || 0
                  : 0) >
                0 && (
                <div className="space-y-1 mb-2">
                  <span className="text-sm font-medium">
                    💺 Phụ phí ghế ngồi:
                  </span>
                  {/* Outbound seats */}
                  {Object.keys(extrasData?.selectedSeats || {}).length > 0 && (
                    <div className="ml-4 text-sm text-gray-600">
                      Chiều đi:{" "}
                      {formatCurrencyVND(
                        Object.entries(extrasData.selectedSeats).reduce(
                          (total, [passengerKey, seatInfo]) => {
                            // Handle both new format (object) and old format (string)
                            if (
                              typeof seatInfo === "object" &&
                              seatInfo.priceVND !== undefined
                            ) {
                              return total + (seatInfo.priceVND || 0);
                            } else if (typeof seatInfo === "string") {
                              const seatDetail =
                                seatDetails[seatInfo] ||
                                allAvailableSeats?.find(
                                  (seat) => seat.seatNumber === seatInfo
                                );
                              return total + (seatDetail?.priceVND || 0);
                            }
                            return total;
                          },
                          0
                        )
                      )}
                    </div>
                  )}
                  {/* Return seats for round-trip */}
                  {(flight?.isRoundTrip || flight?.type === "ROUND_TRIP") &&
                    Object.keys(extrasData?.selectedReturnSeats || {}).length >
                      0 && (
                      <div className="ml-4 text-sm text-gray-600">
                        Chiều về:{" "}
                        {formatCurrencyVND(
                          Object.entries(extrasData.selectedReturnSeats).reduce(
                            (total, [passengerKey, seatInfo]) => {
                              // Handle both new format (object) and old format (string)
                              if (
                                typeof seatInfo === "object" &&
                                seatInfo.priceVND !== undefined
                              ) {
                                return total + (seatInfo.priceVND || 0);
                              } else if (typeof seatInfo === "string") {
                                const seatDetail =
                                  seatDetails[seatInfo] ||
                                  allAvailableSeats?.find(
                                    (seat) => seat.seatNumber === seatInfo
                                  );
                                return total + (seatDetail?.priceVND || 0);
                              }
                              return total;
                            },
                            0
                          )
                        )}
                      </div>
                    )}
                  {/* Auto-assigned seats - Hidden as requested */}
                  {/* {Object.keys(autoAssignedSeats).length > 0 && (
                    <div className="ml-4 text-sm text-gray-600">
                      Ghế tự động:{" "}
                      {formatCurrencyVND(
                        Object.entries(autoAssignedSeats).reduce(
                          (total, [passengerKey, seatInfo]) => {
                            // Handle both new format (object) and old format (string)
                            if (
                              typeof seatInfo === "object" &&
                              seatInfo.priceVND !== undefined
                            ) {
                              return total + (seatInfo.priceVND || 0);
                            } else if (typeof seatInfo === "string") {
                              const seatDetail =
                                seatDetails[seatInfo] ||
                                allAvailableSeats?.find(
                                  (seat) => seat.seatNumber === seatInfo
                                );
                              return total + (seatDetail?.priceVND || 0);
                            }
                            return total;
                          },
                          0
                        )
                      )}
                    </div>
                  )} */}
                  <div className="flex justify-between text-sm ml-4 font-medium border-t pt-1 mt-1">
                    <span>Tổng phụ phí ghế:</span>
                    <span>
                      {formatCurrencyVND(
                        (extrasData?.seatTotal || 0) +
                          (flight?.isRoundTrip || flight?.type === "ROUND_TRIP"
                            ? extrasData?.returnSeatTotal || 0
                            : 0)
                      )}
                    </span>
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              {/* Points Redemption Section */}
              {(() => {
                const hasUser = !!user;
                const hasMembershipCode = formData.passengers.some(
                  (p) => p.membershipCode && p.membershipData?.valid
                );
                const hasPointsRates = !!pointsRates;

                console.log("🎁 Points Redemption Debug:", {
                  hasUser,
                  hasMembershipCode,
                  hasPointsRates,
                  userPoints,
                  passengers: formData.passengers.map((p) => ({
                    name: `${p.firstName} ${p.lastName}`,
                    membershipCode: p.membershipCode,
                    membershipData: p.membershipData,
                    hasValid: p.membershipData?.valid,
                    points: p.membershipData?.currentPoints,
                  })),
                });

                // Show if user is logged in OR has valid membership code (regardless of points amount)
                return (hasUser || hasMembershipCode) && hasPointsRates;
              })() && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-700">
                      Đổi điểm giảm giá
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({userPoints.toLocaleString()} điểm khả dụng
                      {(() => {
                        const userLoyaltyPoints = user?.loyaltyPoints || 0;
                        const membershipPoints = formData.passengers
                          .filter(
                            (p) =>
                              p.membershipData?.valid &&
                              p.membershipData?.currentPoints
                          )
                          .reduce(
                            (sum, p) =>
                              sum + (p.membershipData.currentPoints || 0),
                            0
                          );

                        if (userLoyaltyPoints > 0 && membershipPoints > 0) {
                          return ` = ${userLoyaltyPoints.toLocaleString()} (tài khoản) + ${membershipPoints.toLocaleString()} (hội viên)`;
                        } else if (userLoyaltyPoints > 0) {
                          return ` từ tài khoản`;
                        } else if (membershipPoints > 0) {
                          return ` từ hội viên`;
                        }
                        return "";
                      })()}
                      )
                    </span>
                  </div>

                  {/* Points Rate Info */}
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      Quy tắc đổi điểm: {pointsRates.pointsPer10kVnd} điểm ={" "}
                      {formatCurrencyVND(pointsRates.vndPer100Points)} giảm giá
                    </p>
                    <p className="text-xs mb-1">Điểm tối thiểu: 500 điểm</p>
                    <p className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      ⚠️ Điểm đổi không được vượt quá tổng tiền đơn hàng (
                      {formatCurrencyVND(currentTotalAmount - dealDiscount)})
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pointsRates.suggestedTiers &&
                        Object.entries(pointsRates.suggestedTiers).map(
                          ([points, discount]) => (
                            <span
                              key={points}
                              className="bg-blue-100 px-2 py-1 rounded text-xs"
                            >
                              {points}đ → {formatCurrencyVND(discount)}
                            </span>
                          )
                        )}
                    </div>
                  </div>

                  {/* Points Input */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Nhập số điểm để đổi giảm giá (tối thiểu 500)"
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsChange(e.target.value)}
                      disabled={pointsApplied}
                      min="500"
                      max={userPoints}
                      className="flex-1 dark:text-black"
                    />
                    {!pointsApplied ? (
                      <Button
                        onClick={handleRedeemPoints}
                        disabled={
                          redeemingPoints || !canRedeem || !pointsToRedeem
                        }
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {redeemingPoints ? "Đang xử lý..." : "Đổi điểm"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRemovePoints}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        Hủy
                      </Button>
                    )}
                  </div>

                  {/* Points Preview */}
                  {pointsToRedeem && (
                    <div className="text-sm">
                      {canRedeem ? (
                        <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded">
                          <span>
                            ✓ {pointsToRedeem} điểm ={" "}
                            {formatCurrencyVND(pointsDiscount)} giảm giá
                          </span>
                        </div>
                      ) : (
                        <div className="text-red-600 bg-red-50 p-2 rounded">
                          {pointsError ||
                            `Không đủ điểm hoặc ít hơn 500 điểm tối thiểu`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Points Applied Success */}
                  {pointsApplied && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex justify-between text-sm text-orange-800 mb-2">
                        <span>
                          ✓ Đã đổi {pointsToRedeem} điểm thành giảm giá
                        </span>
                        <span className="font-bold">
                          -{formatCurrencyVND(pointsDiscount)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Giảm giá trực tiếp cho đơn hàng này</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator className="my-4" />

              {/* Deal Code Section */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã giảm giá (VD: STUDENT10)"
                    value={dealCode}
                    onChange={(e) => setDealCode(e.target.value.toUpperCase())}
                    disabled={dealApplied}
                    className="flex-1 dark:text-black"
                  />
                  {!dealApplied ? (
                    <Button
                      onClick={handleApplyDeal}
                      disabled={applyingDeal || !dealCode.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {applyingDeal ? "Đang xử lý..." : "Áp dụng"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRemoveDeal}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </Button>
                  )}
                </div>

                {dealError && (
                  <p className="text-red-500 text-sm">{dealError}</p>
                )}

                {dealApplied && appliedDealInfo && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between text-sm text-green-800 mb-2">
                      <span>✓ Mã giảm giá "{dealCode}" đã áp dụng</span>
                      <span className="font-bold">
                        -{formatCurrencyVND(dealDiscount)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>
                        <strong>{appliedDealInfo.title}</strong>
                      </p>
                      <p>{appliedDealInfo.description}</p>
                      <div className="flex justify-between">
                        <span>Giảm {appliedDealInfo.discountPercentage}%</span>
                        {appliedDealInfo.maxDiscountAmount && (
                          <span>
                            Tối đa{" "}
                            {formatCurrencyVND(
                              appliedDealInfo.maxDiscountAmount
                            )}
                          </span>
                        )}
                      </div>
                      {appliedDealInfo.remainingUsage && (
                        <p className="text-orange-600">
                          Còn lại {appliedDealInfo.remainingUsage} lượt sử dụng
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {(dealApplied || pointsApplied || membershipDiscount > 0) && (
                <div className="flex justify-between text-sm mb-2">
                  <span>Tạm tính</span>
                  <span>{formatCurrencyVND(currentTotalAmount)}</span>
                </div>
              )}

              {membershipDiscount > 0 && (
                <div className="flex justify-between text-sm mb-2 text-purple-600">
                  <span>
                    Ưu đãi giảm giá hội viên (
                    {user?.loyaltyTier ||
                      user?.membershipTier ||
                      user?.tier ||
                      userMembershipTier ||
                      "STANDARD"}
                    )
                  </span>
                  <span>-{formatCurrencyVND(membershipDiscount)}</span>
                </div>
              )}

              {dealApplied && (
                <div className="flex justify-between text-sm mb-2 text-green-600">
                  <span>Giảm giá (mã {dealCode})</span>
                  <span>-{formatCurrencyVND(dealDiscount)}</span>
                </div>
              )}

              {pointsApplied && (
                <div className="flex justify-between text-sm mb-2 text-orange-600">
                  <span>Giảm giá (đổi {pointsToRedeem} điểm)</span>
                  <span>-{formatCurrencyVND(pointsDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">
                  {formatCurrencyVND(finalAmount)}
                </span>
              </div>

              {finalAmount === 0 && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-2">
                  <p className="text-green-800 text-sm font-medium">
                    🎉 Tuyệt vời! Đơn hàng của bạn đã được giảm 100% nhờ các ưu
                    đãi.
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    Bạn chỉ cần xác nhận đặt vé mà không phải thanh toán gì
                    thêm.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Payment Method */}
        <div className="w-full xl:w-1/3 space-y-4 sm:space-y-6">
          <Card className="sticky top-4">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">
                Phương Thức Thanh Toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method Selection - Responsive */}
              <div className="space-y-3 sm:space-y-4">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-900 transition-colors">
                    <RadioGroupItem value="BANK_TRANSFER" id="qr" />
                    <Label htmlFor="qr" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-blue-600" />
                        <span className="text-sm sm:text-base font-medium">
                          QR Code (Chuyển khoản ngân hàng)
                        </span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-gray-900 transition-colors">
                    <RadioGroupItem value="PAYPAL" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-blue-600" />
                        <span className="text-sm sm:text-base font-medium">
                          PayPal
                        </span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Content based on selected method */}
                {paymentMethod === "BANK_TRANSFER" && (
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-700 text-center text-sm sm:text-base">
                      Quét mã QR để hoàn tất thanh toán qua ứng dụng ngân hàng.
                    </p>
                  </div>
                )}

                {paymentMethod === "PAYPAL" && (
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                    <p className="text-gray-700 text-center text-sm sm:text-base">
                      Bạn sẽ được chuyển hướng đến PayPal để hoàn tất thanh toán
                      an toàn.
                    </p>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-start">
                <span className="mr-2 text-lg">🛡️</span>
                <span className="text-sm sm:text-base">
                  <strong>Thanh toán bảo mật:</strong> Thông tin thanh toán của
                  bạn được mã hóa và bảo mật
                </span>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeTerms}
                  onCheckedChange={setAgreeTerms}
                  className="mt-1"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm sm:text-base leading-relaxed"
                >
                  Tôi đồng ý với{" "}
                  <span className="text-blue-600 underline cursor-pointer">
                    Điều khoản và Điều kiện
                  </span>{" "}
                  cũng như{" "}
                  <span className="text-blue-600 underline cursor-pointer">
                    Quy định giá vé
                  </span>
                </Label>
              </div>

              {/* Payment Buttons - Responsive */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm sm:text-base font-semibold"
                  disabled={!agreeTerms || isProcessing}
                  onClick={(e) => handleSubmit(e, false)}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    <>💳 Thanh toán ngay - {formatCurrencyVND(finalAmount)}</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 py-3 text-sm sm:text-base font-semibold"
                  disabled={!agreeTerms || isProcessing}
                  onClick={(e) => handleSubmit(e, true)}
                >
                  Thanh toán sau (1 giờ)
                </Button>

                <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                  <p className="text-xs sm:text-sm text-orange-800">
                    <strong>Lưu ý:</strong> Thanh toán sau sẽ giữ chỗ trong 1
                    giờ. Sau thời gian này, mã đặt chỗ sẽ tự động hủy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

Payment.propTypes = {
  formData: PropTypes.shape({
    passengers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.oneOf(["ADULT", "CHILD", "INFANT"]),
        fullName: PropTypes.string,
        dob: PropTypes.instanceOf(Date),
        passport: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            number: PropTypes.string,
          }),
        ]),
      })
    ).isRequired,
  }).isRequired,
  extrasData: PropTypes.shape({
    selectedSeats: PropTypes.object,
    baggage: PropTypes.object,
    additionalServices: PropTypes.object,
    total: PropTypes.number,
    seatTotal: PropTypes.number,
    baggageTotal: PropTypes.number,
    servicesTotal: PropTypes.number,
  }),
  flight: PropTypes.shape({
    id: PropTypes.number,
    airline: PropTypes.string,
    departureAirport: PropTypes.shape({
      airportName: PropTypes.string,
    }),
    arrivalAirport: PropTypes.shape({
      airportName: PropTypes.string,
    }),
  }).isRequired,
  fare: PropTypes.shape({
    price: PropTypes.number,
    travelClass: PropTypes.shape({
      classId: PropTypes.number,
      className: PropTypes.string,
    }),
  }).isRequired,
};

export default Payment;
