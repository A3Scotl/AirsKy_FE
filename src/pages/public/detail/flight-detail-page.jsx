"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Luggage,
  Star,
  AlertCircle,
  ArrowRight,
  Check,
  Wifi,
  Monitor,
  Utensils,
  Zap,
  Package,
  Headphones,
  Bed,
  Users,
} from "lucide-react";

const FlightDetail = () => {
  const navigate = useNavigate();
  const [selectedFare, setSelectedFare] = useState(null);
  const [flightData, setFlightData] = useState(null);

  // Get flight data from localStorage (from result-section)
  // useEffect(() => {
  //   const savedFlight = localStorage.getItem('selectedFlight');
  //   if (savedFlight) {
  //     setFlightData(JSON.parse(savedFlight));
  //   }
  // }, []);

  const defaultFlightInfo = {
    airline: "Vietnam Airlines",
    flightNumber: "VN7210",
    airlineLogo:
      "https://logos-world.net/wp-content/uploads/2021/02/Vietnam-Airlines-Logo.png",
    departure: {
      city: "Ho Chi Minh City",
      code: "SGN",
      time: "05:05",
      date: "August 15, 2025",
    },
    arrival: {
      city: "Hanoi",
      code: "HAN",
      time: "07:10",
      date: "August 15, 2025",
    },
    duration: "2h 05m",
    stops: "Direct",
    aircraft: "Airbus A321",
  };

  // Use flight data from localStorage or default
  const flightInfo = flightData || defaultFlightInfo;

  const fareClasses = [
    {
      id: "economy",
      type: "Economy Class",
      price: 299,
      currency: "USD",
      originalPrice: 350,
      features: [
        { included: true, text: "Personal item included" },
        { included: true, text: "1 carry-on bag (7kg)" },
        { included: false, text: "Checked baggage" },
        { included: true, text: "Standard seat selection" },
        { included: true, text: "In-flight entertainment" },
        { included: false, text: "Meal service" },
        { included: false, text: "Priority boarding" },
      ],
      availability: "9 seats left",
      popular: false,
    },
    {
      id: "premium",
      type: "Premium Economy",
      price: 499,
      currency: "USD",
      originalPrice: 580,
      features: [
        { included: true, text: "Personal item included" },
        { included: true, text: "1 carry-on bag (10kg)" },
        { included: true, text: "1 checked bag (23kg)" },
        { included: true, text: "Extra legroom seats" },
        { included: true, text: "Priority boarding" },
        { included: true, text: "Enhanced meal service" },
        { included: true, text: "Free seat selection" },
      ],
      availability: "6 seats left",
      popular: true,
    },
    {
      id: "business",
      type: "Business Class",
      price: 1299,
      currency: "USD",
      originalPrice: 1499,
      features: [
        { included: true, text: "Personal item included" },
        { included: true, text: "2 carry-on bags (15kg)" },
        { included: true, text: "2 checked bags (32kg each)" },
        { included: true, text: "Lie-flat seats" },
        { included: true, text: "Lounge access" },
        { included: true, text: "Gourmet meals & drinks" },
        { included: true, text: "Priority check-in & boarding" },
        { included: true, text: "Dedicated cabin service" },
      ],
      availability: "4 seats left",
      popular: false,
    },
  ];

  const handleSelectFare = (fareId) => {
    setSelectedFare(fareId);
  };

  const handleProceedToBooking = (fareId) => {
    const selectedFareData = fareClasses.find((fare) => fare.id === fareId);
    // Store flight and fare data for booking process
    localStorage.setItem("selectedFlight", JSON.stringify(flightInfo));
    localStorage.setItem("selectedFare", JSON.stringify(selectedFareData));
    // Navigate to booking stepper
    navigate("/booking-stepper");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Flight Route */}
      <div
        className="h-80 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-blue-500 bg-opacity-50"></div>
        <div className="relative z-10 h-full flex items-center justify-center text-white">
          <div className="text-center max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img
                src={flightInfo.airlineLogo || defaultFlightInfo.airlineLogo}
                alt={flightInfo.airline}
                className="w-12 h-12 rounded bg-white p-1"
              />
              <h1 className="text-4xl font-bold">
                {flightInfo.departure?.city || flightInfo.from} →{" "}
                {flightInfo.arrival?.city || flightInfo.to}
              </h1>
            </div>
            <p className="text-xl mb-2">
              {flightInfo.airline} Flight {flightInfo.flightNumber || "VN7210"}
            </p>
            <div className="flex items-center justify-center gap-8 text-lg">
              <span>
                {flightInfo.departure?.time || flightInfo.departureTime} -{" "}
                {flightInfo.arrival?.time || "07:10"}
              </span>
              <span>•</span>
              <span>{flightInfo.duration || defaultFlightInfo.duration}</span>
              <span>•</span>
              <span>{flightInfo.stops || defaultFlightInfo.stops}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Flight Summary Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-6 h-6 text-blue-600" />
              Flight Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg">Departure</h3>
                <p className="font-bold">
                  {flightInfo.departure?.city || flightInfo.from} (
                  {flightInfo.departure?.code || flightInfo.fromCode})
                </p>
                <p className="text-sm text-gray-600">
                  {flightInfo.departure?.time || flightInfo.departureTime},{" "}
                  {flightInfo.departure?.date || flightInfo.date}
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <Plane className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg">Flight Details</h3>
                <p className="font-bold">
                  {flightInfo.duration || defaultFlightInfo.duration} •{" "}
                  {flightInfo.stops || defaultFlightInfo.stops}
                </p>
                <p className="text-sm text-gray-600">
                  Aircraft: {flightInfo.aircraft || defaultFlightInfo.aircraft}
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                <MapPin className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg">Arrival</h3>
                <p className="font-bold">
                  {flightInfo.arrival?.city || flightInfo.to} (
                  {flightInfo.arrival?.code || flightInfo.toCode})
                </p>
                <p className="text-sm text-gray-600">
                  {flightInfo.arrival?.time || "07:10"},{" "}
                  {flightInfo.arrival?.date || flightInfo.date}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fare Selection Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Fare
          </h2>
          <p className="text-gray-600 mb-6">
            Select the cabin class that best suits your travel needs
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fareClasses.map((fare) => (
              <div
                key={fare.id}
                className={`border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFare === fare.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:border-blue-300 hover:shadow-md"
                } ${
                  fare.popular
                    ? "border-blue-200 bg-blue-50 relative"
                    : "border-gray-200"
                }`}
                onClick={() => handleSelectFare(fare.id)}
              >
                {fare.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {fare.type}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {fare.availability}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-3xl font-bold text-blue-600">
                        ${fare.price}
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        ${fare.originalPrice}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">per person</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {fare.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <span
                          className={`mr-3 ${
                            feature.included ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {feature.included ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            "✗"
                          )}
                        </span>
                        <span
                          className={`${
                            feature.included ? "text-gray-700" : "text-gray-500"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                    {fare.features.length > 4 && (
                      <p className="text-xs text-gray-500 pl-7">
                        +{fare.features.length - 4} more benefits
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  {selectedFare === fare.id ? (
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProceedToBooking(fare.id);
                        }}
                      >
                        Continue to Booking{" "}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <p className="text-xs text-center text-green-600 font-medium">
                        ✓ {fare.type} selected
                      </p>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Select {fare.type}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Action for Selected Fare */}
          {selectedFare && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {fareClasses.find((f) => f.id === selectedFare)?.type}{" "}
                    selected
                  </p>
                  <p className="text-xs text-green-600">
                    Total: $
                    {fareClasses.find((f) => f.id === selectedFare)?.price} per
                    person
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleProceedToBooking(selectedFare)}
                >
                  Book Now <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Flight Information Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-t-lg border-b">
              <TabsTrigger value="details" className="text-sm">
                Flight Details
              </TabsTrigger>
              <TabsTrigger value="policies" className="text-sm">
                Policies
              </TabsTrigger>
              <TabsTrigger value="amenities" className="text-sm">
                Amenities
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="details" className="mt-0">
                <div className="space-y-6">
                  {/* Flight Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Flight Schedule
                    </h3>
                    <div className="relative">
                      <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200"></div>

                      {/* Departure */}
                      <div className="flex items-start space-x-4 mb-8">
                        <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                          <Plane className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Departure
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              On Time
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {flightInfo.departure.time}
                          </p>
                          <p className="text-gray-600">
                            {flightInfo.departure.date}
                          </p>
                          <p className="text-lg font-medium text-gray-800 mt-1">
                            {flightInfo.departure.airport}
                          </p>
                          <p className="text-sm text-gray-500">
                            Terminal 4, Gate A12
                          </p>
                        </div>
                      </div>

                      {/* Flight Duration */}
                      <div className="flex items-center space-x-4 mb-8 ml-8">
                        <div className="flex-grow border-l-2 border-dashed border-gray-300 pl-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Flight Duration
                              </span>
                              <span className="font-semibold text-gray-900">
                                {flightInfo.duration}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-sm text-gray-600">
                                Aircraft
                              </span>
                              <span className="font-semibold text-gray-900">
                                {flightInfo.aircraft}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrival */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                          <MapPin className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Arrival
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                            >
                              On Time
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">
                            {flightInfo.arrival.time}
                          </p>
                          <p className="text-gray-600">
                            {flightInfo.arrival.date}
                          </p>
                          <p className="text-lg font-medium text-gray-800 mt-1">
                            {flightInfo.arrival.airport}
                          </p>
                          <p className="text-sm text-gray-500">
                            Terminal 7, Gate B15
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Flight Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Flight Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Flight Number:</span>
                          <span className="font-medium">
                            {flightInfo.flightNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Aircraft Type:</span>
                          <span className="font-medium">
                            {flightInfo.aircraft}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Distance:</span>
                          <span className="font-medium">2,475 miles</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Operated by:</span>
                          <span className="font-medium">
                            {flightInfo.airline}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Check-in Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Online Check-in:
                          </span>
                          <span className="font-medium">
                            24h before departure
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Airport Check-in:
                          </span>
                          <span className="font-medium">
                            2h before departure
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Boarding:</span>
                          <span className="font-medium">
                            30 min before departure
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gate Closes:</span>
                          <span className="font-medium">
                            10 min before departure
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="policies" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Baggage Policy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <Package className="w-5 h-5 text-blue-600 mr-2" />
                            <h4 className="font-semibold">Carry-on Baggage</h4>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Maximum weight: 7kg (15 lbs)</li>
                            <li>• Maximum dimensions: 56 x 36 x 23 cm</li>
                            <li>• 1 piece included in all fares</li>
                            <li>• Must fit in overhead compartment</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <Luggage className="w-5 h-5 text-blue-600 mr-2" />
                            <h4 className="font-semibold">Checked Baggage</h4>
                          </div>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Economy: 1 x 23kg included</li>
                            <li>• Business: 2 x 32kg included</li>
                            <li>• Maximum dimensions: 158cm total</li>
                            <li>• Additional bags available for purchase</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Cancellation & Changes
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <h4 className="font-semibold text-yellow-800">
                          Important Notice
                        </h4>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Fare conditions vary by ticket type. Please review your
                        specific fare rules before booking.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Economy Light</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• No changes allowed</li>
                          <li>• No refunds</li>
                          <li>• Non-transferable</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Economy Standard</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Changes: $150 fee + fare difference</li>
                          <li>• Cancellation: $200 fee</li>
                          <li>• 24h free cancellation</li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Business Class</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Free changes (fare difference applies)</li>
                          <li>• Free cancellation up to 2h before</li>
                          <li>• Fully refundable within 24h</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="amenities" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      In-Flight Services
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          icon: Wifi,
                          title: "Free Wi-Fi",
                          desc: "Complimentary high-speed internet",
                        },
                        {
                          icon: Monitor,
                          title: "Entertainment",
                          desc: "Personal screens with 1000+ options",
                        },
                        {
                          icon: Utensils,
                          title: "Dining",
                          desc: "Gourmet meals and premium beverages",
                        },
                        {
                          icon: Headphones,
                          title: "Premium Audio",
                          desc: "Noise-canceling headphones provided",
                        },
                        {
                          icon: Bed,
                          title: "Comfort",
                          desc: "Adjustable headrests and blankets",
                        },
                        {
                          icon: Zap,
                          title: "Power Outlets",
                          desc: "USB and power ports at every seat",
                        },
                      ].map((amenity, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center mb-2">
                            <amenity.icon className="w-6 h-6 text-blue-600 mr-3" />
                            <h4 className="font-semibold">{amenity.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600">
                            {amenity.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Seat Configuration
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Economy Class</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Seat pitch: 31-32 inches</li>
                            <li>• Seat width: 17-18 inches</li>
                            <li>• 3-3-3 configuration</li>
                            <li>• Adjustable headrest</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Business Class</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Seat pitch: 60+ inches</li>
                            <li>• Seat width: 21 inches</li>
                            <li>• 2-2-2 configuration</li>
                            <li>• Lie-flat seats</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default FlightDetail;
